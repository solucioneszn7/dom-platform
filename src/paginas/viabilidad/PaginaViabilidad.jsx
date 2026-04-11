// ===== Viabilidad — FUNCIONAL: trabaja con BC3 en Firebase, editable, RBAC =====
import { useState, useEffect, useMemo } from 'react'
import {
  Upload, ArrowLeft, AlertTriangle, CheckCircle, DollarSign, Users,
  BarChart3, TrendingUp, Shield, Target, Download, Save, Plus, Trash2,
  ShieldCheck, ShieldAlert, ShieldX, Eye, EyeOff, FileSpreadsheet,
  Printer, Lock, ChevronRight, FolderKanban, Edit2, Layers, X,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import {
  obtenerPartidas, obtenerPresupuesto, obtenerViabilidad,
  guardarViabilidad, guardarIndirectos, guardarCoeficientes, guardarDatosCierre,
} from '../../servicios/presupuestos'
import { PERMISOS } from '../../constantes/tramitaciones'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

const FMT = (n, d = 0) => n ? Number(n).toLocaleString('es-ES', { maximumFractionDigits: d }) : '—'
const PCT = n => n ? `${(n * 100).toFixed(1)}%` : '—'

const INDIRECTOS_TEMPLATE = [
  { id: 'jo', cat: 'PERSONAL', cargo: 'Jefe de obra', uds: 1, meses: 22, precio: 6000 },
  { id: 'jp', cat: 'PERSONAL', cargo: 'Jefe de producción', uds: 1, meses: 22, precio: 5000 },
  { id: 'enc', cat: 'PERSONAL', cargo: 'Encargado', uds: 1, meses: 22, precio: 5000 },
  { id: 'peon', cat: 'PERSONAL', cargo: 'Peón', uds: 2, meses: 22, precio: 3200 },
  { id: 'adm', cat: 'PERSONAL', cargo: 'Administrativo', uds: 1, meses: 20, precio: 3600 },
  { id: 'grua', cat: 'MAQUINARIA', cargo: 'Grúa torre', uds: 1, meses: 21, precio: 1300 },
  { id: 'plat', cat: 'MAQUINARIA', cargo: 'Plataformas', uds: 1, meses: 5, precio: 5000 },
  { id: 'and', cat: 'MEDIOS AUX', cargo: 'Andamios', uds: 1, meses: 6, precio: 6000 },
  { id: 'cas', cat: 'INST. PROV', cargo: 'Casetas', uds: 4, meses: 22, precio: 500 },
  { id: 'elec', cat: 'INST. PROV', cargo: 'Electricidad', uds: 1, meses: 22, precio: 1400 },
  { id: 'agua', cat: 'INST. PROV', cargo: 'Agua', uds: 1, meses: 22, precio: 400 },
  { id: 'vig', cat: 'VARIOS', cargo: 'Vigilancia', uds: 1, meses: 22, precio: 2000 },
  { id: 'veh', cat: 'VARIOS', cargo: 'Vehículos', uds: 3, meses: 22, precio: 600 },
  { id: 'ferr', cat: 'VARIOS', cargo: 'Ferretería', uds: 1, meses: 22, precio: 2400 },
]

export default function PaginaViabilidad() {
  const { usuario, datosUsuario, esAdmin, puedeVerMargenes, puedeAprobar, puedeExportarTodo } = useAuth()
  const rol = datosUsuario?.rol || 'gestor'
  const permisos = PERMISOS[rol] || PERMISOS.gestor || {}
  const puedeEditar = permisos.editarViabilidad !== false

  const [proyectos, setProyectos] = useState([])
  const [proyectoId, setProyectoId] = useState(null)
  const [proyectoInfo, setProyectoInfo] = useState(null)
  const [cargandoP, setCargandoP] = useState(true)

  // Data from Firebase
  const [partidas, setPartidas] = useState([])
  const [presupuesto, setPresupuesto] = useState(null)
  const [viabilidad, setViabilidad] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Editable state
  const [indirectos, setIndirectos] = useState([])
  const [cierre, setCierre] = useState({ plazoMeses: 22, bajaPct: 0, ggPct: 0.13, biPct: 0.06, pecOferta: 0, cliente: '', obra: '' })
  const [guardando, setGuardando] = useState(false)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, d => { setProyectos(d.filter(p => p.tienePresupuesto)); setCargandoP(false) })
  }, [usuario, esAdmin])

  // Load project data from Firebase
  useEffect(() => {
    if (!proyectoId) return
    setCargando(true)
    Promise.all([
      obtenerPartidas(proyectoId),
      obtenerPresupuesto(proyectoId),
      obtenerViabilidad(proyectoId),
    ]).then(([parts, pres, viab]) => {
      setPartidas(parts)
      setPresupuesto(pres)
      // Load saved viabilidad or initialize from BC3
      if (viab?.indirectos) setIndirectos(viab.indirectos)
      else setIndirectos(INDIRECTOS_TEMPLATE.map(t => ({ ...t, total: t.uds * t.meses * t.precio })))

      if (viab?.cierre) setCierre(viab.cierre)
      else {
        const info = proyectoInfo || {}
        setCierre(prev => ({ ...prev, obra: info.nombre || '', cliente: info.propietario?.nombre || '', plazoMeses: viab?.cierre?.plazoMeses || 22 }))
      }
      setViabilidad(viab)
    }).finally(() => setCargando(false))
  }, [proyectoId])

  // ===== CALCULATED from real BC3 partidas =====
  const calc = useMemo(() => {
    // Coste Directo = sum of all partida (precio * cantidad) from BC3
    const costeDirecto = partidas.filter(p => p.tipo !== 'capitulo').reduce((s, p) => s + (p.precioUnitario || 0) * (p.cantidadPresupuestada || 0), 0)

    // Indirectos from editable table
    const totalInd = indirectos.reduce((s, i) => s + (i.uds || 0) * (i.meses || 0) * (i.precio || 0), 0)
    const indByCat = {}
    for (const i of indirectos) {
      const t = (i.uds || 0) * (i.meses || 0) * (i.precio || 0)
      indByCat[i.cat] = (indByCat[i.cat] || 0) + t
    }

    // Coeficientes
    const gg = costeDirecto * (cierre.ggPct || 0)
    const bi = costeDirecto * (cierre.biPct || 0)
    const pem = costeDirecto + gg + bi
    const pecSinBaja = pem
    const baja = pecSinBaja * (cierre.bajaPct || 0)
    const pecOferta = cierre.pecOferta > 0 ? cierre.pecOferta : pecSinBaja - baja

    // Margen
    const costoTotal = costeDirecto + totalInd
    const margenAbs = pecOferta - costoTotal
    const margenPct = pecOferta > 0 ? margenAbs / pecOferta : 0
    const coefPEC = costeDirecto > 0 ? pecOferta / costeDirecto : 0
    const indMensual = cierre.plazoMeses > 0 ? totalInd / cierre.plazoMeses : 0
    const indPctCD = costeDirecto > 0 ? totalInd / costeDirecto : 0

    // Pareto by chapter
    const capMap = new Map()
    for (const p of partidas) {
      if (p.tipo === 'capitulo') { capMap.set(p.codigo, { nombre: p.nombre, importe: 0 }); continue }
      const cap = p.codigoPadre || '__'
      if (!capMap.has(cap)) capMap.set(cap, { nombre: cap, importe: 0 })
      capMap.get(cap).importe += (p.precioUnitario || 0) * (p.cantidadPresupuestada || 0)
    }
    const caps = [...capMap.values()].filter(c => c.importe > 0).sort((a, b) => b.importe - a.importe)
    const totalCaps = caps.reduce((s, c) => s + c.importe, 0)
    let acum = 0
    const pareto = caps.map(c => { acum += c.importe; return { ...c, pct: totalCaps > 0 ? c.importe / totalCaps : 0, pctAcum: totalCaps > 0 ? acum / totalCaps : 0 } })
    const pareto80 = pareto.filter(p => p.pctAcum <= 0.82 || p.pct > 0.08)

    // Dictamen
    let dictamen = 'VIABLE', dictColor = 'emerald'
    const alertas = []
    if (margenPct < 0.02) { alertas.push('Margen < 2%'); dictamen = 'VIABLE CON RIESGOS'; dictColor = 'amber' }
    if (margenPct < 0) { alertas.push('Margen NEGATIVO'); dictamen = 'NO VIABLE'; dictColor = 'red' }
    if (indPctCD > 0.15) { alertas.push('Indirectos > 15% del CD'); if (dictColor === 'emerald') { dictColor = 'amber'; dictamen = 'VIABLE CON RIESGOS' } }
    if (cierre.bajaPct > 0.20) alertas.push(`Baja agresiva: ${PCT(cierre.bajaPct)}`)

    return { costeDirecto, totalInd, indByCat, gg, bi, pem, pecOferta, costoTotal, margenAbs, margenPct, coefPEC, indMensual, indPctCD, pareto, pareto80, dictamen, dictColor, alertas }
  }, [partidas, indirectos, cierre])

  // ===== SAVE to Firebase =====
  async function guardarTodo() {
    setGuardando(true)
    try {
      await guardarViabilidad(proyectoId, {
        indirectos, cierre,
        calculado: {
          costeDirecto: calc.costeDirecto, totalIndirectos: calc.totalInd,
          pem: calc.pem, pecOferta: calc.pecOferta,
          margenAbs: calc.margenAbs, margenPct: calc.margenPct,
          dictamen: calc.dictamen,
        },
      })
      toast.success('Viabilidad guardada en proyecto')
    } catch (err) { toast.error('Error: ' + err.message) }
    finally { setGuardando(false) }
  }

  // Editar fila de indirectos
  function editarIndirecto(idx, campo, valor) {
    setIndirectos(prev => prev.map((item, i) => i === idx ? { ...item, [campo]: campo === 'cargo' || campo === 'cat' ? valor : parseFloat(valor) || 0 } : item))
  }
  function agregarIndirecto() {
    setIndirectos(prev => [...prev, { id: `n${Date.now()}`, cat: 'VARIOS', cargo: 'Nuevo concepto', uds: 1, meses: cierre.plazoMeses, precio: 0 }])
  }
  function eliminarIndirecto(idx) { setIndirectos(prev => prev.filter((_, i) => i !== idx)) }

  // Export PDF
  function exportarPDF() {
    const c = calc, ci = cierre
    const html = `<html><head><meta charset="utf-8"><title>Viabilidad</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;font-size:11px;color:#1a1a1a}h1{font-size:16px;color:#1b51f5}h2{font-size:13px;border-bottom:2px solid #3371ff;padding-bottom:3px;margin-top:20px}
    table{width:100%;border-collapse:collapse;margin:6px 0}td,th{padding:5px 7px;border:1px solid #e5e7eb;font-size:10px}th{background:#f3f4f6;font-weight:600}
    .r{text-align:right}.b{font-weight:700}.badge{display:inline-block;padding:3px 10px;border-radius:6px;font-weight:700;font-size:12px}
    .green{background:#d1fae5;color:#065f46}.amber{background:#fef3c7;color:#92400e}.red{background:#fee2e2;color:#991b1b}</style></head><body>
    <h1>INFORME DE VIABILIDAD — ${ci.obra || proyectoInfo?.nombre || ''}</h1>
    <p>Cliente: ${ci.cliente || ''} · Plazo: ${ci.plazoMeses} meses · ${new Date().toLocaleDateString('es-ES')}</p>
    <span class="badge ${c.dictColor === 'emerald' ? 'green' : c.dictColor === 'amber' ? 'amber' : 'red'}">${c.dictamen}</span>
    <h2>RESUMEN ECONÓMICO (desde BC3)</h2>
    <table><tr><th>Concepto</th><th class="r">Importe</th></tr>
    <tr><td>Coste Directo (${partidas.filter(p => p.tipo !== 'capitulo').length} partidas BC3)</td><td class="r b">€${FMT(c.costeDirecto)}</td></tr>
    <tr><td>Costes Indirectos (${indirectos.length} conceptos)</td><td class="r">€${FMT(c.totalInd)}</td></tr>
    <tr><td>GG (${PCT(ci.ggPct)})</td><td class="r">€${FMT(c.gg)}</td></tr>
    <tr><td>BI (${PCT(ci.biPct)})</td><td class="r">€${FMT(c.bi)}</td></tr>
    <tr><td>PEM</td><td class="r">€${FMT(c.pem)}</td></tr>
    <tr><td class="b">PEC Oferta</td><td class="r b">€${FMT(c.pecOferta)}</td></tr>
    <tr><td class="b">Margen Real</td><td class="r b">€${FMT(c.margenAbs)} (${PCT(c.margenPct)})</td></tr></table>
    <h2>PARETO — CAPÍTULOS CRÍTICOS</h2>
    <table><tr><th>Capítulo</th><th class="r">Importe</th><th class="r">%</th><th class="r">Acum</th></tr>
    ${c.pareto.map(p => `<tr><td>${p.nombre}</td><td class="r">€${FMT(p.importe)}</td><td class="r">${PCT(p.pct)}</td><td class="r">${PCT(p.pctAcum)}</td></tr>`).join('')}</table>
    <h2>DICTAMEN</h2><p class="badge ${c.dictColor === 'emerald' ? 'green' : c.dictColor === 'amber' ? 'amber' : 'red'}">${c.dictamen}</p>
    ${c.alertas.length ? '<ul>' + c.alertas.map(a => `<li>⚠️ ${a}</li>`).join('') + '</ul>' : ''}
    <p style="margin-top:20px;font-size:9px;color:#999">DOM Platform · Generado automáticamente · ${new Date().toISOString()}</p></body></html>`
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300)
  }

  // ===== SELECTOR PROYECTO =====
  if (!proyectoId) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Viabilidad de Obra</h1>
          <p className="text-sm text-gray-400 mt-1">Análisis funcional desde datos BC3 · Rol: {rol}</p></div>
        {cargandoP ? <Cargando /> : (
          <Tarjeta>
            <div className="px-5 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-800">Proyectos con presupuesto BC3</h2></div>
            {proyectos.length === 0 ? <div className="py-12 text-center"><FolderKanban className="h-10 w-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Carga un BC3 en Planificación primero.</p></div> : (
              <div className="divide-y divide-gray-50">{proyectos.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  onClick={() => { setProyectoId(p.id); setProyectoInfo(p) }}>
                  <div><span className="font-mono text-[10px] text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded mr-2">{p.numeroCaso}</span>
                    <span className="text-[13px] font-semibold text-gray-900">{p.nombre}</span>
                    <p className="text-[11px] text-gray-400">{p.presupuestoResumen?.totalPartidas || 0} partidas · {p.moneda || 'EUR'}</p></div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}</div>
            )}
          </Tarjeta>
        )}
      </div>
    )
  }

  if (cargando) return <Cargando texto="Cargando datos BC3 del proyecto..." />
  const c = calc

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setProyectoId(null); setPartidas([]) }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><ArrowLeft className="h-4 w-4" /></button>
          <div><h1 className="text-xl font-bold text-gray-900">Viabilidad de Obra</h1>
            <p className="text-[12px] text-gray-400">{proyectoInfo?.numeroCaso} — {proyectoInfo?.nombre} · {partidas.filter(p => p.tipo !== 'capitulo').length} partidas BC3</p></div>
        </div>
        <div className="flex items-center gap-2">
          {puedeEditar && <Boton icono={Save} tamano="xs" cargando={guardando} onClick={guardarTodo}>Guardar</Boton>}
          <Boton variante="secundario" tamano="xs" icono={Download} onClick={() => setShowExport(!showExport)}>Exportar</Boton>
          {puedeAprobar && <Boton variante="exito" tamano="xs" icono={CheckCircle} onClick={() => toast.success('Proyecto aprobado')}>Aprobar</Boton>}
          <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[12px] font-bold ${c.dictColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : c.dictColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {c.dictColor === 'emerald' ? <ShieldCheck className="h-4 w-4" /> : c.dictColor === 'amber' ? <ShieldAlert className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}{c.dictamen}
          </div>
        </div>
      </div>

      {showExport && (
        <Tarjeta><TarjetaCuerpo><div className="flex items-center gap-3"><Boton icono={Printer} tamano="sm" onClick={exportarPDF}>PDF</Boton><Boton variante="secundario" tamano="xs" onClick={() => { setShowExport(false); toast('Excel: próximamente') }}>Excel</Boton><button onClick={() => setShowExport(false)} className="ml-auto p-1 rounded hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button></div></TarjetaCuerpo></Tarjeta>
      )}

      {/* ===== 1. DATOS DEL PROYECTO + CIERRE EDITABLE ===== */}
      <SH num="1" t="Datos del Proyecto y Cierre" i={Target} />
      <Tarjeta><TarjetaCuerpo>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Obra" value={cierre.obra} onChange={v => setCierre({ ...cierre, obra: v })} disabled={!puedeEditar} />
          <Field label="Cliente" value={cierre.cliente} onChange={v => setCierre({ ...cierre, cliente: v })} disabled={!puedeEditar} />
          <Field label="Plazo (meses)" value={cierre.plazoMeses} type="number" onChange={v => setCierre({ ...cierre, plazoMeses: +v })} disabled={!puedeEditar} />
          <Field label="Baja adjudicación (%)" value={(cierre.bajaPct * 100).toFixed(1)} type="number" onChange={v => setCierre({ ...cierre, bajaPct: v / 100 })} disabled={!puedeEditar} />
          <Field label="GG (%)" value={(cierre.ggPct * 100).toFixed(1)} type="number" onChange={v => setCierre({ ...cierre, ggPct: v / 100 })} disabled={!puedeEditar} />
          <Field label="BI (%)" value={(cierre.biPct * 100).toFixed(1)} type="number" onChange={v => setCierre({ ...cierre, biPct: v / 100 })} disabled={!puedeEditar} />
          <Field label="PEC Oferta (0=auto)" value={cierre.pecOferta} type="number" onChange={v => setCierre({ ...cierre, pecOferta: +v })} disabled={!puedeEditar} />
        </div>
      </TarjetaCuerpo></Tarjeta>

      {/* Stats from BC3 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat l="CD (BC3)" v={`€${FMT(c.costeDirecto)}`} c="dom" />
        <Stat l="Indirectos" v={`€${FMT(c.totalInd)}`} c="teal" />
        <Stat l="PEM" v={`€${FMT(c.pem)}`} c="blue" />
        <Stat l="PEC Oferta" v={`€${FMT(c.pecOferta)}`} c="purple" />
        <Stat l="Margen" v={`€${FMT(c.margenAbs)} (${PCT(c.margenPct)})`} c={c.margenPct >= 0.05 ? 'emerald' : c.margenPct >= 0 ? 'amber' : 'red'} />
      </div>

      {/* ===== 2. INDIRECTOS EDITABLES ===== */}
      {(puedeVerMargenes !== false) && (<>
        <SH num="2" t="Costes Indirectos (editable)" i={Users} />
        <Tarjeta>
          <div className="hidden lg:grid grid-cols-12 gap-1 px-4 py-2 text-[10px] font-medium text-gray-400 uppercase border-b border-gray-100 bg-gray-50/50">
            <span className="col-span-2">Categoría</span><span className="col-span-3">Concepto</span>
            <span className="col-span-1 text-center">Uds</span><span className="col-span-1 text-center">Meses</span>
            <span className="col-span-2 text-right">Precio/mes</span><span className="col-span-2 text-right">Total</span><span className="col-span-1"></span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
            {indirectos.map((item, idx) => {
              const total = (item.uds || 0) * (item.meses || 0) * (item.precio || 0)
              return (
                <div key={item.id || idx} className="grid grid-cols-1 lg:grid-cols-12 gap-1 items-center px-4 py-1.5">
                  <div className="lg:col-span-2">
                    <select value={item.cat} onChange={e => editarIndirecto(idx, 'cat', e.target.value)} disabled={!puedeEditar}
                      className="w-full text-[10px] rounded border border-gray-200 px-1.5 py-1 focus:border-dom-500 focus:outline-none bg-white">
                      {['PERSONAL', 'MAQUINARIA', 'MEDIOS AUX', 'INST. PROV', 'VARIOS'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-3"><input value={item.cargo} onChange={e => editarIndirecto(idx, 'cargo', e.target.value)} disabled={!puedeEditar} className="w-full text-[11px] rounded border border-gray-200 px-2 py-1 focus:border-dom-500 focus:outline-none" /></div>
                  <div className="lg:col-span-1"><input type="number" value={item.uds} onChange={e => editarIndirecto(idx, 'uds', e.target.value)} disabled={!puedeEditar} className="w-full text-[11px] rounded border border-gray-200 px-1.5 py-1 text-center focus:border-dom-500 focus:outline-none" /></div>
                  <div className="lg:col-span-1"><input type="number" value={item.meses} onChange={e => editarIndirecto(idx, 'meses', e.target.value)} disabled={!puedeEditar} className="w-full text-[11px] rounded border border-gray-200 px-1.5 py-1 text-center focus:border-dom-500 focus:outline-none" /></div>
                  <div className="lg:col-span-2"><input type="number" value={item.precio} onChange={e => editarIndirecto(idx, 'precio', e.target.value)} disabled={!puedeEditar} className="w-full text-[11px] rounded border border-gray-200 px-2 py-1 text-right focus:border-dom-500 focus:outline-none" /></div>
                  <div className="lg:col-span-2 text-right"><span className="text-[12px] font-semibold text-gray-800">€{FMT(total)}</span></div>
                  <div className="lg:col-span-1 text-center">{puedeEditar && <button onClick={() => eliminarIndirecto(idx)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>}</div>
                </div>
              )
            })}
          </div>
          {puedeEditar && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button onClick={agregarIndirecto} className="flex items-center gap-1.5 text-[11px] text-dom-600 hover:text-dom-700 font-medium"><Plus className="h-3 w-3" />Añadir concepto</button>
            </div>
          )}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(c.indByCat).map(([cat, total]) => (
              <div key={cat}><p className="text-[9px] text-gray-400 uppercase">{cat}</p><p className="text-[12px] font-bold text-gray-800">€{FMT(total)}</p></div>
            ))}
            <div><p className="text-[9px] text-dom-600 uppercase font-semibold">TOTAL</p><p className="text-[14px] font-bold text-dom-700">€{FMT(c.totalInd)}</p></div>
          </div>
        </Tarjeta>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MM l="Gasto mensual" v={`€${FMT(c.indMensual)}/mes`} /><MM l="% sobre CD" v={PCT(c.indPctCD)} w={c.indPctCD > 0.12} /><MM l="Coef. paso PEC" v={c.coefPEC.toFixed(4)} /><MM l="Plazo" v={`${cierre.plazoMeses} meses`} />
        </div>
      </>)}

      {/* ===== 3. PARETO ===== */}
      <SH num="3" t="Riesgo por Capítulos (Pareto 80/20)" i={BarChart3} />
      <Tarjeta><TarjetaCuerpo>
        <div className="space-y-1.5 mb-4">{c.pareto.map((cap, i) => {
          const maxImp = c.pareto[0]?.importe || 1, w = ((cap.importe || 0) / maxImp) * 100, is80 = cap.pctAcum <= 0.82
          return <div key={i} className="flex items-center gap-2"><span className="text-[10px] text-gray-500 w-[140px] truncate text-right">{cap.nombre}</span><div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative"><div className={`h-full rounded-full ${is80 ? 'bg-dom-500' : 'bg-gray-300'}`} style={{ width: `${w}%` }} /><span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-gray-700">€{FMT(cap.importe)} ({PCT(cap.pct)})</span></div><span className="text-[9px] text-gray-400 w-[36px] text-right">{PCT(cap.pctAcum)}</span></div>
        })}</div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[12px] font-semibold text-amber-800">Críticos (80%): {c.pareto80.map(p => p.nombre).join(', ')}</p></div>
      </TarjetaCuerpo></Tarjeta>

      {/* ===== 4. DICTAMEN ===== */}
      <SH num="4" t="Dictamen y Estrategia" i={Shield} />
      <div className={`rounded-xl border-2 p-5 ${c.dictColor === 'emerald' ? 'border-emerald-300 bg-emerald-50/50' : c.dictColor === 'amber' ? 'border-amber-300 bg-amber-50/50' : 'border-red-300 bg-red-50/50'}`}>
        <div className="flex items-center gap-3 mb-3">
          {c.dictColor === 'emerald' ? <ShieldCheck className="h-7 w-7 text-emerald-600" /> : c.dictColor === 'amber' ? <ShieldAlert className="h-7 w-7 text-amber-600" /> : <ShieldX className="h-7 w-7 text-red-600" />}
          <div><p className={`text-lg font-bold ${c.dictColor === 'emerald' ? 'text-emerald-700' : c.dictColor === 'amber' ? 'text-amber-700' : 'text-red-700'}`}>{c.dictamen}</p>
            <p className="text-[12px] text-gray-500">Margen: €{FMT(c.margenAbs)} ({PCT(c.margenPct)}) · CD: €{FMT(c.costeDirecto)} · PEC: €{FMT(c.pecOferta)}</p></div>
        </div>
        {c.alertas.length > 0 && <div className="mb-3 space-y-1">{c.alertas.map((a, i) => <div key={i} className="flex items-center gap-2 text-[12px] text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />{a}</div>)}</div>}
        <div className="space-y-2">
          <Reco n={1} t={`Cerrar precios con subcontratistas para: ${c.pareto80.slice(0, 3).map(p => p.nombre).join(', ')} (${PCT(c.pareto80.reduce((s, p) => s + p.pct, 0))} del presupuesto).`} />
          <Reco n={2} t={`Indirectos: €${FMT(c.indMensual)}/mes (${PCT(c.indPctCD)} del CD). ${c.indPctCD > 0.12 ? 'Optimizar personal o maquinaria.' : 'Proporción aceptable.'}`} />
          <Reco n={3} t="Blindar margen: compras anticipadas, pagos aplazados, control estricto desde certificación #1." />
        </div>
      </div>
    </div>
  )
}

// ===== UI Components =====
function SH({ num, t, i: I }) { return <div className="flex items-center gap-3 pt-1"><div className="h-7 w-7 rounded-lg bg-dom-100 flex items-center justify-center text-dom-700 font-bold text-[12px]">{num}</div><I className="h-4 w-4 text-dom-500" /><h2 className="text-[14px] font-semibold text-gray-900">{t}</h2></div> }
function Field({ label, value, onChange, type = 'text', disabled }) {
  return <div><label className="text-[10px] text-gray-400 uppercase block mb-1">{label}</label><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} className={`w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-dom-500 focus:outline-none ${disabled ? 'bg-gray-100 text-gray-500' : ''}`} /></div>
}
function Stat({ l, v, c }) { return <div className={`rounded-lg p-3 bg-${c}-50 border border-${c}-200`}><p className={`text-[10px] uppercase font-medium text-${c}-600`}>{l}</p><p className={`text-[14px] font-bold text-${c}-800 mt-1`}>{v}</p></div> }
function MM({ l, v, w }) { return <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">{l}</p><p className={`text-[13px] font-bold mt-1 ${w ? 'text-amber-600' : 'text-gray-900'}`}>{v}</p></div> }
function Reco({ n, t }) { return <div className="flex items-start gap-2.5 p-3 bg-white/60 rounded-lg"><div className="h-5 w-5 rounded-full bg-dom-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{n}</div><p className="text-[11px] text-gray-700 leading-relaxed">{t}</p></div> }
