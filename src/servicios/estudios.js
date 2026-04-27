// ===== Servicio de Estudios de Licitaciones =====
// Mapea los campos del Listado_Obras_2026.accdb a Firestore
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  deleteDoc, query, orderBy, where, serverTimestamp, onSnapshot, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'estudios'

// ===== LEER ARCHIVO .accdb DIRECTAMENTE EN EL NAVEGADOR =====
export async function leerArchivoAccess(file) {
  const MDBReader = (await import('mdb-reader')).default
  const buffer = await file.arrayBuffer()
  const reader = new MDBReader(buffer)
  
  const tableNames = reader.getTableNames()
  
  // Load lookup tables
  const lookups = {}
  const lookupDefs = {
    'Clientes': { key: 'Id', value: 'Clientes' },
    'Procedimientos': { key: 'Id', value: 'Procedimiento' },
    'Categorías Clasificación': { key: 'Id', value: 'Categorías' },
    'Grupos Clasificación': { key: 'Id', value: 'Campo1' },
    'Subgrupos Clasificación': { key: 'Id', value: 'Campo1' },
    'Criterios de Valoración': { key: 'Id', value: 'Campo1' },
  }
  
  for (const [tname, def] of Object.entries(lookupDefs)) {
    if (tableNames.includes(tname)) {
      try {
        const t = reader.getTable(tname).getData()
        lookups[tname] = Object.fromEntries(t.map(r => [r[def.key], r[def.value]]))
      } catch { lookups[tname] = {} }
    }
  }
  
  // Read main table
  const mainTable = reader.getTable('Listado Obras')
  const rawData = mainTable.getData()
  
  // Resolve foreign keys and normalize
  const obras = rawData.map((r, idx) => ({
    orden: r.Orden || r.orden || idx + 1,
    anio: r['Año'] || 2026,
    titulo: r['Título de la Obra'] || '',
    licitacionIVA: parseFloat(r.LicitacionIVAexcluido) || 0,
    cliente: lookups['Clientes']?.[r.Clientes] || String(r.Clientes || ''),
    procedimiento: lookups['Procedimientos']?.[r.Procedimiento] || String(r.Procedimiento || ''),
    valoracion: lookups['Criterios de Valoración']?.[r['Valoración']] || '',
    fechaPresentacion: formatDate(r['Fecha de Presentación']),
    horaPresentacion: formatTime(r['Hora de Presentación']),
    fechaApertura: formatDate(r['Fecha de Apertura']),
    horaApertura: formatTime(r['Hora de Apertura']),
    fechaInterna: formatDate(r['Fecha Interna']),
    vamos: r.Vamos === true,
    apertura: r.Apertura === true,
    empresaAdjudicataria: r['Empresa Adjudicataria'] || '',
    importeAdjudicacion: parseFloat(r['Importe Adjudicación']) || 0,
    posicionGuamar: r['Posición Guamar'] || '',
    costeEstudio: parseFloat(r['Coste Estudio']) || 0,
    importeOfertado: parseFloat(r['Importe Ofertado Guamar']) || 0,
    docTecnica: !!r['Documentación Técnica'],
    docAdministrativa: !!r['Documentación Administrativa'],
    estudioEconomico: !!r['Estudio Económico'],
    seguridadSalud: !!r['Seguridad y Salud'],
    calidadMA: !!r['Calidad y MA'],
    pctGuamar: (r['% UTE GUAMAR'] === 1 ? 100 : ((r['% UTE GUAMAR'] || 0) * 100)) || (r['% Guamar'] || 100),
    componenteUTE1: r['Componente UTE 1'] || '',
    pctComponente1: (r['% Componente 1'] || 0) * 100,
    componenteUTE2: r['Componente UTE 2'] || '',
    pctComponente2: (r['% Componente 2'] || 0) * 100,
    clasificacion: [1,2,3,4,5,6].map(n => ({
      grupo: lookups['Grupos Clasificación']?.[r[`Grupo ${n}`]] || '',
      subgrupo: lookups['Subgrupos Clasificación']?.[r[`Subgrupo ${n}`]] || '',
      categoria: lookups['Categorías Clasificación']?.[r[`Categoría ${n}`]] || '',
    })).filter(c => c.grupo || c.subgrupo || c.categoria),
    observaciones: r.Observaciones || '',
    faseActual: calcularFase(r),
    origenFuente: 'accdb',
    idExterno: r.orden || String(idx),
    urlPlataforma: '',
  }))
  
  return { obras, lookups, tableNames, totalRows: rawData.length }
}

