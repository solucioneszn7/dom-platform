// ===== Layout Principal — con transición de página GSAP =====
import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import BarraLateral from './BarraLateral'
import BarraSuperior from './BarraSuperior'

export default function LayoutPrincipal() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [sidebarColapsado, setSidebarColapsado] = useState(false)
  const mainRef = useRef(null)
  const location = useLocation()

  // Animar contenido principal en cada cambio de ruta
  useEffect(() => {
    if (!mainRef.current) return
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' }
    )
  }, [location.pathname])

  return (
    <div className="flex h-screen bg-surface-secondary overflow-hidden">
      <BarraLateral
        abierta={sidebarAbierto}
        colapsado={sidebarColapsado}
        onCerrar={() => setSidebarAbierto(false)}
        onToggleColapsar={() => setSidebarColapsado(!sidebarColapsado)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <BarraSuperior
          onAbrirMenu={() => setSidebarAbierto(true)}
          sidebarColapsado={sidebarColapsado}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Quitamos animate-page-enter de CSS — ahora lo maneja GSAP */}
          <div ref={mainRef} className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
