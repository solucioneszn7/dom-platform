// ===== Conector PLACE — Plataforma de Contratación del Sector Público =====
// Consume el feed ATOM público de contrataciondelestado.es, normaliza al
// esquema Firestore y sincroniza evitando duplicados por idExterno.
import {
  collection, doc, getDocs, query, where, writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { cpvAClasificacion, cpvADescripcion } from '../utils/cpvClasificacion'

const COL = 'estudios'

// URLs base
const PLACE_BASE = 'https://contrataciondelestado.es'
const PLACE_FEED_PATH = '/wps/PA_1_GPPDE3A204IJR7CC3UD40000000/FeedServlet'

// Proxy CORS para desarrollo (los feeds de PLACE no tienen CORS habilitado).
// En producción usar la Cloud Function `syncPlace` como proxy.
const CORS_PROXY_DEV = 'https://api.allorigins.win/raw?url='

// Mapeo del tipo de contrato
export const TIPOS_CONTRATO = {
  1: 'Suministros',
  2: 'Obras',
  3: 'Concesión de obras',
  4: 'Servicios',
  5: 'Concesión de servicios',
  6: 'Gestión de servicios públicos',
  7: 'Colaboración público-privada',
  8: 'Administrativo especial',
  50: 'Privado',
  999: 'Sin definir',
}

// Mapeo de procedimientos de PLACE a los 5 oficiales del proyecto
const PROC_MAP = {
  '1': 'Abierto Ordinario',
  '2': 'Restringido',
  '3': 'Negociado',
  '4': 'Invitación',
  '5': 'Diálogo Competitivo',
  'abierto': 'Abierto Ordinario',
  'abierto simplificado': 'Abierto Ordinario',
  'restringido': 'Restringido',
  'negociado': 'Negociado',
  'negociado sin publicidad': 'Negociado',
  'negociado con publicidad': 'Negociado',
  'dialogo competitivo': 'Diálogo Competitivo',
  'diálogo competitivo': 'Diálogo Competitivo',
  'asociacion innovacion': 'Diálogo Competitivo',
}

// ===== Construir URL del feed =====
function construirUrlFeed({
  fechaDesde,
  tipContrato = 2,
  importeDesde = 100000,
  estado = 'PUB',
  lang = 'es',
} = {}) {
  const params = new URLSearchParams({
    type: 'anuncio',
    lang,
    tipContrato: String(tipContrato),
    estado,
  })
  if (fechaDesde) params.set('fechaDesde', fechaDesde)
  if (importeDesde) params.set('importeDesde', String(importeDesde))
  return `${PLACE_BASE}${PLACE_FEED_PATH}?${params.toString()}`
}

// ===== Fetch con proxy (dev) o directo (cuando llame una CF) =====
async function fetchPlace(url, { useProxy = true } = {}) {
  const finalUrl = useProxy ? CORS_PROXY_DEV + encodeURIComponent(url) : url
  const r = await fetch(finalUrl, { headers: { Accept: 'application/atom+xml' } })
  if (!r.ok) throw new Error(`PLACE devolvió ${r.status}`)
  return r.text()
}

// ===== Parser ATOM (DOMParser nativo del browser) =====
function parsearAtom(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) throw new Error('Feed ATOM mal formado')

  const entries = Array.from(doc.getElementsByTagName('entry'))
  return entries.map(entryToItem)
}

// Extrae un entry del ATOM y extrae todos los campos relevantes
function entryToItem(entry) {
  const get = (tag) => entry.getElementsByTagName(tag)[0]?.textContent?.trim() || ''
  const getAttr = (tag, attr) => entry.getElementsByTagName(tag)[0]?.getAttribute(attr) || ''
  const nsGet = (ns, tag) => {
    const el = entry.getElementsByTagNameNS(ns, tag)[0] || entry.getElementsByTagName(`cbc-cac:${tag}`)[0]
    return el?.textContent?.trim() || ''
  }
  // Los feeds de PLACE usan namespaces CBC/CAC de UBL-2.1
  const CBC = 'urn:dgpe:names:draft:codice:schema:xsd:CommonBasicComponents-2'
  const CAC = 'urn:dgpe:names:draft:codice:schema:xsd:CommonAggregateComponents-2'
  const getCBC = (tag) => entry.getElementsByTagNameNS(CBC, tag)[0]?.textContent?.trim() || ''
  const getCAC = (tag) => entry.getElementsByTagNameNS(CAC, tag)[0]

  const link = getAttr('link', 'href') || get('id')
  const resumen = get('summary')

  // Importe
  let importe = 0
  const taxExclAmount = entry.getElementsByTagNameNS(CBC, 'TaxExclusiveAmount')[0]
  if (taxExclAmount) importe = parseFloat(taxExclAmount.textContent) || 0
  if (!importe) {
    const totalAmount = entry.getElementsByTagNameNS(CBC, 'TotalAmount')[0]
    if (totalAmount) importe = parseFloat(totalAmount.textContent) || 0
  }

  // Fecha fin presentación
  let fechaFin = ''
  const endDate = entry.getElementsByTagNameNS(CBC, 'EndDate')[0]
  if (endDate) fechaFin = endDate.textContent
  let horaFin = ''
  const endTime = entry.getElementsByTagNameNS(CBC, 'EndTime')[0]
  if (endTime) horaFin = endTime.textContent.substring(0, 5)

  // Organismo contratante
  let organismo = ''
  const partyName = entry.getElementsByTagNameNS(CAC, 'PartyName')[0]
  if (partyName) organismo = partyName.textContent.trim()

  // CPV
  let cpv = ''
  const itemClass = entry.getElementsByTagNameNS(CAC, 'ItemClassificationCode')[0]
  if (itemClass) cpv = itemClass.textContent.trim()
  if (!cpv) {
    const cpvNode = entry.getElementsByTagNameNS(CBC, 'ItemClassificationCode')[0]
    if (cpvNode) cpv = cpvNode.textContent.trim()
  }

  // Tipo contrato
  let tipoContrato = 0
  const contractType = entry.getElementsByTagNameNS(CBC, 'TypeCode')[0]
  if (contractType) tipoContrato = parseInt(contractType.textContent) || 0

  // Procedimiento
  let procedimiento = ''
  const procCode = entry.getElementsByTagNameNS(CBC, 'ProcedureCode')[0]
  if (procCode) procedimiento = procCode.textContent.trim()

  // Expediente (idExterno)
  let expediente = ''
  const contractId = entry.getElementsByTagNameNS(CBC, 'ContractFolderID')[0]
  if (contractId) expediente = contractId.textContent.trim()
  if (!expediente) expediente = (get('id') || link).split('/').pop()

  return {
    idExterno: expediente,
    titulo: get('title'),
    resumen,
    url: link,
    fechaPublicacion: get('updated') || get('published'),
    fechaFinPresentacion: fechaFin,
    horaFinPresentacion: horaFin,
    importeSinIVA: importe,
    organismo,
    cpv,
    tipoContrato,
    procedimiento,
  }
}

