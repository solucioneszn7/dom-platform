// ===== Máquina de estados — Certificaciones A-LARIFE =====
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../servicios/firebase'

export const ESTADOS = ['borrador', 'pendiente_firma', 'aprobada', 'facturada']

export const ETIQUETAS = {
  borrador: 'Borrador',
  pendiente_firma: 'Pendiente de firma',
  aprobada: 'Aprobada',
  facturada: 'Facturada',
}

export const COLORES = {
  borrador: 'bg-gray-100 text-gray-600 border-gray-200',
  pendiente_firma: 'bg-amber-50 text-amber-700 border-amber-200',
  aprobada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  facturada: 'bg-blue-50 text-blue-700 border-blue-200',
}

export const ICONOS_COLOR = {
  borrador: '#888780',
  pendiente_firma: '#BA7517',
  aprobada: '#0F6E56',
  facturada: '#185FA5',
}

// Solo avanza al estado inmediatamente siguiente — nunca salta
export function puedeTransicionar(estadoActual, estadoObjetivo) {
  const actual = ESTADOS.indexOf(estadoActual)
  const objetivo = ESTADOS.indexOf(estadoObjetivo)
  if (actual === -1 || objetivo === -1) return false
  return objetivo === actual + 1
}

export function siguienteEstado(estadoActual) {
  const idx = ESTADOS.indexOf(estadoActual)
  return idx >= 0 && idx < ESTADOS.length - 1 ? ESTADOS[idx + 1] : null
}

export function esFinalizado(estadoActual) {
  return estadoActual === 'facturada'
}

export function etiquetaBoton(estadoActual) {
  const siguiente = siguienteEstado(estadoActual)
  if (!siguiente) return null
  return {
    pendiente_firma: 'Enviar a firma',
    aprobada: 'Aprobar certificación',
    facturada: 'Marcar como facturada',
  }[siguiente] || ETIQUETAS[siguiente]
}

// Transiciona en Firestore con validación y auditoría
export async function avanzarCertificacion(certId, estadoActual, uid) {
  const siguiente = siguienteEstado(estadoActual)
  if (!siguiente) throw new Error('Esta certificación ya está en el estado final.')
  if (!puedeTransicionar(estadoActual, siguiente)) throw new Error(`No se puede pasar de "${ETIQUETAS[estadoActual]}" a "${ETIQUETAS[siguiente]}".`)

  await updateDoc(doc(db, 'certificaciones', certId), {
    estado: siguiente,
    [`fecha_${siguiente}`]: new Date().toISOString(),
    historial: arrayUnion({
      de: estadoActual,
      a: siguiente,
      fecha: new Date().toISOString(),
      uid,
    }),
  })
  return siguiente
}
