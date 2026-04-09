// ===== Funciones utilitarias =====

// Generar número de caso automático: DOM-2026-0001
export function generarNumeroCaso(secuencia) {
  const anio = new Date().getFullYear()
  const numero = String(secuencia).padStart(4, '0')
  return `DOM-${anio}-${numero}`
}

// Formatear fecha a formato chileno
export function formatearFecha(fecha) {
  if (!fecha) return '—'

  // Si es un Timestamp de Firestore
  const date = fecha.toDate ? fecha.toDate() : new Date(fecha)

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Formatear fecha con hora
export function formatearFechaHora(fecha) {
  if (!fecha) return '—'
  const date = fecha.toDate ? fecha.toDate() : new Date(fecha)

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Calcular porcentaje de documentos subidos
export function calcularProgreso(documentos) {
  if (!documentos || documentos.length === 0) return 0
  const subidos = documentos.filter((d) => d.subido).length
  return Math.round((subidos / documentos.length) * 100)
}

// Calcular días hábiles restantes
export function calcularDiasHabiles(fechaIngreso, plazo) {
  if (!fechaIngreso) return null
  const inicio = fechaIngreso.toDate ? fechaIngreso.toDate() : new Date(fechaIngreso)
  let diasContados = 0
  const hoy = new Date()
  const fecha = new Date(inicio)

  while (fecha <= hoy) {
    const diaSemana = fecha.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasContados++
    }
    fecha.setDate(fecha.getDate() + 1)
  }

  return plazo - diasContados
}

// Validar RUT chileno
export function validarRut(rut) {
  if (!rut || rut.length < 3) return false
  const limpio = rut.replace(/[.\-]/g, '').toUpperCase()
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }

  const resto = 11 - (suma % 11)
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)

  return dv === dvEsperado
}

// Formatear RUT: 12345678-9 → 12.345.678-9
export function formatearRut(rut) {
  if (!rut) return ''
  const limpio = rut.replace(/[.\-]/g, '')
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  const formateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formateado}-${dv}`
}
