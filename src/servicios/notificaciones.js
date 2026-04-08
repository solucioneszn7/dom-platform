// ===== Servicio de Notificaciones =====
// Preferencias de notificación y generación de resúmenes semanales

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Guardar preferencias de notificación del usuario
export async function guardarPreferenciasNotificacion(uid, prefs) {
  const docRef = doc(db, 'usuarios', uid)
  await updateDoc(docRef, {
    notificaciones: {
      emailSemanal: prefs.emailSemanal ?? true,
      diaEnvio: prefs.diaEnvio || 'lunes',
      horaEnvio: prefs.horaEnvio || '12:00',
      emailDestino: prefs.emailDestino || '',
      incluirFinanciero: prefs.incluirFinanciero ?? true,
      incluirTramitaciones: prefs.incluirTramitaciones ?? true,
      fechaActualizacion: new Date().toISOString(),
    },
    fechaActualizacion: serverTimestamp(),
  })
}

// Generar resumen semanal de proyectos (texto plano para email)
export function generarResumenSemanal(proyectos, nombreUsuario) {
  const fecha = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const activos = proyectos.filter(p => p.estado === 'activo')
  const completados = proyectos.filter(p => p.estado === 'completado')

  let resumen = `Resumen Semanal — DOM Platform\n`
  resumen += `${fecha}\n`
  resumen += `Hola ${nombreUsuario},\n\n`
  resumen += `=== ESTADO DE PROYECTOS ===\n`
  resumen += `Total: ${proyectos.length} | Activos: ${activos.length} | Completados: ${completados.length}\n\n`

  for (const p of activos) {
    const rf = p.resumenFinanciero
    resumen += `▸ ${p.numeroCaso} — ${p.nombre}\n`
    resumen += `  ${p.direccion}, ${p.comuna}\n`
    if (rf?.totalAcordado) {
      resumen += `  Presupuesto: $${rf.totalAcordado.toLocaleString('es-CL')} | Ejecutado: ${rf.porcentajeEjecucion || 0}%\n`
    }
    resumen += `\n`
  }

  resumen += `---\nEste resumen se envía todos los lunes a las 12:00 hrs.\n`
  resumen += `Puedes desactivar esta notificación en Configuración > Notificaciones.\n`

  return resumen
}

// Generar notificaciones pendientes (para el icono de la campana)
export function generarNotificacionesPendientes(proyectos, datosUsuario) {
  const notificaciones = []
  const ahora = new Date()

  for (const p of proyectos) {
    // Proyecto sin contrato asignado
    if (!p.resumenFinanciero?.totalAcordado && !p.contrato?.montoAcordado) {
      notificaciones.push({
        tipo: 'contrato',
        mensaje: `${p.numeroCaso} sin contrato asignado`,
        proyecto: p,
        prioridad: 'media',
      })
    }

    // Avance > 90%
    const porcEjec = p.resumenFinanciero?.porcentajeEjecucion || 0
    if (porcEjec >= 90 && porcEjec < 100) {
      notificaciones.push({
        tipo: 'avance',
        mensaje: `${p.numeroCaso} al ${porcEjec}% de ejecución`,
        proyecto: p,
        prioridad: 'alta',
      })
    }
  }

  // Notificación resumen semanal
  const prefsNotif = datosUsuario?.notificaciones
  if (prefsNotif?.emailSemanal) {
    notificaciones.push({
      tipo: 'info',
      mensaje: `Resumen semanal: lunes 12:00 a ${prefsNotif.emailDestino || datosUsuario.email}`,
      prioridad: 'baja',
    })
  }

  return notificaciones
}
