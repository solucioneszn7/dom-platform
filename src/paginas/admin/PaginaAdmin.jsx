// ===== Panel de Administración — A-LARIFE =====
import { useState, useEffect } from 'react'
import {
  Users, Plus, Shield, Mail, Trash2, Check, X,
  UserCheck, Crown, Eye, Briefcase,
} from 'lucide-react'
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, serverTimestamp, query, where,
} from 'firebase/firestore'
import { db } from '../../servicios/firebase'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'
import { useEntradaPagina } from '../../hooks/useAnimacion'

// ─── Modelo de roles ─────────────────────────────────────────────────────────
// usuarios/{uid}: { nombre, email, rolGlobal }
// proyectos/{id}: { participantes: { [uid]: 'gestor' | 'revisor' | 'cliente' } }
// invitaciones/{id}: { email, rolGlobal, estado: 'pendiente'|'aceptada', token, fechaExpira }

export const ROLES_GLOBALES = {
  admin: { label: 'Administrador', color: 'bg-purple-50 text-purple-700 border-purple-200', icono: Crown },
  gestor: { label: 'Gestor', color: 'bg-dom-50 text-dom-700 border-dom-200', icono: Briefcase },
  revisor: { label: 'Revisor', color: 'bg-blue-50 text-blue-700 border-blue-200', icono: Eye },
  cliente: { label: 'Cliente', color: 'bg-gray-100 text-gray-600 border-gray-200', icono: UserCheck },
}

export const ROLES_PROYECTO = ['gestor', 'revisor', 'cliente']

export default function PaginaAdmin() {
  const { usuario, esAdmin } = useAuth()
  const paginaRef = useEntradaPagina()
  const [usuarios, setUsuarios] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalInvitar, setModalInvitar] = useState(false)

  // Cargar usuarios e invitaciones
  useEffect(() => {
    if (!esAdmin) return
    async function cargar() {
      const [snapUs, snapInv] = await Promise.all([
        getDocs(collection(db, 'usuarios')),
        getDocs(query(collection(db, 'invitaciones'), where('estado', '==', 'pendiente'))),
      ])
      setUsuarios(snapUs.docs.map(d => ({ id: d.id, ...d.data() })))
      setInvitaciones(snapInv.docs.map(d => ({ id: d.id, ...d.data() })))
      setCargando(false)
    }
    cargar()
  }, [esAdmin])

  async function cambiarRol(uid, nuevoRol) {
    await updateDoc(doc(db, 'usuarios', uid), { rolGlobal: nuevoRol })
    setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, rolGlobal: nuevoRol } : u))
    toast.success('Rol actualizado')
  }

  async function eliminarUsuario(uid) {
    if (!window.confirm('¿Eliminar este usuario del sistema?')) return
    await deleteDoc(doc(db, 'usuarios', uid))
    setUsuarios(prev => prev.filter(u => u.id !== uid))
    toast.success('Usuario eliminado')
  }

  async function cancelarInvitacion(id) {
    await deleteDoc(doc(db, 'invitaciones', id))
    setInvitaciones(prev => prev.filter(i => i.id !== id))
    toast.success('Invitación cancelada')
  }

  if (!esAdmin) {
    return (
      <div className="py-20 text-center">
        <Shield className="h-10 w-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">Acceso restringido a administradores.</p>
      </div>
    )
  }

  if (cargando) return <Cargando texto="Cargando administración..." />

  return (
    <div ref={paginaRef} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Administración</h1>
          <p className="text-sm text-gray-400 mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => setModalInvitar(true)}
          className="flex items-center gap-2 px-4 py-2 bg-dom-600 text-white rounded-lg text-sm font-medium hover:bg-dom-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Invitar usuario
        </button>
      </div>

      {/* Tabla usuarios */}
      <Tarjeta>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <h2 className="text-[14px] font-semibold text-gray-800">Usuarios del sistema</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Rol global</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map(u => {
                const rol = ROLES_GLOBALES[u.rolGlobal] || ROLES_GLOBALES.gestor
                const IconoRol = rol.icono
                const esMismo = u.id === usuario.uid
                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-dom-400 to-dom-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-white">{u.nombre?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <span className="text-[13px] font-medium text-gray-800">{u.nombre || '—'}</span>
                        {esMismo && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Tú</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      {esMismo ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${rol.color}`}>
                          <IconoRol className="h-3 w-3" />{rol.label}
                        </span>
                      ) : (
                        <select
                          value={u.rolGlobal || 'gestor'}
                          onChange={e => cambiarRol(u.id, e.target.value)}
                          className="text-[12px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-dom-500 bg-white"
                        >
                          {Object.entries(ROLES_GLOBALES).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!esMismo && (
                        <button
                          onClick={() => eliminarUsuario(u.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      {/* Invitaciones pendientes */}
      {invitaciones.length > 0 && (
        <Tarjeta>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-500" />
            <h2 className="text-[14px] font-semibold text-gray-800">Invitaciones pendientes</h2>
            <span className="ml-auto text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{invitaciones.length}</span>
          </div>
          <TarjetaCuerpo className="space-y-2">
            {invitaciones.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                <div>
                  <p className="text-[13px] font-medium text-gray-800">{inv.email}</p>
                  <p className="text-[11px] text-gray-400">
                    Rol: {ROLES_GLOBALES[inv.rolGlobal]?.label || inv.rolGlobal} · Enviada el {inv.fechaEnvio ? new Date(inv.fechaEnvio).toLocaleDateString('es-ES') : '—'}
                  </p>
                </div>
                <button
                  onClick={() => cancelarInvitacion(inv.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Cancelar invitación"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* Modal invitar */}
      {modalInvitar && (
        <ModalInvitar
          onCerrar={() => setModalInvitar(false)}
          onInvitado={inv => {
            setInvitaciones(prev => [inv, ...prev])
            setModalInvitar(false)
          }}
        />
      )}
    </div>
  )
}

function ModalInvitar({ onCerrar, onInvitado }) {
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('gestor')
  const [enviando, setEnviando] = useState(false)

  async function handleEnviar() {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Email no válido')
      return
    }
    setEnviando(true)
    try {
      const token = Math.random().toString(36).substring(2, 15)
      const fechaExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const invData = {
        email: email.trim().toLowerCase(),
        rolGlobal: rol,
        estado: 'pendiente',
        token,
        fechaExpira,
        fechaEnvio: new Date().toISOString(),
        creadoEn: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'invitaciones'), invData)
      toast.success(`Invitación enviada a ${email}`)
      onInvitado({ id: docRef.id, ...invData })
    } catch {
      toast.error('Error al crear la invitación')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-gray-900">Invitar nuevo usuario</h3>
          <button onClick={onCerrar} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="nombre@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500/30"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Rol en el sistema</label>
            <select
              value={rol}
              onChange={e => setRol(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dom-500 focus:outline-none bg-white"
            >
              {Object.entries(ROLES_GLOBALES).filter(([k]) => k !== 'admin').map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-[12px] text-blue-700">
            El usuario recibirá un enlace de acceso. Expira en 7 días.
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onCerrar} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !email.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-dom-600 text-white hover:bg-dom-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {enviando ? 'Enviando...' : <><Mail className="h-3.5 w-3.5" /> Enviar invitación</>}
          </button>
        </div>
      </div>
    </div>
  )
}
