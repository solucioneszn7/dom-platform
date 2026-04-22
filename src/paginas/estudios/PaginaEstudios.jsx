// ===== Estudios de Licitaciones — Estilo Tendios =====
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, ChevronDown, ChevronUp, SlidersHorizontal, Upload, Plus,
  Star, Filter, MessageSquare, Building2, Calendar, DollarSign,
  Users, Save, Clock, AlertCircle, Radio, ExternalLink, KanbanSquare,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import {
  escucharEstudios, crearEstudio, actualizarEstudio,
  importarEstudiosDesdeJSON, nuevaObra, leerArchivoAccess,
} from '../../servicios/estudios'
import OBRAS_SEED from '../../datos/obras_seed.json'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import PanelSincronizacion from '../../componentes/PanelSincronizacion'
import toast from 'react-hot-toast'

// ── Utils ───────────────────────────────────────────────────────────────────────
const FMT = n => {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K€`
  return `${n.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`
}
const fmtDate = s => s ? new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : null
const diasHasta = s => {
  if (!s) return null
  return Math.ceil((new Date(s) - new Date()) / 86400000)
}

const PROCEDIMIENTOS = ['Abierto Ordinario', 'Negociado', 'Restringido', 'Invitación', 'Diálogo Competitivo']
const VALORACIONES = ['Varios Criterios', 'Sólo Precio']
const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const SORT_OPTIONS = [
  { key: 'fechaPresentacion_asc', label: 'Plazo presentación ↑' },
  { key: 'fechaPresentacion_desc', label: 'Plazo presentación ↓' },
  { key: 'licitacionIVA_desc', label: 'Mayor importe' },
  { key: 'licitacionIVA_asc', label: 'Menor importe' },
  { key: 'orden_asc', label: 'Nº orden' },
]
const TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'vamos', label: '¡Vamos!', dot: 'bg-emerald-500' },
  { key: 'pendiente', label: 'Pend. apertura', dot: 'bg-amber-500' },
  { key: 'ute', label: 'En UTE', dot: 'bg-purple-500' },
  { key: 'adjudicada', label: 'Adjudicadas', dot: 'bg-gray-400' },
]
const FILTROS_0 = {
  texto: '', estado: 'todas', procedimientos: [], valoracion: '',
  grupos: [], importeMin: '', importeMax: '', fechaDesde: '',
  fechaHasta: '', soloUTE: false, soloVamos: false, cliente: '',
  fuentes: [],
}

// ── FilterSection ───────────────────────────────────────────────────────────────
function Sec({ title, children, open: def = true }) {
  const [open, setOpen] = useState(def)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-3 space-y-1">{children}</div>}
    </div>
  )
}

// ── StatusBadge ─────────────────────────────────────────────────────────────────
function StatusBadge({ obra }) {
  if (obra.empresaAdjudicataria) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">ADJUDICADA</span>
  const d = diasHasta(obra.fechaPresentacion)
  if (d === null) return null
  if (d < 0) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-500">CERRADA</span>
  if (d <= 3) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">¡{d}d!</span>
  if (d <= 7) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{d}d</span>
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">ABIERTA</span>
}

// ── Card ────────────────────────────────────────────────────────────────────────
function Card({ obra, starred, onVer, onStar, onNota, onTablero }) {
  const d = diasHasta(obra.fechaPresentacion)
  const urgente = d !== null && d >= 0 && d <= 3
  const proxima = d !== null && d > 3 && d <= 7

  return (
    <div
      onClick={() => onVer(obra.id)}
      className={`group relative bg-white border rounded-xl hover:shadow-md transition-all cursor-pointer
        ${urgente ? 'border-red-200 hover:border-red-300' : proxima ? 'border-amber-200' : 'border-gray-200 hover:border-blue-200'}`}
    >
      {/* left accent */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${urgente ? 'bg-red-400' : proxima ? 'bg-amber-400' : obra.vamos ? 'bg-emerald-400' : 'bg-gray-200'}`} />

      <div className="pl-4 pr-4 py-3.5">
        {/* Row 1: Title + actions */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              {obra.origenFuente === 'place' && (
                <span className="flex-shrink-0 mt-0.5 inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Importada desde PLACE">
                  <Radio className="h-2.5 w-2.5" />PLACE
                </span>
              )}
              <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{obra.titulo || 'Sin título'}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 truncate">{obra.cliente}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            {obra.urlPlataforma && (
              <a href={obra.urlPlataforma} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-blue-500" title="Ver en PLACE">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button onClick={() => onStar(obra.id)} className={`p-1 rounded hover:bg-gray-100 ${starred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
              <Star className={`h-3.5 w-3.5 ${starred ? 'fill-current' : ''}`} />
            </button>
            <button onClick={() => onNota(obra)} className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-blue-500">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Importe + fecha + estado + procedimiento */}
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          {obra.licitacionIVA > 0 && (
            <span className="text-[14px] font-bold text-gray-900">{FMT(obra.licitacionIVA)}</span>
          )}
          {obra.fechaPresentacion && (
            <div className={`flex items-center gap-1 text-[11px] ${urgente ? 'text-red-600 font-semibold' : proxima ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
              <Calendar className="h-3 w-3" />
              <span>{fmtDate(obra.fechaPresentacion)}</span>
              {obra.horaPresentacion && <span className="text-gray-400">{obra.horaPresentacion}</span>}
            </div>
          )}
          <StatusBadge obra={obra} />
          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{obra.procedimiento}</span>
        </div>

        {/* Row 3: Tags + checklist */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Clasificacion */}
            {obra.clasificacion?.length > 0 && (
              <div className="flex gap-1">
                {obra.clasificacion.slice(0, 3).map((c, i) => (
                  <span key={i} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-mono">{c.grupo}{c.subgrupo}</span>
                ))}
                {obra.clasificacion.length > 3 && <span className="text-[9px] text-gray-400">+{obra.clasificacion.length - 3}</span>}
              </div>
            )}
            {/* UTE */}
            {obra.componenteUTE1 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-purple-400" />
                <span className="text-[10px] text-purple-600 font-medium">UTE {Math.round(obra.pctGuamar)}% + {obra.componenteUTE1}</span>
              </div>
            )}
            {/* Ref */}
            {obra.observaciones && <span className="text-[9px] text-gray-400 font-mono">{obra.observaciones}</span>}
            {/* nota interna */}
            {obra.notaInterna && <span className="text-[9px] text-blue-400 flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Nota</span>}
          </div>

          {/* Checklist dots + Tablero */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {obra.vamos && (
              <button
                onClick={e => { e.stopPropagation(); onTablero(obra.id) }}
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-md transition-colors"
                title="Ir al tablero de esta licitación"
              >
                <KanbanSquare className="h-3 w-3" /> Tablero
              </button>
            )}
            {[['T', obra.docTecnica], ['A', obra.docAdministrativa], ['E', obra.estudioEconomico]].map(([l, v]) => (
              <div key={l} className={`h-4 w-4 rounded text-[8px] font-bold flex items-center justify-center ${v ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal Nota ──────────────────────────────────────────────────────────────────
function ModalNota({ obra, onClose, onSave }) {
  const [txt, setTxt] = useState(obra?.notaInterna || '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Nota interna</h3><button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button></div>
        <p className="text-[11px] text-gray-500 line-clamp-1">{obra?.titulo}</p>
        <textarea value={txt} onChange={e => setTxt(e.target.value)} rows={4} placeholder="Añade tus notas..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none" />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" tamano="sm" onClick={onClose}>Cancelar</Boton>
          <Boton icono={Save} tamano="sm" onClick={() => { onSave(obra.id, txt); onClose() }}>Guardar</Boton>
        </div>
      </div>
    </div>
  )
}

// ── Modal Nueva ─────────────────────────────────────────────────────────────────
function ModalNueva({ onClose, onCrear }) {
  const [f, setF] = useState(nuevaObra())
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Nueva licitación</h3><button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button></div>
        <div className="space-y-3">
          <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Título *</label><input value={f.titulo} onChange={e => s('titulo', e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Organismo / Cliente</label><input value={f.cliente} onChange={e => s('cliente', e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" /></div>
            <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Procedimiento</label>
              <select value={f.procedimiento} onChange={e => s('procedimiento', e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
                {PROCEDIMIENTOS.map(p => <option key={p}>{p}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Licitación IVA excl. (€)</label><input type="number" value={f.licitacionIVA || ''} onChange={e => s('licitacionIVA', +e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" /></div>
            <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Fecha presentación</label><input type="date" value={f.fechaPresentacion || ''} onChange={e => s('fechaPresentacion', e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" /></div>
          </div>
          <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Referencia / Observaciones</label><input value={f.observaciones || ''} onChange={e => s('observaciones', e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={f.vamos} onChange={e => s('vamos', e.target.checked)} className="accent-emerald-500 h-4 w-4" /><span className="text-sm font-medium text-gray-800">¡Vamos! — marcar como activa</span></label>
        </div>
        <div className="flex justify-end gap-2 pt-1"><Boton variante="secundario" tamano="sm" onClick={onClose}>Cancelar</Boton><Boton icono={Plus} tamano="sm" onClick={() => onCrear(f)}>Crear</Boton></div>
      </div>
    </div>
  )
}

// ── MAIN ────────────────────────────────────────────────────────────────────────
export default function PaginaEstudios() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [estudios, setEstudios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState(FILTROS_0)
  const [sort, setSort] = useState('fechaPresentacion_asc')
  const [panelOpen, setPanelOpen] = useState(true)
  const [modalNota, setModalNota] = useState(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [modalSync, setModalSync] = useState(false)
  const [starred, setStarred] = useState(() => JSON.parse(localStorage.getItem('dom_starred') || '[]'))

  // Firebase listener
  useEffect(() => {
    if (!usuario) return
    return escucharEstudios(d => { setEstudios(d); setCargando(false) })
  }, [usuario])

  // Seed fallback
  useEffect(() => {
    if (!cargando && estudios.length === 0)
      setEstudios(OBRAS_SEED.map((o, i) => ({ ...o, id: `seed_${i}`, origenFuente: 'accdb' })))
  }, [cargando, estudios.length])

  const setF = (k, v) => setFiltros(f => ({ ...f, [k]: v }))
  const toggleArr = (k, v) => setFiltros(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
  }))
  const nFiltros = Object.entries(filtros).filter(([k, v]) => k !== 'estado' && (Array.isArray(v) ? v.length : v !== '' && v !== false)).length

  // Filter + sort
  const resultados = useMemo(() => {
    let r = [...estudios]
    if (filtros.estado === 'vamos') r = r.filter(e => e.vamos && !e.empresaAdjudicataria)
    else if (filtros.estado === 'pendiente') r = r.filter(e => !e.apertura && e.fechaPresentacion && new Date(e.fechaPresentacion) < new Date())
    else if (filtros.estado === 'ute') r = r.filter(e => e.componenteUTE1)
    else if (filtros.estado === 'adjudicada') r = r.filter(e => e.empresaAdjudicataria)
    if (filtros.texto) { const q = filtros.texto.toLowerCase(); r = r.filter(e => [e.titulo, e.cliente, e.observaciones].some(f => (f || '').toLowerCase().includes(q))) }
    if (filtros.cliente) { const q = filtros.cliente.toLowerCase(); r = r.filter(e => (e.cliente || '').toLowerCase().includes(q)) }
    if (filtros.procedimientos.length) r = r.filter(e => filtros.procedimientos.includes(e.procedimiento))
    if (filtros.valoracion) r = r.filter(e => e.valoracion === filtros.valoracion)
    if (filtros.grupos.length) r = r.filter(e => (e.clasificacion || []).some(c => filtros.grupos.includes(c.grupo)))
    if (filtros.importeMin) r = r.filter(e => e.licitacionIVA >= +filtros.importeMin)
    if (filtros.importeMax) r = r.filter(e => e.licitacionIVA <= +filtros.importeMax)
    if (filtros.fechaDesde) r = r.filter(e => e.fechaPresentacion >= filtros.fechaDesde)
    if (filtros.fechaHasta) r = r.filter(e => e.fechaPresentacion <= filtros.fechaHasta)
    if (filtros.soloUTE) r = r.filter(e => e.componenteUTE1)
    if (filtros.soloVamos) r = r.filter(e => e.vamos)
    if (filtros.fuentes.length) r = r.filter(e => filtros.fuentes.includes(e.origenFuente || 'manual'))
    const [campo, dir] = sort.split('_')
    r.sort((a, b) => { let va = a[campo], vb = b[campo]; if (!va) return 1; if (!vb) return -1; if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() } return dir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1) })
    return r
  }, [estudios, filtros, sort])

  const stats = useMemo(() => ({
    total: resultados.length,
    totalImporte: resultados.reduce((s, e) => s + (e.licitacionIVA || 0), 0),
    activas: estudios.filter(e => e.vamos && !e.empresaAdjudicataria).length,
    urgentes: estudios.filter(e => { const d = diasHasta(e.fechaPresentacion); return d !== null && d >= 0 && d <= 7 }).length,
    place: estudios.filter(e => e.origenFuente === 'place').length,
    accdb: estudios.filter(e => e.origenFuente === 'accdb').length,
    manual: estudios.filter(e => !e.origenFuente || e.origenFuente === 'manual').length,
  }), [resultados, estudios])

  const tabCount = key => key === 'todas' ? estudios.length : key === 'vamos' ? estudios.filter(e => e.vamos && !e.empresaAdjudicataria).length : key === 'pendiente' ? estudios.filter(e => !e.apertura && e.fechaPresentacion && new Date(e.fechaPresentacion) < new Date()).length : key === 'ute' ? estudios.filter(e => e.componenteUTE1).length : estudios.filter(e => e.empresaAdjudicataria).length

  const toggleStar = id => { const n = starred.includes(id) ? starred.filter(x => x !== id) : [...starred, id]; setStarred(n); localStorage.setItem('dom_starred', JSON.stringify(n)) }
  const saveNota = async (id, txt) => { if (!id.startsWith('seed_')) await actualizarEstudio(id, { notaInterna: txt }); toast.success('Nota guardada') }
  const handleCrear = async f => { if (!f.titulo) { toast.error('Título requerido'); return }; try { await crearEstudio(f); setModalNueva(false); toast.success('Licitación creada') } catch (e) { toast.error(e.message) } }
  const handleAccess = async e => {
    const file = e.target.files?.[0]; if (!file) return
    const id = toast.loading('Leyendo Access...')
    try { const { obras } = await leerArchivoAccess(file); toast.loading(`Importando ${obras.length}...`, { id }); await importarEstudiosDesdeJSON(obras); toast.success(`${obras.length} obras importadas`, { id }) }
    catch (err) { toast.error(err.message, { id }) }
  }

  if (cargando && estudios.length === 0) return <Cargando texto="Cargando licitaciones..." />

  return (
    <div className="flex h-[calc(100vh-56px)] -mt-5 -mx-5 lg:-mx-8 overflow-hidden">

      {/* ══════════ PANEL FILTROS (izquierda) ══════════ */}
      <aside className={`flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto transition-all duration-200 ${panelOpen ? 'w-[240px]' : 'w-0 overflow-hidden'}`}>
        <div className="min-w-[240px]">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Filtros</span>
              {nFiltros > 0 && <span className="h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">{nFiltros}</span>}
            </div>
            {nFiltros > 0 && <button onClick={() => setFiltros(FILTROS_0)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5"><X className="h-3 w-3" />Limpiar</button>}
          </div>

          {/* Búsqueda texto */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={filtros.texto} onChange={e => setF('texto', e.target.value)} placeholder="Obra, cliente, referencia..." className="w-full rounded-lg border border-gray-200 pl-8 pr-8 py-1.5 text-[12px] focus:border-blue-400 focus:outline-none" />
              {filtros.texto && <button onClick={() => setF('texto', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
            </div>
          </div>

          {/* Estado */}
          <Sec title="Estado" open>
            {[{ v: 'todas', l: 'Todas' }, { v: 'vamos', l: '¡Vamos! (activas)', c: 'text-emerald-600' }, { v: 'pendiente', l: 'Pendiente apertura', c: 'text-amber-600' }, { v: 'ute', l: 'En UTE', c: 'text-purple-600' }, { v: 'adjudicada', l: 'Adjudicadas', c: 'text-gray-400' }].map(({ v, l, c }) => (
              <label key={v} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="radio" name="estado" checked={filtros.estado === v} onChange={() => setF('estado', v)} className="accent-blue-500" />
                <span className={`text-[12px] ${c || 'text-gray-700'} ${filtros.estado === v ? 'font-semibold' : ''}`}>{l}</span>
              </label>
            ))}
          </Sec>

          {/* Procedimiento */}
          <Sec title="Procedimiento" open={false}>
            {PROCEDIMIENTOS.map(p => (
              <label key={p} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="checkbox" checked={filtros.procedimientos.includes(p)} onChange={() => toggleArr('procedimientos', p)} className="accent-blue-500" />
                <span className="text-[12px] text-gray-700">{p}</span>
              </label>
            ))}
          </Sec>

          {/* Importe */}
          <Sec title="Importe IVA excl." open={false}>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] text-gray-400 uppercase block mb-1">Mín (€)</label><input type="number" value={filtros.importeMin} onChange={e => setF('importeMin', e.target.value)} placeholder="0" className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:border-blue-400 focus:outline-none" /></div>
              <div><label className="text-[9px] text-gray-400 uppercase block mb-1">Máx (€)</label><input type="number" value={filtros.importeMax} onChange={e => setF('importeMax', e.target.value)} placeholder="∞" className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:border-blue-400 focus:outline-none" /></div>
            </div>
          </Sec>

          {/* Fechas */}
          <Sec title="Fecha presentación" open={false}>
            <div><label className="text-[9px] text-gray-400 uppercase block mb-1">Desde</label><input type="date" value={filtros.fechaDesde} onChange={e => setF('fechaDesde', e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:border-blue-400 focus:outline-none" /></div>
            <div className="mt-2"><label className="text-[9px] text-gray-400 uppercase block mb-1">Hasta</label><input type="date" value={filtros.fechaHasta} onChange={e => setF('fechaHasta', e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:border-blue-400 focus:outline-none" /></div>
          </Sec>

          {/* Clasificación */}
          <Sec title="Clasificación (Grupo)" open={false}>
            <div className="flex flex-wrap gap-1">
              {GRUPOS.map(g => <button key={g} onClick={() => toggleArr('grupos', g)} className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${filtros.grupos.includes(g) ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>{g}</button>)}
            </div>
          </Sec>

          {/* Criterios valoración */}
          <Sec title="Criterios valoración" open={false}>
            {['', ...VALORACIONES].map(v => <label key={v} className="flex items-center gap-2 py-0.5 cursor-pointer"><input type="radio" name="val" checked={filtros.valoracion === v} onChange={() => setF('valoracion', v)} className="accent-blue-500" /><span className="text-[12px] text-gray-700">{v || 'Todos'}</span></label>)}
          </Sec>

          {/* Organismo */}
          <Sec title="Organismo / Cliente" open={false}>
            <input value={filtros.cliente} onChange={e => setF('cliente', e.target.value)} placeholder="Buscar organismo..." className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-[11px] focus:border-blue-400 focus:outline-none" />
          </Sec>

          {/* Opciones */}
          <Sec title="Opciones adicionales" open={false}>
            <label className="flex items-center gap-2 py-0.5 cursor-pointer"><input type="checkbox" checked={filtros.soloVamos} onChange={e => setF('soloVamos', e.target.checked)} className="accent-emerald-500" /><span className="text-[12px] text-gray-700">Solo ¡Vamos!</span></label>
            <label className="flex items-center gap-2 py-0.5 cursor-pointer"><input type="checkbox" checked={filtros.soloUTE} onChange={e => setF('soloUTE', e.target.checked)} className="accent-purple-500" /><span className="text-[12px] text-gray-700">Solo en UTE</span></label>
          </Sec>

          {/* Fuente de datos */}
          <Sec title="Fuente" open={false}>
            {[
              { v: 'place', l: 'PLACE (oficial)', c: 'text-blue-600', icon: Radio },
              { v: 'accdb', l: 'Access .accdb', c: 'text-amber-600' },
              { v: 'manual', l: 'Manual', c: 'text-gray-600' },
            ].map(({ v, l, c, icon: I }) => (
              <label key={v} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="checkbox" checked={filtros.fuentes.includes(v)} onChange={() => toggleArr('fuentes', v)} className="accent-blue-500" />
                {I && <I className="h-3 w-3 text-blue-500" />}
                <span className={`text-[12px] ${c || 'text-gray-700'}`}>{l}</span>
                <span className="text-[9px] text-gray-400 ml-auto">{v === 'place' ? stats.place : v === 'accdb' ? stats.accdb : stats.manual}</span>
              </label>
            ))}
          </Sec>
        </div>
      </aside>

      {/* ══════════ PANEL RESULTADOS (derecha) ══════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-5 pt-3 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 pb-3">
            {/* Left: toggle filtros + stats */}
            <div className="flex items-center gap-3">
              <button onClick={() => setPanelOpen(!panelOpen)} className={`p-1.5 rounded-lg border ${panelOpen ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Filter className="h-3.5 w-3.5" />
              </button>
              <div>
                <span className="text-[15px] font-bold text-gray-900">{stats.total}</span>
                <span className="text-[12px] text-gray-500 ml-1.5">licitaciones</span>
                {stats.total > 0 && <span className="text-[11px] text-gray-400 ml-2">· {FMT(stats.totalImporte)}</span>}
              </div>
              <div className="hidden md:flex items-center gap-2">
                {stats.activas > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{stats.activas} activas</span>}
                {stats.urgentes > 0 && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">{stats.urgentes} urgentes</span>}
                {stats.place > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Radio className="h-2.5 w-2.5" />{stats.place} PLACE</span>}
              </div>
            </div>

            {/* Right: sort + import + sync + nueva */}
            <div className="flex items-center gap-2">
              <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] text-gray-700 focus:border-blue-400 focus:outline-none bg-white">
                {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <input ref={fileRef} type="file" accept=".accdb" onChange={handleAccess} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] text-gray-600 font-medium">
                <Upload className="h-3.5 w-3.5" />Access
              </button>
              <button onClick={() => setModalSync(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[11px] text-blue-700 font-semibold">
                <Radio className="h-3.5 w-3.5" />Sync PLACE
              </button>
              <button onClick={() => setModalNueva(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold">
                <Plus className="h-3.5 w-3.5" />Nueva
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setF('estado', tab.key)} className={`flex items-center gap-1.5 px-3 pb-2.5 text-[11px] font-medium border-b-2 transition-colors -mb-px ${filtros.estado === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.dot && <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${tab.dot}`} />}
                {tab.label}
                <span className={`text-[9px] px-1.5 rounded-full ${filtros.estado === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{tabCount(tab.key)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4">
          {resultados.length === 0 ? (
            <div className="text-center py-24">
              <Search className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Sin resultados con estos filtros</p>
              <button onClick={() => setFiltros(FILTROS_0)} className="mt-2 text-[12px] text-blue-500 hover:underline">Limpiar filtros</button>
            </div>
          ) : (
            <div className="space-y-2">
              {resultados.map(o => (
                <Card key={o.id} obra={o} starred={starred.includes(o.id)} onVer={id => navigate(`/estudios/${id}`)} onStar={toggleStar} onNota={setModalNota} onTablero={id => navigate(`/tablero?licitacion=${id}`)} />
              ))}
              <p className="text-center text-[11px] text-gray-400 py-4">{resultados.length} resultados · {FMT(stats.totalImporte)} en licitación</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalNota && <ModalNota obra={modalNota} onClose={() => setModalNota(null)} onSave={saveNota} />}
      {modalNueva && <ModalNueva onClose={() => setModalNueva(false)} onCrear={handleCrear} />}
      {modalSync && <PanelSincronizacion onClose={() => setModalSync(false)} onCompletado={() => setModalSync(false)} />}
    </div>
  )
}
