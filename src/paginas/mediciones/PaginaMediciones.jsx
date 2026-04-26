// ===== Mediciones — Glass Aurora (lógica intacta: Firestore + batch save) =====
import { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, ChevronDown, Save, Search, FolderKanban,
  ArrowLeft, Lock, Ruler, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { escucharPartidas, guardarMedicionesBatch } from '../../servicios/presupuestos'
import GlassCard from '../../componentes/ui/GlassCard'
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
    return escucharProyectos(usuario.uid, esAdmin, d => {
      setProyectos(d.filter(p => p.tienePresupuesto))
      setCargando(false)
    })
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
        return {
          partidaId: pid,
          avanceAcumulado: parseFloat(val) || 0,
          precioUnitario: p?.precioUnitario || 0,
          cantidadPresupuestada: p?.cantidadPresupuestada || 0,
        }
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
      if (p.codigoPadre && col.has(p.codigoPadre)) {
        if (p.tipo === 'capitulo') col.add(p.codigo)
        continue
      }
      vis.push(p)
      if (p.tipo === 'capitulo' && !exp.has(p.id)) col.add(p.codigo)
    }
    return vis
  }, [partidas, exp, busqueda])

  // ── Selector de proyecto ────────────────────────────────────────────────────
  if (!proyectoId) {
    return (
      <div className="space-y-6 animate-page-enter">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 100%)' }}>
              <Ruler className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-[24px] font-bold text-white tracking-tight">Mediciones</h1>
          </div>
          <p className="text-[13px] text-white/55 ml-12">Registro de avance ejecutado por partida</p>
        </div>

        {cargando ? <Cargando /> : (
          <GlassCard className="!p-0 overflow-hidden">
            {proyectos.length === 0 ? (
              <div className="py-16 text-center">
                <div className="h-12 w-12 rounded-2xl glass-soft flex items-center justify-center mx-auto mb-3">
                  <FolderKanban className="h-6 w-6 text-white/40" />
                </div>
                <p className="text-[13px] text-white/55">Carga un BC3 en Planificación primero.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {proyectos.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    onClick={() => { setProyectoId(p.id); setProyectoNombre(`${p.numeroCaso} — ${p.nombre}`) }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-violet-200 bg-violet-500/15 px-1.5 py-0.5 rounded ring-1 ring-violet-500/25">{p.numeroCaso}</span>
                        <span className="text-[13px] font-semibold text-white truncate">{p.nombre}</span>
                      </div>
                      <p className="text-[11px] text-white/45 ml-1">{p.presupuestoArchivo}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/35 group-hover:text-violet-300 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    )
  }

  if (cargando) return <Cargando texto="Cargando partidas..." />
  const hayCambios = Object.keys(cambios).length > 0

  return (
    <div className="space-y-4 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => { setProyectoId(null); setPartidas([]); setCambios({}) }}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-white/55 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-white tracking-tight">Mediciones</h1>
            <p className="text-[12px] text-white/55 truncate">{proyectoNombre}</p>
          </div>
        </div>
        <Boton icono={Save} cargando={guardando} onClick={guardarTodo} disabled={!hayCambios}>
          Guardar {hayCambios ? `(${Object.keys(cambios).length})` : ''}
        </Boton>
      </div>

      {/* KPIs resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard soft className="!p-4">
          <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] font-semibold mb-1">Presupuesto</p>
          <p className="text-[18px] font-bold text-white tracking-tight">
            {resumen.pres.toLocaleString('es-ES', { maximumFractionDigits: 0 })} <span className="text-white/55 text-[14px]">€</span>
          </p>
        </GlassCard>
        <GlassCard className="!p-4 !bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <p className="text-[10px] text-emerald-300/80 uppercase tracking-[0.12em] font-semibold mb-1">Ejecutado</p>
          <p className="text-[18px] font-bold text-emerald-200 tracking-tight">
            {resumen.ej.toLocaleString('es-ES', { maximumFractionDigits: 0 })} <span className="text-emerald-300/60 text-[14px]">€</span>
          </p>
        </GlassCard>
        <GlassCard className="!p-4 !bg-violet-500/10 ring-1 ring-violet-500/25">
          <p className="text-[10px] text-violet-200/80 uppercase tracking-[0.12em] font-semibold mb-1">Avance</p>
          <div className="flex items-center gap-2">
            <p className="text-[18px] font-bold text-gradient tracking-tight">{resumen.pct}%</p>
            <TrendingUp className="h-3.5 w-3.5 text-violet-300" />
          </div>
          <div className="mt-2 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${resumen.pct}%`, background: 'linear-gradient(90deg, #7c4dff, #ff5a8a)' }}
            />
          </div>
        </GlassCard>
      </div>

      {/* Buscador */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar partida o código..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="input-premium w-full pl-9 pr-3 py-1.5 text-[13px]"
        />
      </div>

      {/* Tabla de partidas */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-1 px-4 py-2.5 text-[10px] font-semibold text-white/45 uppercase tracking-[0.1em] border-b border-white/[0.06] bg-white/[0.02]">
          <span className="col-span-4">Partida</span>
          <span className="col-span-1 text-center">Ud</span>
          <span className="col-span-1 text-right">Presup.</span>
          <span className="col-span-2 text-center">Medición a Origen</span>
          <span className="col-span-1 text-center">%</span>
          {!esEncargado && (
            <>
              <span className="col-span-1 text-right">P.U.</span>
              <span className="col-span-1 text-right">Importe</span>
            </>
          )}
          <span className={esEncargado ? 'col-span-3' : 'col-span-1'}>Empresa</span>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[560px] overflow-y-auto sidebar-scroll">
          {visibles.map(p => {
            if (p.tipo === 'capitulo') return (
              <div
                key={p.id}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.025] cursor-pointer hover:bg-white/[0.05] transition-colors"
                style={{ paddingLeft: 12 + (p.nivel || 0) * 16 }}
                onClick={() => toggleCap(p.id)}
              >
                {exp.has(p.id)
                  ? <ChevronDown className="h-3.5 w-3.5 text-violet-300" />
                  : <ChevronRight className="h-3.5 w-3.5 text-white/45" />}
                <span className="text-[12px] font-semibold text-white/90 flex-1">{p.nombre}</span>
              </div>
            )
            const med = cambios[p.id] !== undefined ? cambios[p.id] : (p.avanceAcumulado || '')
            const medNum = parseFloat(med) || 0
            const pct = p.cantidadPresupuestada > 0 ? Math.min(100, Math.round((medNum / p.cantidadPresupuestada) * 100)) : 0
            const imp = medNum * (p.precioUnitario || 0)
            const blocked = p.bloqueado

            return (
              <div
                key={p.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-1 items-center px-4 py-2 hover:bg-white/[0.03] transition-colors ${blocked ? 'bg-amber-500/[0.05]' : ''}`}
                style={{ paddingLeft: 12 + (p.nivel || 0) * 16 }}
              >
                <div className="lg:col-span-4 flex items-center gap-1 min-w-0">
                  <span className="w-4 flex-shrink-0">
                    {blocked && <Lock className="h-3 w-3 text-amber-400" title="Certificación aprobada" />}
                  </span>
                  <span className="font-mono text-[9px] text-violet-200 bg-violet-500/12 ring-1 ring-violet-500/20 px-1 py-0.5 rounded">{p.codigo}</span>
                  <span className="text-[11px] text-white/85 truncate">{p.nombre}</span>
                </div>
                <div className="lg:col-span-1 text-center">
                  <span className="text-[10px] text-white/45">{p.unidad}</span>
                </div>
                <div className="lg:col-span-1 text-right">
                  <span className="text-[11px] text-white/65">{p.cantidadPresupuestada || '—'}</span>
                </div>
                <div className="lg:col-span-2 flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={med}
                    placeholder="0"
                    disabled={blocked}
                    onChange={e => setCambios(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className={`w-full text-[11px] rounded-md px-2 py-1 text-center focus:outline-none transition-colors
                      ${blocked
                        ? 'bg-white/[0.03] text-white/35 ring-1 ring-white/[0.06] cursor-not-allowed'
                        : cambios[p.id] !== undefined
                          ? 'bg-violet-500/15 ring-1 ring-violet-400/40 text-white focus:ring-violet-400/60'
                          : 'bg-white/[0.04] ring-1 ring-white/[0.06] text-white focus:ring-violet-400/40'}`}
                  />
                  <span className="text-[9px] text-white/40 whitespace-nowrap">/{p.cantidadPresupuestada || '?'}</span>
                </div>
                <div className="lg:col-span-1 text-center">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded
                    ${pct >= 100
                      ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25'
                      : pct > 0
                        ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/25'
                        : 'bg-white/[0.04] text-white/35'}`}>
                    {pct}%
                  </span>
                </div>
                {!esEncargado && (
                  <div className="lg:col-span-1 text-right">
                    <span className="text-[11px] text-white/65">{(p.precioUnitario || 0).toFixed(2)}</span>
                  </div>
                )}
                {!esEncargado && (
                  <div className="lg:col-span-1 text-right">
                    <span className="text-[11px] font-semibold text-white">{imp.toFixed(0)}</span>
                  </div>
                )}
                <div className={esEncargado ? 'lg:col-span-3' : 'lg:col-span-1'}>
                  <span className="text-[10px] text-white/45 truncate block">{p.empresaNombre || '—'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
