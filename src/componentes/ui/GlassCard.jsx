// ===== GlassCard — Tarjeta glassmorphism reutilizable =====
import { forwardRef } from 'react'

const GlassCard = forwardRef(function GlassCard(
  { children, className = '', as: Tag = 'div', strong = false, soft = false, hover = false, onClick, ...rest },
  ref
) {
  const base = strong ? 'glass-strong' : soft ? 'glass-soft' : 'card-premium'
  const interactive = hover || onClick ? 'cursor-pointer transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_24px_60px_rgba(0,0,0,.45)]' : ''
  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={`${base} ${interactive} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
})

export default GlassCard
