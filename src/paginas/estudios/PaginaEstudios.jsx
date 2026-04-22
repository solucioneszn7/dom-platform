// FILE: src/paginas/estudios/PaginaEstudios.jsx
// ─────────────────────────────────────────────────────────────────────────────
// MULTI-AGENT UPGRADE — Acua-conect Luxury Edition (INTEGRADO)
//
// Agente Marketing   → Lenguaje "Concierge de Licitaciones" en toda la UI
// Agente Diseño      → Apple-style: squircles, blur, spacing, sombras suaves
// Programador 1      → Botón "Analizar Pliego" abre ModalExtraccionPliego (IA)
// Programador 2      → Botón "Participar" crea tarea en Tablero (Firestore + localStorage)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, ChevronDown, ChevronUp, SlidersHorizontal, Upload, Plus,
  Star, MessageSquare, Building2, Calendar, DollarSign,
  Users, Save, Radio, ExternalLink, KanbanSquare, Sparkles,
  FileSearch, Zap, Filter, TrendingUp, LayoutGrid, List,
  CheckCircle2, AlertCircle,
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
import ModalExtraccionPliego from '../../componentes/ModalExtraccionPliego'
import toast from 'react-hot-toast'

// ─── Formateo ────────────────────────────────────────────────────────────────
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

// ─── Constantes ───────────────────────────────────────────────────────────────
const PROCEDIMIENTOS = ['Abierto Ordinario', 'Negociado', 'Restringido', 'Invitación', 'Diálogo Competitivo']
const VALORACIONES = ['Varios Criterios', 'Sólo Precio']
const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const SORT_OPTIONS = [
  { key: 'fechaPresentacion_asc', label: 'Plazo próximo' },
  { key: 'fechaPresentacion_desc', label: 'Plazo lejano' },
  { key: 'licitacionIVA_desc', label: 'Mayor importe' },
  { key: 'licitacionIVA_asc', label: 'Menor importe' },
  { key: 'orden_asc', label: 'Nº orden' },
]
// Clave de puente localStorage → PaginaTablero
const PENDING_KEY = 'acuaconect_tablero_pendientes'

// Marketing Agent: Lenguaje "Concierge de Licitaciones"
const TABS = [
  { key: 'todas', label: 'Todas las oportunidades' },
  { key: 'vamos', label: 'En cartera activa', dot: 'bg-emerald-500' },
  { key: 'pendiente', label: 'Pend. apertura', dot: 'bg-amber-500' },
  { key: 'ute', label: 'Alianzas UTE', dot: 'bg-purple-500' },
  { key: 'adjudicada', label: 'Adjudicadas', dot: 'bg-gray-400' },
]
const FILTROS_0 = {
  texto: '', estado: 'todas', procedimientos: [], valoracion: '',
  grupos: [], importeMin: '', importeMax: '', fechaDesde: '',
  fechaHasta: '', soloUTE: false, soloVamos: false, cliente: '',
  fuentes: [],
}

// ─── Acordeón de filtros ──────────────────────────────────────────────────────
function Sec({ title, children, open: def = true }) {
  const [open, setOpen] = useState(def)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp className="h-3 w-3 text-gray-300" /> : <ChevronDown className="h-3 w-3 text-gray-300" />}
      </button>
      {open && <div className="px-4 pb-3 space-y-1">{children}</div>}
    </div>
  )
}