function formatDate(v) {
  if (!v) return null
  try { return new Date(v).toISOString().split('T')[0] } catch { return null }
}
function formatTime(v) {
  if (!v) return ''
  try { return new Date(v).toTimeString().split(' ')[0].substring(0, 5) } catch { return '' }
}

// ===== CRUD =====

export function escucharEstudios(callback) {
  const q = query(collection(db, COL), orderBy('orden', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function obtenerEstudios() {
  const snap = await getDocs(query(collection(db, COL), orderBy('orden', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function obtenerEstudio(id) {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function crearEstudio(datos) {
  const ref = await addDoc(collection(db, COL), {
    ...datos,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  })
  return { id: ref.id, ...datos }
}

export async function actualizarEstudio(id, datos) {
  await updateDoc(doc(db, COL, id), {
    ...datos,
    fechaActualizacion: serverTimestamp(),
  })
}

export async function eliminarEstudio(id) {
  await deleteDoc(doc(db, COL, id))
}

// ===== IMPORTAR DESDE CSV/JSON (convertido desde .accdb) =====
// Idempotente: usa clave determinista (anio + orden + slug título) como ID de documento.
// Si un estudio ya existe con ese ID, se actualiza con merge (no se duplica).

function slugificar(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function calcularIdEstudio(mapped) {
  // Clave estable: año-orden-slug. Permite re-importar sin duplicar.
  const anio = mapped.anio || new Date().getFullYear()
  const orden = String(mapped.orden ?? '0').padStart(4, '0')
  const slug = slugificar(mapped.titulo) || 'sin-titulo'
  return `access-${anio}-${orden}-${slug}`
}

export async function importarEstudiosDesdeJSON(obras) {
  const CHUNK = 400
  const resumen = { importadas: 0, actualizadas: 0, total: obras.length }

  // 1) Mapear y calcular IDs deterministas
  const docs = obras.map(obra => {
    const mapped = mapearCamposAccess(obra)
    return { id: calcularIdEstudio(mapped), datos: mapped }
  })

  // 2) Detectar cuáles ya existen (en chunks de 30 por límite de Firestore 'in')
  const existentes = new Set()
  const ids = docs.map(d => d.id)
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30)
    try {
      // Nota: documentId() no se puede usar directamente con 'in' en SDK web; iteramos por getDoc
      // Para mantener simplicidad y rendimiento, hacemos getDoc por cada uno (suele ser <1k registros)
      const checks = await Promise.all(chunk.map(id => getDoc(doc(db, COL, id))))
      checks.forEach((snap, idx) => { if (snap.exists()) existentes.add(chunk[idx]) })
    } catch (err) {
      console.warn('Error verificando duplicados:', err)
    }
  }

  // 3) Escribir en batches usando setDoc con merge (idempotente)
  for (let i = 0; i < docs.length; i += CHUNK) {
    const chunk = docs.slice(i, i + CHUNK)
    const b = writeBatch(db)
    for (const { id, datos } of chunk) {
      const ref = doc(db, COL, id)
      const yaExiste = existentes.has(id)
      b.set(ref, {
        ...datos,
        ...(yaExiste ? {} : { fechaCreacion: serverTimestamp() }),
        fechaActualizacion: serverTimestamp(),
        origen: 'access',
      }, { merge: true })
      if (yaExiste) resumen.actualizadas++
      else resumen.importadas++
    }
    await b.commit()
  }
  return resumen
}

// ===== MAPEO Access → Firestore =====

function mapearCamposAccess(row) {
  return {
    // Identificación
    anio: row['Año'] || row.anio || new Date().getFullYear(),
    orden: row['orden'] || row.orden || 0,
    titulo: row['Título de la Obra'] || row.titulo || '',
    cliente: row['Clientes'] || row.cliente || '',
    procedimiento: row['Procedimiento'] || row.procedimiento || '',

    // Económicos
    licitacionIVA: parseFloat(row['LicitacionIVAexcluido'] || row.licitacionIVA) || 0,
    costeEstudio: parseFloat(row['Coste Estudio'] || row.costeEstudio) || 0,
    importeOfertado: parseFloat(row['Importe Ofertado Guamar'] || row.importeOfertado) || 0,

    // Fechas
    fechaPresentacion: row['Fecha de Presentación'] || row.fechaPresentacion || null,
    horaPresentacion: row['Hora de Presentación'] || row.horaPresentacion || '',
    fechaInterna: row['Fecha Interna'] || row.fechaInterna || null,
    fechaApertura: row['Fecha de Apertura'] || row.fechaApertura || null,
    horaApertura: row['Hora de Apertura'] || row.horaApertura || '',

    // Estados
    vamos: row['Vamos'] === true || row['Vamos'] === 'Sí' || row.vamos === true,
    apertura: row['Apertura'] === true || row['Apertura'] === 'Sí' || row.apertura === true,
    empresaAdjudicataria: row['Empresa Adjudicataria'] || row.empresaAdjudicataria || '',

    // Documentación (checklist)
    docTecnica: row['Documentación Técnica'] === true || row.docTecnica === true,
    docAdministrativa: row['Documentación Administrativa'] === true || row.docAdministrativa === true,
    estudioEconomico: row['Estudio Económico'] === true || row.estudioEconomico === true,
    seguridadSalud: row['Seguridad y Salud'] === true || row.seguridadSalud === true,
    calidadMA: row['Calidad y MA'] === true || row.calidadMA === true,

    // UTE
    componenteUTE1: row['Componente UTE 1'] || row.componenteUTE1 || '',
    componenteUTE2: row['Componente UTE 2'] || row.componenteUTE2 || '',
    pctComponente1: parseFloat(row['% Componente 1'] || row.pctComponente1) || 0,
    pctComponente2: parseFloat(row['% Componente 2'] || row.pctComponente2) || 0,
    pctGuamar: parseFloat(row['% Guamar'] || row.pctGuamar) || 100,
    pctUTEGuamar: parseFloat(row['% UTE GUAMAR'] || row.pctUTEGuamar) || 0,

    // Clasificación
    grupo1: row['Grupo 1'] || row.grupo1 || '',
    subgrupo1: row['Subgrupo 1'] || row.subgrupo1 || '',
    categoria1: row['Categoría 1'] || row.categoria1 || '',

    // Evaluación
    valoracion: row['Valoración'] || row.valoracion || '',
    observaciones: row['Observaciones'] || row.observaciones || '',

    // Origen (nuevos campos)
    origenFuente: row.origenFuente || 'accdb',
    idExterno: row.idExterno || '',
    urlPlataforma: row.urlPlataforma || '',

    // Estado workflow
    faseActual: calcularFase(row),
  }
}

function calcularFase(row) {
  if (row.empresaAdjudicataria || row['Empresa Adjudicataria']) return 'resultado'
  if (row.apertura || row['Apertura']) return 'apertura'
  if (row.docAdministrativa || row['Documentación Administrativa']) return 'administrativa'
  if (row.vamos || row['Vamos']) return 'oferta'
  return 'captacion'
}

// ===== TEMPLATE para nueva obra =====
export function nuevaObra() {
  return {
    anio: new Date().getFullYear(), orden: 0, titulo: '', cliente: '', procedimiento: 'Abierto Ordinario',
    licitacionIVA: 0, costeEstudio: 0, importeOfertado: 0,
    fechaPresentacion: null, horaPresentacion: '', fechaInterna: null, fechaApertura: null, horaApertura: '',
    vamos: false, apertura: false, empresaAdjudicataria: '',
    docTecnica: false, docAdministrativa: false, estudioEconomico: false, seguridadSalud: false, calidadMA: false,
    componenteUTE1: '', componenteUTE2: '', pctComponente1: 0, pctComponente2: 0, pctGuamar: 100, pctUTEGuamar: 0,
    grupo1: '', subgrupo1: '', categoria1: '', valoracion: '', observaciones: '',
    faseActual: 'captacion',
    origenFuente: 'manual', idExterno: '', urlPlataforma: '',
  }
}

// ===== FILTROS DE NEGOCIO =====

export function filtrarActivos(estudios) {
  return estudios.filter(e => e.vamos && !e.empresaAdjudicataria)
}

export function filtrarPendientesApertura(estudios) {
  return estudios.filter(e => !e.apertura && e.fechaPresentacion && new Date(e.fechaPresentacion) < new Date())
}

export function filtrarCerrados(estudios) {
  return estudios.filter(e => !!e.empresaAdjudicataria)
}

export function filtrarProximosVencimientos(estudios, dias = 7) {
  const limite = new Date(); limite.setDate(limite.getDate() + dias)
  return estudios.filter(e => e.fechaInterna && new Date(e.fechaInterna) <= limite && new Date(e.fechaInterna) >= new Date())
}

export function filtrarUTE(estudios) {
  return estudios.filter(e => e.componenteUTE1 || e.componenteUTE2)
}
