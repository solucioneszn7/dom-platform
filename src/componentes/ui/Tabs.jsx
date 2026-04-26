// ===== Tabs Premium — Glassmorphism =====
import { useState, createContext, useContext } from 'react'

const TabsCtx = createContext(null)

export function Tabs({ defaultValue, value, onChange, children, className = '' }) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value !== undefined ? value : internal
  const setActive = (v) => {
    if (value === undefined) setInternal(v)
    onChange?.(v)
  }
  return (
    <TabsCtx.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ children, className = '' }) {
  return (
    <div className={`relative flex items-center gap-0.5 glass-soft rounded-xl p-1 border border-white/[0.06] overflow-x-auto no-scrollbar ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, icon: Icon, count, children, disabled = false }) {
  const { active, setActive } = useContext(TabsCtx)
  const isActive = active === value
  return (
    <button
      onClick={() => !disabled && setActive(value)}
      disabled={disabled}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all whitespace-nowrap ${
        isActive
          ? 'bg-white/[0.1] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]'
          : disabled
            ? 'text-white/25 cursor-not-allowed'
            : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {isActive && (
        <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
      )}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {count !== undefined && count !== null && (
        <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-violet-500/30 text-violet-200' : 'bg-white/[0.06] text-white/55'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }) {
  const { active } = useContext(TabsCtx)
  if (active !== value) return null
  return <div className={`animate-page-enter ${className}`}>{children}</div>
}
