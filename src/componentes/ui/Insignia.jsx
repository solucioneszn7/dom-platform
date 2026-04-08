// ===== Insignia (Badge) — Notion-style tags =====
import { FASES } from '../../constantes/tramitaciones'

const coloresFase = {
  preparacion: 'bg-gray-100 text-gray-600',
  ingreso_dom: 'bg-blue-50 text-blue-700',
  en_revision: 'bg-amber-50 text-amber-700',
  observaciones: 'bg-red-50 text-red-700',
  aprobado: 'bg-emerald-50 text-emerald-700',
  rechazado: 'bg-red-100 text-red-800',
  recepcion: 'bg-purple-50 text-purple-700',
}

const coloresGenericos = {
  red: 'bg-red-50 text-red-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  purple: 'bg-purple-50 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
}

// Dot indicators for Notion-style
const dotColors = {
  preparacion: 'bg-gray-400',
  ingreso_dom: 'bg-blue-500',
  en_revision: 'bg-amber-500',
  observaciones: 'bg-red-500',
  aprobado: 'bg-emerald-500',
  rechazado: 'bg-red-600',
  recepcion: 'bg-purple-500',
}

export default function Insignia({ fase, color, children, className = '', conPunto = false }) {
  if (fase) {
    const faseInfo = Object.values(FASES).find((f) => f.id === fase)
    const colorFase = coloresFase[fase] || 'bg-gray-100 text-gray-600'
    const dotColor = dotColors[fase] || 'bg-gray-400'

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${colorFase} ${className}`}>
        {conPunto && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
        {faseInfo?.nombre || fase}
      </span>
    )
  }

  const colorClase = coloresGenericos[color] || 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${colorClase} ${className}`}>
      {children}
    </span>
  )
}
