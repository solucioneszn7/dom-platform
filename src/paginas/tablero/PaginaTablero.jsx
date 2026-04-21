import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../../servicios/firebase'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import AquaConectBoard from '../../componentes/AquaConectBoard'

export default function PaginaTablero() {
  const { usuario } = useAuth()
  const [searchParams] = useSearchParams()
  const proyectoId = searchParams.get('proyecto')
  const licitacionId = searchParams.get('licitacion')
  const [boardData, setBoardData] = useState(null)
  const [contexto, setContexto] = useState(null)

  const boardId = proyectoId 
    ? `proyecto_${proyectoId}` 
    : licitacionId 
      ? `licitacion_${licitacionId}` 
      : `general_${usuario?.uid || 'default'}`

  useEffect(() => {
    if (!usuario) return
    const ref = doc(db, 'tableros', boardId)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setBoardData(snap.data().board || null)
    })
    return () => unsub()
  }, [boardId, usuario])

  useEffect(() => {
    async function cargarContexto() {
      if (proyectoId) {
        const snap = await getDoc(doc(db, 'proyectos', proyectoId))
        if (snap.exists()) setContexto({ tipo: 'proyecto', ...snap.data() })
      } else if (licitacionId) {
        const snap = await getDoc(doc(db, 'estudios', licitacionId))
        if (snap.exists()) setContexto({ tipo: 'licitacion', ...snap.data() })
      }
    }
    cargarContexto()
  }, [proyectoId, licitacionId])

  async function guardarBoard(board) {
    await setDoc(doc(db, 'tableros', boardId), {
      board,
      boardId,
      proyectoId: proyectoId || null,
      licitacionId: licitacionId || null,
      usuarioId: usuario?.uid,
      actualizadoEn: new Date().toISOString(),
    }, { merge: true })
  }

  return (
    <div className="h-[calc(100vh-56px)] -mt-5 -mx-5 lg:-mx-8 overflow-hidden flex flex-col bg-gray-50">
      {contexto && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 shadow-sm">
          <div className={`h-2 w-2 rounded-full ${contexto.tipo === 'proyecto' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            {contexto.tipo === 'proyecto' ? 'Proyecto vinculado' : 'Licitación vinculada'}
          </span>
          <span className="text-[13px] font-semibold text-gray-800 truncate">
            {contexto.nombre || contexto.titulo || 'Sin título'}
          </span>
          {contexto.numeroCaso && (
            <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              {contexto.numeroCaso}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden p-4">
        <AquaConectBoard initialData={boardData} onSave={guardarBoard} />
      </div>
    </div>
  )
}
