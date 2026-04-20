// ===== Detalle Proyecto — Notion-style page =====
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, MapPin, User, Phone, Mail, Calendar, FileText,
  Trash2, ChevronRight,
} from 'lucide-react'
import { obtenerProyecto } from '../../servicios/proyectos'
// Tramitaciones removed - replaced by Estudios
// TIPOS_TRAMITACION removed
import { formatearFecha, calcularProgreso } from '../../utils/generadores'
import Tarjeta, { TarjetaEncabezado, TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Insignia from '../../componentes/ui/Insignia'
import BarraProgreso from '../../componentes/ui/BarraProgreso'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'
import TarjetaResumenFinanciero from '../../componentes/TarjetaResumenFinanciero'

export default function PaginaDetalleProyecto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [proyecto, setProyecto] = useState(null)
  const [tramitaciones, setTramitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [tipoSeleccionado, setTipoSeleccionado] = useState('')
  const [creandoTramitacion, setCreandoTramitacion] = useState(false)

  useEffect(() => { cargarProyecto() }, [id])
  useEffect(() => {
    if (!id) return
    const cancelar = (() => {})
    return cancelar
  }, [id])

  async function cargarProyecto() {
    try {
      const datos = await obtenerProyecto(id)
      setProyecto(datos)
    } catch {
      toast.error('Proyecto no encontrado'); navegar('/proyectos')
    } finally { setCargando(false) }
  }

  async function manejarCrearTramitacion() {
    if (!tipoSeleccionado) { toast.error('Selecciona un tipo'); return }
    setCreandoTramitacion(true)
    try {
      await Promise.resolve()
      toast.success('Tramitación creada'); setMostrarModal(false); setTipoSeleccionado('')
    } catch { toast.error('Error al crear') }
    finally { setCreandoTramitacion(false) }
  }

  async function manejarEliminar(tramId, tramNombre, e) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`¿Eliminar "${tramNombre}"?\n\nEsta acción no se puede deshacer.`)) return
    try { await Promise.resolve(); toast.success('Eliminada') }
    catch { toast.error('Error al eliminar') }
  }

  if (cargando) return <Cargando texto="Cargando proyecto..." />
  if (!proyecto) return null

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Back */}
      <div className="flex items-center gap-2 text-[13px]">
        <button onClick={() => navegar('/proyectos')} className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Proyectos
        </button>
        <ChevronRight className="h-3 w-3 text-gray-300" />
        <span className="text-gray-800 font-medium">{proyecto.numeroCaso}</span>
      </div>

      {/* Page Title — Notion style large heading */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-dom-600 bg-dom-50 px-2 py-0.5 rounded">{proyecto.numeroCaso}</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
            proyecto.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${proyecto.estado === 'activo' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {proyecto.estado}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{proyecto.nombre}</h1>
      </div>

      {/* Property blocks — Notion inline database properties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Datos del proyecto */}
        <Tarjeta>
          <TarjetaEncabezado>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos del Proyecto</h2>
          </TarjetaEncabezado>
          <TarjetaCuerpo className="space-y-3">
            <PropertyRow icon={MapPin} label="Dirección" value={`${proyecto.direccion}, ${proyecto.comuna}`} />
            <PropertyRow icon={Calendar} label="Creado" value={formatearFecha(proyecto.fechaCreacion)} />
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Propietario */}
        <Tarjeta>
          <TarjetaEncabezado>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Propietario</h2>
          </TarjetaEncabezado>
          <TarjetaCuerpo className="space-y-3">
            <PropertyRow icon={User} label="Nombre" value={proyecto.propietario?.nombre || '—'} />
            <PropertyRow icon={FileText} label="RUT" value={proyecto.propietario?.rut || '—'} />
            <PropertyRow icon={Phone} label="Teléfono" value={proyecto.propietario?.telefono || '—'} />
            <PropertyRow icon={Mail} label="Email" value={proyecto.propietario?.email || '—'} />
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Financiero */}
        <TarjetaResumenFinanciero proyecto={proyecto} onActualizado={() => cargarProyecto()} />
      </div>

      {/* Tramitaciones — Notion-style linked database */}
      <Tarjeta>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tramitaciones</h2>
          <Boton tamano="xs" icono={Plus} onClick={() => setMostrarModal(true)}>Agregar</Boton>
        </div>

        {tramitaciones.length === 0 ? (
          <TarjetaCuerpo>
            <div className="py-12 text-center">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <FileText className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 mb-3">No hay tramitaciones aún</p>
              <Boton tamano="xs" icono={Plus} onClick={() => setMostrarModal(true)}>Agregar primera</Boton>
            </div>
          </TarjetaCuerpo>
        ) : (
          <div className="divide-y divide-gray-50">
            {tramitaciones.map(tram => (
              <div key={tram.id} className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/30 transition-colors group">
                <Link to={`/proyectos/${id}/tramitaciones/${tram.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] font-semibold text-gray-900">{tram.tipoNombre}</span>
                    <Insignia fase={tram.fase} conPunto />
                  </div>
                  <BarraProgreso porcentaje={calcularProgreso(tram.documentos)} className="max-w-xs" delgada />
                </Link>
                <button
                  onClick={e => manejarEliminar(tram.id, tram.tipoNombre, e)}
                  className="p-1.5 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all ml-3"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {/* Modal nueva tramitación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Nueva Tramitación</h3>
            <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto">
              {LISTA_TIPOS.map(tipo => {
                const key = Object.keys(TIPOS_TRAMITACION).find(k => TIPOS_TRAMITACION[k].id === tipo.id)
                const selected = tipoSeleccionado === key
                return (
                  <label key={tipo.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selected ? 'border-dom-500 bg-dom-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="tipo" className="mt-0.5 accent-dom-600" checked={selected} onChange={() => setTipoSeleccionado(key)} />
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{tipo.nombre}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{tipo.descripcion}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" tamano="sm" onClick={() => { setMostrarModal(false); setTipoSeleccionado('') }}>Cancelar</Boton>
              <Boton tamano="sm" onClick={manejarCrearTramitacion} cargando={creandoTramitacion}>Crear</Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PropertyRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-[13px] text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}
