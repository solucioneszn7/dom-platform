// ===== Botón — Glass Aurora =====
import { Loader2 } from 'lucide-react'

const variantes = {
  // Gradient violet→pink — el botón principal de la app
  primario:
    'text-white shadow-[0_8px_24px_rgba(124,77,255,.35)] hover:shadow-[0_12px_32px_rgba(124,77,255,.5)] hover:scale-[1.02] active:scale-[0.98] bg-[linear-gradient(135deg,#7c4dff_0%,#ff5a8a_100%)]',
  // Glass-soft con borde
  secundario:
    'glass-soft text-white/85 hover:text-white hover:bg-white/[0.08]',
  peligro:
    'bg-rose-500/85 hover:bg-rose-500 text-white shadow-[0_8px_24px_rgba(244,63,94,.3)]',
  fantasma:
    'hover:bg-white/[0.06] text-white/70 hover:text-white',
  exito:
    'bg-emerald-500/85 hover:bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,.3)]',
  notion:
    'bg-white/[0.06] hover:bg-white/[0.1] text-white ring-1 ring-white/10',
  trello:
    'text-white shadow-[0_6px_20px_rgba(124,77,255,.3)] hover:shadow-[0_10px_28px_rgba(124,77,255,.45)] bg-[linear-gradient(135deg,#7c4dff_0%,#4dc7ff_100%)]',
}

const tamanos = {
  xs: 'px-2 py-1 text-[11px] gap-1',
  sm: 'px-3 py-1.5 text-[12px] gap-1.5',
  md: 'px-4 py-2 text-[13px] gap-2',
  lg: 'px-5 py-2.5 text-[14px] gap-2',
}

export default function Boton({
  children,
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled = false,
  icono: Icono,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || cargando}
      className={`
        inline-flex items-center justify-center rounded-lg font-semibold
        transition-all duration-150 focus:outline-none focus-visible:ring-2
        focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantes[variante] || variantes.primario}
        ${tamanos[tamano]}
        ${className}
      `}
      {...props}
    >
      {cargando ? (
        <Loader2 className={`${tamano === 'xs' ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
      ) : Icono ? (
        <Icono className={tamano === 'xs' ? 'h-3 w-3' : 'h-4 w-4'} />
      ) : null}
      {children}
    </button>
  )
}
