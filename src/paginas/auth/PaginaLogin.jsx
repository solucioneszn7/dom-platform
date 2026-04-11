// ===== Login — Notion-style clean auth =====
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import Boton from '../../componentes/ui/Boton'
import CampoTexto from '../../componentes/ui/CampoTexto'
import toast from 'react-hot-toast'

function DomLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="12" fill="#1b51f5" />
      <path d="M11 14h8a8 8 0 010 16h-8V14z" fill="white" opacity="0.9" />
      <circle cx="30" cy="22" r="5" fill="white" opacity="0.7" />
    </svg>
  )
}

export default function PaginaLogin() {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [cargando, setCargando] = useState(false)
  const { iniciarSesion, iniciarConGoogle } = useAuth()
  const navegar = useNavigate()

  async function manejarSubmit(e) {
    e.preventDefault()
    setCargando(true)
    try {
      await iniciarSesion(email, contrasena)
      toast.success('¡Bienvenido de vuelta!')
      navegar('/dashboard')
    } catch (error) {
      if (error.code === 'auth/invalid-credential') toast.error('Credenciales incorrectas')
      else if (error.code === 'auth/too-many-requests') toast.error('Demasiados intentos')
      else toast.error('Error al iniciar sesión')
    } finally { setCargando(false) }
  }

  async function manejarGoogle() {
    try {
      await iniciarConGoogle()
      toast.success('¡Bienvenido!')
      navegar('/dashboard')
    } catch { toast.error('Error con Google') }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Geometric pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 800">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="1" height="40" fill="white" />
              <rect width="40" height="1" fill="white" />
            </pattern>
            <rect width="400" height="800" fill="url(#grid)" />
          </svg>
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-dom-600/20 blur-[80px]" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-dom-400/15 blur-[60px]" />
        </div>
        <div className="relative z-10 text-center px-12">
          <DomLogo />
          <h2 className="text-3xl font-bold text-white mt-6 tracking-tight">DOM Platform</h2>
          <p className="text-sidebar-text mt-3 text-sm leading-relaxed max-w-xs mx-auto">
            Gestión integral de tramitaciones municipales. Control financiero, seguimiento documental y más.
          </p>
          {/* Feature blocks */}
          <div className="mt-10 space-y-3 text-left max-w-[280px] mx-auto">
            {['Tablero Kanban de proyectos', 'Control financiero por contrato', 'Seguimiento de fases DOM'].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-dom-400" />
                <span className="text-[13px] text-gray-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <DomLogo />
            <h1 className="text-xl font-bold text-gray-900 mt-3">DOM Platform</h1>
          </div>

          <div className="lg:mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-4 mt-6">
            <CampoTexto etiqueta="Email" type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} icono={Mail} required />
            <CampoTexto etiqueta="Contraseña" type="password" placeholder="••••••••" value={contrasena}
              onChange={e => setContrasena(e.target.value)} icono={Lock} required />
            <Boton type="submit" cargando={cargando} className="w-full" variante="notion">
              Continuar con email
            </Boton>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-white text-[11px] text-gray-400 uppercase tracking-wider">o</span></div>
          </div>

          <Boton variante="secundario" className="w-full" onClick={manejarGoogle}>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </Boton>

          <p className="text-center text-[13px] text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-dom-600 font-medium hover:text-dom-700">Regístrate</Link>
          </p>
          <p className="text-center text-[13px] text-gray-400 mt-2">
            <Link to="/consulta" className="text-gray-500 hover:text-gray-700">Consulta tu caso (clientes)</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
