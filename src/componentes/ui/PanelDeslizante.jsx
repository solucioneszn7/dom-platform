// ===== Panel Deslizante — Notion-style side peek =====
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function PanelDeslizante({ abierto, onCerrar, titulo, subtitulo, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCerrar()
    }
    if (abierto) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          abierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCerrar}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl
          transform transition-transform duration-250 ease-out overflow-hidden flex flex-col ${
          abierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 truncate">{titulo}</h2>
              {subtitulo && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitulo}</p>}
            </div>
            <button
              onClick={onCerrar}
              className="ml-3 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  )
}
