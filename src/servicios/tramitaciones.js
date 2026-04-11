// ===== Servicio de Tramitaciones =====
// CRUD para tramitaciones (subcolección de proyectos)

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { TIPOS_TRAMITACION, FASES } from '../constantes/tramitaciones'

// Referencia a la subcolección de tramitaciones de un proyecto
function refTramitaciones(proyectoId) {
  return collection(db, 'proyectos', proyectoId, 'tramitaciones')
}

// Crear nueva tramitación
export async function crearTramitacion(proyectoId, tipoId) {
  const tipo = TIPOS_TRAMITACION[tipoId]

  if (!tipo) {
    throw new Error(`Tipo de tramitación no válido: ${tipoId}`)
  }

  // Preparar checklist de documentos con estado inicial
  const documentos = tipo.documentos.map((doc) => ({
    nombre: doc.nombre,
    requerido: doc.requerido,
    carpeta: doc.carpeta,
    subido: false,
    driveFileId: null,
    fechaSubida: null,
    nombreArchivo: null,
  }))

  const tramitacion = {
    tipo: tipo.id,
    tipoNombre: tipo.nombre,
    fase: FASES.PREPARACION.id,
    documentos,
    observaciones: [],
    fechaIngreso: null,
    fechaAprobacion: null,
    numeroPermiso: null,
    motivoRechazo: null,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  }

  const docRef = await addDoc(refTramitaciones(proyectoId), tramitacion)
  return { id: docRef.id, ...tramitacion }
}

// Obtener una tramitación específica
export async function obtenerTramitacion(proyectoId, tramitacionId) {
  const docRef = doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Tramitación no encontrada')
  }

  return { id: docSnap.id, ...docSnap.data() }
}

// Escuchar tramitaciones de un proyecto en tiempo real
export function escucharTramitaciones(proyectoId, callback) {
  const q = query(refTramitaciones(proyectoId))

  return onSnapshot(q, (snapshot) => {
    const tramitaciones = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const fechaA = a.fechaCreacion?.toMillis?.() || 0
        const fechaB = b.fechaCreacion?.toMillis?.() || 0
        return fechaA - fechaB // asc
      })
    callback(tramitaciones)
  })
}

// Obtener todas las tramitaciones de un proyecto (una sola vez)
export async function obtenerTramitaciones(proyectoId) {
  const q = query(refTramitaciones(proyectoId))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const fechaA = a.fechaCreacion?.toMillis?.() || 0
      const fechaB = b.fechaCreacion?.toMillis?.() || 0
      return fechaA - fechaB // asc
    })
}

// Cambiar la fase de una tramitación
export async function cambiarFase(proyectoId, tramitacionId, nuevaFase, datosExtra = {}) {
  const docRef = doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId)

  const actualizacion = {
    fase: nuevaFase,
    fechaActualizacion: serverTimestamp(),
    ...datosExtra,
  }

  // Si se ingresa a la DOM, registrar fecha
  if (nuevaFase === FASES.INGRESO_DOM.id) {
    actualizacion.fechaIngreso = serverTimestamp()
  }

  // Si se aprueba, registrar fecha
  if (nuevaFase === FASES.APROBADO.id) {
    actualizacion.fechaAprobacion = serverTimestamp()
  }

  await updateDoc(docRef, actualizacion)
}

// Marcar documento como subido
export async function marcarDocumentoSubido(proyectoId, tramitacionId, indiceDocumento, datosArchivo) {
  const docRef = doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Tramitación no encontrada')
  }

  const datos = docSnap.data()
  const documentos = [...datos.documentos]

  documentos[indiceDocumento] = {
    ...documentos[indiceDocumento],
    subido: true,
    driveFileId: datosArchivo.driveFileId || null,
    fechaSubida: new Date().toISOString(),
    nombreArchivo: datosArchivo.nombreArchivo || null,
  }

  await updateDoc(docRef, {
    documentos,
    fechaActualizacion: serverTimestamp(),
  })
}

// Agregar observación a una tramitación
export async function agregarObservacion(proyectoId, tramitacionId, texto, autor) {
  const docRef = doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Tramitación no encontrada')
  }

  const datos = docSnap.data()
  const observaciones = [
    ...datos.observaciones,
    {
      texto,
      autor,
      fecha: new Date().toISOString(),
    },
  ]

  await updateDoc(docRef, {
    observaciones,
    fechaActualizacion: serverTimestamp(),
  })
}

// Eliminar tramitación
export async function eliminarTramitacion(proyectoId, tramitacionId) {
  await deleteDoc(doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId))
}

// ===== Formularios OGUC =====

// Marcar formulario OGUC como completado
export async function marcarFormularioOguc(proyectoId, tramitacionId, formulario) {
  const docRef = doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Tramitación no encontrada')
  }

  const datos = docSnap.data()
  const formulariosOguc = datos.formularios_oguc || []

  // Evitar duplicados
  const yaExiste = formulariosOguc.some((f) => f.codigo === formulario.codigo)
  if (yaExiste) return

  const nuevosFormularios = [
    ...formulariosOguc,
    {
      codigo: formulario.codigo,
      nombre: formulario.nombre,
      completado: true,
      fechaCompletado: new Date().toISOString(),
    },
  ]

  await updateDoc(docRef, {
    formularios_oguc: nuevosFormularios,
    fechaActualizacion: serverTimestamp(),
  })

  return nuevosFormularios
}

// Desmarcar formulario OGUC (quitar de completados)
export async function desmarcarFormularioOguc(proyectoId, tramitacionId, codigoFormulario) {
  const docRef = doc(db, 'proyectos', proyectoId, 'tramitaciones', tramitacionId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Tramitación no encontrada')
  }

  const datos = docSnap.data()
  const formulariosOguc = datos.formularios_oguc || []

  const nuevosFormularios = formulariosOguc.filter((f) => f.codigo !== codigoFormulario)

  await updateDoc(docRef, {
    formularios_oguc: nuevosFormularios,
    fechaActualizacion: serverTimestamp(),
  })

  return nuevosFormularios
}
