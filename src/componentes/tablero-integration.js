// ═══════════════════════════════════════════════════════════════════════════
// ACUA-CONECT — Tablero Integration Utilities
// Agente Programador 2 — Módulo de integración Estudios ↔ Tablero
//
// Exporta:
//   · LICITACION_STATUS_OPTIONS   → estados premium para licitaciones en tablero
//   · crearTareaTableroLocal      → bridge localStorage (Estudios → Tablero)
//   · leerYLimpiarTareasPendientes → lectura y limpieza del bridge
// ═══════════════════════════════════════════════════════════════════════════

// Clave compartida entre PaginaEstudios y PaginaTablero
export const PENDING_KEY = 'acuaconect_tablero_pendientes'

// ─────────────────────────────────────────────────────────────────────────
// Estados premium para el flujo de una licitación en el tablero
// Úsalos en AquaConectBoard como statusOptions para grupos de licitaciones
// ─────────────────────────────────────────────────────────────────────────
export const LICITACION_STATUS_OPTIONS = [
  { id: 'not_started',          label: 'Pendiente',             bg: '#f3f4f6', text: '#6b7280' },
  { id: 'en_estudio',           label: 'En estudio',            bg: '#3371ff', text: '#fff'    },
  { id: 'oferta_preparada',     label: 'Oferta lista',          bg: '#8b5cf6', text: '#fff'    },
  { id: 'presentada',           label: 'Presentada',            bg: '#f59e0b', text: '#fff'    },
  { id: 'pendiente_resolucion', label: 'Pend. resolución',      bg: '#06b6d4', text: '#fff'    },
  { id: 'adjudicada',           label: 'Adjudicada 🎯',         bg: '#10b981', text: '#fff'    },
  { id: 'desierta',             label: 'Desierta',               bg: '#6b7280', text: '#fff'    },
  { id: 'no_presentada',        label: 'No presentada',         bg: '#ef4444', text: '#fff'    },
]

// ─────────────────────────────────────────────────────────────────────────
// Helpers de formato (locales, sin dependencias externas)
// ─────────────────────────────────────────────────────────────────────────
const _fmt = n => {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K€`
  return `${n.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`
}

const _fmtDate = s => s
  ? new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  : null

// ─────────────────────────────────────────────────────────────────────────
// Crea una tarea de seguimiento y la escribe en localStorage
// PaginaTablero la leerá al montar e inyectará en el board
// ─────────────────────────────────────────────────────────────────────────
export function crearTareaTableroLocal(obra, datosUsuario) {
  const resumen = [
    obra.cliente     ? `Org: ${obra.cliente}`           : null,
    obra.licitacionIVA ? `PBL: ${_fmt(obra.licitacionIVA)}` : null,
    obra.fechaPresentacion ? `Plazo: ${_fmtDate(obra.fechaPresentacion)}` : null,
    obra.procedimiento || null,
  ].filter(Boolean).join(' · ')

  const tarea = {
    id: `lic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: obra.titulo || 'Licitación sin título',
    owner: datosUsuario?.nombre?.slice(0, 2).toUpperCase() || 'AC',
    status: 'not_started',
    dueDate: obra.fechaPresentacion || null,
    notes: resumen,
    _origen: 'licitacion',
    _licitacionId: obra.id,
    _timestamp: Date.now(),
  }

  const pendientes = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
  pendientes.push(tarea)
  localStorage.setItem(PENDING_KEY, JSON.stringify(pendientes))

  return tarea
}

// ─────────────────────────────────────────────────────────────────────────
// Lee las tareas pendientes del localStorage y las limpia
// Llamar en el useEffect de inicialización de PaginaTablero
// ─────────────────────────────────────────────────────────────────────────
export function leerYLimpiarTareasPendientes() {
  const pendientes = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
  if (pendientes.length > 0) {
    localStorage.removeItem(PENDING_KEY)
  }
  return pendientes
}

// ─────────────────────────────────────────────────────────────────────────
// Estructura inicial del grupo "Seguimiento de Oportunidades" para el board
// Úsalo como plantilla cuando el grupo aún no existe
// ─────────────────────────────────────────────────────────────────────────
export function crearGrupoSeguimiento(items = []) {
  return {
    id: 'seguimiento_licitaciones',
    name: 'Seguimiento de Oportunidades',
    color: '#3371ff',
    collapsed: false,
    items,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Inyecta tareas pendientes en el board state (inmutable)
// Devuelve el nuevo state del board con las tareas añadidas
// ─────────────────────────────────────────────────────────────────────────
export function inyectarTareasEnBoard(boardPrev, tareas) {
  if (!tareas?.length) return boardPrev

  const tareaItems = tareas.map(t => ({
    id: t.id,
    cells: {
      name:    t.name    || 'Licitación sin título',
      owner:   t.owner   || null,
      status:  t.status  || 'not_started',
      dueDate: t.dueDate || null,
      notes:   t.notes   || '',
    },
    _origen:      t._origen,
    _licitacionId: t._licitacionId,
  }))

  const base = boardPrev || {
    name: 'Tablero',
    columns: [
      { id: 'name',    label: 'Tarea',       type: 'text',   width: 240, fixed: true },
      { id: 'owner',   label: 'Responsable', type: 'owner',  width: 110 },
      { id: 'status',  label: 'Estado',      type: 'status', width: 140 },
      { id: 'dueDate', label: 'Vencimiento', type: 'date',   width: 130 },
      { id: 'notes',   label: 'Notas',       type: 'text',   width: 200 },
    ],
    groups: [],
  }

  const grupoExiste = base.groups.some(g => g.id === 'seguimiento_licitaciones')

  const grupos = grupoExiste
    ? base.groups.map(g =>
        g.id === 'seguimiento_licitaciones'
          ? { ...g, items: [...tareaItems, ...g.items] }
          : g
      )
    : [crearGrupoSeguimiento(tareaItems), ...base.groups]

  return { ...base, groups: grupos }
}