// ===== Mapear item PLACE → esquema Firestore =====
export function parsearItemPLACE(item) {
  // Normalizar fecha
  const toISODate = (d) => {
    if (!d) return null
    try { return new Date(d).toISOString().split('T')[0] } catch { return null }
  }

  const procedimiento = PROC_MAP[item.procedimiento?.toLowerCase()] || PROC_MAP[item.procedimiento] || 'Abierto Ordinario'

  return {
    // Identificación
    anio: new Date().getFullYear(),
    orden: 0,
    titulo: item.titulo || item.resumen || 'Sin título',
    cliente: item.organismo || '',
    procedimiento,

    // Económicos
    licitacionIVA: item.importeSinIVA || 0,
    costeEstudio: 0,
    importeOfertado: 0,
    importeAdjudicacion: 0,

    // Fechas
    fechaPresentacion: toISODate(item.fechaFinPresentacion),
    horaPresentacion: item.horaFinPresentacion || '',
    fechaInterna: null,
    fechaApertura: null,
    horaApertura: '',

    // Estado (por defecto en captación)
    vamos: false,
    apertura: false,
    empresaAdjudicataria: '',
    posicionGuamar: '',
    faseActual: 'captacion',

    // Documentación
    docTecnica: false,
    docAdministrativa: false,
    estudioEconomico: false,
    seguridadSalud: false,
    calidadMA: false,

    // UTE
    componenteUTE1: '',
    componenteUTE2: '',
    pctComponente1: 0,
    pctComponente2: 0,
    pctGuamar: 100,
    pctUTEGuamar: 0,

    // Clasificación (calculada desde CPV)
    clasificacion: cpvAClasificacion(item.cpv),
    cpv: item.cpv || '',
    cpvDescripcion: cpvADescripcion(item.cpv),

    // Metadatos
    valoracion: '',
    observaciones: item.idExterno ? `Exp. ${item.idExterno}` : '',
    notaInterna: '',

    // Origen
    origenFuente: 'place',
    idExterno: item.idExterno || '',
    urlPlataforma: item.url || '',
    fechaPublicacionExterna: toISODate(item.fechaPublicacion),
  }
}

// ===== Obtener licitaciones de PLACE =====
export async function obtenerLicitacionesPLACE({
  fechaDesde,
  importeMin = 100000,
  tipContrato = 2,
  maxResultados = 100,
  useProxy = true,
} = {}) {
  const url = construirUrlFeed({ fechaDesde, importeDesde: importeMin, tipContrato })
  const xml = await fetchPlace(url, { useProxy })
  const items = parsearAtom(xml)
  return items.slice(0, maxResultados).map(parsearItemPLACE)
}

// ===== Sincronizar a Firestore evitando duplicados =====
export async function sincronizarDesdePLACE(licitaciones) {
  const resultado = { importadas: 0, duplicadas: 0, errores: [], total: licitaciones.length }

  if (!licitaciones.length) return resultado

  // 1) Buscar idExterno ya existentes en Firestore (en chunks de 30 por limitación Firestore 'in')
  const idsExternos = licitaciones.map(l => l.idExterno).filter(Boolean)
  const existentes = new Set()
  for (let i = 0; i < idsExternos.length; i += 30) {
    const chunk = idsExternos.slice(i, i + 30)
    try {
      const q = query(collection(db, COL), where('idExterno', 'in', chunk))
      const snap = await getDocs(q)
      snap.forEach(d => existentes.add(d.data().idExterno))
    } catch (err) { resultado.errores.push(`check dup: ${err.message}`) }
  }

  // 2) Filtrar duplicados
  const nuevas = licitaciones.filter(l => !existentes.has(l.idExterno))
  resultado.duplicadas = licitaciones.length - nuevas.length

  // 3) Escribir en batches de 400
  const BATCH_SIZE = 400
  for (let i = 0; i < nuevas.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const slice = nuevas.slice(i, i + BATCH_SIZE)
    for (const lic of slice) {
      const ref = doc(collection(db, COL))
      batch.set(ref, {
        ...lic,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
      })
    }
    try {
      await batch.commit()
      resultado.importadas += slice.length
    } catch (err) { resultado.errores.push(`batch ${i}: ${err.message}`) }
  }

  return resultado
}

// ===== Helper: CPV → Clasificación (reexportado para conveniencia) =====
export { cpvAClasificacion, cpvADescripcion }
