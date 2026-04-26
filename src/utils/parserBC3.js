// ===== Parser BC3 (Presto/FIEBDC-3) — DEFINITIVE VERSION =====
// FIXES APPLIED:
//   1. # lookup: descomps.get("01") → also try "01#", "01##"
//   2. Chapter children ALWAYS treated as partidas (never as APU resources)
//      This ensures TABLARO ELECTRICO, COBERTIZO, VENTANAS etc. appear
//   3. Only partida-level children use type classification for APU
//
// Verified against PRESTO_-_SHOSHU.bc3: 7 caps, 92 partidas, 460+ APU items

export const TIPO_RECURSO = { MO: 'mano_obra', MAQ: 'maquinaria', MAT: 'material', PARTIDA: 'partida' }
const TIPO_MAP = { '0': TIPO_RECURSO.PARTIDA, '1': TIPO_RECURSO.MO, '2': TIPO_RECURSO.MAQ, '3': TIPO_RECURSO.MAT }
const TIPO_LABEL = { mano_obra: 'Mano de Obra', maquinaria: 'Maquinaria', material: 'Material', partida: 'Partida' }

// ===== MAIN =====
export function parsearBC3(contenido) {
  const lineas = contenido.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const conceptos = new Map(), descomps = new Map(), textos = new Map(), mediciones = new Map()
  let version = '', moneda = 'CLP', coeficientes = {}

  for (const linea of lineas) {
    const l = linea.trim()
    if (l.startsWith('~V|')) version = bd(l).split('|')[1] || bd(l).split('|')[0] || ''
    else if (l.startsWith('~K|')) {
      const c = bd(l).split('|')
      if (c[0]) { const p = c[0].split('\\'); for (let i = p.length - 1; i >= 0; i--) { const v = p[i].trim(); if (/^[A-Z]{3}$/.test(v)) { moneda = v; break } } }
      if (c[1]) { const p = c[1].split('\\'); coeficientes = { ci: nm(p[0]), gg: nm(p[1]), bi: nm(p[2]), baja: nm(p[3]), iva: nm(p[4]) } }
    }
    else if (l.startsWith('~C|')) {
      const c = bd(l).split('|'), code = c[0]?.trim(); if (!code) continue
      conceptos.set(code, { codigo: code, unidad: c[1]?.trim() || '', descripcion: c[2]?.trim() || '', precio: nm(c[3]), tipoBC3: c[5]?.trim() || '0', tipoRecurso: TIPO_MAP[c[5]?.trim()] || TIPO_RECURSO.PARTIDA, esCapitulo: code.endsWith('#') || code.endsWith('##') })
    }
    else if (l.startsWith('~D|')) {
      const c = bd(l).split('|'), padre = c[0]?.trim(); if (!padre || !c[1]) continue
      const parts = c[1].split('\\'), hijos = []
      for (let i = 0; i < parts.length; i += 3) { const ch = parts[i]?.trim(); if (ch) hijos.push({ codigo: ch, factor: nm(parts[i + 1]) || 1, rendimiento: nm(parts[i + 2]) }) }
      if (hijos.length) descomps.set(padre, [...(descomps.get(padre) || []), ...hijos])
    }
    else if (l.startsWith('~T|')) { const c = bd(l).split('|'); if (c[0]?.trim() && c[1]) textos.set(c[0].trim(), c[1].trim()) }
    else if (l.startsWith('~M|')) {
      const c = bd(l).split('|'), k = (c[0] || '').split('\\')
      const key = k[1]?.trim() || k[0]?.trim()
      if (key) mediciones.set(key, (mediciones.get(key) || 0) + nm(c[1]))
    }
  }

  const raiz = findRoot(conceptos, descomps)
  const arbol = buildTree(raiz, conceptos, descomps, textos, mediciones)
  const partidasFlat = flatten(arbol)

  return {
    version, moneda, coeficientes,
    resumen: {
      totalConceptos: conceptos.size,
      totalCapitulos: partidasFlat.filter(p => p.tipo === 'capitulo').length,
      totalPartidas: partidasFlat.filter(p => p.tipo !== 'capitulo').length,
      presupuestoTotal: arbol.reduce((s, c) => {
        const capC = gC(conceptos, c.codigoOriginal || c.codigo)
        return s + (capC?.precio || 0)
      }, 0),
    },
    arbol, partidasFlat,
  }
}

