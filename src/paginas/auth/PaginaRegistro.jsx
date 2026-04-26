// ===== Registro — Glass Aurora =====
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Sparkles } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Aurora blobs */}
      <div className="bg-blob animate-float" style={{ top: '-10%', left: '-10%', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(124,77,255,.55), transparent 70%)' }} />
      <div className="bg-blob animate-float" style={{ bottom: '-15%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(77,199,255,.35), transparent 70%)', animationDelay: '6s' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div
              className="rounded-2xl flex items-center justify-center shadow-[0_12px_40px_rgba(124,77,255,.4)]"
              style={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg, #7c4dff 0%, #ff5a8a 50%, #4dc7ff 100%)',
              }}
            >
              <Sparkles className="text-white h-7 w-7" />
            </div>
          </div>
          <h1 className="text-[24px] font-bold text-gradient mt-4 tracking-tight">Crear Cuenta</h1>
          <p className="text-[13px] text-white/55 mt-1">Regístrate para gestionar tus tramitaciones</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <form onSubmit={manejarSubmit} className="space-y-4">
            <CampoTexto etiqueta="Nombre completo" type="text" placeholder="Juan Pérez" value={nombre}
              onChange={e => setNombre(e.target.value)} icono={User} required />
            <CampoTexto etiqueta="Email" type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} icono={Mail} required />
            <CampoTexto etiqueta="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={contrasena}
              onChange={e => setContrasena(e.target.value)} icono={Lock} required />
            <CampoTexto etiqueta="Confirmar contraseña" type="password" placeholder="Repite tu contraseña" value={confirmar}
              onChange={e => setConfirmar(e.target.value)} icono={Lock} required />
            <Boton type="submit" cargando={cargando} className="w-full">
              Crear Cuenta
            </Boton>
          </form>
        </div>

        <p className="text-center text-[13px] text-white/55 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-violet-300 font-semibold hover:text-violet-200 transition-colors">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
