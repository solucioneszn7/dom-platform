// ===== Página de Proyectos — A-LARIFE =====
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, Trash2, Pencil, ChevronRight,
  FolderKanban, ArrowRight, MoreHorizontal, X, AlertCircle,
} from 'lucide-react'
import { gsap } from 'gsap'
import { useRef } from 'react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos, eliminarProyecto } from '../../servicios/proyectos'
import { ETIQUETAS_FASE, COLORES_FASE, DOT_FASE, etiquetaBotonFase, avanzarFaseProyecto } from '../../utils/estadosProyecto'
import Tarjeta from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'
import { useEntradaPagina } from '../../hooks/useAnimacion'

const MONEDA_SYM = { CLP: '$', EUR: '€', USD: '$', CAD: 'C$' }

export default function PaginaProyectos() {
  const { usuario, esAdmin } = useAuth()
  const navegar = useNavigate()
  const paginaRef = useEntradaPagina()

  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroFase, setFiltroFase] = useState('todos')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [avanzando, setAvanzando] = useState(null)

  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, datos => {
      setProyectos(datos)
      setCargando(false)
    })
  }, [usuario, esAdmin])

  const filtrados = proyectos.filter(p => {
    const coincideBusqueda =
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.numeroCaso?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.propietario?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    const coincideFase = filtroFase === 'todos' || p.fase === filtroFase
    return coincideBusqueda && coincideFase
  })

  async function handleEliminar() {
    if (!confirmarEliminar) return
    setEliminando(true)
    try {
      await eliminarProyecto(confirmarEliminar.id)
      toast.success('Proyecto eliminado permanentemente')
      setConfirmarEliminar(null)
    } catch {
      toast.error('Error al eliminar el proyecto')
    } finally {
      setEliminando(false)
    }
  }

  async function handleAvanzarFase(proyecto) {
    setAvanzando(proyecto.id)
    try {
      const nueva = await avanzarFaseProyecto(proyecto.id, proyecto.fase || 'revision', usuario.uid)
      toast.success(`Proyecto → ${ETIQUETAS_FASE[nueva]}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAvanzando(null)
    }
  }

  if (cargando) return <Cargando texto="Cargando proyectos..." />

  return (
    <div ref={paginaRef} className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proyectos de estudio</h1>
          <p className="text-sm text-gray-400 mt-0.5">{proyectos.length} proyectos en total</p>
        </div>
        <Link to="/proyectos/nuevo">
          <Boton icono={Plus}>Nuevo proyecto</Boton>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, caso o propietario..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500/30"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['todos', 'revision', 'observaciones', 'preparacion', 'presentado', 'adjudicado'].map(f => (
            <button
              key={f}
              onClick={() => setFiltroFase(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                filtroFase === f
                  ? 'bg-dom-600 text-white border-dom-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'todos' ? 'Todos' : ETIQUETAS_FASE[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="py-20 text-center">
          <FolderKanban className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay proyectos{busqueda ? ' con esa búsqueda' : ''}</p>
          {!busqueda && (
            <Link to="/proyectos/nuevo" className="mt-3 inline-block text-sm text-dom-600 font-medium hover:underline">
              Crear primer proyecto →
            </Link>
          )}
        </div>
      ) : (
        <Tarjeta>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Caso</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Proyecto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Fase</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Presupuesto</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => (
                  <FilaProyecto
                    key={p.id}
                    proyecto={p}
                    onEliminar={() => setConfirmarEliminar(p)}
                    onAvanzar={() => handleAvanzarFase(p)}
                    avanzando={avanzando === p.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      )}

      {/* Modal confirmar eliminación */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Eliminar proyecto permanentemente</h3>
                <p className="text-sm text-gray-500 mb-1">
                  Vas a eliminar <span className="font-medium text-gray-800">"{confirmarEliminar.nombre}"</span>.
                </p>
                <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
                  ⚠ Esta acción no se puede deshacer. Se eliminarán todos los datos del proyecto.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilaProyecto({ proyecto: p, onEliminar, onAvanzar, avanzando }) {
  const rowRef = useRef(null)
  const fase = p.fase || 'revision'
  const boton = etiquetaBotonFase(fase)
  const sym = MONEDA_SYM[p.moneda] || '$'
  const total = p.presupuestoResumen?.presupuestoTotal || 0

  return (
    <tr
      ref={rowRef}
      onMouseEnter={() => gsap.to(rowRef.current, { backgroundColor: '#fafafa', duration: 0.15 })}
      onMouseLeave={() => gsap.to(rowRef.current, { backgroundColor: 'transparent', duration: 0.15 })}
      className="group"
    >
      <td className="px-4 py-3">
        <span className="text-[11px] font-mono text-dom-600 bg-dom-50 px-2 py-0.5 rounded whitespace-nowrap">
          {p.numeroCaso}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link to={`/proyectos/${p.id}`} className="font-medium text-gray-900 hover:text-dom-600 transition-colors">
          {p.nombre}
        </Link>
        {p.comuna && <p className="text-[11px] text-gray-400 mt-0.5">{p.comuna}</p>}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="text-[13px] text-gray-700 truncate max-w-[160px]">{p.propietario?.nombre || '—'}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${COLORES_FASE[fase]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: DOT_FASE[fase] }} />
            {ETIQUETAS_FASE[fase]}
          </span>
        </div>
        {boton && (
          <button
            onClick={onAvanzar}
            disabled={avanzando}
            className="mt-1.5 text-[10px] text-dom-600 hover:text-dom-700 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {avanzando ? 'Avanzando...' : boton}
            {!avanzando && <ArrowRight className="h-2.5 w-2.5" />}
          </button>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {total > 0
          ? <span className="text-[13px] font-semibold text-gray-800">{sym}{(total / 1e6).toFixed(1)}M</span>
          : <span className="text-[11px] text-gray-300">Sin BC3</span>
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/proyectos/${p.id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-dom-600 hover:bg-dom-50 transition-colors"
            title="Ver detalle"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/proyectos/${p.id}/editar`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onEliminar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar permanentemente"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
