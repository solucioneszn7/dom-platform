// ===== Indicador de carga — Notion style =====
export default function Cargando({ texto = 'Cargando...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative h-8 w-8 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-2 border-dom-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-gray-400">{texto}</p>
    </div>
  )
}