// ===== LOOKUP HELPERS (try code, code+#, code+##) =====
function gC(conceptos, cod) { return conceptos.get(cod) || conceptos.get(cod + '#') || conceptos.get(cod + '##') || null }
function gD(descomps, cod) { return descomps.get(cod) || descomps.get(cod + '#') || descomps.get(cod + '##') || [] }
function gT(textos, cod) { return textos.get(cod) || textos.get(cod + '#') || textos.get(cod.replace(/#+$/, '')) || '' }

// ===== TREE =====
function findRoot(conceptos, descomps) {
  for (const [c] of conceptos) if (c.endsWith('##')) return c
  const allCh = new Set()
  for (const hijos of descomps.values()) hijos.forEach(h => allCh.add(h.codigo))
  for (const c of descomps.keys()) if (!allCh.has(c)) return c
  return null
}

function buildTree(raiz, conceptos, descomps, textos, mediciones) {
  if (!raiz) return []
  return gD(descomps, raiz).map(({ codigo, factor, rendimiento }) =>
    expandNode(codigo, factor, rendimiento, conceptos, descomps, textos, mediciones, 0, true)
  )
}

function expandNode(codigo, factor, rendimiento, conceptos, descomps, textos, mediciones, nivel, padreEsCapitulo) {
  const concepto = gC(conceptos, codigo) || { codigo, unidad: '', descripcion: codigo, precio: 0, tipoBC3: '0', tipoRecurso: TIPO_RECURSO.PARTIDA, esCapitulo: false }
  const codigoReal = concepto.codigo
  let hijosD = gD(descomps, codigo)
  if (!hijosD.length) hijosD = gD(descomps, codigoReal)

  const esCapitulo = concepto.esCapitulo || (padreEsCapitulo && nivel === 0)

  // ===== THE KEY LOGIC =====
  const hijosPartida = []
  const apuItems = []

  for (const h of hijosD) {
    const hConcepto = gC(conceptos, h.codigo)
    const hDescomp = gD(descomps, h.codigo)

    if (esCapitulo) {
      // FIX #2: Chapter children are ALWAYS partidas, never APU resources
      hijosPartida.push(h)
    } else if (!hConcepto) {
      // Unknown concept → APU resource placeholder
      apuItems.push({
        codigo: h.codigo, descripcion: h.codigo, unidad: '',
        tipo: inferType(h.codigo, ''), tipoLabel: 'Material',
        rendimiento: h.rendimiento, precio: 0, importe: 0,
      })
    } else if (hConcepto.tipoBC3 === '0' && hDescomp.length > 0) {
      // Type 0 WITH decomposition → sub-partida (recurse)
      hijosPartida.push(h)
    } else {
      // Type 1/2/3 or type 0 without decomp → APU resource
      const tipo = hConcepto.tipoRecurso !== TIPO_RECURSO.PARTIDA
        ? hConcepto.tipoRecurso
        : inferType(h.codigo, hConcepto.descripcion)
      apuItems.push({
        codigo: h.codigo, descripcion: hConcepto.descripcion || h.codigo,
        unidad: hConcepto.unidad, tipo, tipoLabel: TIPO_LABEL[tipo] || tipo,
        rendimiento: h.rendimiento, precio: hConcepto.precio,
        importe: h.rendimiento * hConcepto.precio * (h.factor || 1),
      })
    }
  }

  const hijos = hijosPartida.map(h =>
    expandNode(h.codigo, h.factor, h.rendimiento, conceptos, descomps, textos, mediciones, nivel + 1, esCapitulo)
  )

  const codigoLimpio = codigoReal.replace(/#+$/, '')

  return {
    codigo: codigoLimpio, codigoOriginal: codigoReal,
    tipo: esCapitulo ? 'capitulo' : 'partida',
    nombre: concepto.descripcion || codigoLimpio,
    descripcion: gT(textos, codigoReal),
    unidad: concepto.unidad, precioUnitario: concepto.precio,
    cantidadPresupuestada: rendimiento || mediciones.get(codigoReal) || 0,
    tipoBC3: concepto.tipoBC3, nivel, factor,
    hijos, apu: apuItems,
    apuResumen: {
      manoObra: apuItems.filter(a => a.tipo === TIPO_RECURSO.MO),
      materiales: apuItems.filter(a => a.tipo === TIPO_RECURSO.MAT),
      maquinaria: apuItems.filter(a => a.tipo === TIPO_RECURSO.MAQ),
      otros: apuItems.filter(a => a.tipo === TIPO_RECURSO.PARTIDA),
      totalMO: apuItems.filter(a => a.tipo === TIPO_RECURSO.MO).reduce((s, a) => s + a.importe, 0),
      totalMAT: apuItems.filter(a => a.tipo === TIPO_RECURSO.MAT).reduce((s, a) => s + a.importe, 0),
      totalMAQ: apuItems.filter(a => a.tipo === TIPO_RECURSO.MAQ).reduce((s, a) => s + a.importe, 0),
    },
  }
}

function inferType(codigo, desc) {
  const t = `${codigo} ${desc}`.toUpperCase()
  if (/M\.?O\.?|MANO|OFICIAL|PEON|PEÓN|AYUDANTE|FABRICACION|MONTAJE|INSTALADOR|ELECTRI|GASFITER|SOLDADOR|PINTOR|MAESTRO|JORNAL/.test(t)) return TIPO_RECURSO.MO
  if (/CAMION|GRUA|GRÚA|PLUMA|RETROEXCAVADORA|BOMBA|VIBRAD|ANDAMIO|HERRAMIENTA|MAQUINA/.test(t)) return TIPO_RECURSO.MAQ
  return TIPO_RECURSO.MAT
}

// ===== FLATTEN TO FIRESTORE DOCS =====
function flatten(nodos, padre = null, orden = { n: 0 }) {
  const r = []
  for (const nodo of nodos) {
    r.push({
      codigo: nodo.codigo, tipo: nodo.tipo, nombre: nodo.nombre,
      descripcion: nodo.descripcion, unidad: nodo.unidad,
      precioUnitario: nodo.precioUnitario, cantidadPresupuestada: nodo.cantidadPresupuestada,
      codigoPadre: padre, nivel: nodo.nivel, orden: orden.n++,
      apu: nodo.apu, apuResumen: nodo.apuResumen,
      empresaId: null, empresaNombre: '',
      avanceAcumulado: 0, avanceAnterior: 0,
      importeEjecutado: 0, porcentaje: 0,
      estado: 'pendiente', bloqueado: false,
    })
    if (nodo.hijos?.length) r.push(...flatten(nodo.hijos, nodo.codigo, orden))
  }
  return r
}

// ===== GANTT =====
export function partidasAGantt(partidas, fechaInicio = new Date()) {
  const tareas = []; let dia = 0
  for (const p of partidas) {
    const esCap = p.tipo === 'capitulo'
    const dur = esCap ? 0 : Math.min(Math.max(1, Math.ceil(Math.abs(p.precioUnitario || 1) / 500000)), 30)
    const ini = new Date(fechaInicio); ini.setDate(ini.getDate() + dia)
    const fin = new Date(ini); fin.setDate(fin.getDate() + dur)
    const prog = p.cantidadPresupuestada > 0 ? Math.min(100, Math.round(((p.avanceAcumulado || 0) / p.cantidadPresupuestada) * 100)) : 0
    tareas.push({ id: p.id || p.codigo, codigo: p.codigo, nombre: p.nombre, inicio: fd(ini), fin: fd(fin), duracion: dur, progreso: prog, esCapitulo: esCap, parentCodigo: p.codigoPadre, nivel: p.nivel, precio: p.precioUnitario, unidad: p.unidad, apu: p.apu, empresaNombre: p.empresaNombre, avance: p.avanceAcumulado, cantidad: p.cantidadPresupuestada, bloqueado: p.bloqueado })
    if (!esCap) dia += dur
  }
  for (const t of tareas) {
    if (t.esCapitulo) {
      const h = tareas.filter(x => x.parentCodigo === t.codigo)
      if (h.length) { t.inicio = fd(new Date(Math.min(...h.map(x => new Date(x.inicio))))); t.fin = fd(new Date(Math.max(...h.map(x => new Date(x.fin))))); const tc = h.reduce((s, x) => s + (x.cantidad || 0), 0); const ta = h.reduce((s, x) => s + (x.avance || 0), 0); t.progreso = tc > 0 ? Math.round((ta / tc) * 100) : 0 }
    }
  }
  return tareas
}

// ===== UTILS =====
function bd(l) { return l.replace(/^~[A-Z]\|/, '').replace(/\|~\s*$/, '').replace(/\|\s*$/, '').trim() }
function nm(s) { if (!s) return 0; const v = parseFloat(String(s).trim()); return isNaN(v) ? 0 : v }
function fd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export function leerArchivoBC3(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => { try { resolve(parsearBC3(e.target.result)) } catch (err) { reject(new Error('Error BC3: ' + err.message)) } }
    reader.onerror = () => reject(new Error('Error al leer archivo'))
    reader.readAsText(file, 'latin-1')
  })
}
