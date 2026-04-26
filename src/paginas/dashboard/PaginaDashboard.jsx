// ===== Dashboard Premium — Glassmorphism Aurora =====
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderKanban, Plus, ArrowRight, ChevronRight,
  TrendingUp, AlertTriangle, Briefcase, Sparkles,
  Layers, Ruler, FileCheck2, CalendarDays, Building2,
  Wallet, ClipboardList, Activity, Target, Zap,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { escucharEstudios, filtrarActivos, filtrarProximosVencimientos } from '../../servicios/estudios'
import GlassCard from '../../componentes/ui/GlassCard'
import KPICard from '../../componentes/ui/KPICard'
import Cargando from '../../componentes/ui/Cargando'

const ESTADO_CFG = {
  estudio:       { label: 'En Estudio',     dot: 'bg-cyan-400',    text: 'text-cyan-300',    bg: 'bg-cyan-500/15' },
  activo:        { label: 'Activo',         dot: 'bg-violet-400',  text: 'text-violet-300',  bg: 'bg-violet-500/15' },
  ejecucion:     { label: 'En Obra',        dot: 'bg-pink-400',    text: 'text-pink-300',    bg: 'bg-pink-500/15' },
  certificacion: { label: 'Certificación',  dot: 'bg-amber-400',   text: 'text-amber-300',   bg: 'bg-amber-500/15' },
  completado:    { label: 'Completado',     dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  archivado:     { label: 'Archivado',      dot: 'bg-slate-400',   text: 'text-slate-300',   bg: 'bg-slate-500/15' },
}

const fakeSparkline = (base, len = 8) =>
  Array.from({ length: len }, (_, i) => Math.max(0, base + Math.sin(i * 1.2) * (base * 0.25) + (Math.random() - 0.5) * (base * 0.1)))

export default function PaginaDashboard() {
  const { usuario, datosUsuario, esAdmin } = useAuth()
  const navegar = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [estudios, setEstudios] = useState([])
  const [cargando, setCargando] = useState(true)

  const hoy = new Date()
  const saludo = hoy.getHours() < 12 ? 'Buenos días' : hoy.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    if (!usuario) return
    const c1 = escucharProyectos(usuario.uid, esAdmin, d => { setProyectos(d); setCargando(false) })
    const c2 = escucharEstudios(d => setEstudios(d || []))
    return () => { c1?.(); c2?.() }
  }, [usuario, esAdmin])

  const stats = useMemo(() => {
    const total = proyectos.length
    const conPres = proyectos.filter(p => p.tienePresupuesto).length
    const activos = proyectos.filter(p => p.estado === 'activo' || p.estado === 'ejecucion').length
    const sinPres = total - conPres
    // Pipeline counts por estado
    const porEstado = Object.keys(ESTADO_CFG).reduce((acc, k) => {
      acc[k] = proyectos.filter(p => (p.estado || 'estudio') === k).length
      return acc
    }, {})
    // Estudios (licitaciones)
    const estActivas = filtrarActivos(estudios).length
    const estProximas = filtrarProximosVencimientos(estudios, 7).length
    return { total, conPres, activos, sinPres, porEstado, estActivas, estProximas }
  }, [proyectos, estudios])

  const recientes = useMemo(() => {
    return [...proyectos]
      .sort((a, b) => (b.fechaActualizacion?.seconds || 0) - (a.fechaActualizacion?.seconds || 0))
      .slice(0, 6)
  }, [proyectos])

  const proximas = useMemo(() => filtrarProximosVencimientos(estudios, 14).slice(0, 4), [estudios])

  if (cargando) return <Cargando texto="Cargando dashboard..." />

  const totalPipeline = Object.values(stats.porEstado).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-6">
      {/* HERO */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-30 animate-float pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,77,255,.6), transparent 70%)' }} />
        <div className="absolute -bottom-16 left-1/3 w-80 h-80 rounded-full opacity-20 animate-float pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,90,138,.6), transparent 70%)', animationDelay: '4s' }} />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[12px] uppercase tracking-[0.15em] text-white/45 font-semibold mb-1">Hub central</p>
            <h1 className="text-[34px] font-bold tracking-tight leading-tight">
              <span className="text-gradient">{saludo}, {datosUsuario?.nombre?.split(' ')[0] || 'Equipo'}</span>
            </h1>
            <p className="text-[13px] text-white/55 mt-1.5 capitalize">
              {hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/70">{stats.total} proyectos · {stats.estActivas} licitaciones activas</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/estudios" className="btn-ghost text-[12.5px] flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Licitaciones
            </Link>
            <Link to="/tablero" className="btn-primary text-[12.5px] flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Tablero
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Proyectos totales"
          value={stats.total}
          icon={FolderKanban}
          variant="violet"
          hint={`${stats.activos} en marcha`}
          sparkline={fakeSparkline(Math.max(stats.total, 4))}
          onClick={() => navegar('/tablero')}
        />
        <KPICard
          label="Licitaciones activas"
          value={stats.estActivas}
          icon={Briefcase}
          variant="cyan"
          hint={stats.estProximas > 0 ? `${stats.estProximas} próximas (7d)` : 'Sin urgencias'}
          sparkline={fakeSparkline(Math.max(stats.estActivas, 5))}
          onClick={() => navegar('/estudios')}
        />
        <KPICard
          label="Con BC3 cargado"
          value={stats.conPres}
          icon={Layers}
          variant="emerald"
          hint={stats.total > 0 ? `${Math.round((stats.conPres / stats.total) * 100)}% cobertura` : 'Sin datos'}
          sparkline={fakeSparkline(Math.max(stats.conPres, 3))}
          onClick={() => navegar('/planificacion')}
        />
        <KPICard
          label="Pendientes de BC3"
          value={stats.sinPres}
          icon={AlertTriangle}
          variant={stats.sinPres > 0 ? 'amber' : 'slate'}
          hint={stats.sinPres > 0 ? 'Subir presupuesto' : 'Todo cubierto'}
          sparkline={fakeSparkline(Math.max(stats.sinPres, 2))}
          onClick={() => navegar('/planificacion')}
        />
      </div>

      {/* PIPELINE + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline mini-kanban */}
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500/25 to-pink-500/15 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-violet-300" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Pipeline de obras</h3>
                <p className="text-[10.5px] text-white/45">Distribución por estado</p>
              </div>
            </div>
            <Link to="/tablero" className="text-[11.5px] text-violet-300 hover:text-white font-medium flex items-center gap-1">
              Tablero completo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(ESTADO_CFG).map(([key, cfg]) => {
              const count = stats.porEstado[key] || 0
              const pct = Math.round((count / totalPipeline) * 100)
              return (
                <div key={key} className={`rounded-xl ${cfg.bg} border border-white/[0.05] p-3 hover:border-white/[0.12] transition-colors`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className="text-[10.5px] uppercase tracking-wider font-semibold text-white/55">{cfg.label}</span>
                  </div>
                  <p className="text-[22px] font-bold text-white leading-none">{count}</p>
                  <p className={`text-[10px] mt-1 ${cfg.text}`}>{pct}%</p>
                </div>
              )
            })}
          </div>

          {/* Health bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider font-semibold text-white/45 mb-1.5">
              <span>Salud del portafolio</span>
              <span className="text-white/65">{stats.activos}/{stats.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${(stats.activos / Math.max(stats.total, 1)) * 100}%` }} />
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${(stats.sinPres / Math.max(stats.total, 1)) * 100}%` }} />
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500/25 to-sky-500/15 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white">Accesos rápidos</h3>
              <p className="text-[10.5px] text-white/45">Tareas frecuentes</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { icon: Briefcase, label: 'Importar licitaciones', desc: 'BBDD .accdb', to: '/estudios', tone: 'violet' },
              { icon: Layers, label: 'Cargar BC3', desc: 'Presupuesto', to: '/planificacion', tone: 'cyan' },
              { icon: Ruler, label: 'Mediciones', desc: 'Avance partida', to: '/mediciones', tone: 'emerald' },
              { icon: FileCheck2, label: 'Certificación', desc: 'Workflow', to: '/certificaciones', tone: 'amber' },
              { icon: CalendarDays, label: 'Calendario', desc: 'Agenda', to: '/calendario', tone: 'pink' },
            ].map(a => <QuickAction key={a.to} {...a} />)}
          </div>
        </GlassCard>
      </div>

      {/* RECIENTES + PROXIMAS LICITACIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-pink-500/25 to-violet-500/15 flex items-center justify-center">
                <ClipboardList className="h-3.5 w-3.5 text-pink-300" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Proyectos recientes</h3>
                <p className="text-[10.5px] text-white/45">Últimos actualizados</p>
              </div>
            </div>
            <Link to="/tablero" className="text-[11.5px] text-violet-300 hover:text-white font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recientes.length === 0 ? (
            <div className="py-10 text-center">
              <Sparkles className="h-8 w-8 text-white/20 mx-auto mb-2" />
              <p className="text-[12.5px] text-white/45">Sin proyectos aún</p>
              <Link to="/estudios" className="mt-3 inline-flex btn-primary text-[12px]">
                <Plus className="h-3.5 w-3.5" /> Crear desde licitación
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recientes.map(p => {
                const cfg = ESTADO_CFG[p.estado] || ESTADO_CFG.estudio
                return (
                  <Link key={p.id} to={`/proyectos/${p.id}`} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(124,77,255,.25), rgba(255,90,138,.15))' }}>
                      <Building2 className="h-4 w-4 text-white/85" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded">{p.numeroCaso}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[13px] text-white font-medium truncate mt-0.5">{p.nombre}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/25 group-hover:text-white/65 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500/25 to-orange-500/15 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white">Próximas licitaciones</h3>
              <p className="text-[10.5px] text-white/45">Vencimientos &lt; 14 días</p>
            </div>
          </div>

          {proximas.length === 0 ? (
            <div className="py-8 text-center">
              <Briefcase className="h-7 w-7 text-white/20 mx-auto mb-2" />
              <p className="text-[12px] text-white/45">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {proximas.map((e, i) => (
                <Link key={e.id || i} to={`/estudios/${e.id || ''}`} className="group block p-2.5 rounded-xl glass-soft hover:bg-white/[0.06] transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">{e.orden || '—'}</span>
                    <span className="text-[10px] text-amber-200">{e.fechaPresentacion || '—'}</span>
                  </div>
                  <p className="text-[12.5px] text-white font-medium line-clamp-2 leading-snug">{e.titulo || 'Sin título'}</p>
                  <p className="text-[10.5px] text-white/45 mt-1 truncate">{e.cliente || '—'}</p>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* AI HINT */}
      <GlassCard className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50 pointer-events-none"
          style={{ background: 'linear-gradient(120deg, rgba(124,77,255,.15) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 100%)' }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">
              {stats.sinPres > 0
                ? `Tienes ${stats.sinPres} proyecto${stats.sinPres > 1 ? 's' : ''} sin BC3.`
                : stats.estProximas > 0
                  ? `${stats.estProximas} licitación${stats.estProximas > 1 ? 'es' : ''} próxima${stats.estProximas > 1 ? 's' : ''} a vencer.`
                  : '¡Todo en orden! Buen momento para revisar el tablero.'}
            </p>
            <p className="text-[11px] text-white/55 mt-0.5">
              {stats.sinPres > 0
                ? 'Cargar BC3 desbloquea Mediciones y Certificaciones.'
                : 'Mantén la trazabilidad actualizando avance semanal.'}
            </p>
          </div>
          <Link
            to={stats.sinPres > 0 ? '/planificacion' : stats.estProximas > 0 ? '/estudios' : '/tablero'}
            className="btn-primary text-[12px]"
          >
            Ir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, to, tone = 'violet' }) {
  const map = {
    violet: 'from-violet-500/25 to-violet-700/10 text-violet-300',
    cyan: 'from-cyan-500/25 to-sky-700/10 text-cyan-300',
    emerald: 'from-emerald-500/25 to-teal-700/10 text-emerald-300',
    amber: 'from-amber-500/25 to-orange-700/10 text-amber-300',
    pink: 'from-pink-500/25 to-rose-700/10 text-pink-300',
  }[tone]
  return (
    <Link to={to} className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all">
      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${map} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-white truncate">{label}</p>
        <p className="text-[10.5px] text-white/40 truncate">{desc}</p>
      </div>
      <ArrowRight className="h-3 w-3 text-white/25 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}
