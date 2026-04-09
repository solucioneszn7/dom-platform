// ===== Registro — Notion-style =====
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import Boton from '../../componentes/ui/Boton'
import CampoTexto from '../../componentes/ui/CampoTexto'
import toast from 'react-hot-toast'

export default function PaginaRegistro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [cargando, setCargando] = useState(false)
  const { registrarse } = useAuth()
  const navegar = useNavigate()

  async function manejarSubmit(e) {
    e.preventDefault()
    if (contrasena !== confirmar) { toast.error('Las contraseñas no coinciden'); return }
    if (contrasena.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setCargando(true)
    try {
      await registrarse(email, contrasena, nombre)
      toast.success('¡Cuenta creada!')
      navegar('/dashboard')
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') toast.error('Email ya registrado')
      else if (error.code === 'auth/weak-password') toast.error('Contraseña muy débil')
      else toast.error('Error al crear cuenta')
    } finally { setCargando(false) }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="mx-auto">
            <rect width="44" height="44" rx="12" fill="#1b51f5" />
            <path d="M11 14h8a8 8 0 010 16h-8V14z" fill="white" opacity="0.9" />
            <circle cx="30" cy="22" r="5" fill="white" opacity="0.7" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 tracking-tight">Crear Cuenta</h1>
          <p className="text-sm text-gray-400 mt-1">Regístrate para gestionar tus tramitaciones</p>
        </div>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <CampoTexto etiqueta="Nombre completo" type="text" placeholder="Juan Pérez" value={nombre}
            onChange={e => setNombre(e.target.value)} icono={User} required />
          <CampoTexto etiqueta="Email" type="email" placeholder="tu@email.com" value={email}
            onChange={e => setEmail(e.target.value)} icono={Mail} required />
          <CampoTexto etiqueta="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={contrasena}
            onChange={e => setContrasena(e.target.value)} icono={Lock} required />
          <CampoTexto etiqueta="Confirmar contraseña" type="password" placeholder="Repite tu contraseña" value={confirmar}
            onChange={e => setConfirmar(e.target.value)} icono={Lock} required />
          <Boton type="submit" cargando={cargando} className="w-full" variante="notion">
            Crear Cuenta
          </Boton>
        </form>

        <p className="text-center text-[13px] text-gray-400 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-dom-600 font-medium hover:text-dom-700">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
