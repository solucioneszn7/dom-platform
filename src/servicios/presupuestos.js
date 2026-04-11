// ===== Servicio de Presupuestos — Drive ↔ Firebase ↔ Certificaciones =====
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  deleteDoc, query, orderBy, serverTimestamp, onSnapshot, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// ===================================================================
// DRIVE INTEGRATION
// ===================================================================

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

// Upload BC3 to Drive and get fileId
export async function subirBC3ADrive(driveToken, file, folderId = null) {
  const metadata = { name: file.name, mimeType: 'application/octet-stream' }
  if (folderId) metadata.parents = [folderId]

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const res = await fetch(`${DRIVE_UPLOAD}/files?uploadType=multipart`, {
    method: 'POST', headers: { Authorization: `Bearer ${driveToken}` }, body: form,
  })
  if (!res.ok) throw new Error(`Drive upload error: ${res.status}`)
  return res.json() // { id, name, modifiedTime, ... }
}

// Download BC3 from Drive by fileId
export async function descargarBC3DeDrive(driveToken, fileId) {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${driveToken}` },
  })
  if (!res.ok) throw new Error(`Drive download error: ${res.status}`)
  return res.text()
}

// Check if file was modified since last sync
export async function verificarCambiosDrive(driveToken, fileId) {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=modifiedTime,name`, {
    headers: { Authorization: `Bearer ${driveToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

// ===================================================================
// PRESUPUESTO (doc principal por proyecto)
// ===================================================================

export async function guardarPresupuesto(proyectoId, parseResult, archivoNombre, driveFileId = null) {
  const ref = doc(db, 'proyectos', proyectoId, 'presupuesto', 'datos')
  await setDoc(ref, {
    archivoNombre, driveFileId,
    version: parseResult.version, moneda: parseResult.moneda,
    coeficientes: parseResult.coeficientes, resumen: parseResult.resumen,
    arbol: JSON.stringify(parseResult.arbol),
    ultimaSincronizacion: serverTimestamp(), fechaCarga: serverTimestamp(),
  })

  // Mark project
  await updateDoc(doc(db, 'proyectos', proyectoId), {
    tienePresupuesto: true, presupuestoArchivo: archivoNombre,
    presupuestoMoneda: parseResult.moneda, presupuestoResumen: parseResult.resumen,
    driveFileId: driveFileId || null, fechaActualizacion: serverTimestamp(),
  })

  // Create/update partidas
  await sincronizarPartidas(proyectoId, parseResult.partidasFlat)
}

export async function obtenerPresupuesto(proyectoId) {
  const snap = await getDoc(doc(db, 'proyectos', proyectoId, 'presupuesto', 'datos'))
  if (!snap.exists()) return null
  const d = snap.data()
  return { ...d, arbol: JSON.parse(d.arbol || '[]') }
}

// ===================================================================
// PARTIDAS — Sync with merge logic (preserves measurements)
// ===================================================================

async function sincronizarPartidas(proyectoId, partidasNuevas) {
  const ref = collection(db, 'proyectos', proyectoId, 'partidas')
  const existentes = await getDocs(ref)
  const mapaExistentes = new Map()
  existentes.forEach(d => mapaExistentes.set(d.data().codigo, { id: d.id, ...d.data() }))

  const batch = writeBatch(db)

  for (const p of partidasNuevas) {
    const existe = mapaExistentes.get(p.codigo)
    if (existe) {
      // MERGE: Update prices/quantities but PRESERVE measurements and empresa
      const updates = {
        nombre: p.nombre, descripcion: p.descripcion, unidad: p.unidad,
        precioUnitario: p.precioUnitario, cantidadPresupuestada: p.cantidadPresupuestada,
        codigoPadre: p.codigoPadre, nivel: p.nivel, orden: p.orden, tipo: p.tipo,
        apu: p.apu, fechaActualizacion: serverTimestamp(),
      }
      // REGLA DE ORO: Si está bloqueado (certificación aprobada), marcar alerta
      if (existe.bloqueado && (existe.precioUnitario !== p.precioUnitario || existe.cantidadPresupuestada !== p.cantidadPresupuestada)) {
        updates._alertaCambio = true
        updates._cambioDetalle = `Precio: ${existe.precioUnitario}→${p.precioUnitario}, Cant: ${existe.cantidadPresupuestada}→${p.cantidadPresupuestada}`
      }
      batch.update(doc(ref, existe.id), updates)
      mapaExistentes.delete(p.codigo)
    } else {
      // New partida
      batch.set(doc(ref), { ...p, fechaCreacion: serverTimestamp() })
    }
  }

  // Partidas that no longer exist in BC3 — mark as removed (don't delete if they have data)
  for (const [, vieja] of mapaExistentes) {
    if (vieja.avanceAcumulado > 0 || vieja.bloqueado) {
      batch.update(doc(ref, vieja.id), { _eliminadaEnBC3: true })
    } else {
      batch.delete(doc(ref, vieja.id))
    }
  }

  await batch.commit()
}

export function escucharPartidas(proyectoId, callback) {
  const ref = collection(db, 'proyectos', proyectoId, 'partidas')
  return onSnapshot(query(ref, orderBy('orden')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function obtenerPartidas(proyectoId) {
  const ref = collection(db, 'proyectos', proyectoId, 'partidas')
  const snap = await getDocs(query(ref, orderBy('orden')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function actualizarPartida(proyectoId, partidaId, datos) {
  await updateDoc(doc(db, 'proyectos', proyectoId, 'partidas', partidaId), { ...datos, fechaActualizacion: serverTimestamp() })
}

// ===================================================================
// MEDICIONES — Actualizar avance con recalculo automático
// ===================================================================

export async function registrarMedicion(proyectoId, partidaId, avanceAcumulado, precioUnitario, cantidadPresupuestada) {
  const importeEjecutado = avanceAcumulado * precioUnitario
  const porcentaje = cantidadPresupuestada > 0 ? Math.min(100, Math.round((avanceAcumulado / cantidadPresupuestada) * 100)) : 0
  await actualizarPartida(proyectoId, partidaId, {
    avanceAcumulado, importeEjecutado, porcentaje,
    estado: avanceAcumulado >= cantidadPresupuestada ? 'completada' : avanceAcumulado > 0 ? 'en_ejecucion' : 'pendiente',
  })
}

// Batch save multiple measurements
export async function guardarMedicionesBatch(proyectoId, mediciones) {
  const batch = writeBatch(db)
  const ref = collection(db, 'proyectos', proyectoId, 'partidas')

  for (const { partidaId, avanceAcumulado, precioUnitario, cantidadPresupuestada } of mediciones) {
    const imp = avanceAcumulado * precioUnitario
    const pct = cantidadPresupuestada > 0 ? Math.min(100, Math.round((avanceAcumulado / cantidadPresupuestada) * 100)) : 0
    batch.update(doc(ref, partidaId), {
      avanceAcumulado, importeEjecutado: imp, porcentaje: pct,
      estado: avanceAcumulado >= cantidadPresupuestada ? 'completada' : avanceAcumulado > 0 ? 'en_ejecucion' : 'pendiente',
      fechaActualizacion: serverTimestamp(),
    })
  }
  await batch.commit()
}

// ===================================================================
// EMPRESAS / SUBCONTRATAS
// ===================================================================

export async function obtenerEmpresas(proyectoId) {
  const snap = await getDocs(collection(db, 'proyectos', proyectoId, 'empresas'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function crearEmpresa(proyectoId, datos) {
  const r = await addDoc(collection(db, 'proyectos', proyectoId, 'empresas'), { ...datos, fechaCreacion: serverTimestamp() })
  return { id: r.id, ...datos }
}

export async function eliminarEmpresa(proyectoId, empresaId) {
  await deleteDoc(doc(db, 'proyectos', proyectoId, 'empresas', empresaId))
}

export async function asignarEmpresa(proyectoId, partidaId, empresaId, empresaNombre) {
  await actualizarPartida(proyectoId, partidaId, { empresaId, empresaNombre })
}

// ===================================================================
// CERTIFICACIONES — Origen-Anterior-Actual + Bloqueo
// ===================================================================

export async function obtenerCertificaciones(proyectoId) {
  const snap = await getDocs(collection(db, 'proyectos', proyectoId, 'certificaciones'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.numero || 0) - (a.numero || 0))
}

export async function generarCertificacion(proyectoId) {
  const partidas = await obtenerPartidas(proyectoId)
  const certsExistentes = await obtenerCertificaciones(proyectoId)
  const now = new Date()

  // Calculate anterior (sum of all approved certs)
  const importeAnterior = certsExistentes
    .filter(c => c.estado === 'aprobada' || c.estado === 'facturada')
    .reduce((s, c) => s + (c.importeActual || 0), 0)

  // Calculate origen (current total executed)
  const importeOrigen = partidas
    .filter(p => p.tipo !== 'capitulo')
    .reduce((s, p) => s + (p.importeEjecutado || 0), 0)

  const importeActual = importeOrigen - importeAnterior

  // Group by chapter
  const capMap = new Map()
  for (const p of partidas) {
    if (p.tipo === 'capitulo') { capMap.set(p.codigo, { nombre: p.nombre, origen: 0, anterior: 0, actual: 0 }); continue }
    const cap = p.codigoPadre || '__sin_cap'
    if (!capMap.has(cap)) capMap.set(cap, { nombre: cap, origen: 0, anterior: 0, actual: 0 })
    const c = capMap.get(cap)
    c.origen += p.importeEjecutado || 0
  }

  // Snapshot of measurements (for audit trail)
  const lineas = partidas.filter(p => p.tipo !== 'capitulo' && (p.avanceAcumulado || 0) > 0).map(p => ({
    codigo: p.codigo, nombre: p.nombre, unidad: p.unidad,
    cantidadPresupuestada: p.cantidadPresupuestada,
    avanceAcumulado: p.avanceAcumulado, precioUnitario: p.precioUnitario,
    importeEjecutado: p.importeEjecutado, empresa: p.empresaNombre || '',
  }))

  const certData = {
    numero: certsExistentes.length + 1,
    mes: now.toLocaleString('es-ES', { month: 'long' }),
    anio: now.getFullYear(),
    estado: 'borrador',
    importeOrigen, importeAnterior,
    importeActual: importeActual > 0 ? importeActual : importeOrigen,
    capitulos: Array.from(capMap.values()).filter(c => c.origen > 0),
    lineas, // Snapshot for the PDF
    fechaCreacion: serverTimestamp(),
    fechaAprobacion: null,
  }

  const r = await addDoc(collection(db, 'proyectos', proyectoId, 'certificaciones'), certData)
  return { id: r.id, ...certData }
}

export async function cambiarEstadoCertificacion(proyectoId, certId, nuevoEstado) {
  const updates = { estado: nuevoEstado }
  if (nuevoEstado === 'aprobada') {
    updates.fechaAprobacion = new Date().toISOString()
    // BLOQUEAR partidas que tienen mediciones en esta certificación
    await bloquearPartidas(proyectoId, certId)
  }
  await updateDoc(doc(db, 'proyectos', proyectoId, 'certificaciones', certId), updates)
}

// Bloquear partidas con certificación aprobada
async function bloquearPartidas(proyectoId, certId) {
  const certSnap = await getDoc(doc(db, 'proyectos', proyectoId, 'certificaciones', certId))
  if (!certSnap.exists()) return
  const cert = certSnap.data()

  const batch = writeBatch(db)
  const ref = collection(db, 'proyectos', proyectoId, 'partidas')
  const partidas = await getDocs(ref)

  for (const d of partidas.docs) {
    const p = d.data()
    // If this partida has measurements in the cert snapshot, lock it
    const enCert = (cert.lineas || []).find(l => l.codigo === p.codigo)
    if (enCert) {
      batch.update(d.ref, {
        bloqueado: true,
        avanceAnterior: p.avanceAcumulado, // Freeze "anterior" at approval time
      })
    }
  }
  await batch.commit()
}

// Editar certificación
export async function actualizarCertificacion(proyectoId, certId, datos) {
  await updateDoc(doc(db, 'proyectos', proyectoId, 'certificaciones', certId), { ...datos, fechaActualizacion: serverTimestamp() })
}

// Eliminar certificación (solo borradores)
export async function eliminarCertificacion(proyectoId, certId) {
  await deleteDoc(doc(db, 'proyectos', proyectoId, 'certificaciones', certId))
}

// Editar empresa
export async function actualizarEmpresa(proyectoId, empresaId, datos) {
  await updateDoc(doc(db, 'proyectos', proyectoId, 'empresas', empresaId), { ...datos, fechaActualizacion: serverTimestamp() })
}

// ===================================================================
// VIABILIDAD — Datos editables vinculados al proyecto
// ===================================================================

export async function guardarViabilidad(proyectoId, datos) {
  const ref = doc(db, 'proyectos', proyectoId, 'presupuesto', 'viabilidad')
  await setDoc(ref, { ...datos, fechaActualizacion: serverTimestamp() }, { merge: true })
}

export async function obtenerViabilidad(proyectoId) {
  const snap = await getDoc(doc(db, 'proyectos', proyectoId, 'presupuesto', 'viabilidad'))
  return snap.exists() ? snap.data() : null
}

export function escucharViabilidad(proyectoId, callback) {
  return onSnapshot(doc(db, 'proyectos', proyectoId, 'presupuesto', 'viabilidad'), snap => {
    callback(snap.exists() ? snap.data() : null)
  })
}

// Guardar indirectos editables
export async function guardarIndirectos(proyectoId, indirectos) {
  await guardarViabilidad(proyectoId, { indirectos, indirectosActualizados: serverTimestamp() })
}

// Guardar coeficientes de paso editables
export async function guardarCoeficientes(proyectoId, coeficientes) {
  await guardarViabilidad(proyectoId, { coeficientes, coeficientesActualizados: serverTimestamp() })
}

// Guardar datos de cierre
export async function guardarDatosCierre(proyectoId, cierre) {
  await guardarViabilidad(proyectoId, { cierre, cierreActualizado: serverTimestamp() })
}
