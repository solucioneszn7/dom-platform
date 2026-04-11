// ===== Página Proyectos — Notion database view =====
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FolderKanban, ArrowRight, LayoutList, Columns3 } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { obtenerPorcentajeEjecucion, obtenerMontoAcordado, formatearMontoCorto } from '../../servicios/financiero'
import { formatearFecha } from '../../utils/generadores'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
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
    <div className="space-y-6">
      {/* Page header — Notion style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proyectos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} registrado{proyectos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Boton icono={Plus} tamano="sm" onClick={() => navegar('/proyectos/nuevo')}>
          Nuevo Proyecto
        </Boton>
      </div>

      {/* Toolbar — search + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-1.5 text-sm placeholder-gray-400 hover:border-gray-300 focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500/30 transition-colors" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
          <button onClick={() => setVista('tabla')} className={`p-1.5 rounded transition-colors ${vista === 'tabla' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`} title="Vista tabla">
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setVista('kanban')} className={`p-1.5 rounded transition-colors ${vista === 'kanban' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`} title="Vista board">
            <Columns3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {proyectosFiltrados.length === 0 ? (
        <Tarjeta>
          <TarjetaCuerpo>
            <div className="py-14 text-center">
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 mb-3">{busqueda ? 'Sin resultados' : 'No hay proyectos aún'}</p>
              {!busqueda && <Boton tamano="sm" icono={Plus} onClick={() => navegar('/proyectos/nuevo')}>Crear primer proyecto</Boton>}
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      ) : vista === 'tabla' ? (
        /* ===== Table View — Notion database ===== */
        <Tarjeta>
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
            <span className="col-span-4">Proyecto</span>
            <span className="col-span-2">Estado</span>
            <span className="col-span-2">Propietario</span>
            <span className="col-span-2 text-right">Monto</span>
            <span className="col-span-1">Fecha</span>
            <span className="col-span-1" />
          </div>
          <div className="divide-y divide-gray-50">
            {proyectosFiltrados.map(proyecto => {
              const monto = obtenerMontoAcordado(proyecto)
              const pct = obtenerPorcentajeEjecucion(proyecto)
              return (
                <Link key={proyecto.id} to={`/proyectos/${proyecto.id}`}>
                  <div className="group grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-blue-50/30 transition-colors cursor-pointer">
                    <div className="sm:col-span-4 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded">{proyecto.numeroCaso}</span>
                      </div>
                      <h3 className="text-[13px] font-semibold text-gray-900 truncate">{proyecto.nombre}</h3>
                      <p className="text-[11px] text-gray-400 truncate">{proyecto.direccion}, {proyecto.comuna}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                        proyecto.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' :
                        proyecto.estado === 'completado' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          proyecto.estado === 'activo' ? 'bg-emerald-500' :
                          proyecto.estado === 'completado' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        {proyecto.estado}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[13px] text-gray-600">{proyecto.propietario?.nombre || '—'}</span>
                    </div>
                    <div className="sm:col-span-2 text-right">
                      {monto > 0 ? (
                        <div>
                          <span className="text-[13px] font-semibold text-gray-700">{formatearMontoCorto(monto)}</span>
                          {pct > 0 && <div className="mt-1 flex items-center gap-1.5 justify-end">
                            <div className="w-12 bg-gray-100 rounded-full h-1 overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400">{pct}%</span>
                          </div>}
                        </div>
                      ) : <span className="text-[11px] text-gray-300">—</span>}
                    </div>
                    <div className="sm:col-span-1">
                      <span className="text-[11px] text-gray-400">{formatearFecha(proyecto.fechaCreacion)}</span>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-dom-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Tarjeta>
      ) : (
        /* ===== Kanban View — Trello board ===== */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { key: 'activo', label: 'Activos', dot: 'bg-emerald-400' },
            { key: 'completado', label: 'Completados', dot: 'bg-blue-400' },
            { key: 'archivado', label: 'Archivados', dot: 'bg-gray-400' },
          ].map(({ key, label, dot }) => (
            <div key={key} className="flex-shrink-0 w-[300px] sm:flex-1 sm:min-w-[260px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
                <span className="text-[11px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">{columnas[key]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(columnas[key] || []).map(p => (
                  <Link key={p.id} to={`/proyectos/${p.id}`}>
                    <div className="kanban-card bg-white rounded-lg border border-gray-200/80 p-3 cursor-pointer">
                      <span className="text-[10px] font-mono text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded">{p.numeroCaso}</span>
                      <h4 className="text-[13px] font-medium text-gray-900 mt-2 mb-1">{p.nombre}</h4>
                      <p className="text-[11px] text-gray-400 truncate">{p.direccion}, {p.comuna}</p>
                      {p.propietario?.nombre && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-gray-500">{p.propietario.nombre.charAt(0)}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{p.propietario.nombre}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {key === 'activo' && (
                  <button onClick={() => navegar('/proyectos/nuevo')}
                    className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-[13px] text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5">
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
