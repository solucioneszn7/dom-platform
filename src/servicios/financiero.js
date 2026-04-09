// ===== Servicio Financiero v2 =====
// Multi-contrato por proyecto, anticipos, avances por fase

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ===== CONTRATOS (subcolección) =====

// Crear contrato nuevo para un proyecto
export async function crearContrato(proyectoId, datosContrato) {
  const refContratos = collection(db, 'proyectos', proyectoId, 'contratos')

  const contrato = {
    numeroContrato: datosContrato.numeroContrato || '',
    descripcion: datosContrato.descripcion || '',
    fase: datosContrato.fase || 'general',
    montoAcordado: datosContrato.montoAcordado || 0,
    anticipo: datosContrato.anticipo || 0,
    montoEjecutado: datosContrato.anticipo || 0, // el anticipo cuenta como ejecutado
    fechaContrato: datosContrato.fechaContrato || new Date().toISOString(),
    estado: datosContrato.estado || 'vigente', // vigente, completado, suspendido
    notas: datosContrato.notas || '',
    fechaCreacion: serverTimestamp(),
  }

  const docRef = await addDoc(refContratos, contrato)

  // Recalcular totales del proyecto
  await recalcularTotalesProyecto(proyectoId)

  return { id: docRef.id, ...contrato }
}

// Actualizar contrato existente
export async function actualizarContrato(proyectoId, contratoId, datos) {
  const docRef = doc(db, 'proyectos', proyectoId, 'contratos', contratoId)
  await updateDoc(docRef, {
    ...datos,
    fechaActualizacion: serverTimestamp(),
  })
  await recalcularTotalesProyecto(proyectoId)
}

// Eliminar contrato
export async function eliminarContrato(proyectoId, contratoId) {
  await deleteDoc(doc(db, 'proyectos', proyectoId, 'contratos', contratoId))
  await recalcularTotalesProyecto(proyectoId)
}

// Obtener contratos de un proyecto
export async function obtenerContratos(proyectoId) {
  const ref = collection(db, 'proyectos', proyectoId, 'contratos')
  const snapshot = await getDocs(query(ref))
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(a.fechaContrato).getTime() - new Date(b.fechaContrato).getTime())
}

// ===== ESTADOS DE PAGO / AVANCES =====

// Registrar EP o avance en un contrato
export async function registrarAvance(proyectoId, contratoId, datosAvance) {
  const refAvances = collection(db, 'proyectos', proyectoId, 'contratos', contratoId, 'avances')

  const avance = {
    monto: datosAvance.monto,
    tipo: datosAvance.tipo || 'ep', // ep, anticipo, retencion, finiquito
    descripcion: datosAvance.descripcion || '',
    numeroEP: datosAvance.numeroEP || null,
    porcentajeAvance: datosAvance.porcentajeAvance || null,
    fecha: datosAvance.fecha || new Date().toISOString(),
    fechaCreacion: serverTimestamp(),
  }

  const docRef = await addDoc(refAvances, avance)

  // Actualizar monto ejecutado del contrato
  const contratoRef = doc(db, 'proyectos', proyectoId, 'contratos', contratoId)
  const contratoSnap = await getDoc(contratoRef)

  if (contratoSnap.exists()) {
    const datos = contratoSnap.data()
    const ejecutadoActual = datos.montoEjecutado || 0
    await updateDoc(contratoRef, {
      montoEjecutado: ejecutadoActual + datosAvance.monto,
      fechaActualizacion: serverTimestamp(),
    })
  }

  // Recalcular totales del proyecto
  await recalcularTotalesProyecto(proyectoId)

  return { id: docRef.id, ...avance }
}

// Obtener avances de un contrato
export async function obtenerAvances(proyectoId, contratoId) {
  const ref = collection(db, 'proyectos', proyectoId, 'contratos', contratoId, 'avances')
  const snapshot = await getDocs(query(ref))
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
}

// ===== RECALCULAR TOTALES =====