// ─── Badge de estado de plazo ─────────────────────────────────────────────────
function StatusBadge({ obra }) {
  if (obra.empresaAdjudicataria) return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 tracking-wide">ADJUDICADA</span>
  )
  const d = diasHasta(obra.fechaPresentacion)
  if (d === null) return null
  if (d < 0) return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 tracking-wide">CERRADA</span>
  )
  if (d <= 3) return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white tracking-wide">¡{d}d!</span>
  )
  if (d <= 7) return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 tracking-wide">{d}d restantes</span>
  )
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 tracking-wide">ACTIVA</span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Agente Diseño: Apple-style card con squircles, sombras suaves, más aire
// Agente Programador 2: onParticipar crea tarea en Tablero
// ─────────────────────────────────────────────────────────────────────────────
function Card({ obra, starred, onVer, onStar, onNota, onTablero, onParticipar, onAnalizarPliego }) {
  const d = diasHasta(obra.fechaPresentacion)
  const urgente = d !== null && d >= 0 && d <= 3
  const proxima = d !== null && d > 3 && d <= 7

  const borderColor = urgente
    ? 'rgba(239,68,68,0.25)'
    : proxima
      ? 'rgba(245,158,11,0.25)'
      : 'rgba(229,231,235,0.8)'

  return (
    <div
      onClick={() => onVer(obra.id)}
      className="group relative bg-white cursor-pointer transition-all duration-200"
      style={{
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        padding: '18px 20px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.07)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Accent izquierdo */}
      <div
        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
        style={{
          background: urgente ? '#ef4444' : proxima ? '#f59e0b' : obra.vamos ? '#10b981' : '#e5e7eb',
          borderRadius: '0 2px 2px 0',
          left: 0,
        }}
      />

      {/* Fila 1: Título + acciones */}
      <div className="flex items-start gap-3 pl-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {obra.origenFuente === 'place' && (
              <span
                className="flex-shrink-0 mt-0.5 inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-600 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.08)' }}
                title="Importada desde PLACE"
              >
                <Radio className="h-2.5 w-2.5" />PLACE
              </span>
            )}
            <h3 className="text-[13.5px] font-semibold text-gray-900 leading-snug line-clamp-2 flex-1 tracking-tight">
              {obra.titulo || 'Sin título'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="h-3 w-3 text-gray-300 flex-shrink-0" />
            <span className="text-[11px] text-gray-400 truncate">{obra.cliente}</span>
          </div>
        </div>

        {/* Botones hover */}
        <div
          className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={e => e.stopPropagation()}
        >
          {obra.urlPlataforma && (
            <a
              href={obra.urlPlataforma}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-blue-500 transition-colors"
              title="Ver en plataforma"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {/* Agente Programador 1: Analizar Pliego */}
          <button
            onClick={() => onAnalizarPliego?.(obra)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-dom-500 transition-colors"
            title="Analizar pliego con IA"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onStar(obra.id)}
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${starred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
          >
            <Star className={`h-3.5 w-3.5 ${starred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onNota(obra)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-blue-500 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Fila 2: Importe + fecha + estado */}
      <div className="flex items-center gap-3 mt-3 pl-3 flex-wrap">
        {obra.licitacionIVA > 0 && (
          <span className="text-[15px] font-bold text-gray-900 tracking-tight">
            {FMT(obra.licitacionIVA)}
          </span>
        )}
        {obra.fechaPresentacion && (
          <div className={`flex items-center gap-1.5 text-[11px] ${urgente ? 'text-red-500 font-semibold' : proxima ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
            <Calendar className="h-3 w-3" />
            <span>{fmtDate(obra.fechaPresentacion)}</span>
            {obra.horaPresentacion && <span className="opacity-60">{obra.horaPresentacion}</span>}
          </div>
        )}
        <StatusBadge obra={obra} />
        {obra.procedimiento && (
          <span
            className="text-[9px] text-blue-600 font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.08)' }}
          >
            {obra.procedimiento}
          </span>
        )}
      </div>

      {/* Fila 3: Tags + acciones CTA */}
      <div className="flex items-center justify-between gap-2 mt-3 pl-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {obra.clasificacion?.length > 0 && (
            <div className="flex gap-1">
              {obra.clasificacion.slice(0, 3).map((c, i) => (
                <span key={i} className="text-[9px] text-purple-600 font-mono px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)' }}>
                  {c.grupo}{c.subgrupo}
                </span>
              ))}
              {obra.clasificacion.length > 3 && (
                <span className="text-[9px] text-gray-400">+{obra.clasificacion.length - 3}</span>
              )}
            </div>
          )}
          {obra.componenteUTE1 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] text-purple-600 font-medium">UTE {Math.round(obra.pctGuamar)}%</span>
            </div>
          )}
          {obra.notaInterna && (
            <span className="text-[9px] text-blue-400 flex items-center gap-0.5">
              <MessageSquare className="h-2.5 w-2.5" />Nota interna
            </span>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {/* Agente Programador 2: Botón "Participar" → crea tarea en Tablero */}
          {!obra.vamos && !obra.empresaAdjudicataria && (
            <button
              onClick={() => onParticipar?.(obra)}
              className="flex items-center gap-1 text-[10px] font-semibold text-dom-600 px-2.5 py-1.5 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(51,113,255,0.08)',
                border: '1px solid rgba(51,113,255,0.18)',
              }}
              title="Crear expediente de seguimiento en Tablero"
            >
              <Zap className="h-3 w-3" />
              Participar
            </button>
          )}

          {/* Ir al tablero si ya está en cartera */}
          {obra.vamos && (
            <button
              onClick={() => onTablero(obra.id)}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 px-2.5 py-1.5 rounded-xl transition-all duration-150 hover:scale-[1.02]"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
              title="Ir al tablero de seguimiento"
            >
              <KanbanSquare className="h-3 w-3" />
              Tablero
            </button>
          )}

          {/* Checkboxes doc */}
          {[['T', obra.docTecnica], ['A', obra.docAdministrativa], ['E', obra.estudioEconomico]].map(([l, v]) => (
            <div
              key={l}
              className={`h-4 w-4 rounded text-[8px] font-bold flex items-center justify-center transition-colors
                ${v ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'}`}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Modal de nota interna ────────────────────────────────────────────────────
function ModalNota({ obra, onClose, onSave }) {
  const [txt, setTxt] = useState(obra?.notaInterna || '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full max-w-md p-6 space-y-4 animate-scale-in"
        style={{ borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.16)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">Nota de seguimiento</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{obra?.titulo}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <textarea
          value={txt}
          onChange={e => setTxt(e.target.value)}
          rows={4}
          placeholder="Añade tus observaciones estratégicas..."
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-dom-400 focus:outline-none resize-none leading-relaxed"
          style={{ fontSize: '13px' }}
        />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" tamano="sm" onClick={onClose}>Cancelar</Boton>
          <Boton icono={Save} tamano="sm" onClick={() => { onSave(obra.id, txt); onClose() }}>Guardar</Boton>
        </div>
      </div>
    </div>
  )
}

// ─── Modal nueva oportunidad ─────────────────────────────────────────────────
// Marketing Agent: "Registrar Oportunidad Estratégica"
function ModalNueva({ onClose, onCrear, datosPrerellenados = {} }) {
  const [f, setF] = useState({ ...nuevaObra(), ...datosPrerellenados })
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full max-w-lg p-6 space-y-5 max-h-[88vh] overflow-y-auto"
        style={{ borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Registrar Oportunidad Estratégica
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Incorporar al Portafolio de Oportunidades
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">
              Denominación del contrato *
            </label>
            <input
              value={f.titulo}
              onChange={e => s('titulo', e.target.value)}
              placeholder="Nombre del contrato público..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-dom-400 focus:outline-none"
              style={{ fontSize: '13px' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Organismo licitador</label>
              <input value={f.cliente} onChange={e => s('cliente', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] focus:border-dom-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Procedimiento</label>
              <select value={f.procedimiento} onChange={e => s('procedimiento', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] focus:border-dom-400 focus:outline-none">
                {PROCEDIMIENTOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Presupuesto base (€)</label>
              <input type="number" value={f.licitacionIVA || ''} onChange={e => s('licitacionIVA', +e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] focus:border-dom-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Fecha límite oferta</label>
              <input type="date" value={f.fechaPresentacion || ''} onChange={e => s('fechaPresentacion', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] focus:border-dom-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">Referencia / Expediente</label>
            <input value={f.observaciones || ''} onChange={e => s('observaciones', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] focus:border-dom-400 focus:outline-none" />
          </div>

          {/* Extracto del pliego si viene de IA */}
          {f.extractoPliego && (
            <div className="bg-dom-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-dom-500" />
                <span className="text-[10px] font-bold text-dom-600 uppercase tracking-wider">Extracto IA del pliego</span>
              </div>
              <p className="text-[12px] text-gray-600 leading-relaxed">{f.extractoPliego}</p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" checked={f.vamos || false} onChange={e => s('vamos', e.target.checked)} className="accent-emerald-500 h-4 w-4 rounded" />
            <span className="text-[13px] font-medium text-gray-700">Incorporar directamente a cartera activa</span>
          </label>
        </div>

        <div className="flex gap-2.5 pt-1">
          <Boton variante="secundario" tamano="md" onClick={onClose} className="flex-1">Cancelar</Boton>
          <Boton tamano="md" onClick={() => {
            if (!f.titulo) { toast.error('Título requerido'); return }
            onCrear(f); onClose()
          }} className="flex-1">
            Incorporar al Portafolio
          </Boton>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Agente Programador 2 — lógica de "Participar" → crear tarea en Tablero
// Escribe en Firestore (persistencia) y en localStorage (bridge inmediato)
// ─────────────────────────────────────────────────────────────────────────────
async function crearTareaTablero(obra, datosUsuario) {
  // Importación dinámica para no romper si el módulo cambia
  const { db } = await import('../../servicios/firebase')
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

  const resumenEjecutivo = [
    obra.titulo,
    obra.cliente ? `Organismo: ${obra.cliente}` : null,
    obra.licitacionIVA ? `Presupuesto base: ${FMT(obra.licitacionIVA)}` : null,
    obra.fechaPresentacion ? `Plazo oferta: ${fmtDate(obra.fechaPresentacion)}` : null,
    obra.procedimiento ? `Procedimiento: ${obra.procedimiento}` : null,
  ].filter(Boolean).join(' · ')

  const nuevaTarea = {
    name: obra.titulo || 'Nueva licitación',
    owner: datosUsuario?.nombre?.slice(0, 2).toUpperCase() || 'AC',
    status: 'not_started',
    priority: diasHasta(obra.fechaPresentacion) <= 7 ? 'high' : 'medium',
    dueDate: obra.fechaPresentacion || null,
    notes: resumenEjecutivo,
    origen: 'licitacion',
    licitacionId: obra.id,
    fechaCreacion: serverTimestamp(),
    creadoPor: datosUsuario?.uid || null,
  }

  await addDoc(collection(db, 'tablero_tareas'), nuevaTarea)
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function PaginaEstudios() {
  const { usuario, datosUsuario } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [estudios, setEstudios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [starred, setStarred] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('starred_obras') || '[]')) }
    catch { return new Set() }
  })

  const [filtros, setFiltros] = useState(FILTROS_0)
  const [activeTab, setActiveTab] = useState('todas')
  const [sort, setSort] = useState('fechaPresentacion_asc')
  const [panelOpen, setPanelOpen] = useState(true)

  const [modalNueva, setModalNueva] = useState(false)
  const [modalSync, setModalSync] = useState(false)
  const [modalNota, setModalNota] = useState(null)
  const [modalPliego, setModalPliego] = useState(false)
  const [datosPrerellenados, setDatosPrerellenados] = useState({})

  // Escuchar licitaciones en tiempo real
  useEffect(() => {
    if (!usuario) return
    const unsub = escucharEstudios(usuario.uid, data => {
      setEstudios(data)
      setCargando(false)
    })
    return unsub
  }, [usuario])

  // Seed fallback si vacío
  useEffect(() => {
    if (!cargando && estudios.length === 0)
      setEstudios(OBRAS_SEED.map((o, i) => ({ ...o, id: `seed_${i}`, origenFuente: 'accdb' })))
  }, [cargando, estudios.length])

  // Filtrado y ordenación
  const setF = (k, v) => setFiltros(p => ({ ...p, [k]: v }))
  const toggleArr = (k, v) => setF(k, filtros[k].includes(v) ? filtros[k].filter(x => x !== v) : [...filtros[k], v])
  const nFiltros = Object.entries(filtros).filter(([k, v]) => {
    if (k === 'texto' || k === 'estado') return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'boolean') return v
    return !!v
  }).length

  const filtradas = useMemo(() => {
    let arr = [...estudios]
    const { texto, procedimientos, valoracion, grupos, importeMin, importeMax, fechaDesde, fechaHasta, soloUTE, soloVamos, cliente, fuentes } = filtros

    // Filtro por tab activa
    if (activeTab === 'vamos') arr = arr.filter(o => o.vamos)
    else if (activeTab === 'pendiente') arr = arr.filter(o => o.estadoParticipacion === 'pendiente_apertura')
    else if (activeTab === 'ute') arr = arr.filter(o => !!o.componenteUTE1)
    else if (activeTab === 'adjudicada') arr = arr.filter(o => !!o.empresaAdjudicataria)

    // Filtro lateral por estado (si difiere del tab)
    if (filtros.estado !== 'todas' && filtros.estado !== activeTab) {
      if (filtros.estado === 'vamos') arr = arr.filter(o => o.vamos)
      else if (filtros.estado === 'pendiente') arr = arr.filter(o => o.estadoParticipacion === 'pendiente_apertura')
      else if (filtros.estado === 'ute') arr = arr.filter(o => !!o.componenteUTE1)
      else if (filtros.estado === 'adjudicada') arr = arr.filter(o => !!o.empresaAdjudicataria)
    }

    if (texto) {
      const q = texto.toLowerCase()
      arr = arr.filter(o =>
        o.titulo?.toLowerCase().includes(q) ||
        o.cliente?.toLowerCase().includes(q) ||
        o.observaciones?.toLowerCase().includes(q)
      )
    }
    if (procedimientos.length) arr = arr.filter(o => procedimientos.includes(o.procedimiento))
    if (valoracion) arr = arr.filter(o => o.criteriosValoracion === valoracion)
    if (grupos.length) arr = arr.filter(o => o.clasificacion?.some(c => grupos.includes(c.grupo)))
    if (importeMin) arr = arr.filter(o => (o.licitacionIVA || 0) >= +importeMin)
    if (importeMax) arr = arr.filter(o => (o.licitacionIVA || 0) <= +importeMax)
    if (fechaDesde) arr = arr.filter(o => o.fechaPresentacion >= fechaDesde)
    if (fechaHasta) arr = arr.filter(o => o.fechaPresentacion <= fechaHasta)
    if (soloUTE) arr = arr.filter(o => !!o.componenteUTE1)
    if (soloVamos) arr = arr.filter(o => o.vamos)
    if (cliente) arr = arr.filter(o => o.cliente?.toLowerCase().includes(cliente.toLowerCase()))
    if (fuentes.length) arr = arr.filter(o => fuentes.includes(o.origenFuente || 'manual'))

    const [field, dir] = sort.split('_')
    arr.sort((a, b) => {
      const av = a[field] ?? '', bv = b[field] ?? ''
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })

    return arr
  }, [estudios, filtros, sort, activeTab])

  const stats = useMemo(() => ({
    total: estudios.length,
    activas: estudios.filter(o => o.vamos).length,
    pendientes: estudios.filter(o => {
      const d = diasHasta(o.fechaPresentacion)
      return d !== null && d >= 0 && d <= 7
    }).length,
    importeTotal: estudios.filter(o => o.vamos).reduce((s, o) => s + (o.licitacionIVA || 0), 0),
    place: estudios.filter(o => o.origenFuente === 'place').length,
    accdb: estudios.filter(o => o.origenFuente === 'accdb').length,
    manual: estudios.filter(o => !o.origenFuente || o.origenFuente === 'manual').length,
  }), [estudios])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStar = (id) => {
    setStarred(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('starred_obras', JSON.stringify([...next]))
      return next
    })
  }

  const handleNota = (obra) => setModalNota(obra)
  const handleGuardarNota = async (id, nota) => {
    if (!id.startsWith('seed_')) await actualizarEstudio(id, { notaInterna: nota })
    toast.success('Nota guardada')
  }

  const handleTablero = (id) => navigate(`/tablero?licitacion=${id}`)

  // Agente Programador 2: "Participar" → localStorage bridge + Firestore
  const handleParticipar = async (obra) => {
    const toastId = toast.loading('Creando expediente de seguimiento…')
    try {
      // 1. Escribir en localStorage → PaginaTablero lo lee al montar
      const resumen = [
        obra.cliente ? `Org: ${obra.cliente}` : null,
        obra.licitacionIVA ? `PBL: ${FMT(obra.licitacionIVA)}` : null,
        obra.fechaPresentacion ? `Plazo: ${fmtDate(obra.fechaPresentacion)}` : null,
        obra.procedimiento || null,
      ].filter(Boolean).join(' · ')

      const tarea = {
        id: `lic_${Date.now()}`,
        name: obra.titulo || 'Licitación',
        owner: datosUsuario?.nombre?.slice(0, 2).toUpperCase() || 'AC',
        dueDate: obra.fechaPresentacion || null,
        notes: resumen,
      }
      const pendientes = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
      pendientes.push(tarea)
      localStorage.setItem(PENDING_KEY, JSON.stringify(pendientes))

      // 2. Persistir en Firestore (no bloquea la navegación)
      crearTareaTablero(obra, datosUsuario).catch(console.warn)

      // 3. Marcar obra como activa en Firestore
      if (!obra.id.startsWith('seed_')) {
        await actualizarEstudio(obra.id, { vamos: true })
      }

      toast.success('✓ Expediente creado. Abriendo Tablero…', { id: toastId })
      setTimeout(() => navigate(`/tablero?licitacion=${obra.id}`), 700)
    } catch (err) {
      toast.error('No se pudo crear el expediente: ' + err.message, { id: toastId })
    }
  }

  // Agente Programador 1: Abrir modal de extracción IA
  const handleAnalizarPliego = () => setModalPliego(true)

  // Cuando la IA extrae datos → abrir formulario pre-rellenado
  const handleDatosExtraidos = (datos) => {
    setDatosPrerellenados(datos)
    setModalNueva(true)
  }

  const handleCrear = async (f) => {
    const id = toast.loading('Incorporando oportunidad…')
    try {
      await crearEstudio(usuario?.uid, f)
      toast.success('Oportunidad incorporada al portafolio', { id })
    } catch (err) {
      toast.error(err.message, { id })
    }
  }

  const handleImportarAccess = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const id = toast.loading('Importando…')
    try {
      const { obras } = await leerArchivoAccess(file)
      toast.loading(`Procesando ${obras.length} oportunidades…`, { id })
      await importarEstudiosDesdeJSON(obras)
      toast.success(`${obras.length} oportunidades importadas`, { id })
    } catch (err) { toast.error(err.message, { id }) }
  }

  const handleSeedData = async () => {
    const id = toast.loading('Cargando datos de demostración…')
    try {
      await importarEstudiosDesdeJSON(OBRAS_SEED)
      toast.success('Portafolio de demostración cargado', { id })
    } catch (err) { toast.error(err.message, { id }) }
  }

  if (cargando && estudios.length === 0) return <Cargando texto="Cargando portafolio estratégico…" />

  return (
    <div className="flex h-[calc(100vh-56px)] -mt-5 -mx-5 lg:-mx-8 overflow-hidden">

      {/* ════════════════════════════════════════════════════════════
          Panel de filtros — izquierda
          Agente Diseño: sin líneas divisorias, sombra suave
      ════════════════════════════════════════════════════════════ */}
      <aside
        className={`flex-shrink-0 bg-white overflow-y-auto transition-all duration-200 ${panelOpen ? 'w-[244px]' : 'w-0 overflow-hidden'}`}
        style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="min-w-[244px]">
          {/* Header filtros */}
          <div className="sticky top-0 bg-white z-10 px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Filtros</span>
              {nFiltros > 0 && (
                <span className="h-4 w-4 rounded-full bg-dom-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {nFiltros}
                </span>
              )}
            </div>
            {nFiltros > 0 && (
              <button onClick={() => setFiltros(FILTROS_0)} className="text-[10px] text-dom-500 hover:text-dom-700 font-medium flex items-center gap-0.5">
                <X className="h-3 w-3" />Limpiar
              </button>
            )}
          </div>

          {/* Búsqueda */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
              <input
                value={filtros.texto}
                onChange={e => setF('texto', e.target.value)}
                placeholder="Buscar oportunidades..."
                className="w-full rounded-xl border border-gray-100 bg-gray-50 pl-8 pr-7 py-2 text-[12px] focus:border-dom-300 focus:outline-none focus:bg-white transition-colors"
              />
              {filtros.texto && (
                <button onClick={() => setF('texto', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="px-4 py-3 grid grid-cols-2 gap-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
              <p className="text-[18px] font-bold text-gray-900 tracking-tight">{stats.activas}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">En cartera</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2 text-center">
              <p className="text-[18px] font-bold text-amber-700 tracking-tight">{stats.pendientes}</p>
              <p className="text-[9px] text-amber-500 uppercase tracking-wider font-medium">Próximas</p>
            </div>
          </div>

          {/* Filtros */}
          <Sec title="Estado de la oportunidad" open>
            {[
              { v: 'todas', l: 'Todas' },
              { v: 'vamos', l: 'En cartera activa', c: 'text-emerald-600' },
              { v: 'pendiente', l: 'Pend. apertura', c: 'text-amber-600' },
              { v: 'ute', l: 'Alianzas UTE', c: 'text-purple-600' },
              { v: 'adjudicada', l: 'Adjudicadas', c: 'text-gray-400' },
            ].map(({ v, l, c }) => (
              <label key={v} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="radio" name="estado" checked={filtros.estado === v} onChange={() => setF('estado', v)} className="accent-dom-500" />
                <span className={`text-[12px] ${c || 'text-gray-700'} ${filtros.estado === v ? 'font-semibold' : ''}`}>{l}</span>
              </label>
            ))}
          </Sec>

          <Sec title="Procedimiento" open={false}>
            {PROCEDIMIENTOS.map(p => (
              <label key={p} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="checkbox" checked={filtros.procedimientos.includes(p)} onChange={() => toggleArr('procedimientos', p)} className="accent-dom-500" />
                <span className="text-[12px] text-gray-600">{p}</span>
              </label>
            ))}
          </Sec>

          <Sec title="Importe base (€)" open={false}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-gray-400 uppercase block mb-1 tracking-wider">Mín</label>
                <input type="number" value={filtros.importeMin} onChange={e => setF('importeMin', e.target.value)} placeholder="0" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-dom-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-400 uppercase block mb-1 tracking-wider">Máx</label>
                <input type="number" value={filtros.importeMax} onChange={e => setF('importeMax', e.target.value)} placeholder="∞" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-dom-400 focus:outline-none" />
              </div>
            </div>
          </Sec>

          <Sec title="Plazo de presentación" open={false}>
            <div>
              <label className="text-[9px] text-gray-400 uppercase block mb-1 tracking-wider">Desde</label>
              <input type="date" value={filtros.fechaDesde} onChange={e => setF('fechaDesde', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-dom-400 focus:outline-none" />
            </div>
            <div className="mt-2">
              <label className="text-[9px] text-gray-400 uppercase block mb-1 tracking-wider">Hasta</label>
              <input type="date" value={filtros.fechaHasta} onChange={e => setF('fechaHasta', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-dom-400 focus:outline-none" />
            </div>
          </Sec>

          <Sec title="Clasificación SETU" open={false}>
            <div className="flex flex-wrap gap-1">
              {GRUPOS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleArr('grupos', g)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors
                    ${filtros.grupos.includes(g) ? 'bg-dom-500 text-white border-dom-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-dom-300'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Sec>

          <Sec title="Criterios de valoración" open={false}>
            {['', ...VALORACIONES].map(v => (
              <label key={v} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="radio" name="val" checked={filtros.valoracion === v} onChange={() => setF('valoracion', v)} className="accent-dom-500" />
                <span className="text-[12px] text-gray-600">{v || 'Todos'}</span>
              </label>
            ))}
          </Sec>

          <Sec title="Organismo público" open={false}>
            <input value={filtros.cliente} onChange={e => setF('cliente', e.target.value)} placeholder="Buscar organismo..." className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] focus:border-dom-400 focus:outline-none" />
          </Sec>

          <Sec title="Opciones de cartera" open={false}>
            <label className="flex items-center gap-2 py-0.5 cursor-pointer">
              <input type="checkbox" checked={filtros.soloVamos} onChange={e => setF('soloVamos', e.target.checked)} className="accent-emerald-500" />
              <span className="text-[12px] text-gray-600">Solo cartera activa</span>
            </label>
            <label className="flex items-center gap-2 py-0.5 cursor-pointer">
              <input type="checkbox" checked={filtros.soloUTE} onChange={e => setF('soloUTE', e.target.checked)} className="accent-purple-500" />
              <span className="text-[12px] text-gray-600">Solo alianzas UTE</span>
            </label>
          </Sec>

          <Sec title="Fuente de datos" open={false}>
            {[
              { v: 'place', l: 'PLACE (oficial)', c: 'text-blue-600', icon: Radio },
              { v: 'accdb', l: 'Importación Access', c: 'text-amber-600' },
              { v: 'manual', l: 'Entrada manual', c: 'text-gray-600' },
            ].map(({ v, l, c, icon: I }) => (
              <label key={v} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input type="checkbox" checked={filtros.fuentes.includes(v)} onChange={() => toggleArr('fuentes', v)} className="accent-dom-500" />
                {I && <I className="h-3 w-3 text-blue-400" />}
                <span className={`text-[12px] ${c || 'text-gray-600'}`}>{l}</span>
                <span className="text-[9px] text-gray-300 ml-auto">
                  {v === 'place' ? stats.place : v === 'accdb' ? stats.accdb : stats.manual}
                </span>
              </label>
            ))}
          </Sec>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════
          Panel de resultados — derecha
      ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/60 overflow-hidden">

        {/* Toolbar */}
        <div
          className="flex-shrink-0 bg-white px-5 py-3 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          {/* Toggle filtros */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={`p-1.5 rounded-lg transition-colors ${panelOpen ? 'bg-dom-50 text-dom-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title={panelOpen ? 'Cerrar filtros' : 'Abrir filtros'}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* Marketing Agent: "Portafolio de Oportunidades Estratégicas" */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-none">
              Portafolio de Oportunidades
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {filtradas.length} de {estudios.length} oportunidades
              {stats.importeTotal > 0 && ` · Cartera activa: ${FMT(stats.importeTotal)}`}
            </p>
          </div>

          {/* Badges rápidos */}
          <div className="hidden md:flex items-center gap-2">
            {stats.activas > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{stats.activas} activas</span>
            )}
            {stats.pendientes > 0 && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{stats.pendientes} próximas</span>
            )}
          </div>

          {/* Orden */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-[12px] text-gray-600 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-dom-400 bg-white hidden sm:block"
          >
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            {/* Agente Programador 1: Analizar pliego IA */}
            <button
              onClick={() => setModalPliego(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-dom-600 px-3 py-1.5 rounded-xl transition-all duration-150 hover:scale-[1.02]"
              style={{ background: 'rgba(51,113,255,0.08)', border: '1px solid rgba(51,113,255,0.15)' }}
              title="Analizar pliego con IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analizar Pliego</span>
            </button>

            <input ref={fileRef} type="file" accept=".accdb,.mdb" className="hidden" onChange={handleImportarAccess} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[11px] text-gray-600 font-medium hidden sm:flex"
            >
              <Upload className="h-3.5 w-3.5" />Access
            </button>

            <Boton
              variante="secundario"
              tamano="sm"
              icono={Radio}
              onClick={() => setModalSync(true)}
            >
              <span className="hidden sm:inline">Sincronizar</span>
            </Boton>

            <Boton
              tamano="sm"
              icono={Plus}
              onClick={() => { setDatosPrerellenados({}); setModalNueva(true) }}
            >
              <span className="hidden sm:inline">Nueva</span>
            </Boton>
          </div>
        </div>

        {/* Tabs — Marketing Agent: lenguaje premium */}
        <div
          className="flex-shrink-0 bg-white px-5 flex items-center gap-1 overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.key
                  ? 'border-dom-500 text-dom-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab.dot && <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista de oportunidades */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtradas.length === 0 ? (
            <EmptyState estudios={estudios} onSeed={handleSeedData} onImport={handleImportarAccess} />
          ) : (
            <div className="space-y-3 max-w-4xl">
              {filtradas.map(obra => (
                <Card
                  key={obra.id}
                  obra={obra}
                  starred={starred.has(obra.id)}
                  onVer={id => navigate(`/estudios/${id}`)}
                  onStar={handleStar}
                  onNota={handleNota}
                  onTablero={handleTablero}
                  onParticipar={handleParticipar}
                  onAnalizarPliego={handleAnalizarPliego}
                />
              ))}
              <p className="text-center text-[11px] text-gray-400 py-4">
                {filtradas.length} oportunidades · {FMT(stats.importeTotal)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modales ─────────────────────────────────────────────────────── */}
      {modalNota && (
        <ModalNota obra={modalNota} onClose={() => setModalNota(null)} onSave={handleGuardarNota} />
      )}
      {modalNueva && (
        <ModalNueva
          onClose={() => setModalNueva(false)}
          onCrear={handleCrear}
          datosPrerellenados={datosPrerellenados}
        />
      )}
      {modalSync && (
        <PanelSincronizacion
          onClose={() => setModalSync(false)}
          onCompletado={() => setModalSync(false)}
        />
      )}
      {/* Agente Programador 1: Modal de extracción IA */}
      {modalPliego && (
        <ModalExtraccionPliego
          onClose={() => setModalPliego(false)}
          onAplicar={handleDatosExtraidos}
        />
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ estudios, onSeed, onImport }) {
  const inputRef = useRef(null)
  if (estudios.length > 0) {
    return (
      <div className="text-center py-16">
        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Search className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-[14px] font-medium text-gray-500 mb-1">Sin resultados</p>
        <p className="text-[12px] text-gray-400">Ajusta los filtros para ampliar la búsqueda</p>
      </div>
    )
  }
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(51,113,255,0.12) 0%, rgba(14,165,233,0.12) 100%)' }}
      >
        <TrendingUp className="h-8 w-8 text-dom-500" />
      </div>
      <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight mb-2">
        Portafolio vacío
      </h3>
      <p className="text-[13px] text-gray-400 mb-7 leading-relaxed">
        Importa desde PLACE, carga un archivo Access o registra tu primera oportunidad estratégica.
      </p>
      <div className="flex flex-col gap-2.5 items-center">
        <Boton icono={Radio} onClick={onSeed} variante="primario">
          Cargar datos de demostración
        </Boton>
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
          <Upload className="h-4 w-4" />
          Importar archivo Access (.accdb)
          <input ref={inputRef} type="file" accept=".accdb,.mdb" className="hidden" onChange={onImport} />
        </label>
      </div>
    </div>
  )
}
