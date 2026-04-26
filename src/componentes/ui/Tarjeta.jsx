// ===== Tarjeta — Glass card =====
export default function Tarjeta({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`
        card-premium
        ${hover ? 'cursor-pointer transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_24px_60px_rgba(0,0,0,.45)]' : ''}
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
    <div className={`px-5 py-3.5 border-b border-white/[0.06] ${className}`}>
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
