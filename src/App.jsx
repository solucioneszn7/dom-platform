import { Routes, Route, Navigate } from 'react-router-dom'
import LayoutPrincipal from './componentes/layout/LayoutPrincipal'
import RutaProtegida from './componentes/RutaProtegida'

import PaginaLogin from './paginas/auth/PaginaLogin'
import PaginaRegistro from './paginas/auth/PaginaRegistro'
import PaginaDashboard from './paginas/dashboard/PaginaDashboard'
import PaginaEstudios from './paginas/estudios/PaginaEstudios'
import PaginaFichaObra from './paginas/estudios/PaginaFichaObra'
import PaginaCalendario from './paginas/calendario/PaginaCalendario'
import PaginaMediciones from './paginas/mediciones/PaginaMediciones'
import PaginaCertificaciones from './paginas/certificaciones/PaginaCertificaciones'
import PaginaViabilidad from './paginas/viabilidad/PaginaViabilidad'
import PaginaConfiguracion from './paginas/configuracion/PaginaConfiguracion'
import PaginaConsultaCliente from './paginas/cliente/PaginaConsultaCliente'
import PaginaTablero from './paginas/tablero/PaginaTablero'
import PaginaPlanificacion from './paginas/planificacion/PaginaPlanificacion'
import PaginaPrivacidad from './paginas/legal/PaginaPrivacidad'
import PaginaTerminos from './paginas/legal/PaginaTerminos'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />
      <Route path="/registro" element={<PaginaRegistro />} />
      <Route path="/consulta" element={<PaginaConsultaCliente />} />
      <Route path="/privacidad" element={<PaginaPrivacidad />} />
      <Route path="/terminos" element={<PaginaTerminos />} />

      <Route element={
        <RutaProtegida rolesPermitidos={['admin','director_general','jefe_depto','tecnico_estudio','gestor','jefe_obra','encargado']}>
          <LayoutPrincipal />
        </RutaProtegida>
      }>
        <Route path="/dashboard" element={<PaginaDashboard />} />
        <Route path="/estudios" element={<PaginaEstudios />} />
        <Route path="/estudios/:id" element={<PaginaFichaObra />} />
        <Route path="/calendario" element={<PaginaCalendario />} />
        <Route path="/planificacion" element={<PaginaPlanificacion />} />
        <Route path="/mediciones" element={<PaginaMediciones />} />
        <Route path="/certificaciones" element={<PaginaCertificaciones />} />
        <Route path="/viabilidad" element={<PaginaViabilidad />} />
        <Route path="/configuracion" element={<PaginaConfiguracion />} />
        <Route path="/tablero" element={<PaginaTablero />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
