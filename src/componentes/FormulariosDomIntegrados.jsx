// ===== Formularios OGUC — Desplegable con requisitos por fase =====
import { useState } from 'react'
import { FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink, FolderOpen } from 'lucide-react'
import { obtenerFormulariosParaTipo, CATALOGO_MINVU } from '../servicios/formulariosDom'
import Tarjeta, { TarjetaCuerpo } from './ui/Tarjeta'
import Boton from './ui/Boton'
import Insignia from './ui/Insignia'

// Requisitos comunes por etapa del flujo documental
const REQUISITOS_POR_ETAPA = {
  anteproyecto: [
    'Certificado de Informaciones Previas vigente',
    'Planos de anteproyecto (escala según OGUC)',
    'Memoria explicativa del proyecto',
  ],
  solicitud_permiso: [
    'Certificado de Informaciones Previas vigente',
    'Título de dominio del predio',
    'Declaración jurada del propietario (Art. 1.2.2 OGUC)',
    'Patentes profesionales vigentes (Arquitecto, Constructor)',
    'Planos de arquitectura a escala con cuadro de superficies',
    'Especificaciones técnicas',
    'Presupuesto de las obras',
    'Certificado de avalúo fiscal del SII',
  ],
  permiso: [
    'Solicitud aprobada por la DOM',
    'Todos los antecedentes del expediente timbrados',
    'Pago de derechos municipales',
  ],
  solicitud_modificacion: [
    'Lista de modificaciones referidas a cada plano (Art. 5.1.17 OGUC)',
    'Planos con modificaciones firmados por arquitecto y propietario',
    'Cuadro de superficies actualizado',
    'Especificaciones técnicas de las modificaciones',
    'Presupuesto de obras complementarias',
    'Fotocopia del permiso original',
  ],
  resolucion_modificacion: [
    'Solicitud de modificación aprobada',
    'Expediente actualizado y timbrado por la DOM',
  ],
  solicitud_recepcion: [
    'Informe del Arquitecto conforme al permiso (Art. 144 LGUC)',
    'Informe del Revisor Independiente (si corresponde)',
    'Informe del Inspector Técnico de Obra (si corresponde)',
    'Declaración jurada del Constructor (gestión y control de calidad)',
    'Libro de obras',
    'Certificado de dotación agua potable y alcantarillado',
    'Documentos instalaciones eléctricas y gas (si procede)',
    'Certificado de ensaye hormigones (si procede)',
  ],
  certificado_recepcion: [
    'Solicitud de recepción aprobada',
    'Todos los certificados e informes verificados por la DOM',
    'Pago total de derechos municipales',
  ],
}

// Mapeo: fase de tramitación → etapas de formularios activas
const FASE_A_ETAPAS = {
  preparacion: ['anteproyecto', 'solicitud_permiso'],
  ingreso_dom: ['solicitud_permiso'],
  en_revision: ['solicitud_permiso', 'permiso'],
  observaciones: ['solicitud_modificacion'],
  aprobado: ['permiso', 'resolucion_modificacion'],
  rechazado: [],
  recepcion: ['solicitud_recepcion', 'certificado_recepcion'],
}

