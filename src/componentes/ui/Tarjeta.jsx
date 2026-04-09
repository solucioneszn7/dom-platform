// ===== Tarjeta — Notion-style card =====
export default function Tarjeta({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200/80
        ${hover ? 'hover:bg-surface-hover transition-colors duration-150 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function TarjetaEncabezado({ children, className = '' }) {
  return (
    <div className={`px-5 py-3.5 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function TarjetaCuerpo({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  )
}
