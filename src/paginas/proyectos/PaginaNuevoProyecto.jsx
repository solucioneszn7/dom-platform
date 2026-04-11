// ===== Página para crear un nuevo proyecto =====
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { crearProyecto } from '../../servicios/proyectos'
import Boton from '../../componentes/ui/Boton'
import CampoTexto from '../../componentes/ui/CampoTexto'
import Tarjeta, { TarjetaEncabezado, TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import toast from 'react-hot-toast'

export default function PaginaNuevoProyecto() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [cargando, setCargando] = useState(false)

  const [formulario, setFormulario] = useState({
    nombre: '',
    direccion: '',
    comuna: '',
    moneda: 'CLP',
    propietarioNombre: '',
    propietarioRut: '',
    propietarioTelefono: '',
    propietarioEmail: '',
  })

  function manejarCambio(campo) {
    return (e) => setFormulario({ ...formulario, [campo]: e.target.value })
  }

  async function manejarSubmit(e) {
    e.preventDefault()
    setCargando(true)

    try {
      const proyecto = await crearProyecto(formulario, usuario.uid)
      toast.success(`Proyecto ${proyecto.numeroCaso} creado exitosamente`)
      navegar(`/proyectos/${proyecto.id}`)
    } catch (error) {
      console.error('Error al crear proyecto:', error)
      toast.error('Error al crear el proyecto')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Boton
          variante="fantasma"
          tamano="sm"
          icono={ArrowLeft}
          onClick={() => navegar('/proyectos')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
          <p className="text-gray-500 mt-0.5">
            Completa los datos para registrar un nuevo proyecto
          </p>
        </div>
      </div>

      <form onSubmit={manejarSubmit}>
        {/* Datos del proyecto */}
        <Tarjeta className="mb-6">
          <TarjetaEncabezado>
            <h2 className="text-base font-semibold text-gray-900">
              Datos del Proyecto
            </h2>
          </TarjetaEncabezado>
          <TarjetaCuerpo className="space-y-4">
            <CampoTexto
              etiqueta="Nombre del proyecto"
              placeholder="Ej: Casa habitación Sr. Pérez"
              value={formulario.nombre}
              onChange={manejarCambio('nombre')}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto
                etiqueta="Dirección"
                placeholder="Ej: Av. Principal 123"
                value={formulario.direccion}
                onChange={manejarCambio('direccion')}
                required
              />
              <CampoTexto
                etiqueta="Comuna"
                placeholder="Ej: Providencia"
                value={formulario.comuna}
                onChange={manejarCambio('comuna')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda del proyecto</label>
              <select value={formulario.moneda} onChange={manejarCambio('moneda')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500/30 bg-white">
                <option value="CLP">🇨🇱 CLP — Peso Chileno</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
                <option value="USD">🇺🇸 USD — Dólar Americano</option>
                <option value="CAD">🇨🇦 CAD — Dólar Canadiense</option>
              </select>
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Datos del propietario */}
        <Tarjeta className="mb-6">
          <TarjetaEncabezado>
            <h2 className="text-base font-semibold text-gray-900">
              Datos del Propietario
            </h2>
          </TarjetaEncabezado>
          <TarjetaCuerpo className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto
                etiqueta="Nombre completo"
                placeholder="Ej: Juan Pérez González"
                value={formulario.propietarioNombre}
                onChange={manejarCambio('propietarioNombre')}
                required
              />
              <CampoTexto
                etiqueta="RUT"
                placeholder="Ej: 12.345.678-9"
                value={formulario.propietarioRut}
                onChange={manejarCambio('propietarioRut')}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto
                etiqueta="Teléfono"
                type="tel"
                placeholder="Ej: +56 9 1234 5678"
                value={formulario.propietarioTelefono}
                onChange={manejarCambio('propietarioTelefono')}
              />
              <CampoTexto
                etiqueta="Email"
                type="email"
                placeholder="Ej: propietario@email.com"
                value={formulario.propietarioEmail}
                onChange={manejarCambio('propietarioEmail')}
              />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Boton
            variante="secundario"
            type="button"
            onClick={() => navegar('/proyectos')}
          >
            Cancelar
          </Boton>
          <Boton type="submit" cargando={cargando}>
            Crear Proyecto
          </Boton>
        </div>
      </form>
    </div>
  )
}
