// ===== Cloud Function: syncPlace =====
// Proxy server-side para consultar PLACE (evita CORS) y sincronizar licitaciones
// a Firestore. Expone 2 triggers:
//   1. HTTP POST /syncPlace  — llamada manual desde la app
//   2. Cron cada 6 horas     — sincronización automática

const functions = require('firebase-functions')
const admin = require('firebase-admin')

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const PLACE_BASE = 'https://contrataciondelestado.es'
const PLACE_FEED_PATH = '/wps/PA_1_GPPDE3A204IJR7CC3UD40000000/FeedServlet'
const COL = 'estudios'

// ===== Mapeos =====
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
  'dialogo competitivo': 'Diálogo Competitivo',
  'diálogo competitivo': 'Diálogo Competitivo',
}

// Tabla mínima CPV → clasificación (replicada del cliente para no requerir import)
const CPV_MAP = {
  '45000000': [{ grupo: 'C', subgrupo: '1', categoria: '' }],
  '45100000': [{ grupo: 'A', subgrupo: '1', categoria: '' }],
  '45200000': [{ grupo: 'B', subgrupo: '1', categoria: '' }],
  '45210000': [{ grupo: 'C', subgrupo: '2', categoria: '' }],
  '45230000': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45232150': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232400': [{ grupo: 'E', subgrupo: '5', categoria: '' }],
  '45233000': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45234000': [{ grupo: 'D', subgrupo: '1', categoria: '' }],
  '45240000': [{ grupo: 'F', subgrupo: '1', categoria: '' }],
  '45247000': [{ grupo: 'E', subgrupo: '4', categoria: '' }],
  '45252000': [{ grupo: 'E', subgrupo: '5', categoria: '' }],
  '45300000': [{ grupo: 'J', subgrupo: '2', categoria: '' }],
  '45310000': [{ grupo: 'I', subgrupo: '6', categoria: '' }],
  '45330000': [{ grupo: 'J', subgrupo: '1', categoria: '' }],
  '45400000': [{ grupo: 'C', subgrupo: '6', categoria: '' }],
}

function cpvAClasif(cpv) {
  if (!cpv) return []
  const limpio = String(cpv).replace(/[^0-9]/g, '')
  const prefijos = [limpio, limpio.slice(0, 6) + '00', limpio.slice(0, 4) + '0000', limpio.slice(0, 2) + '000000']
  for (const p of prefijos) {
    if (CPV_MAP[p]) return CPV_MAP[p]
  }
  return []
}

