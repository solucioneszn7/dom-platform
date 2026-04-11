// ===== Modal Edición de Presupuesto =====
import { useState } from 'react'
import { X, DollarSign, Save, AlertCircle, TrendingUp } from 'lucide-react'
import { actualizarContrato, crearContrato } from '../servicios/financiero'
import { formatearMontoCLP } from '../servicios/financiero'
import Boton from './ui/Boton'
import toast from 'react-hot-toast'

export default function ModalPresupuesto({ proyecto, contrato, onCerrar, onActualizado }) {
  const [cargando, setCargando] = useState(false)
  const [datos, setDatos] = useState({
    montoAcordado: contrato?.montoAcordado || 0,
    montoEjecutado: contrato?.montoEjecutado || 0,
    anticipo: contrato?.anticipo || 0,
    numeroContrato: contrato?.numeroContrato || '',
    descripcion: contrato?.descripcion || 'Contrato Principal'
  })

  const disponible = datos.montoAcordado - datos.montoEjecutado
  const porcentaje = datos.montoAcordado > 0 
    ? ((datos.montoEjecutado / datos.montoAcordado) * 100).toFixed(1)
    : 0

  const hayError = datos.montoEjecutado > datos.montoAcordado

  async function handleGuardar() {
    if (hayError) {
      toast.error('El monto ejecutado no puede superar el monto acordado')
      return
    }

    setCargando(true)
    try {
      if (contrato) {
        // Actualizar contrato existente
        await actualizarContrato(proyecto.id, contrato.id, {
          montoAcordado: Number(datos.montoAcordado),
          montoEjecutado: Number(datos.montoEjecutado),
          anticipo: Number(datos.anticipo),
          numeroContrato: datos.numeroContrato,
          descripcion: datos.descripcion
        })
        toast.success('Presupuesto actualizado correctamente')
      } else {
        // Crear nuevo contrato
        await crearContrato(proyecto.id, {
          montoAcordado: Number(datos.montoAcordado),
          anticipo: Number(datos.anticipo),
          numeroContrato: datos.numeroContrato,
          descripcion: datos.descripcion,
          fase: 'general',
          estado: 'vigente'
        })
        toast.success('Presupuesto creado correctamente')
      }
      onActualizado()
      onCerrar()
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar el presupuesto')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border-t-4 border-dom-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {contrato ? 'Editar Presupuesto' : 'Crear Presupuesto'}
              </h3>
              <p className="text-gray-300 text-sm">{proyecto.nombre}</p>
            </div>
            <button 
              onClick={onCerrar}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Información del Contrato */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                N° Contrato
              </label>
              <input
                type="text"
                value={datos.numeroContrato}
                onChange={(e) => setDatos({ ...datos, numeroContrato: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-dom-500 focus:outline-none transition"
                placeholder="Ej: CTR-2026-001"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={datos.descripcion}
                onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-dom-500 focus:outline-none transition"
                placeholder="Ej: Contrato Principal"
              />
            </div>
          </div>

          {/* Monto Acordado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monto Total Acordado (CLP)
            </label>
            <input
              type="number"
              value={datos.montoAcordado}
              onChange={(e) => setDatos({ ...datos, montoAcordado: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-mono focus:border-dom-500 focus:outline-none transition"
              min="0"
              step="100000"
            />
          </div>

          {/* Anticipo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Anticipo Pactado (CLP)
            </label>
            <input
              type="number"
              value={datos.anticipo}
              onChange={(e) => setDatos({ ...datos, anticipo: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-mono focus:border-dom-500 focus:outline-none transition"
              min="0"
              step="100000"
            />
          </div>

          {/* Monto Ejecutado */}
          {contrato && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Monto Ejecutado/Pagado (CLP)
              </label>
              <input
                type="number"
                value={datos.montoEjecutado}
                onChange={(e) => setDatos({ ...datos, montoEjecutado: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-mono focus:border-dom-500 focus:outline-none transition"
                min="0"
                max={datos.montoAcordado}
                step="100000"
              />
            </div>
          )}

          {/* Resumen Visual */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Monto Acordado</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatearMontoCLP(datos.montoAcordado)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Ejecutado</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatearMontoCLP(datos.montoEjecutado)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Disponible</p>
                <p className="text-lg font-bold text-dom-600">
                  {formatearMontoCLP(disponible)}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            {contrato && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Ejecución Presupuestaria</span>
                  <span className="font-semibold">{porcentaje}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      hayError ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    }`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Validación */}
            {hayError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded">
                <AlertCircle className="w-4 h-4" />
                <span>El monto ejecutado no puede superar el monto acordado</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t border-gray-200">
          <Boton
            variante="secundario"
            onClick={onCerrar}
            disabled={cargando}
          >
            Cancelar
          </Boton>
          <Boton
            onClick={handleGuardar}
            cargando={cargando}
            icono={Save}
          >
            Guardar Cambios
          </Boton>
        </div>
      </div>
    </div>
  )
}
