// ===== Mediciones — Lee partidas de Firebase, batch save, respeta bloqueo =====
import { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, ChevronDown, Save, Search, FolderKanban,
  ArrowLeft, DollarSign, CheckCircle, Lock, AlertTriangle, Ruler,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { escucharPartidas, guardarMedicionesBatch } from '../../servicios/presupuestos'
import Tarjeta from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

export default function PaginaMediciones() {
  const { usuario, datosUsuario, esAdmin } = useAuth()
  const [proyectos, setProyectos] = useState([])
  const [proyectoId, setProyectoId] = useState(null)
  const [proyectoNombre, setProyectoNombre] = useState('')
  const [partidas, setPartidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [exp, setExp] = useState(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [cambios, setCambios] = useState({})
  const [guardando, setGuardando] = useState(false)
  const esEncargado = datosUsuario?.rol === 'encargado'

  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, d => { setProyectos(d.filter(p => p.tienePresupuesto)); setCargando(false) })
  }, [usuario, esAdmin])

  useEffect(() => {
    if (!proyectoId) return
    setCargando(true)
    return escucharPartidas(proyectoId, d => {
      setPartidas(d); setCargando(false)
      if (exp.size === 0) setExp(new Set(d.filter(p => p.tipo === 'capitulo').map(p => p.id)))
    })
  }, [proyectoId])

  const toggleCap = id => setExp(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function guardarTodo() {
    setGuardando(true)
    try {
      const batch = Object.entries(cambios).map(([pid, val]) => {
        const p = partidas.find(x => x.id === pid)
        return { partidaId: pid, avanceAcumulado: parseFloat(val) || 0, precioUnitario: p?.precioUnitario || 0, cantidadPresupuestada: p?.cantidadPresupuestada || 0 }
      })
      await guardarMedicionesBatch(proyectoId, batch)
      setCambios({})
      toast.success(`${batch.length} mediciones guardadas en Firebase`)
    } catch (err) { toast.error('Error: ' + err.message) }
    finally { setGuardando(false) }
  }

  const resumen = useMemo(() => {
    let pres = 0, ej = 0
    for (const p of partidas) {
      if (p.tipo === 'capitulo') continue
      pres += (p.cantidadPresupuestada || 0) * (p.precioUnitario || 0)
      const med = cambios[p.id] !== undefined ? parseFloat(cambios[p.id]) || 0 : (p.avanceAcumulado || 0)
      ej += med * (p.precioUnitario || 0)
    }
    return { pres, ej, pct: pres > 0 ? Math.round((ej / pres) * 100) : 0 }
  }, [partidas, cambios])

  const visibles = useMemo(() => {
    if (busqueda) return partidas.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo?.includes(busqueda))
    const vis = [], col = new Set()
    for (const p of partidas) {
      if (p.codigoPadre && col.has(p.codigoPadre)) { if (p.tipo === 'capitulo') col.add(p.codigo); continue }
      vis.push(p)
      if (p.tipo === 'capitulo' && !exp.has(p.id)) col.add(p.codigo)
    }
    return vis
  }, [partidas, exp, busqueda])

  // Selector proyecto
  if (!proyectoId) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mediciones</h1><p className="text-sm text-gray-400 mt-1">Registro de avance ejecutado por partida</p></div>
        {cargando ? <Cargando /> : (
          <Tarjeta>
            {proyectos.length === 0 ? <div className="py-12 text-center"><FolderKanban className="h-10 w-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Carga un BC3 en Planificación primero.</p></div> : (
              <div className="divide-y divide-gray-50">{proyectos.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/30 cursor-pointer" onClick={() => { setProyectoId(p.id); setProyectoNombre(`${p.numeroCaso} — ${p.nombre}`) }}>
                  <div><span className="font-mono text-[10px] text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded mr-2">{p.numeroCaso}</span><span className="text-[13px] font-semibold text-gray-900">{p.nombre}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.presupuestoArchivo}</p></div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}</div>
            )}
          </Tarjeta>
        )}
      </div>
    )
  }

  if (cargando) return <Cargando texto="Cargando partidas..." />
  const hayCambios = Object.keys(cambios).length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setProyectoId(null); setPartidas([]); setCambios({}) }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><ArrowLeft className="h-4 w-4" /></button>
          <div><h1 className="text-xl font-bold text-gray-900">Mediciones</h1><p className="text-[12px] text-gray-400">{proyectoNombre}</p></div>
        </div>
        <Boton icono={Save} cargando={guardando} onClick={guardarTodo} disabled={!hayCambios}>
          Guardar {hayCambios ? `(${Object.keys(cambios).length})` : ''}
        </Boton>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg px-4 py-3"><p className="text-[10px] text-gray-400 uppercase mb-0.5">Presupuesto</p><p className="text-base font-bold text-gray-900">{resumen.pres.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p></div>
        <div className="bg-emerald-50 rounded-lg px-4 py-3"><p className="text-[10px] text-emerald-600 uppercase mb-0.5">Ejecutado</p><p className="text-base font-bold text-emerald-700">{resumen.ej.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p></div>
        <div className="bg-dom-50 rounded-lg px-4 py-3"><p className="text-[10px] text-dom-600 uppercase mb-0.5">Avance</p><p className="text-base font-bold text-dom-700">{resumen.pct}%</p>
          <div className="mt-1 bg-white/50 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full bg-dom-600" style={{ width: `${resumen.pct}%` }} /></div></div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-1.5 text-sm placeholder-gray-400 focus:border-dom-500 focus:outline-none" />
      </div>

      <Tarjeta>
        <div className="hidden lg:grid grid-cols-12 gap-1 px-4 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
          <span className="col-span-4">Partida</span><span className="col-span-1 text-center">Ud</span><span className="col-span-1 text-right">Presup.</span>
          <span className="col-span-2 text-center">Medición a Origen</span><span className="col-span-1 text-center">%</span>
          {!esEncargado && <><span className="col-span-1 text-right">P.U.</span><span className="col-span-1 text-right">Importe</span></>}
          <span className={esEncargado ? 'col-span-3' : 'col-span-1'}>Empresa</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
          {visibles.map(p => {
            if (p.tipo === 'capitulo') return (
              <div key={p.id} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 cursor-pointer hover:bg-gray-100/60" style={{ paddingLeft: 12 + (p.nivel || 0) * 16 }} onClick={() => toggleCap(p.id)}>
                {exp.has(p.id) ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                <span className="text-[12px] font-semibold text-gray-800 flex-1">{p.nombre}</span>
              </div>
            )
            const med = cambios[p.id] !== undefined ? cambios[p.id] : (p.avanceAcumulado || '')
            const medNum = parseFloat(med) || 0
            const pct = p.cantidadPresupuestada > 0 ? Math.min(100, Math.round((medNum / p.cantidadPresupuestada) * 100)) : 0
            const imp = medNum * (p.precioUnitario || 0)
            const blocked = p.bloqueado

            return (
              <div key={p.id} className={`grid grid-cols-1 lg:grid-cols-12 gap-1 items-center px-4 py-2 hover:bg-blue-50/20 ${blocked ? 'bg-amber-50/20' : ''}`} style={{ paddingLeft: 12 + (p.nivel || 0) * 16 }}>
                <div className="lg:col-span-4 flex items-center gap-1 min-w-0">
                  <span className="w-4 flex-shrink-0">{blocked && <Lock className="h-3 w-3 text-amber-500" title="Certificación aprobada" />}</span>
                  <span className="font-mono text-[9px] text-dom-600 bg-dom-50 px-1 py-0.5 rounded">{p.codigo}</span>
                  <span className="text-[11px] text-gray-700 truncate">{p.nombre}</span>
                </div>
                <div className="lg:col-span-1 text-center"><span className="text-[10px] text-gray-400">{p.unidad}</span></div>
                <div className="lg:col-span-1 text-right"><span className="text-[11px] text-gray-500">{p.cantidadPresupuestada || '—'}</span></div>
                <div className="lg:col-span-2 flex items-center gap-1">
                  <input type="number" step="0.01" value={med} placeholder="0"
                    disabled={blocked}
                    onChange={e => setCambios(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className={`w-full text-[11px] rounded border px-2 py-1 text-center focus:outline-none ${blocked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : cambios[p.id] !== undefined ? 'border-dom-400 bg-dom-50/30 focus:border-dom-500' : 'border-gray-200 focus:border-dom-500'}`} />
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">/{p.cantidadPresupuestada || '?'}</span>
                </div>
                <div className="lg:col-span-1 text-center">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pct >= 100 ? 'bg-emerald-50 text-emerald-700' : pct > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{pct}%</span>
                </div>
                {!esEncargado && <div className="lg:col-span-1 text-right"><span className="text-[11px] text-gray-500">{(p.precioUnitario || 0).toFixed(2)}</span></div>}
                {!esEncargado && <div className="lg:col-span-1 text-right"><span className="text-[11px] font-semibold text-gray-800">{imp.toFixed(0)}</span></div>}
                <div className={esEncargado ? 'lg:col-span-3' : 'lg:col-span-1'}><span className="text-[10px] text-gray-400 truncate">{p.empresaNombre || '—'}</span></div>
              </div>
            )
          })}
        </div>
      </Tarjeta>
    </div>
  )
}
