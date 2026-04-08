// ===== Barra Superior — Notion-style minimal topbar =====
import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, AlertTriangle, CreditCard, Info, X, ChevronRight, Clock } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { generarNotificacionesPendientes } from '../../servicios/notificaciones'

const rutaNombres = {
  dashboard: 'Dashboard',
  proyectos: 'Proyectos',
  nuevo: 'Nuevo Proyecto',
  configuracion: 'Configuración',
  usuarios: 'Usuarios',
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
    nombre: rutaNombres[seg] || (seg.length > 10 ? seg.slice(0, 8) + '...' : seg),
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
    alta: { icono: AlertTriangle, color: 'text-red-500 bg-red-50' },
    media: { icono: CreditCard, color: 'text-amber-500 bg-amber-50' },
    baja: { icono: Info, color: 'text-blue-500 bg-blue-50' },
  }

  const cantidadAltas = notificaciones.filter(n => n.prioridad === 'alta').length

  return (
    <header className="h-11 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 flex items-center justify-between px-3 lg:px-4 flex-shrink-0">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onAbrirMenu}
          className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumbs — Notion style */}
        <nav className="flex items-center gap-1 text-[13px] min-w-0">
          {migas.map((miga, i) => (
            <div key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
              {miga.esUltimo ? (
                <span className="font-medium text-gray-800 truncate">{miga.nombre}</span>
              ) : (
                <Link
                  to={miga.ruta}
                  className="text-gray-400 hover:text-gray-600 transition-colors truncate"
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
        {/* Clock icon — subtle */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 mr-2">
          <Clock className="h-3 w-3" />
          <span>{new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelAbierto(!panelAbierto)}
            className="relative p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notificaciones.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 ${
                cantidadAltas > 0 ? 'bg-red-500' : 'bg-dom-500'
              }`}>
                {notificaciones.length}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {panelAbierto && (
            <div className="absolute right-0 top-full mt-1.5 w-[340px] bg-white rounded-lg shadow-xl border border-gray-200/80 z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
                <button onClick={() => setPanelAbierto(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-2">
                      <Bell className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">Todo en orden</p>
                  </div>
                ) : (
                  notificaciones.map((notif, i) => {
                    const config = iconosPrioridad[notif.prioridad] || iconosPrioridad.baja
                    const Icono = config.icono
                    return (
                      <div key={i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-default">
                        <div className="flex items-start gap-3">
                          <div className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${config.color}`}>
                            <Icono className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-gray-700 leading-snug">{notif.mensaje}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{notif.tipo}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100">
                <p className="text-[11px] text-gray-400">
                  Resumen semanal · <strong className="text-gray-500">lunes 12:00</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