// ===== Parser ATOM con regex (sin dependencias XML) =====
function parsearAtom(xml) {
  const entries = []
  const regex = /<entry[\s\S]*?<\/entry>/g
  const matches = xml.match(regex) || []

  for (const entry of matches) {
    const get = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
      return m ? m[1].trim() : ''
    }
    const getAttr = (tag, attr) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`))
      return m ? m[1] : ''
    }
    const getNS = (tag) => {
      const m = entry.match(new RegExp(`<cbc-place:${tag}[^>]*>([\\s\\S]*?)</cbc-place:${tag}>`)) ||
                entry.match(new RegExp(`<cbc:${tag}[^>]*>([\\s\\S]*?)</cbc:${tag}>`))
      return m ? m[1].trim() : ''
    }

    entries.push({
      idExterno: get('cbc-place:ContractFolderID') || get('cbc:ContractFolderID') || getAttr('link', 'href').split('/').pop(),
      titulo: get('title'),
      resumen: get('summary'),
      url: getAttr('link', 'href'),
      fechaPublicacion: get('updated') || get('published'),
      fechaFinPresentacion: getNS('EndDate'),
      horaFinPresentacion: getNS('EndTime').substring(0, 5),
      importeSinIVA: parseFloat(getNS('TaxExclusiveAmount') || getNS('TotalAmount')) || 0,
      organismo: getNS('PartyName') || getNS('Name'),
      cpv: getNS('ItemClassificationCode'),
      procedimiento: getNS('ProcedureCode'),
    })
  }
  return entries
}

// ===== Mapear a esquema Firestore =====
function parsearItem(item) {
  const toISO = (d) => {
    if (!d) return null
    try { return new Date(d).toISOString().split('T')[0] } catch { return null }
  }
  const proc = PROC_MAP[item.procedimiento?.toLowerCase()] || PROC_MAP[item.procedimiento] || 'Abierto Ordinario'

  return {
    anio: new Date().getFullYear(),
    orden: 0,
    titulo: item.titulo || item.resumen || 'Sin título',
    cliente: item.organismo || '',
    procedimiento: proc,
    licitacionIVA: item.importeSinIVA || 0,
    costeEstudio: 0, importeOfertado: 0, importeAdjudicacion: 0,
    fechaPresentacion: toISO(item.fechaFinPresentacion),
    horaPresentacion: item.horaFinPresentacion || '',
    fechaInterna: null, fechaApertura: null, horaApertura: '',
    vamos: false, apertura: false, empresaAdjudicataria: '', posicionGuamar: '',
    faseActual: 'captacion',
    docTecnica: false, docAdministrativa: false, estudioEconomico: false,
    seguridadSalud: false, calidadMA: false,
    componenteUTE1: '', componenteUTE2: '', pctComponente1: 0, pctComponente2: 0,
    pctGuamar: 100, pctUTEGuamar: 0,
    clasificacion: cpvAClasif(item.cpv),
    cpv: item.cpv || '',
    valoracion: '', observaciones: item.idExterno ? `Exp. ${item.idExterno}` : '',
    notaInterna: '',
    origenFuente: 'place',
    idExterno: item.idExterno || '',
    urlPlataforma: item.url || '',
    fechaPublicacionExterna: toISO(item.fechaPublicacion),
  }
}

// ===== Obtener del feed PLACE =====
async function obtenerDePLACE({ fechaDesde, tipContrato = 2, importeMin = 100000 }) {
  const params = new URLSearchParams({
    type: 'anuncio',
    lang: 'es',
    tipContrato: String(tipContrato),
    estado: 'PUB',
  })
  if (fechaDesde) params.set('fechaDesde', fechaDesde)
  if (importeMin) params.set('importeDesde', String(importeMin))

  const url = `${PLACE_BASE}${PLACE_FEED_PATH}?${params.toString()}`
  const resp = await fetch(url, { headers: { Accept: 'application/atom+xml' } })
  if (!resp.ok) throw new Error(`PLACE HTTP ${resp.status}`)
  const xml = await resp.text()
  return parsearAtom(xml).map(parsearItem)
}

// ===== Sincronizar a Firestore (dedupe por idExterno) =====
async function sincronizar(licitaciones) {
  const out = { importadas: 0, duplicadas: 0, errores: [], total: licitaciones.length }
  if (!licitaciones.length) return out

  const idsExternos = licitaciones.map(l => l.idExterno).filter(Boolean)
  const existentes = new Set()

  for (let i = 0; i < idsExternos.length; i += 30) {
    const chunk = idsExternos.slice(i, i + 30)
    try {
      const snap = await db.collection(COL).where('idExterno', 'in', chunk).get()
      snap.forEach(d => existentes.add(d.data().idExterno))
    } catch (err) { out.errores.push(`check: ${err.message}`) }
  }

  const nuevas = licitaciones.filter(l => !existentes.has(l.idExterno))
  out.duplicadas = licitaciones.length - nuevas.length

  for (let i = 0; i < nuevas.length; i += 400) {
    const slice = nuevas.slice(i, i + 400)
    const batch = db.batch()
    for (const lic of slice) {
      const ref = db.collection(COL).doc()
      batch.set(ref, {
        ...lic,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    try {
      await batch.commit()
      out.importadas += slice.length
    } catch (err) { out.errores.push(`batch ${i}: ${err.message}`) }
  }
  return out
}

// ===== TRIGGER 1: HTTP manual =====
exports.syncPlace = functions.region('europe-west1').https.onRequest(async (req, res) => {
  // CORS básico (en producción restringir origin a tu dominio Amplify)
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }

  try {
    const { fechaDesde, tipContrato = 2, importeMin = 500000, dryRun = false } = req.body || {}

    const licitaciones = await obtenerDePLACE({ fechaDesde, tipContrato, importeMin })

    if (dryRun) {
      res.json({ ok: true, total: licitaciones.length, muestra: licitaciones.slice(0, 3) })
      return
    }

    const resultado = await sincronizar(licitaciones)
    // Registrar ejecución
    await db.collection('sincronizaciones').add({
      fuente: 'place',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      parametros: { fechaDesde, tipContrato, importeMin },
      resultado,
    })
    res.json({ ok: true, ...resultado })
  } catch (err) {
    console.error('syncPlace error', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ===== TRIGGER 2: Scheduled cada 6 horas =====
exports.syncPlaceScheduled = functions.region('europe-west1')
  .pubsub.schedule('every 6 hours')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    try {
      // Últimos 7 días, obras, importe mínimo 500K
      const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const licitaciones = await obtenerDePLACE({
        fechaDesde: hace7dias,
        tipContrato: 2,
        importeMin: 500000,
      })
      const resultado = await sincronizar(licitaciones)

      await db.collection('sincronizaciones').add({
        fuente: 'place',
        tipo: 'scheduled',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        parametros: { fechaDesde: hace7dias, tipContrato: 2, importeMin: 500000 },
        resultado,
      })
      console.log('syncPlaceScheduled OK:', resultado)
      return null
    } catch (err) {
      console.error('syncPlaceScheduled error:', err)
      return null
    }
  })