export default function FormulariosDomIntegrados({ tramitacion, onFormularioCompleto, onFormularioRemover }) {
  const tipoNormalizado = tramitacion.tipo?.toLowerCase?.() || ''
  const formularios = obtenerFormulariosParaTipo(tipoNormalizado)
  const formulariosCompletados = tramitacion.formularios_oguc || []
  const [expandido, setExpandido] = useState({})
  const [seccionAbierta, setSeccionAbierta] = useState(true)

  if (formularios.length === 0) return null

  const requeridos = formularios.filter((f) => f.requerido)
  const completados = requeridos.filter((f) =>
    formulariosCompletados.some((c) => c.codigo === f.codigo && c.completado)
  )
  const porcentaje = Math.round((completados.length / requeridos.length) * 100)

  // Etapas activas según la fase actual
  const etapasActivas = FASE_A_ETAPAS[tramitacion.fase] || []

  // Agrupar formularios por etapa
  const grupos = {}
  for (const f of formularios) {
    const etapa = f.etapa || 'general'
    if (!grupos[etapa]) grupos[etapa] = []
    grupos[etapa].push(f)
  }

  const nombresEtapa = {
    anteproyecto: 'Anteproyecto',
    resolucion_anteproyecto: 'Resolución Anteproyecto',
    solicitud_permiso: 'Solicitud de Permiso',
    permiso: 'Permiso',
    solicitud_modificacion: 'Modificación de Proyecto',
    resolucion_modificacion: 'Resolución Modificación',
    solicitud_recepcion: 'Recepción Definitiva',
    certificado_recepcion: 'Certificado de Recepción',
    general: 'General',
  }

  return (
    <div className="space-y-4">
      {/* Encabezado desplegable */}
      <button
        onClick={() => setSeccionAbierta(!seccionAbierta)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-dom-600" />
          <h3 className="font-semibold text-gray-900">Formularios OGUC</h3>
          <span className="text-xs bg-dom-50 text-dom-600 px-2 py-0.5 rounded-full font-medium">
            {completados.length}/{requeridos.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">{porcentaje}%</span>
          {seccionAbierta ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {/* Barra de progreso */}
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-dom-600 h-full transition-all" style={{ width: `${porcentaje}%` }} />
      </div>

      {seccionAbierta && (
        <>
          {/* Info fase actual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Fase actual: {tramitacion.fase?.replace(/_/g, ' ')}</strong> — Los formularios relevantes para esta fase están resaltados.
            </p>
          </div>

          {/* Formularios agrupados por etapa */}
          <div className="space-y-4">
            {Object.entries(grupos).map(([etapa, forms]) => {
              const esEtapaActiva = etapasActivas.includes(etapa)
              const requisitos = REQUISITOS_POR_ETAPA[etapa] || []

              return (
                <div
                  key={etapa}
                  className={`rounded-lg border transition-all ${
                    esEtapaActiva
                      ? 'border-dom-300 bg-dom-50/30'
                      : 'border-gray-200 bg-white opacity-60'
                  }`}
                >
                  {/* Encabezado del grupo */}
                  <div className={`px-4 py-3 flex items-center justify-between ${esEtapaActiva ? 'bg-dom-50' : 'bg-gray-50'} rounded-t-lg`}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className={`h-4 w-4 ${esEtapaActiva ? 'text-dom-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${esEtapaActiva ? 'text-dom-800' : 'text-gray-500'}`}>
                        {nombresEtapa[etapa] || etapa}
                      </span>
                      {esEtapaActiva && (
                        <span className="text-[10px] bg-dom-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Activa</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{forms.length} formulario{forms.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Lista de formularios */}
                  <div className="divide-y divide-gray-100">
                    {forms.map((formulario) => {
                      const completado = formulariosCompletados.find((f) => f.codigo === formulario.codigo)
                      const isExpandido = expandido[formulario.codigo]

                      return (
                        <div key={formulario.codigo} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {/* Icono estado */}
                            <div className="mt-0.5">
                              {completado ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : formulario.requerido ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-300" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-xs font-mono text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded">{formulario.codigo}</code>
                                {formulario.requerido && <Insignia color="red">Requerido</Insignia>}
                                {completado && <Insignia color="green">✓ Completado</Insignia>}
                              </div>
                              <p className="text-sm font-medium text-gray-900 mt-1">{formulario.nombre}</p>
                              <p className="text-xs text-gray-500">{formulario.articulo}</p>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!completado ? (
                                <Boton tamano="sm" onClick={() => onFormularioCompleto(formulario)}>Completar</Boton>
                              ) : (
                                <Boton tamano="sm" variante="secundario" onClick={() => onFormularioRemover(formulario.codigo)}>Desmarcar</Boton>
                              )}
                              <button
                                onClick={() => setExpandido({ ...expandido, [formulario.codigo]: !isExpandido })}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {isExpandido ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                              </button>
                            </div>
                          </div>

                          {/* Detalle expandido — requisitos */}
                          {isExpandido && requisitos.length > 0 && (
                            <div className="mt-3 ml-8 bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Documentación requerida para esta etapa:</p>
                              <ul className="space-y-1">
                                {requisitos.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400 mt-0.5">•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                              {formulario.carpetaGoogle && (
                                <p className="text-xs text-gray-400 mt-2">Carpeta: {formulario.carpetaGoogle}</p>
                              )}
                              {formulario.grupo && (() => {
                                const grupoInfo = CATALOGO_MINVU.find(g => g.id === formulario.grupo)
                                return grupoInfo?.url ? (
                                  <a
                                    href={grupoInfo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-dom-600 hover:text-dom-700 hover:underline mt-2"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Ver formulario oficial en MINVU
                                  </a>
                                ) : null
                              })()}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Requeridos completados: <strong>{completados.length}/{requeridos.length}</strong></span>
              <span>Avance: <strong>{porcentaje}%</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
