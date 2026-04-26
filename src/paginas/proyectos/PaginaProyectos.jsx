// ===== Página Proyectos — Glass Aurora =====
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FolderKanban, ArrowRight, LayoutList, Columns3 } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { obtenerPorcentajeEjecucion, obtenerMontoAcordado, formatearMontoCorto } from '../../servicios/financiero'
import { formatearFecha } from '../../utils/generadores'
import GlassCard from '../../componentes/ui/GlassCard'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'

export default function PaginaProyectos() {
  const { usuario, esAdmin } = useAuth()
  const [proyectos, setProyectos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('tabla')
  const navegar = useNavigate()

  useEffect(() => {
    if (!usuario) return
    const cancelar = escucharProyectos(usuario.uid, esAdmin, (datos) => {
      setProyectos(datos); setCargando(false)
    })
    return cancelar
  }, [usuario, esAdmin])

  const proyectosFiltrados = proyectos.filter(p =>
    `${p.numeroCaso} ${p.nombre} ${p.direccion} ${p.comuna} ${p.propietario?.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  )

  const columnas = useMemo(() => ({
    activo: proyectosFiltrados.filter(p => p.estado === 'activo'),
    completado: proyectosFiltrados.filter(p => p.estado === 'completado'),
    archivado: proyectosFiltrados.filter(p => p.estado === 'archivado'),
  }), [proyectosFiltrados])

  if (cargando) return <Cargando texto="Cargando proyectos..." />

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 100%)' }}>
              <FolderKanban className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-[24px] font-bold text-white tracking-tight">Proyectos</h1>
          </div>
          <p className="text-[13px] text-white/55 ml-12">
            {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} registrado{proyectos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Boton icono={Plus} tamano="sm" onClick={() => navegar('/proyectos/nuevo')}>
          Nuevo Proyecto
        </Boton>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-premium w-full pl-9 pr-3 py-1.5 text-[13px]"
          />
        </div>
        <div className="flex items-center gap-1 glass-soft rounded-lg p-0.5">
          <button
            onClick={() => setVista('tabla')}
            className={`p-1.5 rounded transition-colors ${vista === 'tabla' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/45 hover:text-white/85'}`}
            title="Vista tabla"
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setVista('kanban')}
            className={`p-1.5 rounded transition-colors ${vista === 'kanban' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/45 hover:text-white/85'}`}
            title="Vista board"
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {proyectosFiltrados.length === 0 ? (
        <GlassCard>
          <div className="py-14 text-center">
            <div className="h-12 w-12 rounded-2xl glass-soft flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="h-6 w-6 text-white/40" />
            </div>
            <p className="text-[13px] text-white/55 mb-3">{busqueda ? 'Sin resultados' : 'No hay proyectos aún'}</p>
            {!busqueda && <Boton tamano="sm" icono={Plus} onClick={() => navegar('/proyectos/nuevo')}>Crear primer proyecto</Boton>}
          </div>
        </GlassCard>
      ) : vista === 'tabla' ? (
        <GlassCard className="!p-0 overflow-hidden">
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-semibold text-white/45 uppercase tracking-[0.1em] border-b border-white/[0.06] bg-white/[0.02]">
            <span className="col-span-4">Proyecto</span>
            <span className="col-span-2">Estado</span>
            <span className="col-span-2">Propietario</span>
            <span className="col-span-2 text-right">Monto</span>
            <span className="col-span-1">Fecha</span>
            <span className="col-span-1" />
          </div>
          <div className="divide-y divide-white/[0.04]">
            {proyectosFiltrados.map(proyecto => {
              const monto = obtenerMontoAcordado(proyecto)
              const pct = obtenerPorcentajeEjecucion(proyecto)
              return (
                <Link key={proyecto.id} to={`/proyectos/${proyecto.id}`}>
                  <div className="group grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <div className="sm:col-span-4 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-violet-200 bg-violet-500/12 ring-1 ring-violet-500/20 px-1.5 py-0.5 rounded">{proyecto.numeroCaso}</span>
                      </div>
                      <h3 className="text-[13px] font-semibold text-white truncate">{proyecto.nombre}</h3>
                      <p className="text-[11px] text-white/45 truncate">{proyecto.direccion}, {proyecto.comuna}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ring-1
                        ${proyecto.estado === 'activo'
                          ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/25'
                          : proyecto.estado === 'completado'
                            ? 'bg-cyan-500/15 text-cyan-200 ring-cyan-500/25'
                            : 'bg-white/[0.06] text-white/55 ring-white/[0.08]'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          proyecto.estado === 'activo' ? 'bg-emerald-400' :
                          proyecto.estado === 'completado' ? 'bg-cyan-400' : 'bg-white/40'
                        }`} />
                        {proyecto.estado}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[13px] text-white/75">{proyecto.propietario?.nombre || '—'}</span>
                    </div>
                    <div className="sm:col-span-2 text-right">
                      {monto > 0 ? (
                        <div>
                          <span className="text-[13px] font-semibold text-white">{formatearMontoCorto(monto)}</span>
                          {pct > 0 && (
                            <div className="mt-1 flex items-center gap-1.5 justify-end">
                              <div className="w-12 bg-white/[0.06] rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 90 ? 'bg-rose-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-white/55">{pct}%</span>
                            </div>
                          )}
                        </div>
                      ) : <span className="text-[11px] text-white/30">—</span>}
                    </div>
                    <div className="sm:col-span-1">
                      <span className="text-[11px] text-white/45">{formatearFecha(proyecto.fechaCreacion)}</span>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <ArrowRight className="h-3.5 w-3.5 text-white/35 group-hover:text-violet-300 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </GlassCard>
      ) : (
        /* ===== Kanban View ===== */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { key: 'activo', label: 'Activos', dot: 'bg-emerald-400' },
            { key: 'completado', label: 'Completados', dot: 'bg-cyan-400' },
            { key: 'archivado', label: 'Archivados', dot: 'bg-white/40' },
          ].map(({ key, label, dot }) => (
            <div key={key} className="flex-shrink-0 w-[300px] sm:flex-1 sm:min-w-[260px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-[11px] font-semibold text-white/65 uppercase tracking-[0.12em]">{label}</span>
                <span className="text-[11px] text-white/55 bg-white/[0.06] rounded px-1.5 py-0.5 ring-1 ring-white/[0.06]">{columnas[key]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(columnas[key] || []).map(p => (
                  <Link key={p.id} to={`/proyectos/${p.id}`}>
                    <GlassCard hover className="!p-3">
                      <span className="text-[10px] font-mono text-violet-200 bg-violet-500/12 ring-1 ring-violet-500/20 px-1.5 py-0.5 rounded">{p.numeroCaso}</span>
                      <h4 className="text-[13px] font-semibold text-white mt-2 mb-1">{p.nombre}</h4>
                      <p className="text-[11px] text-white/45 truncate">{p.direccion}, {p.comuna}</p>
                      {p.propietario?.nombre && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="h-5 w-5 rounded-full flex items-center justify-center shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #7c4dff, #ff5a8a)' }}>
                            <span className="text-[9px] font-bold text-white">{p.propietario.nombre.charAt(0)}</span>
                          </div>
                          <span className="text-[10px] text-white/55">{p.propietario.nombre}</span>
                        </div>
                      )}
                    </GlassCard>
                  </Link>
                ))}
                {key === 'activo' && (
                  <button
                    onClick={() => navegar('/proyectos/nuevo')}
                    className="w-full py-2 rounded-lg border border-dashed border-white/15 text-[13px] text-white/45 hover:text-white hover:border-violet-400/40 hover:bg-violet-500/[0.05] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nuevo proyecto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
