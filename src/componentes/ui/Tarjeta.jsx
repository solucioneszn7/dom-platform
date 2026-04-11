// ===== Tarjeta — con hover elevation GSAP =====
import { useRef } from 'react'
import { gsap } from 'gsap'

export default function Tarjeta({ children, className = '', hover = false, animarHover = false, ...props }) {
  const ref = useRef(null)

  // hover GSAP: elevación suave (solo si animarHover=true)
  const handleEnter = () => {
    if (!animarHover || !ref.current) return
    gsap.to(ref.current, { y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.09)', duration: 0.2, ease: 'power2.out' })
  }
  const handleLeave = () => {
    if (!animarHover || !ref.current) return
    gsap.to(ref.current, { y: 0, boxShadow: '0 0px 0px rgba(0,0,0,0)', duration: 0.2, ease: 'power2.in' })
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
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
