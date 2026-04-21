/**
 * AquaConectBoard.jsx — Módulo de Gestión de Tableros
 * Sistema: aqua-conect  |  Stack: React + Vite + Tailwind CSS
 *
 * INSTALACIÓN:
 *   1. Copia este archivo en src/components/AquaConectBoard.jsx
 *   2. Añade en tu index.html (dentro de <head>):
 *      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
 *   3. Importa donde necesites:
 *      import AquaConectBoard from './components/AquaConectBoard'
 *
 * DEPENDENCIAS: Solo React + Tailwind (ya en tu proyecto)
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : null

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 'working',     label: 'En curso',   bg: '#F59E0B', text: '#fff' },
  { id: 'done',        label: 'Listo',      bg: '#10B981', text: '#fff' },
  { id: 'stuck',       label: 'Detenido',   bg: '#EF4444', text: '#fff' },
  { id: 'not_started', label: 'Sin iniciar',bg: '#CBD5E1', text: '#64748B' },
]

const PRIORITY_OPTIONS = [
  { id: 'low',      label: 'Baja',    bg: '#3B82F6', text: '#fff' },
  { id: 'medium',   label: 'Media',   bg: '#8B5CF6', text: '#fff' },
  { id: 'high',     label: 'Alta',    bg: '#EF4444', text: '#fff' },
  { id: 'critical', label: 'Crítica', bg: '#ffffff', text: '#fff' },
]

const COLUMN_TYPE_OPTIONS = [
  { type: 'text',     label: 'Texto',        icon: 'T'  },
  { type: 'status',   label: 'Estado',       icon: '◉'  },
  { type: 'date',     label: 'Fecha',        icon: '⊡'  },
  { type: 'owner',    label: 'Responsable',  icon: '◎'  },
  { type: 'number',   label: 'Número',       icon: '#'  },
  { type: 'priority', label: 'Prioridad',    icon: '▲'  },
  { type: 'timeline', label: 'Cronograma',   icon: '↔'  },
]

const GROUP_COLORS = ['#0EA5E9','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#84CC16']

// ─── ESTADO INICIAL ──────────────────────────────────────────────────────────
const INITIAL_BOARD = {
  name: 'aqua-conect',
  columns: [
    { id: 'name',    label: 'Tarea',        type: 'text',   width: 240, fixed: true },
    { id: 'owner',   label: 'Responsable',  type: 'owner',  width: 110 },
    { id: 'status',  label: 'Estado',       type: 'status', width: 140 },
    { id: 'dueDate', label: 'Vencimiento',  type: 'date',   width: 130 },
    { id: 'notes',   label: 'Notas',        type: 'text',   width: 160 },
  ],
  groups: [
    {
      id: 'g1', name: 'Pendientes', color: '#0EA5E9', collapsed: false,
      items: [
        { id: 'i1', cells: { name: 'Tarea 1', owner: 'ZS', status: 'working',     dueDate: '2026-04-20', notes: 'Elementos de acción' } },
        { id: 'i2', cells: { name: 'Tarea 2', owner: null, status: 'done',        dueDate: '2026-04-21', notes: 'Notas de reunión'    } },
        { id: 'i3', cells: { name: 'Tarea 3', owner: null, status: 'stuck',       dueDate: '2026-04-22', notes: 'Otro'                } },
      ],
    },
    {
      id: 'g2', name: 'Completado', color: '#10B981', collapsed: false,
      items: [],
    },
  ],
}

// ─── POPOVER (portal sobre la tabla) ─────────────────────────────────────────
function Popover({ anchorRef, children, onClose }) {
  const ref = useRef(null)
  const [style, setStyle] = useState({ top: 0, left: 0, opacity: 0 })

  useEffect(() => {
    if (!anchorRef?.current) return
    const r = anchorRef.current.getBoundingClientRect()
    setStyle({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, opacity: 1 })
  }, [anchorRef])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  return (
    <div ref={ref} style={{ position: 'fixed', ...style, zIndex: 9999, minWidth: 160, pointerEvents: style.opacity ? 'auto' : 'none' }}
      className="bg-white rounded-xl shadow-2xl border border-gray-100 py-1 overflow-hidden">
      {children}
    </div>
  )
}

// ─── CELL: TEXTO ─────────────────────────────────────────────────────────────
function TextCell({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => setVal(value ?? ''), [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => { setEditing(false); if (val !== value) onChange(val) }

  if (editing)
    return (
      <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) } }}
        className="w-full h-full px-2 text-sm outline-none bg-transparent border-none" />
    )

  return (
    <div onClick={() => setEditing(true)}
      className="w-full h-full flex items-center px-2 text-sm text-gray-700 cursor-text truncate hover:bg-sky-50/60 transition-colors rounded-sm">
      {val || <span className="text-gray-300 select-none">—</span>}
    </div>
  )
}

// ─── CELL: ESTADO ────────────────────────────────────────────────────────────
function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const current = STATUS_OPTIONS.find(s => s.id === value)

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        style={{ backgroundColor: current?.bg ?? '#CBD5E1', color: current?.text ?? '#64748B' }}
        className="w-full h-full flex items-center justify-center text-xs font-semibold transition-opacity hover:opacity-80">
        {current?.label ?? 'Sin iniciar'}
      </button>
      {open && (
        <Popover anchorRef={btnRef} onClose={() => setOpen(false)}>
          {STATUS_OPTIONS.map(s => (
            <button key={s.id} onClick={() => { onChange(s.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left transition-colors">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.bg }} />
              <span className="text-gray-700">{s.label}</span>
              {s.id === value && <span className="ml-auto text-sky-500 text-xs">✓</span>}
            </button>
          ))}
        </Popover>
      )}
    </>
  )
}

// ─── CELL: PRIORIDAD ─────────────────────────────────────────────────────────
function PriorityCell({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const current = PRIORITY_OPTIONS.find(p => p.id === value)

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        style={{ backgroundColor: current?.bg ?? '#CBD5E1', color: current?.text ?? '#64748B' }}
        className="w-full h-full flex items-center justify-center text-xs font-semibold transition-opacity hover:opacity-80">
        {current?.label ?? '—'}
      </button>
      {open && (
        <Popover anchorRef={btnRef} onClose={() => setOpen(false)}>
          {PRIORITY_OPTIONS.map(p => (
            <button key={p.id} onClick={() => { onChange(p.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left transition-colors">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.bg }} />
              <span className="text-gray-700">{p.label}</span>
              {p.id === value && <span className="ml-auto text-sky-500 text-xs">✓</span>}
            </button>
          ))}
        </Popover>
      )}
    </>
  )
}

// ─── CELL: FECHA ─────────────────────────────────────────────────────────────
function DateCell({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const isOverdue = value && new Date(value) < new Date()

  if (editing)
    return (
      <input ref={inputRef} type="date" value={value ?? ''}
        onChange={e => { onChange(e.target.value); setEditing(false) }}
        onBlur={() => setEditing(false)}
        className="w-full h-full px-2 text-xs outline-none bg-white" />
    )

  return (
    <div onClick={() => setEditing(true)}
      className="w-full h-full flex items-center justify-center gap-1.5 text-xs cursor-pointer hover:bg-sky-50/60 transition-colors">
      {value ? (
        <>
          {isOverdue && <span className="text-red-400" style={{ fontSize: 11 }}>!</span>}
          <span className={isOverdue ? 'text-red-500' : 'text-gray-600'}>{fmtDate(value)}</span>
        </>
      ) : <span className="text-gray-300 select-none">Agregar fecha</span>}
    </div>
  )
}

// ─── CELL: RESPONSABLE ───────────────────────────────────────────────────────
function OwnerCell({ value, onChange }) {
  const palette = ['#0EA5E9','#10B981','#8B5CF6','#F59E0B','#EF4444']
  const bg = value ? palette[value.charCodeAt(0) % palette.length] : null

  if (!value)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div onClick={() => { const n = window.prompt('Iniciales (ej: ZS):'); if (n) onChange(n.slice(0,2).toUpperCase()) }}
          className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:border-sky-400 hover:text-sky-400 transition-colors text-xs">
          +
        </div>
      </div>
    )

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ backgroundColor: bg }}
        onClick={() => { if (window.confirm(`¿Quitar a ${value}?`)) onChange(null) }}
        title={value}
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 cursor-pointer hover:opacity-75 transition-opacity select-none">
        {value}
      </div>
    </div>
  )
}

// ─── CELL: NÚMERO ────────────────────────────────────────────────────────────
function NumberCell({ value, onChange, prefix = '$' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputRef = useRef(null)
  useEffect(() => setVal(value ?? ''), [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  const commit = () => { setEditing(false); onChange(val) }

  if (editing)
    return (
      <input ref={inputRef} type="number" value={val} onChange={e => setVal(e.target.value)}
        onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()}
        className="w-full h-full px-2 text-sm text-right outline-none bg-transparent" />
    )

  return (
    <div onClick={() => setEditing(true)}
      className="w-full h-full flex items-center justify-end px-2 text-sm text-gray-700 cursor-text hover:bg-sky-50/60 transition-colors">
      {value != null && value !== '' ? `${prefix}${Number(value).toLocaleString()}` : <span className="text-gray-300">—</span>}
    </div>
  )
}

// ─── CELL: CRONOGRAMA ────────────────────────────────────────────────────────
function TimelineCell({ value }) {
  if (!value) return <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs select-none">—</div>
  return (
    <div className="w-full h-full flex items-center justify-center px-1">
      <span className="px-2 py-0.5 rounded text-xs font-medium text-gray-900 bg-slate-700 truncate">{value}</span>
    </div>
  )
}

// ─── ROUTER DE CELDAS ────────────────────────────────────────────────────────
function Cell({ col, value, item, onCellChange }) {
  const onChange = useCallback((v) => onCellChange(item.id, col.id, v), [item.id, col.id, onCellChange])

  switch (col.type) {
    case 'status':   return <StatusCell   value={value} onChange={onChange} />
    case 'priority': return <PriorityCell value={value} onChange={onChange} />
    case 'date':     return <DateCell     value={value} onChange={onChange} />
    case 'owner':    return <OwnerCell    value={value} onChange={onChange} />
    case 'number':   return <NumberCell   value={value} onChange={onChange} />
    case 'timeline': return <TimelineCell value={value} />
    default:         return <TextCell     value={value} onChange={onChange} />
  }
}

// ─── FOOTER DEL GRUPO ────────────────────────────────────────────────────────
function GroupFooter({ group, columns }) {
  const counts = Object.fromEntries(STATUS_OPTIONS.map(s => [s.id, 0]))
  group.items.forEach(i => { if (i.cells.status) counts[i.cells.status] = (counts[i.cells.status] || 0) + 1 })
  const total = group.items.length
  const budgetTotal = group.items.reduce((acc, i) => acc + (parseFloat(i.cells.budget) || 0), 0)

  return (
    <div className="flex border-t border-gray-100" style={{ height: 34 }}>
      {columns.map(col => (
        <div key={col.id} style={{ width: col.width ?? 120 }}
          className="flex-shrink-0 border-r border-gray-100 flex items-center justify-center px-2">
          {col.type === 'status' && total > 0 && (
            <div className="flex rounded-full overflow-hidden w-full h-2.5">
              {STATUS_OPTIONS.map(s => counts[s.id] > 0 && (
                <div key={s.id} title={`${s.label}: ${counts[s.id]}`}
                  style={{ backgroundColor: s.bg, flex: counts[s.id] }} />
              ))}
            </div>
          )}
          {col.type === 'number' && budgetTotal > 0 && (
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">${budgetTotal.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Total</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── FILA ITEM ───────────────────────────────────────────────────────────────
function RowItem({ item, columns, onCellChange, onDeleteItem, groupColor }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="flex border-b border-gray-100 hover:bg-sky-50/20 transition-colors"
      style={{ height: 40 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: groupColor }} />
      {columns.map((col, i) => (
        <div key={col.id} className="flex-shrink-0 border-r border-gray-100 relative overflow-visible"
          style={{ width: col.width ?? 120, height: '100%' }}>
          {i === 0 && hovered && (
            <button onClick={() => onDeleteItem(item.id)}
              title="Eliminar tarea"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 text-sm z-10 flex items-center justify-center transition-colors">
              ×
            </button>
          )}
          <Cell col={col} value={item.cells[col.id]} item={item} onCellChange={onCellChange} />
        </div>
      ))}
    </div>
  )
}

// ─── PANEL AGREGAR COLUMNA ───────────────────────────────────────────────────
function AddColumnPanel({ onAdd, onClose }) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState('text')

  return (
    <div className="absolute top-full right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-60 mt-1"
      onMouseDown={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-gray-600 mb-3">Agregar columna</p>
      <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
        placeholder="Nombre"
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm mb-3 outline-none focus:border-sky-400 transition-colors" />
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {COLUMN_TYPE_OPTIONS.map(ct => (
          <button key={ct.type} onClick={() => setType(ct.type)}
            className={`text-xs px-2 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5
              ${type === ct.type ? 'border-sky-400 bg-sky-50 text-sky-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <span className="opacity-70">{ct.icon}</span> {ct.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (label.trim()) { onAdd({ id: uid(), label: label.trim(), type, width: 130 }); onClose() } }}
          className="flex-1 bg-sky-500 text-gray-900 text-xs rounded-lg py-1.5 hover:bg-sky-600 transition-colors font-medium">
          Agregar
        </button>
        <button onClick={onClose}
          className="px-3 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── ENCABEZADO DE COLUMNA ───────────────────────────────────────────────────
function ColumnHeader({ col, onRemove }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="flex-shrink-0 border-r border-gray-200 flex items-center justify-between px-2 bg-gray-50 group"
      style={{ width: col.width ?? 120, height: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <span className="text-xs font-medium text-gray-500 truncate">{col.label}</span>
      {!col.fixed && hovered && (
        <button onClick={() => onRemove(col.id)}
          className="w-4 h-4 rounded hover:bg-red-100 hover:text-red-500 text-gray-300 flex items-center justify-center text-xs ml-1 flex-shrink-0 transition-colors">
          ×
        </button>
      )}
    </div>
  )
}

// ─── SECCIÓN DE GRUPO ────────────────────────────────────────────────────────
function GroupSection({ group, columns, onCellChange, onAddItem, onDeleteItem, onToggleCollapse, onRenameGroup, onRemoveGroup, onAddColumn, onRemoveColumn }) {
  const [renaming, setRenaming] = useState(false)
  const [groupName, setGroupName] = useState(group.name)
  const [showAddCol, setShowAddCol] = useState(false)

  return (
    <div className="mb-5">
      {/* Group Header */}
      <div className="flex items-center gap-2 px-1 py-1.5 group/header">
        <button onClick={() => onToggleCollapse(group.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors w-4 text-xs select-none">
          {group.collapsed ? '▶' : '▼'}
        </button>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
        {renaming ? (
          <input autoFocus value={groupName} onChange={e => setGroupName(e.target.value)}
            onBlur={() => { onRenameGroup(group.id, groupName); setRenaming(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRenameGroup(group.id, groupName); setRenaming(false) } if (e.key === 'Escape') { setGroupName(group.name); setRenaming(false) } }}
            style={{ color: group.color }}
            className="text-sm font-semibold outline-none border-b border-current bg-transparent" />
        ) : (
          <span className="text-sm font-semibold cursor-pointer select-none" style={{ color: group.color }}
            onDoubleClick={() => setRenaming(true)}>
            {group.name}
          </span>
        )}
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
          {group.items.length}
        </span>
        <button onClick={() => onRemoveGroup(group.id)}
          className="ml-1 text-gray-200 hover:text-red-400 text-xs opacity-0 group-hover/header:opacity-100 transition-all">
          ✕
        </button>
      </div>

      {/* Table */}
      {!group.collapsed && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Column Headers */}
          <div className="flex border-b border-gray-200" style={{ height: 34 }}>
            <div className="w-1 flex-shrink-0" style={{ backgroundColor: group.color + '40' }} />
            {columns.map(col => <ColumnHeader key={col.id} col={col} onRemove={onRemoveColumn} />)}
            <div className="relative flex-shrink-0">
              <button onClick={() => setShowAddCol(o => !o)}
                className="w-9 h-full flex items-center justify-center text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors text-lg select-none">
                +
              </button>
              {showAddCol && <AddColumnPanel onAdd={onAddColumn} onClose={() => setShowAddCol(false)} />}
            </div>
          </div>

          {/* Rows */}
          {group.items.map(item => (
            <RowItem key={item.id} item={item} columns={columns}
              onCellChange={onCellChange} onDeleteItem={onDeleteItem} groupColor={group.color} />
          ))}

          {/* Add Item */}
          <button onClick={() => onAddItem(group.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-gray-400 hover:text-sky-500 hover:bg-sky-50/50 transition-colors w-full text-left border-t border-gray-100">
            + Agregar tarea
          </button>

          {/* Footer */}
          <GroupFooter group={group} columns={columns} />
        </div>
      )}
    </div>
  )
}

