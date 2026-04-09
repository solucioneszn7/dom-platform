// ===== Tarjeta Resumen Financiero — con contratos seleccionables =====
import { useState, useEffect } from 'react'
import { DollarSign, Edit2, Plus, TrendingUp, Percent, Trash2, ChevronDown } from 'lucide-react'
import { obtenerContratos, eliminarContrato } from '../servicios/financiero'
import { formatearMontoCLP } from '../servicios/financiero'
import Tarjeta, { TarjetaEncabezado, TarjetaCuerpo } from './ui/Tarjeta'
import Boton from './ui/Boton'
import BarraProgreso from './ui/BarraProgreso'
import ModalPresupuesto from './ModalPresupuesto'
import toast from 'react-hot-toast'

export default function TarjetaResumenFinanciero({ proyecto, onActualizado }) {
  const [contratos, setContratos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null)
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    cargarContratos()
  }, [proyecto.id])

  async function cargarContratos() {
    try {
      const datos = await obtenerContratos(proyecto.id)
      setContratos(datos)
    } catch (error) {
      console.error('Error al cargar contratos:', error)
    } finally {
      setCargando(false)
    }
  }

  const rf = proyecto.resumenFinanciero || {}
  const totalAcordado = rf.totalAcordado || 0
  const totalEjecutado = rf.totalEjecutado || 0
  const totalPendiente = rf.totalPendiente || 0
  const porcentajeEjecucion = rf.porcentajeEjecucion || 0

  function abrirCrear() {
    setContratoSeleccionado(null)
    setModalAbierto(true)
  }

  function abrirEditar(contrato) {
    setContratoSeleccionado(contrato)
    setModalAbierto(true)
  }

  async function handleEliminar(contrato, e) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar contrato "${contrato.descripcion || contrato.numeroContrato}"?`)) return
    try {
      await eliminarContrato(proyecto.id, contrato.id)
      toast.success('Contrato eliminado')
      cargarContratos()
      if (onActualizado) onActualizado()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  function handleActualizado() {
    cargarContratos()
    if (onActualizado) onActualizado()
  }

  if (cargando) {
    return (
      <Tarjeta>
        <TarjetaEncabezado>
          <h2 className="text-base font-semibold text-gray-900">Resumen Financiero</h2>
        </TarjetaEncabezado>
        <TarjetaCuerpo className="text-center py-8 text-gray-500">Cargando...</TarjetaCuerpo>
      </Tarjeta>
    )
  }

  return (
    <>
      <Tarjeta>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-dom-600" />
            Resumen Financiero
          </h2>
          <Boton tamano="sm" variante="secundario" icono={Plus} onClick={abrirCrear}>
            Nuevo Contrato
          </Boton>
        </div>
        <TarjetaCuerpo>
          {contratos.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No hay presupuesto registrado</p>
              <Boton tamano="sm" onClick={abrirCrear}>Crear Presupuesto</Boton>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Métricas globales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dom-50 p-4 rounded-lg border border-dom-200">
                  <p className="text-xs text-dom-600 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />Total Acordado
                  </p>
                  <p className="text-xl font-bold text-dom-800">{formatearMontoCLP(totalAcordado)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />Ejecutado
                  </p>
                  <p className="text-xl font-bold text-emerald-800">{formatearMontoCLP(totalEjecutado)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Disponible</p>
                  <p className="text-lg font-bold text-gray-800">{formatearMontoCLP(totalPendiente)}</p>
                </div>
                <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                    <Percent className="w-3 h-3" />Ejecución
                  </p>
                  <p className="text-lg font-bold text-gray-800">{porcentajeEjecucion}%</p>
                </div>
              </div>

              {/* Barra global */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Avance Presupuestario</span>
                  <span className="font-semibold">{porcentajeEjecucion}%</span>
                </div>
                <BarraProgreso porcentaje={porcentajeEjecucion} />
              </div>

              {/* Lista de contratos — seleccionables */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => setExpandido(!expandido)}
                  className="flex items-center justify-between w-full text-left mb-2"
                >
                  <p className="text-xs font-semibold text-gray-700">
                    {contratos.length} contrato{contratos.length !== 1 ? 's' : ''} registrado{contratos.length !== 1 ? 's' : ''}
                  </p>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandido ? 'rotate-180' : ''}`} />
                </button>

                {expandido && (
                  <div className="space-y-2">
                    {contratos.map((c) => {
                      const porcContrato = c.montoAcordado > 0
                        ? Math.round(((c.montoEjecutado || 0) / c.montoAcordado) * 100)
                        : 0
                      return (
                        <div
                          key={c.id}
                          onClick={() => abrirEditar(c)}
                          className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-dom-300 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {c.descripcion || c.numeroContrato || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {c.numeroContrato && `N° ${c.numeroContrato} · `}
                                {c.fechaContrato ? new Date(c.fechaContrato).toLocaleDateString('es-CL') : ''}
                                {c.fase && c.fase !== 'general' ? ` · ${c.fase}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); abrirEditar(c) }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-dom-600 hover:bg-dom-50 opacity-0 group-hover:opacity-100 transition-all"
                                title="Editar contrato"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleEliminar(c, e)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                title="Eliminar contrato"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Montos del contrato */}
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-600">
                              Acordado: <span className="font-semibold text-gray-900">{formatearMontoCLP(c.montoAcordado)}</span>
                            </span>
                            <span className="text-emerald-600">
                              Ejecutado: <span className="font-semibold">{formatearMontoCLP(c.montoEjecutado || 0)}</span>
                            </span>
                          </div>

                          {/* Barra individual */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  porcContrato >= 90 ? 'bg-red-500' :
                                  porcContrato >= 70 ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${porcContrato}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-500 min-w-[2.5rem] text-right">{porcContrato}%</span>
                          </div>

                          {c.anticipo > 0 && (
                            <p className="text-xs text-blue-600 mt-1">Anticipo: {formatearMontoCLP(c.anticipo)}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </TarjetaCuerpo>
      </Tarjeta>

      {/* Modal edición/creación */}
      {modalAbierto && (
        <ModalPresupuesto
          proyecto={proyecto}
          contrato={contratoSeleccionado}
          onCerrar={() => setModalAbierto(false)}
          onActualizado={handleActualizado}
        />
      )}
    </>
  )
}
