// ===== Barra Lateral — A-LARIFE Branding =====
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Settings, LogOut, X,
  ChevronLeft, ChevronRight, Search, Star, Shield,
  Users, CalendarDays, FileCheck2, Ruler, UserCog,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'

function ALarifeLogoMarca({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="10" fill="#1A2B4A" />
      <polygon points="26,9 43,42 9,42" fill="none" stroke="#C9A84C" strokeWidth="2.8" strokeLinejoin="round" />
      <line x1="26" y1="9" x2="26" y2="42" stroke="#C9A84C" strokeWidth="1.2" opacity="0.45" />
      <line x1="18" y1="29" x2="34" y2="29" stroke="#C9A84C" strokeWidth="1.2" opacity="0.45" />
      <circle cx="26" cy="9" r="2" fill="#C9A84C" />
    </svg>
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
  const [favoritosAbierto, setFavoritosAbierto] = useState(true)
  const [workspaceAbierto, setWorkspaceAbierto] = useState(true)
  const [obraAbierto, setObraAbierto] = useState(true)

  const esAdmin = datosUsuario?.rol === 'admin' || datosUsuario?.rolGlobal === 'admin'

  const enlacesPrincipales = [
    { ruta: '/dashboard', nombre: 'Dashboard', icono: LayoutDashboard },
    { ruta: '/proyectos', nombre: 'Proyectos', icono: FolderKanban },
    { ruta: '/calendario', nombre: 'Calendario', icono: CalendarDays },
  ]

  const enlacesObra = [
    { ruta: '/planificacion', nombre: 'Planificación BC3', icono: IconoGantt },
    { ruta: '/mediciones', nombre: 'Mediciones', icono: Ruler },
    { ruta: '/certificaciones', nombre: 'Certificaciones', icono: FileCheck2 },
    { ruta: '/viabilidad', nombre: 'Viabilidad', icono: Shield },
  ]

  const enlacesConfig = [
    ...(esAdmin ? [{ ruta: '/admin', nombre: 'Administración', icono: UserCog }] : []),
    { ruta: '/configuracion', nombre: 'Configuración', icono: Settings },
  ]

  const todosEnlaces = [...enlacesPrincipales, ...enlacesObra, ...enlacesConfig]

  return (
    <>
      {abierta && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onCerrar} />}

      <aside className={`fixed top-0 left-0 z-50 h-full bg-sidebar flex flex-col transform transition-all duration-200 ease-out select-none lg:static lg:z-auto ${abierta ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${colapsado ? 'lg:w-[52px]' : 'lg:w-[240px]'} w-[240px]`}>

        {/* Header */}
        <div className="flex-shrink-0">
          <div className={`flex items-center h-12 px-3 ${colapsado ? 'justify-center' : 'justify-between'}`}>
            {!colapsado ? (
              <>
                <div className="flex items-center gap-2.5 px-1 py-1 flex-1 min-w-0">
                  <ALarifeLogoMarca size={24} />
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold text-sidebar-text-active tracking-tight">A-LARIFE</span>
                    <p className="text-[9px] text-sidebar-text/50 tracking-widest uppercase leading-none mt-0.5">Estudios de Proyectos</p>
                  </div>
                </div>
                <button onClick={onCerrar} className="lg:hidden p-1 rounded text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover"><X className="h-4 w-4" /></button>
                <button onClick={onToggleColapsar} className="hidden lg:flex p-1 rounded text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover"><ChevronLeft className="h-4 w-4" /></button>
              </>
            ) : (
              <button onClick={onToggleColapsar} className="p-1.5 rounded text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover"><ChevronRight className="h-4 w-4" /></button>
            )}
          </div>
          {!colapsado && (
            <div className="px-2 pb-2">
              <button className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors text-[13px]">
                <Search className="h-4 w-4 flex-shrink-0" />
                <span>Buscar</span>
                <kbd className="ml-auto text-[10px] text-sidebar-text/60 bg-sidebar-hover px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 py-1">
          {!colapsado ? (
            <>
              <SidebarSection titulo="Favoritos" abierto={favoritosAbierto} onToggle={() => setFavoritosAbierto(!favoritosAbierto)}>
                <SidebarLink enlace={{ ruta: '/dashboard', nombre: 'Dashboard', icono: () => <Star className="h-4 w-4 flex-shrink-0 fill-amber-400 text-amber-400" /> }} onCerrar={onCerrar} />
              </SidebarSection>

              <SidebarSection titulo="Workspace" abierto={workspaceAbierto} onToggle={() => setWorkspaceAbierto(!workspaceAbierto)}>
                {enlacesPrincipales.map(e => <SidebarLink key={e.ruta} enlace={e} onCerrar={onCerrar} />)}
              </SidebarSection>

              <SidebarSection titulo="Control de Obra" abierto={obraAbierto} onToggle={() => setObraAbierto(!obraAbierto)}>
                {enlacesObra.map(e => <SidebarLink key={e.ruta} enlace={e} onCerrar={onCerrar} />)}
              </SidebarSection>

              {enlacesConfig.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5 space-y-0.5">
                  {enlacesConfig.map(e => <SidebarLink key={e.ruta} enlace={e} onCerrar={onCerrar} />)}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 mt-2">
              {todosEnlaces.map(e => (
                <NavLink key={e.ruta} to={e.ruta} title={e.nombre}
                  className={({ isActive }) => `p-2 rounded-md transition-colors ${isActive ? 'bg-sidebar-active text-sidebar-text-active' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'}`}>
                  <e.icono className="h-4 w-4" />
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="flex-shrink-0 border-t border-white/5">
          {!colapsado ? (
            <div className="p-2">
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#2C4A7C] to-[#1A2B4A] flex items-center justify-center flex-shrink-0 border border-[#C9A84C]/30">
                  <span className="text-[11px] font-bold text-[#C9A84C]">{datosUsuario?.nombre?.charAt(0)?.toUpperCase() || 'A'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sidebar-text-active truncate">{datosUsuario?.nombre || 'Usuario'}</p>
                  <p className="text-[10px] text-sidebar-text/60 capitalize">{datosUsuario?.rolGlobal || datosUsuario?.rol || 'gestor'}</p>
                </div>
                <button onClick={cerrarSesion} className="p-1 rounded text-sidebar-text/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Cerrar sesión">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-3">
              <button onClick={cerrarSesion} className="p-2 rounded-md text-sidebar-text/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"><LogOut className="h-4 w-4" /></button>
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
      <button onClick={onToggle} className="flex items-center gap-1 w-full px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-text/50 hover:text-sidebar-text/80 transition-colors">
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
      className={({ isActive }) => `group flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${isActive ? 'bg-sidebar-active text-sidebar-text-active' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'}`}>
      <enlace.icono className="h-4 w-4 flex-shrink-0" />
      <span className="truncate flex-1">{enlace.nombre}</span>
    </NavLink>
  )
}
