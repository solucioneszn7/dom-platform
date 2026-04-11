// ===== Fases del Estudio de Proyecto — A-LARIFE =====
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../servicios/firebase'

export const FASES = ['revision', 'observaciones', 'preparacion', 'presentado', 'adjudicado']

export const ETIQUETAS_FASE = {
  revision: 'Revisión',
  observaciones: 'Observaciones',
  preparacion: 'Preparación',
  presentado: 'Presentado',
  adjudicado: 'Adjudicado',
}

export const COLORES_FASE = {
  revision: 'bg-gray-100 text-gray-600 border-gray-200',
  observaciones: 'bg-amber-50 text-amber-700 border-amber-200',
  preparacion: 'bg-blue-50 text-blue-700 border-blue-200',
  presentado: 'bg-purple-50 text-purple-700 border-purple-200',
  adjudicado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const DOT_FASE = {
  revision: '#888780',
  observaciones: '#BA7517',
  preparacion: '#185FA5',
  presentado: '#7F77DD',
  adjudicado: '#0F6E56',
}

export function siguienteFase(actual) {
  const idx = FASES.indexOf(actual)
  return idx >= 0 && idx < FASES.length - 1 ? FASES[idx + 1] : null
}

export function esFaseActiva(fase) {
  return fase !== 'adjudicado'
}

export function etiquetaBotonFase(actual) {
  const siguiente = siguienteFase(actual)
  if (!siguiente) return null
  return {
    observaciones: 'Pasar a Observaciones',
    preparacion: 'Iniciar Preparación',
    presentado: 'Marcar Presentado',
    adjudicado: '¡Adjudicar proyecto!',
  }[siguiente]
}

// Avanza fase en Firestore con auditoría
export async function avanzarFaseProyecto(proyectoId, faseActual, uid) {
  const siguiente = siguienteFase(faseActual)
  if (!siguiente) throw new Error('El proyecto ya está adjudicado.')

  await updateDoc(doc(db, 'proyectos', proyectoId), {
    fase: siguiente,
    fechaActualizacion: serverTimestamp(),
    historialFases: arrayUnion({
      de: faseActual,
      a: siguiente,
      fecha: new Date().toISOString(),
      uid,
    }),
  })
  return siguiente
}
