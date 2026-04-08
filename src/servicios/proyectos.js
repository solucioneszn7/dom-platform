// ===== Servicio de Proyectos =====
// CRUD para proyectos en Firestore

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { generarNumeroCaso } from '../utils/generadores'

const COLECCION = 'proyectos'

// Crear un nuevo proyecto
export async function crearProyecto(datos, gestorId) {
  // Obtener el siguiente número de caso
  const q = query(collection(db, COLECCION))
  const snapshot = await getDocs(q)

  let secuencia = 1
  if (!snapshot.empty) {
    // Encontrar el caso más reciente ordenando en JS
    const docs = snapshot.docs.map(d => d.data())
    docs.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toMillis?.() || 0
      const fechaB = b.fechaCreacion?.toMillis?.() || 0
      return fechaB - fechaA
    })
    if (docs[0]?.numeroCaso) {
      const ultimoNumero = parseInt(docs[0].numeroCaso.split('-')[2])
      secuencia = (isNaN(ultimoNumero) ? 0 : ultimoNumero) + 1
    }
  }

  const proyecto = {
    numeroCaso: generarNumeroCaso(secuencia),
    nombre: datos.nombre,
    direccion: datos.direccion,
    comuna: datos.comuna,
    propietario: {
      nombre: datos.propietarioNombre,
      rut: datos.propietarioRut,
      telefono: datos.propietarioTelefono,
      email: datos.propietarioEmail,
    },
    estado: 'activo',
    moneda: datos.moneda || 'CLP',
    gestorId,
    driveFolderId: datos.driveFolderId || null,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, COLECCION), proyecto)
  return { id: docRef.id, ...proyecto }
}

// Obtener un proyecto por ID
export async function obtenerProyecto(id) {
  const docRef = doc(db, COLECCION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Proyecto no encontrado')
  }

  return { id: docSnap.id, ...docSnap.data() }
}

// Obtener proyecto por número de caso (para consulta de clientes)
export async function obtenerProyectoPorCaso(numeroCaso) {
  const q = query(
    collection(db, COLECCION),
    where('numeroCaso', '==', numeroCaso.toUpperCase())
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

// Escuchar proyectos en tiempo real (para el dashboard)
export function escucharProyectos(gestorId, esAdmin, callback) {
  let q

  if (esAdmin) {
    q = query(collection(db, COLECCION))
  } else {
    q = query(
      collection(db, COLECCION),
      where('gestorId', '==', gestorId)
    )
  }

  return onSnapshot(q, (snapshot) => {
    const proyectos = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const fechaA = a.fechaCreacion?.toMillis?.() || 0
        const fechaB = b.fechaCreacion?.toMillis?.() || 0
        return fechaB - fechaA // desc
      })
    callback(proyectos)
  })
}

// Actualizar proyecto
export async function actualizarProyecto(id, datos) {
  const docRef = doc(db, COLECCION, id)
  await updateDoc(docRef, {
    ...datos,
    fechaActualizacion: serverTimestamp(),
  })
}

// Eliminar proyecto
export async function eliminarProyecto(id) {
  await deleteDoc(doc(db, COLECCION, id))
}