// ─── VISTA KANBAN ─────────────────────────────────────────────────────────────
function KanbanView({ board, onCellChange }) {
  const allItems = board.groups.flatMap(g => g.items)

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 px-4 pt-2 min-h-[400px]">
      {STATUS_OPTIONS.map(col => {
        const items = allItems.filter(i => i.cells.status === col.id)
        return (
          <div key={col.id} className="flex-shrink-0 w-60">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: col.bg }} />
              <span className="text-sm font-semibold text-gray-700">{col.label}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-auto">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-800 mb-2.5">{item.cells.name || 'Sin título'}</p>
                  <div className="space-y-1.5">
                    {item.cells.owner && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="text-gray-400">◎</span> {item.cells.owner}
                      </div>
                    )}
                    {item.cells.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="text-gray-400">⊡</span> {fmtDate(item.cells.dueDate)}
                      </div>
                    )}
                    {item.cells.notes && (
                      <div className="text-xs text-gray-400 truncate">{item.cells.notes}</div>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center text-xs text-gray-400">
                  Sin tareas
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── VISTA CALENDARIO ─────────────────────────────────────────────────────────
function CalendarView({ board }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startOff = (firstDay.getDay() + 6) % 7
  const allItems = board.groups.flatMap(g => g.items)

  const DAYS   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const cells = [
    ...Array(startOff).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ]

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 text-sm transition-colors">‹</button>
        <h3 className="text-base font-semibold text-gray-700">{MONTHS[month]} {year}</h3>
        <button onClick={next} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 text-sm transition-colors">›</button>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7">
          {DAYS.map(d => (
            <div key={d} className="bg-gray-50 text-xs font-medium text-gray-500 text-center py-2 border-b border-gray-200">{d}</div>
          ))}
          {cells.map((day, i) => {
            const dateStr = day ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null
            const dayItems = day ? allItems.filter(it => it.cells.dueDate === dateStr) : []
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()

            return (
              <div key={i} className={`min-h-[72px] p-1.5 border-r border-b border-gray-100 ${!day ? 'bg-gray-50/50' : ''} ${i % 7 === 6 ? 'border-r-0' : ''}`}>
                {day && (
                  <>
                    <span className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full mb-1
                      ${isToday ? 'bg-sky-500 text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayItems.map(item => {
                        const st = STATUS_OPTIONS.find(s => s.id === item.cells.status)
                        return (
                          <div key={item.id} title={item.cells.name}
                            style={{ backgroundColor: st?.bg ?? '#CBD5E1' }}
                            className="text-[10px] px-1.5 py-0.5 rounded text-gray-900 truncate leading-tight">
                            {item.cells.name}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-gray-500">
        {STATUS_OPTIONS.map(s => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.bg }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── VISTA GANTT ─────────────────────────────────────────────────────────────
function GanttView({ board }) {
  const allItems = board.groups.flatMap(g => g.items).filter(i => i.cells.dueDate)
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
  const TOTAL_DAYS = 14
  const DAY_W = 52
  const LABEL_W = 160

  const dayHeaders = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="p-4 overflow-x-auto">
      <div style={{ minWidth: LABEL_W + DAY_W * TOTAL_DAYS }}>
        {/* Header Row */}
        <div className="flex border-b border-gray-200 mb-1">
          <div style={{ width: LABEL_W }} className="text-xs font-medium text-gray-500 px-3 py-2 flex-shrink-0">Tarea</div>
          {dayHeaders.map((d, i) => {
            const isToday = d.toDateString() === now.toDateString()
            return (
              <div key={i} style={{ width: DAY_W }}
                className={`text-xs text-center py-2 flex-shrink-0 ${isToday ? 'text-sky-600 font-semibold' : 'text-gray-500'}`}>
                {['D','L','M','X','J','V','S'][d.getDay()]} {d.getDate()}
              </div>
            )
          })}
        </div>

        {/* Rows */}
        {allItems.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-10">Agrega fechas de vencimiento a las tareas para verlas aquí</div>
        )}
        {allItems.map(item => {
          const dueD = new Date(item.cells.dueDate + 'T12:00:00')
          const diff = Math.round((dueD - base) / 86400000)
          const st = STATUS_OPTIONS.find(s => s.id === item.cells.status)
          const todayCol = Math.round((now - base) / 86400000)

          return (
            <div key={item.id} className="flex items-center border-b border-gray-100 hover:bg-sky-50/20 transition-colors"
              style={{ height: 40 }}>
              <div style={{ width: LABEL_W }} className="text-xs text-gray-700 px-3 truncate flex-shrink-0">
                {item.cells.name}
              </div>
              <div className="relative h-full flex items-center flex-shrink-0" style={{ width: DAY_W * TOTAL_DAYS }}>
                {/* Today line */}
                {todayCol >= 0 && todayCol < TOTAL_DAYS && (
                  <div className="absolute h-full w-px bg-sky-300/60" style={{ left: todayCol * DAY_W }} />
                )}
                {/* Task bar */}
                {diff >= 0 && diff < TOTAL_DAYS && (
                  <div className="absolute h-6 rounded-lg px-2 flex items-center text-xs text-gray-900 font-medium shadow-sm overflow-hidden"
                    style={{ left: Math.max(0, diff - 1) * DAY_W, width: DAY_W * 2, backgroundColor: st?.bg ?? '#94A3B8' }}>
                    {item.cells.name}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        {STATUS_OPTIONS.map(s => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: s.bg }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ board, collapsed, onToggle }) {
  if (collapsed)
    return (
      <div className="w-12 bg-slate-900 flex flex-col items-center py-4 gap-4 flex-shrink-0 transition-all">
        <button onClick={onToggle} className="text-slate-400 hover:text-gray-900 transition-colors text-lg">≡</button>
      </div>
    )

  return (
    <div className="w-52 bg-slate-900 flex flex-col flex-shrink-0 transition-all">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-gray-900 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)' }}>A</div>
          <span className="text-gray-900 text-sm font-semibold tracking-tight">aqua-conect</span>
        </div>
        <button onClick={onToggle} className="text-slate-500 hover:text-slate-300 transition-colors text-sm">‹</button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {[
          { label: 'Inicio',     icon: '⌂' },
          { label: 'Mi trabajo', icon: '✦', active: true },
          { label: 'Más',        icon: '⊞' },
        ].map(item => (
          <button key={item.label}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left
              ${item.active ? 'bg-sky-600/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <span className="text-xs">{item.icon}</span> {item.label}
          </button>
        ))}

        <div className="pt-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider px-2.5 mb-2 font-medium">Espacios de trabajo</p>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center text-gray-900 text-[10px] font-bold">E</div>
              <span className="text-slate-300 text-xs font-medium flex-1 truncate">Espacio de trabajo</span>
              <span className="text-slate-600 text-xs">›</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 pl-7">
              <div className="w-3 h-3 rounded-sm bg-sky-500 flex-shrink-0" />
              <span className="text-sky-400 text-xs truncate">{board.name}</span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AquaConectBoard() {
  const [board, setBoard]           = useState(INITIAL_BOARD)
  const [activeView, setActiveView] = useState('table')
  const [editingName, setEditingName] = useState(false)
  const [boardName, setBoardName]   = useState(INITIAL_BOARD.name)
  const [search, setSearch]         = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ── Mutations ─────────────────────────────────────────────────────────────
  const update = useCallback((fn) => setBoard(prev => fn(prev)), [])

  const onCellChange = useCallback((itemId, colId, value) => {
    update(b => ({
      ...b,
      groups: b.groups.map(g => ({
        ...g,
        items: g.items.map(item =>
          item.id === itemId ? { ...item, cells: { ...item.cells, [colId]: value } } : item
        ),
      })),
    }))
  }, [update])

  const onAddItem = useCallback((groupId) => {
    update(b => ({
      ...b,
      groups: b.groups.map(g =>
        g.id === groupId
          ? { ...g, items: [...g.items, { id: uid(), cells: { name: 'Nueva tarea', status: 'not_started' } }] }
          : g
      ),
    }))
  }, [update])

  const onDeleteItem = useCallback((itemId) => {
    update(b => ({ ...b, groups: b.groups.map(g => ({ ...g, items: g.items.filter(i => i.id !== itemId) })) }))
  }, [update])

  const onToggleCollapse = useCallback((groupId) => {
    update(b => ({ ...b, groups: b.groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g) }))
  }, [update])

  const onRenameGroup = useCallback((groupId, name) => {
    update(b => ({ ...b, groups: b.groups.map(g => g.id === groupId ? { ...g, name } : g) }))
  }, [update])

  const onRemoveGroup = useCallback((groupId) => {
    if (!window.confirm('¿Eliminar este grupo y todas sus tareas?')) return
    update(b => ({ ...b, groups: b.groups.filter(g => g.id !== groupId) }))
  }, [update])

  const onAddGroup = useCallback(() => {
    const name = window.prompt('Nombre del nuevo grupo:')
    if (!name?.trim()) return
    update(b => ({
      ...b,
      groups: [...b.groups, {
        id: uid(),
        name: name.trim(),
        color: GROUP_COLORS[b.groups.length % GROUP_COLORS.length],
        collapsed: false,
        items: [],
      }],
    }))
  }, [update])

  const onAddColumn = useCallback((col) => {
    update(b => ({ ...b, columns: [...b.columns, col] }))
  }, [update])

  const onRemoveColumn = useCallback((colId) => {
    update(b => ({ ...b, columns: b.columns.filter(c => c.id !== colId) }))
  }, [update])

  // ── Filtered board for search ──────────────────────────────────────────────
  const filteredBoard = useMemo(() => {
    if (!search.trim()) return board
    const q = search.toLowerCase()
    return {
      ...board,
      groups: board.groups.map(g => ({
        ...g,
        items: g.items.filter(i => i.cells.name?.toLowerCase().includes(q)),
      })),
    }
  }, [board, search])

  const VIEWS = [
    { id: 'table',    label: 'Tabla'       },
    { id: 'kanban',   label: 'Kanban'      },
    { id: 'calendar', label: 'Calendario'  },
    { id: 'gantt',    label: 'Gantt'       },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <Sidebar board={board} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            {/* Board name */}
            <div className="flex items-center gap-2">
              {editingName ? (
                <input autoFocus value={boardName} onChange={e => setBoardName(e.target.value)}
                  onBlur={() => { setEditingName(false); update(b => ({ ...b, name: boardName })) }}
                  onKeyDown={e => { if (e.key === 'Enter') { setEditingName(false); update(b => ({ ...b, name: boardName })) } }}
                  className="text-xl font-bold text-gray-800 outline-none border-b-2 border-sky-400 bg-transparent" />
              ) : (
                <h1 className="text-xl font-bold text-gray-800 cursor-pointer hover:text-sky-600 transition-colors select-none"
                  onClick={() => setEditingName(true)}>
                  {boardName}
                </h1>
              )}
              <span className="text-gray-400 text-sm">›</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {activeView === 'table' && (
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
                  <span className="text-gray-400 text-xs">🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea..."
                    className="bg-transparent text-xs outline-none text-gray-700 w-28" />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-xs">×</button>
                  )}
                </div>
              )}
              <button onClick={onAddGroup}
                className="flex items-center gap-1.5 text-xs bg-sky-500 text-gray-900 px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors font-medium shadow-sm shadow-sky-500/20">
                + Agregar grupo
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-0.5">
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)}
                className={`px-3 py-2 text-sm font-medium transition-all relative
                  ${activeView === v.id
                    ? 'text-sky-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500 after:rounded-t-full'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-auto">
          {activeView === 'table' && (
            <div className="p-4 min-w-max">
              {filteredBoard.groups.map(group => (
                <GroupSection key={group.id} group={group} columns={board.columns}
                  onCellChange={onCellChange} onAddItem={onAddItem} onDeleteItem={onDeleteItem}
                  onToggleCollapse={onToggleCollapse} onRenameGroup={onRenameGroup} onRemoveGroup={onRemoveGroup}
                  onAddColumn={onAddColumn} onRemoveColumn={onRemoveColumn} />
              ))}
              <button onClick={onAddGroup}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-sky-500 hover:bg-sky-50 px-3 py-2 rounded-lg transition-colors mt-1">
                + Agregar grupo nuevo
              </button>
            </div>
          )}

          {activeView === 'kanban' && (
            <KanbanView board={filteredBoard} onCellChange={onCellChange} />
          )}

          {activeView === 'calendar' && (
            <CalendarView board={filteredBoard} />
          )}

          {activeView === 'gantt' && (
            <GanttView board={filteredBoard} />
          )}
        </div>
      </div>
    </div>
  )
}
