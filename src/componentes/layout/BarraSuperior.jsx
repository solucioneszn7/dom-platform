// ===== Barra Superior — Glass topbar minimalista =====
import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, AlertTriangle, CreditCard, Info, X, ChevronRight, Clock, Sparkles } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { generarNotificacionesPendientes } from '../../servicios/notificaciones'

const rutaNombres = {
  dashboard: 'Dashboard',
  estudios: 'Licitaciones',
  tablero: 'Tablero',
  calendario: 'Calendario',
  planificacion: 'Planificación BC3',
  mediciones: 'Mediciones',
  certificaciones: 'Certificaciones',
  viabilidad: 'Viabilidad',
  configuracion: 'Configuración',
  usuarios: 'Usuarios',
  proyectos: 'Proyectos',
  nuevo: 'Nuevo',
  tramitaciones: 'Tramitaciones',
}

export default function BarraSuperior({ onAbrirMenu, sidebarColapsado }) {
  const { usuario, datosUsuario, esAdmin } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [panelAbierto, setPanelAbierto] = useState(false)
  const panelRef = useRef(null)
  const location = useLocation()

  // Build breadcrumbs
  const segmentos = location.pathname.split('/').filter(Boolean)
  const migas = segmentos.map((seg, i) => ({
    nombre: rutaNombres[seg] || (seg.length > 14 ? seg.slice(0, 12) + '…' : seg),
    ruta: '/' + segmentos.slice(0, i + 1).join('/'),
    esUltimo: i === segmentos.length - 1,
  }))

  useEffect(() => {
    if (!usuario) return
    const cancelar = escucharProyectos(usuario.uid, esAdmin, (proyectos) => {
      const notifs = generarNotificacionesPendientes(proyectos, datosUsuario)
      setNotificaciones(notifs)
    })
    return cancelar
  }, [usuario, esAdmin, datosUsuario])

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const iconosPrioridad = {
    alta: { icono: AlertTriangle, ring: 'bg-rose-500/15 text-rose-300' },
    media: { icono: CreditCard, ring: 'bg-amber-500/15 text-amber-300' },
    baja: { icono: Info, ring: 'bg-cyan-500/15 text-cyan-300' },
  }

  const cantidadAltas = notificaciones.filter(n => n.prioridad === 'alta').length

  return (
    <header className="h-12 topbar-glass flex items-center justify-between px-3 lg:px-5 flex-shrink-0 relative z-20">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onAbrirMenu}
          className="lg:hidden p-1.5 rounded-md text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[12.5px] min-w-0">
          {migas.length === 0 && (
            <span className="text-white/45 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-300" /> dom-platform
            </span>
          )}
          {migas.map((miga, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-white/25 flex-shrink-0" />}
              {miga.esUltimo ? (
                <span className="font-semibold text-white truncate">{miga.nombre}</span>
              ) : (
                <Link
                  to={miga.ruta}
                  className="text-white/45 hover:text-white transition-colors truncate"
                >
                  {miga.nombre}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Date pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-white/45 mr-2 px-2 py-1 rounded-md glass-soft">
          <Clock className="h-3 w-3" />
          <span>{new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelAbierto(!panelAbierto)}
            className="relative p-1.5 text-white/55 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notificaciones.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md ${
                cantidadAltas > 0 ? 'bg-rose-500' : 'bg-violet-500'
              }`}>
                {notificaciones.length}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {panelAbierto && (
            <div className="absolute right-0 top-full mt-2 w-[340px] glass-strong rounded-xl border border-white/[0.08] z-50 overflow-hidden animate-scale-in shadow-2xl">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-semibold text-white text-[13px]">Notificaciones</h3>
                <button onClick={() => setPanelAbierto(false)} className="text-white/45 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center mx-auto mb-2">
                      <Bell className="h-5 w-5 text-white/30" />
                    </div>
                    <p className="text-[13px] text-white/55">Todo en orden</p>
                  </div>
                ) : (
                  notificaciones.map((notif, i) => {
                    const config = iconosPrioridad[notif.prioridad] || iconosPrioridad.baja
                    const Icono = config.icono
                    return (
                      <div key={i} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-default">
                        <div className="flex items-start gap-3">
                          <div className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${config.ring}`}>
                            <Icono className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] text-white/85 leading-snug">{notif.mensaje}</p>
                            <p className="text-[10.5px] text-white/40 mt-0.5 capitalize">{notif.tipo}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="px-4 py-2.5 bg-white/[0.03] border-t border-white/[0.06]">
                <p className="text-[10.5px] text-white/45">
                  Resumen semanal · <strong className="text-white/70">lunes 12:00</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
