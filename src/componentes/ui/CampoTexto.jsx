// ===== Campo de Texto — Notion-style input =====
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
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
          {etiqueta}
        </label>
      )}
      <div className="relative">
        {Icono && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icono className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          className={`
            block w-full rounded-md border border-gray-200 px-3 py-2 text-sm
            placeholder-gray-400 transition-all duration-150
            hover:border-gray-300
            focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500/30
            ${Icono ? 'pl-10' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
