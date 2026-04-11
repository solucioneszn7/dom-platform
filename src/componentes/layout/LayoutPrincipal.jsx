// ===== Layout Principal — Notion-style =====
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BarraLateral from './BarraLateral'
import BarraSuperior from './BarraSuperior'

export default function LayoutPrincipal() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [sidebarColapsado, setSidebarColapsado] = useState(false)

  return (
    <div className="flex h-screen bg-surface-secondary overflow-hidden">
      {/* Sidebar — Notion dark style */}
      <BarraLateral
        abierta={sidebarAbierto}
        colapsado={sidebarColapsado}
        onCerrar={() => setSidebarAbierto(false)}
        onToggleColapsar={() => setSidebarColapsado(!sidebarColapsado)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <BarraSuperior
          onAbrirMenu={() => setSidebarAbierto(true)}
          sidebarColapsado={sidebarColapsado}
        />

        {/* Page content with Notion-style max-width */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12 py-6 animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
