// ===== Monitoreo de Equipo y Proyectos =====
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// Escuchar usuarios activos (online)
export function escucharUsuariosActivos(callback) {
  const q = query(collection(db, 'usuarios'))
  return onSnapshot(q, snap => {
    const usuarios = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(usuarios)
  })
}

// Escuchar tableros para ver asignaciones
export function escucharTablerosActivos(callback) {
  const q = query(collection(db, 'tableros'))
  return onSnapshot(q, snap => {
    const tableros = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(tableros)
  })
}

// Obtener proyectos adjudicados
export async function obtenerProyectosAdjudicados() {
  const snap = await getDocs(query(collection(db, 'estudios')))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(e => e.empresaAdjudicataria && e.empresaAdjudicataria.trim() !== '')
}
