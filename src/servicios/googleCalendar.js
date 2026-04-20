// ===== Servicio Google Calendar — API REST directa =====
const BASE = 'https://www.googleapis.com/calendar/v3'

function hdrs(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function gcal(path, token, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...hdrs(token), ...opts.headers } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `GCal API error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function listarCalendarios(token) {
  const data = await gcal('/users/me/calendarList', token)
  return (data.items || []).map(c => ({ id: c.id, nombre: c.summary, color: c.backgroundColor, esPrimario: !!c.primary }))
}

export async function obtenerEventos(token, { calendarId = 'primary', timeMin, timeMax, maxResults = 250 } = {}) {
  const p = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', maxResults: String(maxResults) })
  if (timeMin) p.set('timeMin', new Date(timeMin).toISOString())
  if (timeMax) p.set('timeMax', new Date(timeMax).toISOString())
  const data = await gcal(`/calendars/${encodeURIComponent(calendarId)}/events?${p}`, token)
  return (data.items || []).map(normalizar)
}

export async function crearEvento(token, ev, calId = 'primary') {
  const data = await gcal(`/calendars/${encodeURIComponent(calId)}/events`, token, { method: 'POST', body: JSON.stringify(buildBody(ev)) })
  return normalizar(data)
}

export async function actualizarEvento(token, id, cambios, calId = 'primary') {
  const data = await gcal(`/calendars/${encodeURIComponent(calId)}/events/${id}`, token, { method: 'PATCH', body: JSON.stringify(buildBody(cambios)) })
  return normalizar(data)
}

export async function eliminarEvento(token, id, calId = 'primary') {
  await gcal(`/calendars/${encodeURIComponent(calId)}/events/${id}`, token, { method: 'DELETE' })
}

function normalizar(g) {
  const allDay = !!g.start?.date
  return {
    id: g.id, titulo: g.summary || '(Sin título)', descripcion: g.description || '',
    ubicacion: g.location || '', inicio: allDay ? g.start.date : g.start.dateTime,
    fin: allDay ? g.end.date : g.end.dateTime, todoElDia: allDay,
    color: g.colorId || null, enlace: g.htmlLink,
    asistentes: (g.attendees || []).map(a => ({ email: a.email, nombre: a.displayName, respuesta: a.responseStatus })),
  }
}

function buildBody(ev) {
  const b = {}
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (ev.titulo !== undefined) b.summary = ev.titulo
  if (ev.descripcion !== undefined) b.description = ev.descripcion
  if (ev.ubicacion !== undefined) b.location = ev.ubicacion
  if (ev.inicio) b.start = ev.todoElDia ? { date: ev.inicio.slice(0, 10) } : { dateTime: new Date(ev.inicio).toISOString(), timeZone: tz }
  if (ev.fin) b.end = ev.todoElDia ? { date: ev.fin.slice(0, 10) } : { dateTime: new Date(ev.fin).toISOString(), timeZone: tz }
  if (ev.color) b.colorId = ev.color
  return b
}

export const COLORES_GOOGLE = {
  '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73', '5': '#f6bf26',
  '6': '#f4511e', '7': '#039be5', '8': '#616161', '9': '#3f51b5', '10': '#0b8043', '11': '#d50000',
}
