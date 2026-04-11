// ===== Calendario — Google Calendar bidireccional (FIXED OAuth) =====
import { useState, useEffect, useRef } from 'react'
import {
  CalendarDays, Plus, X, MapPin, Trash2, Save, RefreshCw,
  ChevronLeft, ChevronRight, ExternalLink, Clock,
} from 'lucide-react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, proveedorGoogleCalendar } from '../../servicios/firebase'
import { obtenerEventos, crearEvento, actualizarEvento, eliminarEvento, listarCalendarios, COLORES_GOOGLE } from '../../servicios/googleCalendar'
import Tarjeta from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

const COLMAP = { '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73', '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161', '9': '#3f51b5', '10': '#0b8043', '11': '#d50000' }
const DEFCOL = '#3371ff'
const VISTAS = [{ id: 'month', nombre: 'Mes' }, { id: 'week', nombre: 'Semana' }, { id: 'day', nombre: 'Día' }]

export default function PaginaCalendario() {
  const [token, setToken] = useState(null)
  const [conectando, setConectando] = useState(false)
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [calendarios, setCalendarios] = useState([])
  const [calActivo, setCalActivo] = useState('primary')
  const [vista, setVista] = useState('month')
  const [fecha, setFecha] = useState(new Date())
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(eventoVacio())
  const [guardando, setGuardando] = useState(false)

  // ===== OAuth FIXED: usa GoogleAuthProvider.credentialFromResult =====
  async function conectarGoogle() {
    setConectando(true)
    try {
      const result = await signInWithPopup(auth, proveedorGoogleCalendar)
      // CORRECTO: extraer token del credential, NO de _tokenResponse
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const accessToken = credential?.accessToken
      if (!accessToken) throw new Error('No se obtuvo access token. Verifica los scopes en Google Cloud Console.')
      setToken(accessToken)
      toast.success('Google Calendar conectado')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('OAuth error:', err)
        toast.error(err.message || 'Error al conectar')
      }
    } finally { setConectando(false) }
  }

  useEffect(() => { if (token) listarCalendarios(token).then(setCalendarios).catch(console.error) }, [token])
  useEffect(() => { if (token) cargarEventos() }, [token, calActivo, fecha])

  async function cargarEventos() {
    setCargando(true)
    try {
      const s = new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1)
      const e = new Date(fecha.getFullYear(), fecha.getMonth() + 2, 0)
      const evts = await obtenerEventos(token, { calendarId: calActivo, timeMin: s, timeMax: e })
      setEventos(evts)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) { setToken(null); toast.error('Sesión expirada') }
    } finally { setCargando(false) }
  }

  async function guardarEvento() {
    if (!form.titulo.trim()) { toast.error('Agrega un título'); return }
    setGuardando(true)
    try {
      if (modal === 'crear') await crearEvento(token, { ...form, fin: form.fin || form.inicio }, calActivo)
      else await actualizarEvento(token, modal.id, form, calActivo)
      toast.success(modal === 'crear' ? 'Evento creado' : 'Evento actualizado')
      setModal(null); await cargarEventos()
    } catch (err) { toast.error(err.message) }
    finally { setGuardando(false) }
  }

  async function borrarEvento(id) {
    if (!confirm('¿Eliminar de Google Calendar?')) return
    try { await eliminarEvento(token, id, calActivo); toast.success('Eliminado'); setModal(null); await cargarEventos() }
    catch (err) { toast.error(err.message) }
  }

  function navegar(dir) {
    const d = new Date(fecha)
    if (vista === 'month') d.setMonth(d.getMonth() + dir)
    else if (vista === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setFecha(d)
  }

  // ===== Sin token: pantalla de conexión =====
  if (!token) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendario</h1>
        <Tarjeta>
          <div className="px-5 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-dom-50 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-dom-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Conectar Google Calendar</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
              Sincronización bidireccional: ve, crea, edita y elimina eventos desde DOM Platform.
            </p>
            <Boton icono={CalendarDays} cargando={conectando} onClick={conectarGoogle}>Conectar con Google</Boton>

            <div className="mt-8 text-left max-w-lg mx-auto bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">⚙️ Configuración en Google Cloud Console</h3>
              <ol className="space-y-1.5 text-[12px] text-gray-500 list-decimal list-inside">
                <li>Abre <strong>console.cloud.google.com</strong> → proyecto <code className="bg-gray-200 px-1 rounded">tramitacion-webdom</code></li>
                <li>En <strong>APIs & Services → Library</strong> → habilita <strong>Google Calendar API</strong></li>
                <li>En <strong>Credentials</strong> → tu OAuth 2.0 Client ID</li>
                <li>Agrega a Authorized JS origins: <code className="bg-gray-200 px-1 rounded">http://localhost:5173</code></li>
                <li>Agrega a Redirect URIs: <code className="bg-gray-200 px-1 rounded">https://tramitacion-webdom.firebaseapp.com/__/auth/handler</code></li>
                <li>En <strong>OAuth consent screen → Scopes</strong> agrega <code className="bg-gray-200 px-1 rounded">calendar.events</code></li>
              </ol>
            </div>
          </div>
        </Tarjeta>
      </div>
    )
  }

  // ===== Calendario conectado =====
  const mesLabel = fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendario</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-400">Google Calendar conectado</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="secundario" tamano="xs" icono={RefreshCw} onClick={cargarEventos}>Sync</Boton>
          <Boton tamano="sm" icono={Plus} onClick={() => { setForm(eventoVacio()); setModal('crear') }}>Nuevo</Boton>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setFecha(new Date())} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md">Hoy</button>
          <button onClick={() => navegar(1)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"><ChevronRight className="h-4 w-4" /></button>
          <h2 className="text-sm font-semibold text-gray-800 capitalize ml-2">{mesLabel}</h2>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)} className={`px-2.5 py-1 text-xs font-medium rounded ${vista === v.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>{v.nombre}</button>
          ))}
        </div>
      </div>

      {cargando && !eventos.length ? <Cargando texto="Cargando eventos..." /> : (
        <VistaMes eventos={eventos} fecha={fecha}
          onClickEvento={ev => { setForm({ titulo: ev.titulo, descripcion: ev.descripcion, ubicacion: ev.ubicacion, inicio: ev.inicio?.slice(0, 16) || '', fin: ev.fin?.slice(0, 16) || '', todoElDia: ev.todoElDia, color: ev.color || '' }); setModal(ev) }}
          onClickDia={d => { setForm(eventoVacio(d)); setModal('crear') }} />
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{modal === 'crear' ? 'Nuevo Evento' : 'Editar Evento'}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-md hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <input type="text" placeholder="Título" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} autoFocus
              className="w-full text-lg font-medium border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-dom-500 placeholder-gray-300" />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.todoElDia} onChange={e => setForm({ ...form, todoElDia: e.target.checked })} className="rounded border-gray-300 text-dom-600" />
              Todo el día
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-medium text-gray-400 uppercase mb-1">Inicio</label>
                <input type={form.todoElDia ? 'date' : 'datetime-local'} value={form.inicio} onChange={e => setForm({ ...form, inicio: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" /></div>
              <div><label className="block text-[11px] font-medium text-gray-400 uppercase mb-1">Fin</label>
                <input type={form.todoElDia ? 'date' : 'datetime-local'} value={form.fin} onChange={e => setForm({ ...form, fin: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" /></div>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input type="text" placeholder="Ubicación" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-1.5 text-sm placeholder-gray-400 focus:border-dom-500 focus:outline-none" />
            </div>
            <textarea placeholder="Notas..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2}
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-dom-500 focus:outline-none resize-none" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(COLORES_GOOGLE).map(([id, hex]) => (
                <button key={id} onClick={() => setForm({ ...form, color: id })}
                  className={`h-6 w-6 rounded-full ${form.color === id ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'} transition-transform`}
                  style={{ background: hex }} />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              {modal !== 'crear' && <Boton variante="fantasma" tamano="xs" icono={Trash2} onClick={() => borrarEvento(modal.id)} className="text-red-500 hover:bg-red-50">Eliminar</Boton>}
              {modal === 'crear' && <div />}
              <div className="flex gap-2">
                <Boton variante="secundario" tamano="sm" onClick={() => setModal(null)}>Cancelar</Boton>
                <Boton tamano="sm" icono={Save} cargando={guardando} onClick={guardarEvento}>{modal === 'crear' ? 'Crear' : 'Guardar'}</Boton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Vista Mes Grid =====
function VistaMes({ eventos, fecha, onClickEvento, onClickDia }) {
  const anio = fecha.getFullYear(), mes = fecha.getMonth()
  const primerDia = new Date(anio, mes, 1)
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const offset = (primerDia.getDay() + 6) % 7
  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  return (
    <Tarjeta>
      <div className="grid grid-cols-7">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">{d}</div>
        ))}
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`e${i}`} className="min-h-[88px] border-b border-r border-gray-50 bg-gray-50/30" />
          const fs = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
          const esHoy = fs === hoyStr
          const evs = eventos.filter(ev => ev.inicio?.startsWith(fs))
          return (
            <div key={dia} className="min-h-[88px] border-b border-r border-gray-50 p-1 cursor-pointer hover:bg-blue-50/30 transition-colors" onClick={() => onClickDia(fs)}>
              <span className={`inline-flex items-center justify-center h-6 w-6 text-xs font-medium rounded-full mb-0.5 ${esHoy ? 'bg-dom-600 text-white' : 'text-gray-700'}`}>{dia}</span>
              <div className="space-y-0.5">
                {evs.slice(0, 3).map(ev => (
                  <div key={ev.id} className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-pointer font-medium"
                    style={{ background: (COLMAP[ev.color] || DEFCOL) + '20', color: COLMAP[ev.color] || DEFCOL }}
                    onClick={e => { e.stopPropagation(); onClickEvento(ev) }}>{ev.titulo}</div>
                ))}
                {evs.length > 3 && <span className="text-[9px] text-gray-400 px-1">+{evs.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </Tarjeta>
  )
}

function eventoVacio(f = null) {
  const n = f ? new Date(f + 'T09:00') : new Date(); n.setMinutes(0); n.setSeconds(0)
  const e = new Date(n); e.setHours(e.getHours() + 1)
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { titulo: '', descripcion: '', ubicacion: '', inicio: fmt(n), fin: fmt(e), todoElDia: false, color: '' }
}
