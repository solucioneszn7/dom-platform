// ===== Página de Consulta de Cliente (Pública) =====
// No requiere login. El cliente ingresa su número de caso para ver el estado.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Building2,
  MapPin,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import { obtenerProyectoPorCaso } from '../../servicios/proyectos'
import { obtenerTramitaciones } from '../../servicios/tramitaciones'
import { FASES } from '../../constantes/tramitaciones'
import { formatearFecha, calcularProgreso } from '../../utils/generadores'
import Boton from '../../componentes/ui/Boton'
import CampoTexto from '../../componentes/ui/CampoTexto'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Insignia from '../../componentes/ui/Insignia'
import BarraProgreso from '../../componentes/ui/BarraProgreso'

export default function PaginaConsultaCliente() {
  const [numeroCaso, setNumeroCaso] = useState('')
  const [resultado, setResultado] = useState(null)
  const [tramitaciones, setTramitaciones] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)

  async function manejarBusqueda(e) {
    e.preventDefault()
    if (!numeroCaso.trim()) return

    setBuscando(true)
    setNoEncontrado(false)
    setResultado(null)

    try {
      const proyecto = await obtenerProyectoPorCaso(numeroCaso.trim())

      if (!proyecto) {
        setNoEncontrado(true)
        return
      }

      setResultado(proyecto)

      // Obtener tramitaciones del proyecto
      const trams = await obtenerTramitaciones(proyecto.id)
      setTramitaciones(trams)
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setNoEncontrado(true)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dom-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-dom-600" />
            <span className="text-lg font-bold text-gray-900">DOM</span>
            <span className="text-xs font-medium text-dom-600 bg-dom-50 px-2 py-0.5 rounded-full">
              Platform
            </span>
          </div>
          <Link to="/login">
            <Boton variante="fantasma" tamano="sm">
              Iniciar Sesión
            </Boton>
          </Link>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Consulta tu Tramitación
          </h1>
          <p className="text-gray-500 mt-2">
            Ingresa tu número de caso para ver el estado de tu trámite
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={manejarBusqueda} className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <CampoTexto
              placeholder="Ej: DOM-2026-0001"
              value={numeroCaso}
              onChange={(e) => setNumeroCaso(e.target.value.toUpperCase())}
              icono={Search}
              className="flex-1"
            />
            <Boton type="submit" cargando={buscando}>
              Buscar
            </Boton>
          </div>
        </form>

        {/* Resultado: No encontrado */}
        {noEncontrado && (
          <Tarjeta className="max-w-md mx-auto">
            <TarjetaCuerpo>
              <div className="text-center py-4">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">Caso no encontrado</p>
                <p className="text-sm text-gray-500 mt-1">
                  Verifica el número de caso e intenta nuevamente
                </p>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        )}

        {/* Resultado: Encontrado */}
        {resultado && (
          <div className="space-y-6">
            {/* Info del proyecto */}
            <Tarjeta>
              <TarjetaCuerpo>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-dom-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-dom-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-dom-600 bg-dom-50 px-2 py-0.5 rounded">
                        {resultado.numeroCaso}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          resultado.estado === 'activo'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {resultado.estado}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {resultado.nombre}
                    </h2>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {resultado.direccion}, {resultado.comuna}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Registrado: {formatearFecha(resultado.fechaCreacion)}
                    </p>
                  </div>
                </div>
              </TarjetaCuerpo>
            </Tarjeta>

            {/* Tramitaciones */}
            {tramitaciones.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Estado de Tramitaciones
                </h3>
                {tramitaciones.map((tram) => {
                  const progreso = calcularProgreso(tram.documentos)
                  const faseInfo = Object.values(FASES).find((f) => f.id === tram.fase)

                  return (
                    <Tarjeta key={tram.id}>
                      <TarjetaCuerpo>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-base font-medium text-gray-900">
                            {tram.tipoNombre}
                          </h4>
                          <Insignia fase={tram.fase} />
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          {faseInfo?.descripcion}
                        </p>
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progreso de documentos</span>
                            <span>{progreso}%</span>
                          </div>
                          <BarraProgreso porcentaje={progreso} />
                        </div>
                      </TarjetaCuerpo>
                    </Tarjeta>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
