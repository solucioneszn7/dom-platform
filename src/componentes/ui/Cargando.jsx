// ===== Indicador de carga — Glass Aurora =====
export default function Cargando({ texto = 'Cargando...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative h-10 w-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderImage: 'linear-gradient(135deg, #7c4dff, #ff5a8a, #4dc7ff) 1', borderColor: '#7c4dff' }}
        />
        <div className="absolute inset-1 rounded-full bg-violet-500/20 blur-md animate-pulse" />
      </div>
      <p className="text-[13px] text-white/55">{texto}</p>
    </div>
  )
}
