// ===== Dashboard — con animaciones GSAP al cargar datos de Firebase =====
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderKanban, Clock, CheckCircle, Plus, ArrowRight,
  DollarSign, Search, FileText, CalendarDays, Layers,
  Ruler, FileCheck2, Building2, StickyNote, Trash2,
  ChevronRight, BarChart3, TrendingUp, AlertTriangle,
  Briefcase, ExternalLink, Sparkles,
} from 'lucide-react'
import { gsap } from 'gsap'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'
import { useEntradaPagina, useStaggerTarjetas, useContador } from '../../hooks/useAnimacion'

function IconoGantt({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="14" height="3" rx="1" /><rect x="7" y="10.5" width="10" height="3" rx="1" /><rect x="5" y="17" width="16" height="3" rx="1" /></svg>
}

const MONEDA_SYM = { CLP: '$', EUR: '€', USD: '$', CAD: 'C$' }
const MONEDA_FLAG = { CLP: '🇨🇱', EUR: '🇪🇺', USD: '🇺🇸', CAD: '🇨🇦' }

export default function PaginaDashboard() {
  const { usuario, datosUsuario, esAdmin } = useAuth()
  const navegar = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [notas, setNotas] = useState(() => { try { return JSON.parse(localStorage.getItem('dom_notas') || '[]') } catch { return [] } })
  const [nuevaNota, setNuevaNota] = useState('')
  const hoy = new Date()
  const saludo = hoy.getHours() < 12 ? 'Buenos días' : hoy.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'

  // ── GSAP hooks ──
  const paginaRef = useEntradaPagina()                    // fade de la página entera
  const { ref: statsRef, animar: animarStats } = useStaggerTarjetas()  // stagger de stat cards
  const { ref: seccionesRef, animar: animarSecciones } = useStaggerTarjetas()  // stagger de secciones
  const headerRef = useRef(null)

  // ── Firebase listener ──
  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, datos => {
      setProyectos(datos)
      setCargando(false)
      // Disparar animaciones cuando llegan los datos de Firebase
      setTimeout(() => {
        animarStats()
        animarSecciones()
      }, 50)
    })
  }, [usuario, esAdmin])

  // Animar header al montar
  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.1 }
    )
  }, [])

  const stats = useMemo(() => {
    const total = proyectos.length, conPres = proyectos.filter(p => p.tienePresupuesto).length
    return { total, conPres, activos: proyectos.filter(p => p.estado === 'activo').length, sinPres: total - conPres }
  }, [proyectos])

  function guardarNota() {
    if (!nuevaNota.trim()) return
    const updated = [{ id: Date.now(), texto: nuevaNota.trim(), fecha: new Date().toISOString() }, ...notas].slice(0, 20)
    setNotas(updated); localStorage.setItem('dom_notas', JSON.stringify(updated)); setNuevaNota('')
  }
  function borrarNota(id) { const u = notas.filter(n => n.id !== id); setNotas(u); localStorage.setItem('dom_notas', JSON.stringify(u)) }

  if (cargando) return <Cargando texto="Cargando dashboard..." />

  return (
    <div ref={paginaRef} className="space-y-8 max-w-6xl">
      {/* Header */}
      <div ref={headerRef}>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {saludo}, {datosUsuario?.nombre?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {stats.total} proyectos
        </p>
      </div>

      {/* QUICK STATS — cada tarjeta tiene data-animar para el stagger */}
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div data-animar>
          <StatCard label="Proyectos" value={stats.total} icon={FolderKanban} color="dom" onClick={() => navegar('/proyectos')} />
        </div>
        <div data-animar>
          <StatCard label="Con presupuesto" value={stats.conPres} icon={Layers} color="emerald" onClick={() => navegar('/planificacion')} />
        </div>
        <div data-animar>
          <StatCard label="Activos" value={stats.activos} icon={TrendingUp} color="blue" />
        </div>
        <div data-animar>
          <StatCard label="Sin BC3" value={stats.sinPres} icon={AlertTriangle} color={stats.sinPres > 0 ? 'amber' : 'gray'} />
        </div>
      </div>

      {/* SECCIONES — stagger al cargar */}
      <div ref={seccionesRef} className="space-y-8">
        {/* SECTION 1: PERMISOS Y PRESUPUESTOS */}
        <div data-animar>
          <Section titulo="Permisos y Presupuestos" icono={FolderKanban} desc="Proyectos y estado financiero">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Tarjeta>
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-800">Proyectos recientes</h3>
                  <Link to="/proyectos/nuevo" className="text-[11px] text-dom-600 hover:text-dom-700 font-medium flex items-center gap-1"><Plus className="h-3 w-3" />Nuevo</Link>
                </div>
                {proyectos.length === 0 ? (
                  <div className="px-4 py-10 text-center"><Sparkles className="h-8 w-8 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400 mb-3">Sin proyectos</p><Boton tamano="xs" icono={Plus} onClick={() => navegar('/proyectos/nuevo')}>Crear</Boton></div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
                    {proyectos.slice(0, 8).map(p => (
                      <ProyectoFila key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </Tarjeta>
              <Tarjeta>
                <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Resumen presupuestario</h3></div>
                <TarjetaCuerpo>
                  {proyectos.filter(p => p.tienePresupuesto).length === 0 ? (
                    <div className="py-8 text-center"><DollarSign className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">Carga un BC3 en Planificación</p></div>
                  ) : (
                    <div className="space-y-3">
                      {proyectos.filter(p => p.tienePresupuesto).map(p => {
                        const sym = MONEDA_SYM[p.moneda || p.presupuestoMoneda] || '$'
                        const t = p.presupuestoResumen?.presupuestoTotal || 0
                        return (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="min-w-0 flex-1"><p className="text-[12px] font-medium text-gray-800 truncate">{p.nombre}</p><p className="text-[10px] text-gray-400">{p.presupuestoResumen?.totalPartidas || 0} partidas</p></div>
                            <div className="text-right ml-3"><p className="text-[13px] font-bold text-gray-900">{sym}{t > 0 ? (t / 1e6).toFixed(1) + 'M' : '—'}</p><p className="text-[9px] text-gray-400">{p.moneda || 'CLP'}</p></div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TarjetaCuerpo>
              </Tarjeta>
            </div>
          </Section>
        </div>

        {/* SECTION 2: GESTIÓN Y ORGANIZACIÓN */}
        <div data-animar>
          <Section titulo="Gestión y Organización" icono={CalendarDays} desc="Calendario, agenda y notas rápidas">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Tarjeta className="lg:col-span-1">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-800">Calendario</h3>
                  <Link to="/calendario" className="text-[11px] text-dom-600 font-medium flex items-center gap-1">Abrir<ArrowRight className="h-3 w-3" /></Link>
                </div>
                <TarjetaCuerpo>
                  <MiniCalendar />
                  <Link to="/calendario" className="mt-3 flex items-center justify-center gap-2 p-2.5 bg-dom-50 text-dom-700 rounded-lg text-[12px] font-medium hover:bg-dom-100 transition-colors"><CalendarDays className="h-3.5 w-3.5" />Google Calendar</Link>
                </TarjetaCuerpo>
              </Tarjeta>
              <Tarjeta className="lg:col-span-2">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-800">Notas rápidas</h3>
                  <StickyNote className="h-3.5 w-3.5 text-gray-300" />
                </div>
                <TarjetaCuerpo>
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Escribe una nota..." value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardarNota()}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500/30" />
                    <Boton tamano="sm" icono={Plus} onClick={guardarNota} disabled={!nuevaNota.trim()}>Añadir</Boton>
                  </div>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {notas.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">Sin notas.</p> : notas.map(n => (
                      <div key={n.id} className="group flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors">
                        <StickyNote className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-700">{n.texto}</p><p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div>
                        <button onClick={() => borrarNota(n.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </TarjetaCuerpo>
              </Tarjeta>
            </div>
          </Section>
        </div>

        {/* SECTION 3: CONTROL DE OBRA */}
        <div data-animar>
          <Section titulo="Control de Obra" icono={IconoGantt} desc="Planificación BC3, mediciones y certificaciones">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['Planificación BC3', 'Presupuestos, partidas, APU y Gantt', IconoGantt, 'dom', '/planificacion', `${stats.conPres} proy.`],
                ['Mediciones', 'Registro de avance por partida', Ruler, 'emerald', '/mediciones', stats.conPres > 0 ? 'Activo' : 'Sin BC3'],
                ['Certificaciones', 'Origen-Anterior-Actual + Bloqueo', FileCheck2, 'purple', '/certificaciones', 'Workflow'],
              ].map(([t, d, I, c, r, b]) => {
                const ic = { dom: 'bg-dom-100 text-dom-600', emerald: 'bg-emerald-100 text-emerald-600', purple: 'bg-purple-100 text-purple-600' }
                const hc = { dom: 'hover:border-dom-300 hover:bg-dom-50/30', emerald: 'hover:border-emerald-300 hover:bg-emerald-50/30', purple: 'hover:border-purple-300 hover:bg-purple-50/30' }
                return (
                  <ObraCard key={r} t={t} d={d} I={I} c={c} r={r} b={b} ic={ic} hc={hc} />
                )
              })}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function ProyectoFila({ p }) {
  const ref = useRef(null)
  return (
    <Link
      ref={ref}
      to={`/proyectos/${p.id}`}
      onMouseEnter={() => gsap.to(ref.current, { x: 3, duration: 0.15, ease: 'power1.out' })}
      onMouseLeave={() => gsap.to(ref.current, { x: 0, duration: 0.15, ease: 'power1.in' })}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group"
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.tienePresupuesto ? 'bg-emerald-50' : 'bg-gray-100'}`}>
        {p.tienePresupuesto ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <FolderKanban className="h-4 w-4 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded">{p.numeroCaso}</span>
          {p.moneda && <span className="text-[9px] text-gray-400">{MONEDA_FLAG[p.moneda]} {p.moneda}</span>}
        </div>
        <p className="text-[13px] text-gray-800 font-medium truncate mt-0.5">{p.nombre}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500" />
    </Link>
  )
}

function ObraCard({ t, d, I, c, r, b, ic, hc }) {
  const ref = useRef(null)
  return (
    <Link
      ref={ref}
      to={r}
      onMouseEnter={() => gsap.to(ref.current, { y: -4, boxShadow: '0 8px 20px rgba(0,0,0,0.09)', duration: 0.2, ease: 'power2.out' })}
      onMouseLeave={() => gsap.to(ref.current, { y: 0, boxShadow: '0 0px 0px rgba(0,0,0,0)', duration: 0.2, ease: 'power2.in' })}
      className={`block p-5 bg-white rounded-xl border border-gray-200 transition-colors ${hc[c]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${ic[c]}`}><I className="h-4 w-4" /></div>
        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{b}</span>
      </div>
      <h3 className="text-[14px] font-semibold text-gray-900 mb-1">{t}</h3>
      <p className="text-[12px] text-gray-400">{d}</p>
    </Link>
  )
}

function Section({ titulo, icono: I, desc, children }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center"><I className="h-3.5 w-3.5 text-gray-500" /></div>
        <div><h2 className="text-[15px] font-semibold text-gray-900">{titulo}</h2><p className="text-[11px] text-gray-400">{desc}</p></div>
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, value, icon: I, color, onClick }) {
  const ref = useRef(null)
  const c = {
    dom: 'bg-dom-50 text-dom-700 border-dom-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  // Contador animado GSAP
  const numRef = useContador(value, true)

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => onClick && gsap.to(ref.current, { scale: 1.02, duration: 0.15, ease: 'power1.out' })}
      onMouseLeave={() => onClick && gsap.to(ref.current, { scale: 1, duration: 0.15, ease: 'power1.in' })}
      className={`rounded-xl border px-4 py-3 ${c[color]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <I className="h-4 w-4 opacity-60" />
        {onClick && <ArrowRight className="h-3 w-3 opacity-40" />}
      </div>
      {/* ref del contador — GSAP anima el número */}
      <p ref={numRef} className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider font-medium">{label}</p>
    </div>
  )
}

function MiniCalendar() {
  const h = new Date(), m = h.getMonth(), a = h.getFullYear()
  const p = new Date(a, m, 1).getDay(), d = new Date(a, m + 1, 0).getDate()
  const dias = Array.from({ length: 42 }, (_, i) => { const x = i - (p === 0 ? 6 : p - 1) + 1; return x > 0 && x <= d ? x : null })
  return (
    <div>
      <p className="text-[12px] font-semibold text-gray-700 mb-2 text-center">{h.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-[9px] font-medium text-gray-400 py-1">{d}</div>)}
        {dias.map((x, i) => <div key={i} className={`text-[11px] py-1 rounded-md ${x === h.getDate() ? 'bg-dom-600 text-white font-bold' : x ? 'text-gray-600 hover:bg-gray-100' : ''}`}>{x || ''}</div>)}
      </div>
    </div>
  )
}
