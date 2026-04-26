// ===== Layout Principal — Glassmorphism Aurora =====
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BarraLateral from './BarraLateral'
import BarraSuperior from './BarraSuperior'

export default function LayoutPrincipal() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [sidebarColapsado, setSidebarColapsado] = useState(false)

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Decorative aurora blobs */}
      <div className="bg-blob animate-float" style={{ top: '-10%', left: '-10%', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(124,77,255,.55), transparent 70%)' }} />
      <div className="bg-blob animate-float" style={{ top: '40%', right: '-8%', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(255,90,138,.4), transparent 70%)', animationDelay: '5s' }} />
      <div className="bg-blob animate-float" style={{ bottom: '-15%', left: '30%', width: '460px', height: '460px', background: 'radial-gradient(circle, rgba(77,199,255,.35), transparent 70%)', animationDelay: '10s' }} />

      {/* Sidebar — glass dark */}
      <BarraLateral
        abierta={sidebarAbierto}
        colapsado={sidebarColapsado}
        onCerrar={() => setSidebarAbierto(false)}
        onToggleColapsar={() => setSidebarColapsado(!sidebarColapsado)}
      />

      {/* Main content area */}
      <div className="relative flex-1 flex flex-col overflow-hidden min-w-0 z-10">
        <BarraSuperior
          onAbrirMenu={() => setSidebarAbierto(true)}
          sidebarColapsado={sidebarColapsado}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
