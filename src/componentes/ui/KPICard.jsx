// ===== KPICard — Métrica destacada glassmorphism =====
// Variantes: violet, pink, cyan, emerald, amber, slate
import { ArrowUpRight } from 'lucide-react'

const VARIANTS = {
  violet: {
    grad: 'linear-gradient(135deg, rgba(124,77,255,.22), rgba(124,77,255,.04))',
    text: 'text-violet-300',
    glow: 'shadow-[0_0_40px_-10px_rgba(124,77,255,.55)]',
    accent: 'from-violet-400 to-violet-600',
  },
  pink: {
    grad: 'linear-gradient(135deg, rgba(255,90,138,.22), rgba(255,90,138,.04))',
    text: 'text-pink-300',
    glow: 'shadow-[0_0_40px_-10px_rgba(255,90,138,.55)]',
    accent: 'from-pink-400 to-rose-500',
  },
  cyan: {
    grad: 'linear-gradient(135deg, rgba(77,199,255,.22), rgba(77,199,255,.04))',
    text: 'text-cyan-300',
    glow: 'shadow-[0_0_40px_-10px_rgba(77,199,255,.55)]',
    accent: 'from-cyan-400 to-sky-500',
  },
  emerald: {
    grad: 'linear-gradient(135deg, rgba(16,185,129,.22), rgba(16,185,129,.04))',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_40px_-10px_rgba(16,185,129,.55)]',
    accent: 'from-emerald-400 to-teal-500',
  },
  amber: {
    grad: 'linear-gradient(135deg, rgba(245,158,11,.22), rgba(245,158,11,.04))',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_40px_-10px_rgba(245,158,11,.55)]',
    accent: 'from-amber-400 to-orange-500',
  },
  slate: {
    grad: 'linear-gradient(135deg, rgba(148,163,184,.18), rgba(148,163,184,.03))',
    text: 'text-slate-300',
    glow: '',
    accent: 'from-slate-400 to-slate-500',
  },
}

export default function KPICard({
  label,
  value,
  unit,
  delta,        // numeric, positive/negative
  hint,         // small hint below
  icon: Icon,
  variant = 'violet',
  onClick,
  sparkline,    // array of numbers for mini sparkline
}) {
  const v = VARIANTS[variant] || VARIANTS.violet
  const isPositive = delta !== undefined && delta >= 0

  return (
    <button
      onClick={onClick}
      type="button"
      className={`group relative overflow-hidden text-left card-premium p-4 ${onClick ? 'cursor-pointer hover:translate-y-[-2px]' : 'cursor-default'} ${v.glow} transition-all duration-300`}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-90 pointer-events-none"
        style={{ background: v.grad }}
      />
      {/* Animated shimmer on hover */}
      {onClick && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.06) 50%, transparent 70%)' }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          {Icon && (
            <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${v.accent} flex items-center justify-center shadow-lg`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          )}
          {onClick && (
            <ArrowUpRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <p className="text-[28px] font-bold text-white leading-none tracking-tight">
            {value}
          </p>
          {unit && <span className={`text-[12px] font-medium ${v.text}`}>{unit}</span>}
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-white/45">
            {label}
          </p>
          {delta !== undefined && (
            <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md ${isPositive ? 'text-emerald-300 bg-emerald-500/15' : 'text-rose-300 bg-rose-500/15'}`}>
              {isPositive ? '+' : ''}{delta}%
            </span>
          )}
        </div>

        {hint && (
          <p className="text-[10.5px] text-white/40 mt-1">{hint}</p>
        )}

        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} colorClass={v.text} />
        )}
      </div>
    </button>
  )
}

function Sparkline({ data, colorClass = 'text-violet-300' }) {
  const w = 100, h = 22
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const step = w / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full mt-2 ${colorClass}`} preserveAspectRatio="none" height="22">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}
