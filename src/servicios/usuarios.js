// ===== Servicio de Usuarios =====
// Gestión de usuarios en Firestore

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLECCION = 'usuarios'

// Obtener un usuario por UID
export async function obtenerUsuario(uid) {
  const docRef = doc(db, COLECCION, uid)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() }
}

// Obtener todos los usuarios (solo admin)
export async function obtenerUsuarios() {
  const q = query(collection(db, COLECCION))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const fechaA = a.fechaCreacion?.toMillis?.() || 0
      const fechaB = b.fechaCreacion?.toMillis?.() || 0
      return fechaB - fechaA
    })
}

// Actualizar datos de un usuario
export async function actualizarUsuario(uid, datos) {
  const docRef = doc(db, COLECCION, uid)
  await updateDoc(docRef, {
    ...datos,
    fechaActualizacion: serverTimestamp(),
  })
}

// Cambiar rol de un usuario (solo admin)
export async function cambiarRolUsuario(uid, nuevoRol) {
  const docRef = doc(db, COLECCION, uid)
  await updateDoc(docRef, {
    rol: nuevoRol,
    fechaActualizacion: serverTimestamp(),
  })
}

// Eliminar usuario de Firestore
export async function eliminarUsuario(uid) {
  await deleteDoc(doc(db, COLECCION, uid))
}