// Recalcula el campo resumen financiero del proyecto
async function recalcularTotalesProyecto(proyectoId) {
  const contratos = await obtenerContratos(proyectoId)

  let totalAcordado = 0
  let totalEjecutado = 0
  let totalAnticipo = 0

  for (const c of contratos) {
    totalAcordado += c.montoAcordado || 0
    totalEjecutado += c.montoEjecutado || 0
    totalAnticipo += c.anticipo || 0
  }

  const porcentajeEjecucion = totalAcordado > 0
    ? Math.round((totalEjecutado / totalAcordado) * 100)
    : 0

  await updateDoc(doc(db, 'proyectos', proyectoId), {
    resumenFinanciero: {
      totalAcordado,
      totalEjecutado,
      totalAnticipo,
      totalPendiente: Math.max(0, totalAcordado - totalEjecutado),
      porcentajeEjecucion,
      cantidadContratos: contratos.length,
    },
    fechaActualizacion: serverTimestamp(),
  })
}

// ===== CÁLCULOS GLOBALES =====

export function calcularMetricasFinancieras(proyectos) {
  let presupuestoTotal = 0
  let montoEjecutado = 0
  let pendienteCobro = 0
  let totalAnticipo = 0

  for (const p of proyectos) {
    const rf = p.resumenFinanciero
    if (rf) {
      presupuestoTotal += rf.totalAcordado || 0
      montoEjecutado += rf.totalEjecutado || 0
      pendienteCobro += rf.totalPendiente || 0
      totalAnticipo += rf.totalAnticipo || 0
    } else if (p.contrato) {
      // Compatibilidad con modelo v1
      presupuestoTotal += p.contrato.montoAcordado || 0
      montoEjecutado += p.contrato.montoEjecutado || 0
      pendienteCobro += Math.max(0, (p.contrato.montoAcordado || 0) - (p.contrato.montoEjecutado || 0))
    }
  }

  return {
    presupuestoTotal,
    montoEjecutado,
    pendienteCobro,
    totalAnticipo,
    porcentajeEjecucion: presupuestoTotal > 0
      ? Math.round((montoEjecutado / presupuestoTotal) * 100) : 0,
  }
}

export function generarFlujoCajaMensual(proyectos) {
  const meses = []
  const ahora = new Date()
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    meses.push({
      mes: fecha.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }),
      mesKey: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
      ingresos: 0,
      egresos: 0,
    })
  }
  for (const p of proyectos) {
    const rf = p.resumenFinanciero || p.contrato
    if (!rf || !(rf.totalAcordado || rf.montoAcordado)) continue
    const fechaCreacion = p.fechaCreacion?.toDate ? p.fechaCreacion.toDate() : new Date(p.fechaCreacion || Date.now())
    const mesKey = `${fechaCreacion.getFullYear()}-${String(fechaCreacion.getMonth() + 1).padStart(2, '0')}`
    const mesEncontrado = meses.find((m) => m.mesKey === mesKey)
    if (mesEncontrado) {
      mesEncontrado.ingresos += rf.totalAcordado || rf.montoAcordado || 0
      mesEncontrado.egresos += rf.totalEjecutado || rf.montoEjecutado || 0
    }
  }
  return meses
}

export function formatearMontoCLP(monto) {
  if (monto === null || monto === undefined) return '$0'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(monto)
}

export function formatearMontoCorto(monto) {
  if (!monto) return '$0'
  if (monto >= 1_000_000_000) return `$${(monto / 1_000_000_000).toFixed(1)}B`
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto}`
}

// Obtener % de ejecución de un proyecto (compatibilidad v1 y v2)
export function obtenerPorcentajeEjecucion(proyecto) {
  const rf = proyecto.resumenFinanciero
  if (rf) return rf.porcentajeEjecucion || 0
  const c = proyecto.contrato
  if (c?.montoAcordado) return Math.min(100, Math.round(((c.montoEjecutado || 0) / c.montoAcordado) * 100))
  return 0
}

export function obtenerMontoAcordado(proyecto) {
  return proyecto.resumenFinanciero?.totalAcordado || proyecto.contrato?.montoAcordado || 0
}

export function obtenerMontoEjecutado(proyecto) {
  return proyecto.resumenFinanciero?.totalEjecutado || proyecto.contrato?.montoEjecutado || 0
}

// Fases disponibles para asignar contratos
export const FASES_CONTRATO = [
  { id: 'general', nombre: 'General' },
  { id: 'anteproyecto', nombre: 'Anteproyecto' },
  { id: 'permiso', nombre: 'Permiso de Edificación' },
  { id: 'construccion', nombre: 'Construcción' },
  { id: 'recepcion', nombre: 'Recepción' },
  { id: 'otros', nombre: 'Otros' },
]
