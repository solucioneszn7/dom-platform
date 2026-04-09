// ===== Componente que protege rutas según autenticación y rol =====
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contextos/ContextoAutenticacion'
import Cargando from './ui/Cargando'

export default function RutaProtegida({ children, rolesPermitidos = [] }) {
  const { usuario, datosUsuario, cargando } = useAuth()

  // Mientras verifica si hay sesión, mostrar cargando
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Cargando texto="Verificando sesión..." />
      </div>
    )
  }

  // Si no hay usuario logueado, redirigir al login
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Si se especifican roles y el usuario no tiene permiso
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(datosUsuario?.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
