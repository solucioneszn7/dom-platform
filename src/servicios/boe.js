// ===== Conector BOE =====
import { collection, doc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
const COL = 'estudios'
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

export async function obtenerLicitacionesBOE({ fechaDesde, useProxy = true } = {}) {
  const resultados = []
  const fecha = fechaDesde ? new Date(fechaDesde) : new Date(Date.now() - 7 * 86400000)
  const hoy = new Date()
  while (fecha <= hoy) {
    const yyyy = fecha.getFullYear()
    const mm = String(fecha.getMonth() + 1).padStart(2, '0')
    const dd = String(fecha.getDate()).padStart(2, '0')
    const id = `BOE-S-${yyyy}${mm}${dd}`
    try {
      const url = `https://api.boe.es/api.php?op=api&id=${id}`
      const final = useProxy ? CORS_PROXY + encodeURIComponent(url) : url
      const r = await fetch(final)
      if (r.ok) { const xml = await r.text(); resultados.push(...parsearSumarioBOE(xml, `${yyyy}-${mm}-${dd}`)) }
    } catch {}
    fecha.setDate(fecha.getDate() + 1)
  }
  return resultados
}

function parsearSumarioBOE(xml, fecha) {
  const items = []
  const regex = /<item[^>]*>([\s\S]*?)<\/item>/g
  let m
  while ((m = regex.exec(xml)) !== null) {
    const b = m[1]
    const get = tag => (b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1]?.trim() || ''
    const titulo = get('titulo')
    if (!/licitaci[oó]n|contrat[ao]|adjudicaci[oó]n/i.test(titulo)) continue
    const importe = (() => { const m2 = titulo.match(/([\d.,]+)\s*(€|euros?)/i); return m2 ? parseFloat(m2[1].replace(/\./g,'').replace(',','.')) || 0 : 0 })()
    const proc = /negociado/i.test(titulo) ? 'Negociado' : /restringido/i.test(titulo) ? 'Restringido' : 'Abierto Ordinario'
    const id = get('id') || get('urlHtml').split('/').pop()
    items.push({ idExterno: id, titulo: titulo.replace(/<[^>]+>/g,'').trim(), organismo: get('departamento'), url: get('urlHtml') || get('urlPdf'), fechaPublicacion: fecha, importeSinIVA: importe, procedimiento: proc, origenFuente: 'boe' })
  }
  return items
}

export function parsearItemBOE(item) {
  const toISO = d => { if (!d) return null; try { return new Date(d).toISOString().split('T')[0] } catch { return null } }
  return { anio: new Date().getFullYear(), orden: 0, titulo: item.titulo || 'Sin título', cliente: item.organismo || '', procedimiento: item.procedimiento || 'Abierto Ordinario', licitacionIVA: item.importeSinIVA || 0, costeEstudio: 0, importeOfertado: 0, importeAdjudicacion: 0, fechaPresentacion: null, horaPresentacion: '', fechaInterna: null, fechaApertura: null, horaApertura: '', vamos: false, apertura: false, empresaAdjudicataria: '', posicionGuamar: '', faseActual: 'captacion', docTecnica: false, docAdministrativa: false, estudioEconomico: false, seguridadSalud: false, calidadMA: false, componenteUTE1: '', componenteUTE2: '', pctComponente1: 0, pctComponente2: 0, pctGuamar: 100, pctUTEGuamar: 0, clasificacion: [], cpv: '', cpvDescripcion: '', valoracion: '', observaciones: item.idExterno ? `BOE: ${item.idExterno}` : '', notaInterna: '', origenFuente: 'boe', idExterno: item.idExterno || '', urlPlataforma: item.url || '', fechaPublicacionExterna: toISO(item.fechaPublicacion) }
}

export async function sincronizarDesdeBOE(licitaciones) {
  const resultado = { importadas: 0, duplicadas: 0, errores: [], total: licitaciones.length }
  if (!licitaciones.length) return resultado
  const ids = licitaciones.map(l => l.idExterno).filter(Boolean)
  const existentes = new Set()
  for (let i = 0; i < ids.length; i += 30) {
    try { const snap = await getDocs(query(collection(db, COL), where('idExterno', 'in', ids.slice(i,i+30)))); snap.forEach(d => existentes.add(d.data().idExterno)) } catch (e) { resultado.errores.push(e.message) }
  }
  const nuevas = licitaciones.filter(l => !existentes.has(l.idExterno))
  resultado.duplicadas = licitaciones.length - nuevas.length
  for (let i = 0; i < nuevas.length; i += 400) {
    const batch = writeBatch(db)
    nuevas.slice(i,i+400).forEach(lic => batch.set(doc(collection(db, COL)), { ...lic, fechaCreacion: serverTimestamp(), fechaActualizacion: serverTimestamp() }))
    try { await batch.commit(); resultado.importadas += Math.min(400, nuevas.length-i) } catch (e) { resultado.errores.push(e.message) }
  }
  return resultado
}
