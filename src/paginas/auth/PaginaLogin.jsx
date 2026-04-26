// ===== Login — Glass Aurora =====
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Sparkles } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import Boton from '../../componentes/ui/Boton'
import CampoTexto from '../../componentes/ui/CampoTexto'
import toast from 'react-hot-toast'

function DomLogo({ size = 44 }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center shadow-[0_12px_40px_rgba(124,77,255,.4)]"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 50%, #4dc7ff 100%)',
      }}
    >
      <Sparkles className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Aurora blobs decorativos */}
      <div className="bg-blob animate-float" style={{ top: '-10%', left: '-10%', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(124,77,255,.55), transparent 70%)' }} />
      <div className="bg-blob animate-float" style={{ top: '40%', right: '-8%', width: '460px', height: '460px', background: 'radial-gradient(circle, rgba(255,90,138,.4), transparent 70%)', animationDelay: '5s' }} />
      <div className="bg-blob animate-float" style={{ bottom: '-15%', left: '30%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(77,199,255,.35), transparent 70%)', animationDelay: '10s' }} />

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center relative overflow-hidden border-r border-white/[0.05]">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 400 800">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="1" height="40" fill="white" />
              <rect width="40" height="1" fill="white" />
            </pattern>
            <rect width="400" height="800" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 text-center px-12 max-w-md">
          <DomLogo size={56} />
          <h2 className="text-[28px] font-bold text-gradient mt-6 tracking-tight">DOM Platform</h2>
          <p className="text-white/55 mt-3 text-[14px] leading-relaxed max-w-xs mx-auto">
            Gestión integral de tramitaciones y licitaciones. Control financiero, seguimiento documental y mediciones a origen.
          </p>
          <div className="mt-10 space-y-2.5 text-left max-w-[300px] mx-auto">
            {[
              { txt: 'Tablero Kanban de proyectos', dot: 'bg-violet-400' },
              { txt: 'Control financiero por contrato', dot: 'bg-pink-400' },
              { txt: 'Seguimiento de fases DOM', dot: 'bg-cyan-400' },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 glass-soft rounded-xl px-4 py-2.5">
                <div className={`h-2 w-2 rounded-full ${feat.dot} shadow-md`} />
                <span className="text-[13px] text-white/85">{feat.txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-3"><DomLogo /></div>
            <h1 className="text-[20px] font-bold text-white">DOM Platform</h1>
          </div>

          <div className="lg:mb-8">
            <h1 className="text-[24px] font-bold text-white tracking-tight">Iniciar sesión</h1>
            <p className="text-[13px] text-white/55 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <div className="glass-strong rounded-2xl p-6 mt-2">
            <form onSubmit={manejarSubmit} className="space-y-4">
              <CampoTexto etiqueta="Email" type="email" placeholder="tu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} icono={Mail} required />
              <CampoTexto etiqueta="Contraseña" type="password" placeholder="••••••••" value={contrasena}
                onChange={e => setContrasena(e.target.value)} icono={Lock} required />
              <Boton type="submit" cargando={cargando} className="w-full">
                Continuar con email
              </Boton>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[10px] text-white/45 uppercase tracking-[0.12em] bg-[#0f0c1c]">o</span>
              </div>
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
          </div>

          <p className="text-center text-[13px] text-white/55 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-violet-300 font-semibold hover:text-violet-200 transition-colors">Regístrate</Link>
          </p>
          <p className="text-center text-[12px] text-white/45 mt-2">
            <Link to="/consulta" className="hover:text-white/70 transition-colors">Consulta tu caso (clientes)</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
