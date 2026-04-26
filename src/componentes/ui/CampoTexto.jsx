// ===== Campo de Texto — Glass Aurora =====
export default function CampoTexto({
  etiqueta,
  error,
  icono: Icono,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {etiqueta && (
        <label className="block text-[10px] font-bold text-white/55 uppercase tracking-[0.12em] mb-1.5">
          {etiqueta}
        </label>
      )}
      <div className="relative">
        {Icono && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icono className="h-4 w-4 text-white/40" />
          </div>
        )}
        <input
          className={`
            input-premium block w-full text-[13px]
            ${Icono ? 'pl-10' : ''}
            ${error ? '!ring-1 !ring-rose-500/50 focus:!ring-rose-500/70' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-rose-300">{error}</p>
      )}
    </div>
  )
}
