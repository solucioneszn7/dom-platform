// ===== Barra de Progreso — Notion style =====
export default function BarraProgreso({ porcentaje = 0, className = '', delgada = false }) {
  const colorBarra =
    porcentaje === 100
      ? 'bg-emerald-500'
      : porcentaje >= 60
      ? 'bg-dom-500'
      : porcentaje >= 30
      ? 'bg-amber-500'
      : 'bg-gray-300'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${delgada ? 'h-1' : 'h-1.5'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorBarra}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className={`font-medium text-gray-500 min-w-[2.5rem] text-right ${delgada ? 'text-xs' : 'text-[13px]'}`}>
        {porcentaje}%
      </span>
    </div>
  )
}
