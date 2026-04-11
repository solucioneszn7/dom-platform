import { Routes, Route, Navigate } from 'react-router-dom'
import LayoutPrincipal from './componentes/layout/LayoutPrincipal'
import RutaProtegida from './componentes/RutaProtegida'

import PaginaLogin from './paginas/auth/PaginaLogin'
import PaginaRegistro from './paginas/auth/PaginaRegistro'
import PaginaDashboard from './paginas/dashboard/PaginaDashboard'
import PaginaProyectos from './paginas/proyectos/PaginaProyectos'
import PaginaNuevoProyecto from './paginas/proyectos/PaginaNuevoProyecto'
import PaginaDetalleProyecto from './paginas/proyectos/PaginaDetalleProyecto'
import PaginaDetalleTramitacion from './paginas/tramitaciones/PaginaDetalleTramitacion'
import PaginaCalendario from './paginas/calendario/PaginaCalendario'
import PaginaPlanificacion from './paginas/planificacion/PaginaPlanificacion'
import PaginaMediciones from './paginas/mediciones/PaginaMediciones'
import PaginaCertificaciones from './paginas/certificaciones/PaginaCertificaciones'
import PaginaViabilidad from './paginas/viabilidad/PaginaViabilidad'
import PaginaConfiguracion from './paginas/configuracion/PaginaConfiguracion'
import PaginaConsultaCliente from './paginas/cliente/PaginaConsultaCliente'
import PaginaAdmin from './paginas/admin/PaginaAdmin'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />
      <Route path="/registro" element={<PaginaRegistro />} />
      <Route path="/consulta" element={<PaginaConsultaCliente />} />

      <Route
        element={
          <RutaProtegida rolesPermitidos={['admin', 'gestor', 'revisor', 'jefe_obra', 'encargado', 'direccion']}>
            <LayoutPrincipal />
          </RutaProtegida>
        }
      >
        <Route path="/dashboard" element={<PaginaDashboard />} />
        <Route path="/proyectos" element={<PaginaProyectos />} />
        <Route path="/proyectos/nuevo" element={<PaginaNuevoProyecto />} />
        <Route path="/proyectos/:id" element={<PaginaDetalleProyecto />} />
        <Route path="/proyectos/:id/tramitaciones/:tramitacionId" element={<PaginaDetalleTramitacion />} />
        <Route path="/calendario" element={<PaginaCalendario />} />
        <Route path="/planificacion" element={<PaginaPlanificacion />} />
        <Route path="/mediciones" element={<PaginaMediciones />} />
        <Route path="/certificaciones" element={<PaginaCertificaciones />} />
        <Route path="/viabilidad" element={<PaginaViabilidad />} />
        <Route path="/configuracion" element={<PaginaConfiguracion />} />
        {/* Ruta admin — solo administradores */}
        <Route path="/admin" element={<PaginaAdmin />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
