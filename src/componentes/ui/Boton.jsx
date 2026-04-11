// ===== Botón — Notion/Trello style =====
import { Loader2 } from 'lucide-react'

const variantes = {
  primario: 'bg-dom-600 hover:bg-dom-700 text-white shadow-sm shadow-dom-600/20',
  secundario: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  peligro: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  fantasma: 'hover:bg-gray-100/80 text-gray-600',
  exito: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  notion: 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm',
  trello: 'bg-dom-500 hover:bg-dom-600 text-white',
}

const tamanos = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-[13px] gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-[15px] gap-2',
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
        inline-flex items-center justify-center rounded-md font-medium
        transition-all duration-150 focus:outline-none focus-visible:ring-2
        focus-visible:ring-dom-500 focus-visible:ring-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantes[variante] || variantes.primario}
        ${tamanos[tamano]}
        ${className}
      `}
      {...props}
    >
      {cargando ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icono ? (
        <Icono className={tamano === 'xs' ? 'h-3 w-3' : 'h-4 w-4'} />
      ) : null}
      {children}
    </button>
  )
}
