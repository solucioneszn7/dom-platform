// ===== Barra Lateral — Glass dark con gradient logo + premium active states =====
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Settings, LogOut, X, KanbanSquare as BoardIcon,
  ChevronLeft, ChevronRight, Search, Sparkles,
  Users, CalendarDays, FileCheck2, Ruler, Shield, Briefcase,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'

function DomLogo({ size = 24 }) {
  // Gradient violet→pink→cyan logo
  return (
    <div
      className="rounded-xl flex items-center justify-center shadow-lg"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 50%, #4dc7ff 100%)',
      }}
    >
      <Sparkles className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  )
}

function IconoGantt({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="14" height="3" rx="1" />
      <rect x="7" y="10.5" width="10" height="3" rx="1" />
      <rect x="5" y="17" width="16" height="3" rx="1" />
    </svg>
  )
}

export default function BarraLateral({ abierta, colapsado, onCerrar, onToggleColapsar }) {
  const { datosUsuario, cerrarSesion } = useAuth()
  const [workspaceAbierto, setWorkspaceAbierto] = useState(true)
  const [obraAbierto, setObraAbierto] = useState(true)

  const enlacesPrincipales = [
    { ruta: '/dashboard', nombre: 'Dashboard', icono: LayoutDashboard, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor', 'jefe_obra'] },
    { ruta: '/estudios', nombre: 'Licitaciones', icono: Briefcase, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor'] },
    { ruta: '/tablero', nombre: 'Tablero', icono: BoardIcon, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor', 'jefe_obra'] },
    { ruta: '/calendario', nombre: 'Calendario', icono: CalendarDays, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor', 'jefe_obra'] },
  ]

  const enlacesObra = [
    { ruta: '/planificacion', nombre: 'Planificación BC3', icono: IconoGantt, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor', 'jefe_obra'] },
    { ruta: '/mediciones', nombre: 'Mediciones', icono: Ruler, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor', 'jefe_obra', 'encargado'] },
    { ruta: '/certificaciones', nombre: 'Certificaciones', icono: FileCheck2, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor', 'jefe_obra'] },
    { ruta: '/viabilidad', nombre: 'Viabilidad', icono: Shield, roles: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor'] },
  ]

  const enlacesConfig = [
    { ruta: '/usuarios', nombre: 'Usuarios', icono: Users, roles: ['admin', 'director_general'] },
    { ruta: '/configuracion', nombre: 'Configuración', icono: Settings, roles: ['admin', 'director_general', 'jefe_depto', 'gestor'] },
  ]

  const filtrar = (links) => links.filter(e => e.roles.includes(datosUsuario?.rol))
  const todosEnlaces = [...filtrar(enlacesPrincipales), ...filtrar(enlacesObra), ...filtrar(enlacesConfig)]

  return (
    <>
      {abierta && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onCerrar} />}

      <aside className={`fixed top-0 left-0 z-50 h-full sidebar-glass flex flex-col transform transition-all duration-200 ease-out select-none lg:static lg:z-auto ${abierta ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${colapsado ? 'lg:w-[64px]' : 'lg:w-[260px]'} w-[260px]`}>

        {/* Header */}
        <div className="flex-shrink-0">
          <div className={`flex items-center h-14 px-3 ${colapsado ? 'justify-center' : 'justify-between'}`}>
            {!colapsado ? (
              <>
                <div className="flex items-center gap-2.5 px-1 flex-1 min-w-0">
                  <DomLogo size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-white truncate leading-tight">Acua Conect</p>
                    <p className="text-[10.5px] text-white/40 truncate">{datosUsuario?.empresa || 'Construction OS'}</p>
                  </div>
                </div>
                <button onClick={onCerrar} className="lg:hidden p-1 rounded text-white/45 hover:text-white hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
                <button onClick={onToggleColapsar} className="hidden lg:flex p-1 rounded text-white/45 hover:text-white hover:bg-white/[0.06]"><ChevronLeft className="h-4 w-4" /></button>
              </>
            ) : (
              <button onClick={onToggleColapsar} className="p-1.5 rounded text-white/45 hover:text-white hover:bg-white/[0.06]">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {!colapsado && (
            <div className="px-2 pb-2">
              <button className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-white/55 hover:bg-white/[0.05] hover:text-white transition-colors text-[12.5px]">
                <Search className="h-3.5 w-3.5 flex-shrink-0" /><span>Buscar</span>
                <kbd className="ml-auto text-[10px] text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 py-1">
          {!colapsado ? (
            <>
              <SidebarSection titulo="Workspace" abierto={workspaceAbierto} onToggle={() => setWorkspaceAbierto(!workspaceAbierto)}>
                {filtrar(enlacesPrincipales).map(e => <SidebarLink key={e.ruta} enlace={e} onCerrar={onCerrar} />)}
              </SidebarSection>

              <SidebarSection titulo="Control de Obra" abierto={obraAbierto} onToggle={() => setObraAbierto(!obraAbierto)}>
                {filtrar(enlacesObra).map(e => <SidebarLink key={e.ruta} enlace={e} onCerrar={onCerrar} />)}
              </SidebarSection>

              {filtrar(enlacesConfig).length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-0.5">
                  {filtrar(enlacesConfig).map(e => <SidebarLink key={e.ruta} enlace={e} onCerrar={onCerrar} />)}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 mt-2">
              {todosEnlaces.map(e => (
                <NavLink key={e.ruta} to={e.ruta} title={e.nombre}
                  className={({ isActive }) => `relative p-2.5 rounded-lg transition-all ${isActive ? 'bg-violet-500/20 text-violet-200 shadow-[inset_0_0_0_1px_rgba(124,77,255,.3)]' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'}`}>
                  <e.icono className="h-4 w-4" />
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="flex-shrink-0 border-t border-white/[0.06]">
          {!colapsado ? (
            <div className="p-2">
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl glass-soft">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 100%)' }}>
                  <span className="text-[12px] font-bold text-white">{datosUsuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-white truncate leading-tight">{datosUsuario?.nombre || 'Usuario'}</p>
                  <p className="text-[10.5px] text-white/45 capitalize truncate">{datosUsuario?.rol || 'gestor'}</p>
                </div>
                <button onClick={cerrarSesion} className="p-1.5 rounded-md text-white/40 hover:text-rose-300 hover:bg-rose-500/15 transition-colors" title="Cerrar sesión">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-3">
              <button onClick={cerrarSesion} className="p-2 rounded-md text-white/40 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"><LogOut className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function SidebarSection({ titulo, abierto, onToggle, children }) {
  return (
    <div className="mb-1">
      <button onClick={onToggle} className="flex items-center gap-1 w-full px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/35 hover:text-white/65 transition-colors">
        <svg className={`h-3 w-3 transition-transform ${abierto ? '' : '-rotate-90'}`} viewBox="0 0 12 12" fill="currentColor"><path d="M4 3l4 3-4 3V3z" /></svg>
        {titulo}
      </button>
      {abierto && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  )
}

function SidebarLink({ enlace, onCerrar }) {
  return (
    <NavLink to={enlace.ruta} onClick={onCerrar}
      className={({ isActive }) => `group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${isActive ? 'bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(124,77,255,.25)]' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'}`}>
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-gradient-to-b from-violet-400 to-pink-400" />
          )}
          <enlace.icono className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-violet-300' : ''}`} />
          <span className="truncate flex-1 font-medium">{enlace.nombre}</span>
        </>
      )}
    </NavLink>
  )
}
