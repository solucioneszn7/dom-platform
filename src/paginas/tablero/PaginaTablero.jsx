// PaginaTablero.jsx — Agente Programador 2: recibe tareas desde "Participar"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../../servicios/firebase'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import AquaConectBoard from '../../componentes/AquaConectBoard'
import {
  LICITACION_STATUS_OPTIONS,
  inyectarTareasEnBoard,
  leerYLimpiarTareasPendientes,
} from '../../componentes/tablero-integration'
import toast from 'react-hot-toast'

export default function PaginaTablero() {
  const { usuario } = useAuth()
  const [searchParams] = useSearchParams()
  const proyectoId   = searchParams.get('proyecto')
  const licitacionId = searchParams.get('licitacion')
  const [boardData, setBoardData] = useState(null)
  const [contexto, setContexto]   = useState(null)
  const [nuevasTareas, setNuevasTareas] = useState(0)

  const boardId = proyectoId
    ? `proyecto_${proyectoId}`
    : licitacionId
      ? `licitacion_${licitacionId}`
      : `general_${usuario?.uid || 'default'}`

  // Listener Firestore para el board
  useEffect(() => {
    if (!usuario) return
    const ref = doc(db, 'tableros', boardId)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setBoardData(snap.data().board || null)
    })
    return () => unsub()
  }, [boardId, usuario])

  // Cargar contexto (licitación o proyecto vinculado)
  useEffect(() => {
    async function cargarContexto() {
      if (proyectoId) {
        const snap = await getDoc(doc(db, 'proyectos', proyectoId))
        if (snap.exists()) setContexto({ tipo: 'proyecto', ...snap.data() })
      } else if (licitacionId) {
        // Intentar en 'estudios' primero, luego en 'licitaciones'
        let snap = await getDoc(doc(db, 'estudios', licitacionId))
        if (!snap.exists()) snap = await getDoc(doc(db, 'licitaciones', licitacionId))
        if (snap.exists()) setContexto({ tipo: 'licitacion', ...snap.data() })
      }
    }
    cargarContexto()
  }, [proyectoId, licitacionId])

  // ── Programador 2: detectar tareas pendientes desde botón "Participar" ──
  // Usa inyectarTareasEnBoard desde tablero-integration para mantener lógica centralizada
  useEffect(() => {
    const pendientes = leerYLimpiarTareasPendientes()
    if (pendientes.length === 0) return

    setBoardData(prev => inyectarTareasEnBoard(prev, pendientes))

    setNuevasTareas(pendientes.length)
    toast.success(
      `⚡ ${pendientes.length} oportunidad${pendientes.length > 1 ? 'es' : ''} añadida${pendientes.length > 1 ? 's' : ''} al tablero`
    )
  }, [])

  async function guardarBoard(board) {
    await setDoc(doc(db, 'tableros', boardId), {
      board, boardId,
      proyectoId:   proyectoId || null,
      licitacionId: licitacionId || null,
      usuarioId:    usuario?.uid,
      actualizadoEn: new Date().toISOString(),
    }, { merge: true })
  }

  return (
    <div className="h-[calc(100vh-56px)] -mt-5 -mx-5 lg:-mx-8 overflow-hidden flex flex-col bg-surface-secondary">

      {/* Banner de contexto (licitación o proyecto vinculado) */}
      {contexto && (
        <div className="flex-shrink-0 bg-white px-5 py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className={`h-2 w-2 rounded-full ${contexto.tipo === 'proyecto' ? 'bg-emerald-500' : 'bg-dom-500'}`} />
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            {contexto.tipo === 'proyecto' ? 'Proyecto vinculado' : 'Licitación vinculada'}
          </span>
          <span className="text-[13px] font-semibold text-gray-800 truncate">
            {contexto.nombre || contexto.titulo || 'Sin título'}
          </span>
          {contexto.licitacionIVA > 0 && (
            <span className="text-[11px] font-mono text-dom-600 bg-dom-50 px-2 py-0.5 rounded-lg border border-dom-100 ml-auto">
              {(contexto.licitacionIVA >= 1_000_000
                ? `${(contexto.licitacionIVA / 1_000_000).toFixed(1)}M€`
                : `${Math.round(contexto.licitacionIVA / 1_000)}K€`
              )} PBL
            </span>
          )}
          {nuevasTareas > 0 && (
            <span className="text-[10px] font-bold text-white bg-dom-500 px-2.5 py-1 rounded-full flex items-center gap-1">
              ⚡ {nuevasTareas} nueva{nuevasTareas > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Board — pasa licitacionStatusOptions para que AquaConectBoard pueda usarlos */}
      <div className="flex-1 overflow-hidden p-4">
        <AquaConectBoard
          initialData={boardData}
          onSave={guardarBoard}
          licitacionStatusOptions={LICITACION_STATUS_OPTIONS}
        />
      </div>
    </div>
  )
}
