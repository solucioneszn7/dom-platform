import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  X,
  Upload,
  MessageSquare,
  Send,
  FileText,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Pencil,
  RotateCcw,
  Plus,
  Trash2,
  CircleDot,
} from 'lucide-react'
import { obtenerProyecto } from '../../servicios/proyectos'
import {
  obtenerTramitacion,
  cambiarFase,
  marcarDocumentoSubido,
  agregarObservacion,
  marcarFormularioOguc,
  desmarcarFormularioOguc,
} from '../../servicios/tramitaciones'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { FASES, LISTA_FASES } from '../../constantes/tramitaciones'
import { formatearFecha, formatearFechaHora, calcularProgreso } from '../../utils/generadores'
import Tarjeta, { TarjetaEncabezado, TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Insignia from '../../componentes/ui/Insignia'
import BarraProgreso from '../../componentes/ui/BarraProgreso'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'
import FormulariosDomIntegrados from '../../componentes/FormulariosDomIntegrados'

const iconosFase = {
  preparacion: FileText,
  ingreso_dom: Building2,
  en_revision: Clock,
  observaciones: AlertTriangle,
  aprobado: CheckCircle,
  rechazado: XCircle,
  recepcion: Award,
}

export default function PaginaDetalleTramitacion() {
  const { id: proyectoId, tramitacionId } = useParams()
  const navegar = useNavigate()
  const { datosUsuario } = useAuth()

  const [proyecto, setProyecto] = useState(null)
  const [tramitacion, setTramitacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [textoObservacion, setTextoObservacion] = useState('')
  const [enviandoObs, setEnviandoObs] = useState(false)
  const [documentoActivo, setDocumentoActivo] = useState(null)
  const [nuevoDocNombre, setNuevoDocNombre] = useState('')
  const [nuevoDocCarpeta, setNuevoDocCarpeta] = useState('01_Formularios')

  useEffect(() => {
    cargarDatos()
  }, [proyectoId, tramitacionId])

  async function cargarDatos() {
    try {
      const [proy, tram] = await Promise.all([
        obtenerProyecto(proyectoId),
        obtenerTramitacion(proyectoId, tramitacionId),
      ])
      setProyecto(proy)
      setTramitacion(tram)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar la tramitación')
      navegar(`/proyectos/${proyectoId}`)
    } finally {
      setCargando(false)
    }
  }

  async function manejarCambioFase(nuevaFase) {
    try {
      await cambiarFase(proyectoId, tramitacionId, nuevaFase)
      setTramitacion({ ...tramitacion, fase: nuevaFase })
      toast.success(`Fase actualizada a: ${FASES[Object.keys(FASES).find(k => FASES[k].id === nuevaFase)]?.nombre}`)
    } catch (error) {
      toast.error('Error al cambiar la fase')
    }
  }

  async function manejarMarcarDocumento(indice) {
    try {
      await marcarDocumentoSubido(proyectoId, tramitacionId, indice, {
        nombreArchivo: `documento_${indice + 1}`,
      })
      const nuevosDocumentos = [...tramitacion.documentos]
      nuevosDocumentos[indice] = { ...nuevosDocumentos[indice], subido: true }
      setTramitacion({ ...tramitacion, documentos: nuevosDocumentos })
      toast.success('Documento marcado como subido')
    } catch (error) {
      toast.error('Error al actualizar documento')
    }
  }

  async function manejarEnviarObservacion() {
    if (!textoObservacion.trim()) return
    setEnviandoObs(true)
    try {
      await agregarObservacion(
        proyectoId,
        tramitacionId,
        textoObservacion,
        datosUsuario?.nombre || 'Usuario'
      )
      setTramitacion({
        ...tramitacion,
        observaciones: [
          ...tramitacion.observaciones,
          {
            texto: textoObservacion,
            autor: datosUsuario?.nombre,
            fecha: new Date().toISOString(),
            estado: 'pendiente',
          },
        ],
      })
      setTextoObservacion('')
      toast.success('Observación agregada')
    } catch (error) {
      toast.error('Error al agregar observación')
    } finally {
      setEnviandoObs(false)
    }
  }

  if (cargando) return <Cargando texto="Cargando tramitación..." />
  if (!tramitacion || !proyecto) return null

  const progreso = calcularProgreso(tramitacion.documentos)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Boton
          variante="fantasma"
          tamano="sm"
          icono={ArrowLeft}
          onClick={() => navegar(`/proyectos/${proyectoId}`)}
        />
        <div>
          <p className="text-sm text-gray-500">
            {proyecto.numeroCaso} — {proyecto.nombre}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {tramitacion.tipoNombre}
          </h1>
        </div>
      </div>

      {/* Línea de tiempo de fases */}
      <Tarjeta>
        <TarjetaEncabezado>
          <h2 className="text-base font-semibold text-gray-900">
            Fase Actual
          </h2>
        </TarjetaEncabezado>
        <TarjetaCuerpo>
          <div className="flex flex-wrap gap-2 mb-4">
            {LISTA_FASES.map((fase) => {
              const esActual = tramitacion.fase === fase.id
              const IconoFase = iconosFase[fase.id] || FileText

              return (
                <button
                  key={fase.id}
                  onClick={() => manejarCambioFase(fase.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    esActual
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={esActual ? { backgroundColor: fase.color } : {}}
                >
                  <IconoFase className="h-4 w-4" />
                  {fase.nombre}
                </button>
              )
            })}
          </div>
          <div className="text-sm text-gray-500">
            {FASES[Object.keys(FASES).find(k => FASES[k].id === tramitacion.fase)]?.descripcion}
          </div>
        </TarjetaCuerpo>
      </Tarjeta>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist de documentos — con agregar */}
        <Tarjeta>
          <TarjetaEncabezado>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Documentos</h2>
              <span className="text-sm font-bold text-dom-600">{progreso}%</span>
            </div>
            <BarraProgreso porcentaje={progreso} className="mt-2" />
          </TarjetaEncabezado>
          <TarjetaCuerpo className="p-0">
            {/* Agregar nuevo documento */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del documento..."
                  value={nuevoDocNombre}
                  onChange={(e) => setNuevoDocNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nuevoDocNombre.trim()) {
                      const nuevosDocumentos = [...tramitacion.documentos, {
                        nombre: nuevoDocNombre.trim(),
                        requerido: false,
                        carpeta: nuevoDocCarpeta,
                        subido: false,
                      }]
                      setTramitacion({ ...tramitacion, documentos: nuevosDocumentos })
                      setNuevoDocNombre('')
                      toast.success('Documento agregado')
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500"
                />
                <select
                  value={nuevoDocCarpeta}
                  onChange={(e) => setNuevoDocCarpeta(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-600 focus:border-dom-500 focus:outline-none"
                >
                  <option value="01_Formularios">01_Formularios</option>
                  <option value="02_Planos">02_Planos</option>
                  <option value="03_Calculos">03_Calculos</option>
                  <option value="04_Certificados">04_Certificados</option>
                  <option value="05_Informes">05_Informes</option>
                  <option value="06_Recepcion">06_Recepcion</option>
                </select>
                <button
                  onClick={() => {
                    if (!nuevoDocNombre.trim()) return
                    const nuevosDocumentos = [...tramitacion.documentos, {
                      nombre: nuevoDocNombre.trim(),
                      requerido: false,
                      carpeta: nuevoDocCarpeta,
                      subido: false,
                    }]
                    setTramitacion({ ...tramitacion, documentos: nuevosDocumentos })
                    setNuevoDocNombre('')
                    toast.success('Documento agregado')
                  }}
                  disabled={!nuevoDocNombre.trim()}
                  className="p-1.5 rounded-lg bg-dom-600 text-white hover:bg-dom-700 disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lista agrupada por carpeta */}
            {(() => {
              const grupos = {}
              tramitacion.documentos.forEach((doc, indice) => {
                const carpeta = doc.carpeta || 'General'
                if (!grupos[carpeta]) grupos[carpeta] = []
                grupos[carpeta].push({ ...doc, indice })
              })

              return Object.entries(grupos).map(([carpeta, docs]) => {
                const subidos = docs.filter(d => d.subido).length
                const total = docs.length
                const porcGrupo = Math.round((subidos / total) * 100)

                return (
                  <div key={carpeta}>
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{carpeta}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${porcGrupo === 100 ? 'bg-emerald-500' : 'bg-dom-500'}`} style={{ width: `${porcGrupo}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{subidos}/{total}</span>
                      </div>
                    </div>
                    {docs.map((doc) => {
                      const esActivo = documentoActivo === doc.indice
                      return (
                        <div
                          key={doc.indice}
                          onClick={() => setDocumentoActivo(esActivo ? null : doc.indice)}
                          className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-all border-b border-gray-50 ${
                            esActivo ? 'bg-dom-50 border-l-4 border-l-dom-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              doc.subido ? 'bg-emerald-100 text-emerald-600' : esActivo ? 'bg-dom-100 text-dom-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {doc.subido ? <Check className="h-3.5 w-3.5" /> : esActivo ? <Pencil className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm truncate ${doc.subido ? 'text-gray-500 line-through' : esActivo ? 'text-dom-700 font-semibold' : 'text-gray-900'}`}>
                                {doc.nombre}
                              </p>
                              <p className="text-xs text-gray-400">
                                {doc.requerido ? 'Requerido' : 'Agregado'}{esActivo && !doc.subido && ' · En trabajo'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!doc.subido ? (
                              <Boton variante="fantasma" tamano="sm" icono={Upload} onClick={(e) => { e.stopPropagation(); manejarMarcarDocumento(doc.indice) }}>Subir</Boton>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); const nd = [...tramitacion.documentos]; nd[doc.indice] = { ...nd[doc.indice], subido: false }; setTramitacion({ ...tramitacion, documentos: nd }); toast.success('Desmarcado') }}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Desmarcar">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {!doc.requerido && (
                              <button onClick={(e) => { e.stopPropagation(); const nd = tramitacion.documentos.filter((_, idx) => idx !== doc.indice); setTramitacion({ ...tramitacion, documentos: nd }); toast.success('Documento eliminado') }}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all" title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            })()}
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Observaciones con estados */}
        <Tarjeta>
          <TarjetaEncabezado>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Observaciones</h2>
              {tramitacion.observaciones.length > 0 && (
                <span className="text-xs text-gray-500">
                  {tramitacion.observaciones.filter(o => o.estado === 'solucionada').length}/{tramitacion.observaciones.length} resueltas
                </span>
              )}
            </div>
          </TarjetaEncabezado>
          <TarjetaCuerpo>
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
              {tramitacion.observaciones.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay observaciones aún
                </p>
              ) : (
                tramitacion.observaciones.map((obs, i) => {
                  const esSolucionada = obs.estado === 'solucionada'
                  return (
                    <div key={i} className={`rounded-lg p-3 border transition-all ${
                      esSolucionada ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-dom-600">{obs.autor}</span>
                          <button
                            onClick={() => {
                              const nuevasObs = [...tramitacion.observaciones]
                              nuevasObs[i] = { ...nuevasObs[i], estado: esSolucionada ? 'pendiente' : 'solucionada' }
                              setTramitacion({ ...tramitacion, observaciones: nuevasObs })
                              toast.success(esSolucionada ? 'Marcada como pendiente' : 'Marcada como solucionada')
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold cursor-pointer transition-colors ${
                              esSolucionada
                                ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300'
                                : 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                            }`}
                          >
                            {esSolucionada ? '✓ Solucionada' : '● Pendiente'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-400">{formatearFechaHora(obs.fecha)}</span>
                          <button
                            onClick={() => {
                              if (!confirm('¿Eliminar esta observación?')) return
                              const nuevasObs = tramitacion.observaciones.filter((_, idx) => idx !== i)
                              setTramitacion({ ...tramitacion, observaciones: nuevasObs })
                              toast.success('Observación eliminada')
                            }}
                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Eliminar observación"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm ${esSolucionada ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{obs.texto}</p>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribir observación..."
                value={textoObservacion}
                onChange={(e) => setTextoObservacion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && manejarEnviarObservacion()}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                  placeholder-gray-400 focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500"
              />
              <Boton
                tamano="sm"
                icono={Send}
                onClick={manejarEnviarObservacion}
                cargando={enviandoObs}
                disabled={!textoObservacion.trim()}
              />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* ✨ NUEVO: Formularios OGUC */}
        <div className="lg:col-span-2">
          <Tarjeta>
            <TarjetaEncabezado>
              <h2 className="text-base font-semibold text-gray-900">
                Formularios OGUC — Art. 1.4.3
              </h2>
            </TarjetaEncabezado>
            <TarjetaCuerpo>
              <FormulariosDomIntegrados 
                tramitacion={tramitacion}
                onFormularioCompleto={async (formulario) => {
                  try {
                    const nuevos = await marcarFormularioOguc(proyectoId, tramitacionId, formulario)
                    setTramitacion({ ...tramitacion, formularios_oguc: nuevos })
                    toast.success(`Formulario ${formulario.codigo} marcado como completado`)
                  } catch (error) {
                    console.error('Error al marcar formulario:', error)
                    toast.error('Error al actualizar formulario')
                  }
                }}
                onFormularioRemover={async (codigoFormulario) => {
                  try {
                    const nuevos = await desmarcarFormularioOguc(proyectoId, tramitacionId, codigoFormulario)
                    setTramitacion({ ...tramitacion, formularios_oguc: nuevos })
                    toast.success('Formulario desmarcado')
                  } catch (error) {
                    console.error('Error al desmarcar formulario:', error)
                    toast.error('Error al actualizar formulario')
                  }
                }}
              />
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}
