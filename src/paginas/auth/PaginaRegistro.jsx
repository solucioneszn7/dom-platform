// ===== Registro — Glass Aurora con jurisdicción + aceptación T&C =====
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Sparkles, Globe2 } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import Boton from '../../componentes/ui/Boton'
import CampoTexto from '../../componentes/ui/CampoTexto'
import { JURISDICCIONES, CODIGOS_JURISDICCION } from '../../utils/jurisdicciones'
import toast from 'react-hot-toast'

export default function PaginaRegistro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [pais, setPais] = useState('CL')
  const [acepto, setAcepto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const { registrarse } = useAuth()
  const navegar = useNavigate()

  async function manejarSubmit(e) {
    e.preventDefault()
    if (contrasena !== confirmar) { toast.error('Las contraseñas no coinciden'); return }
    if (contrasena.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    if (!acepto) { toast.error('Debes aceptar los Términos y la Política de Privacidad'); return }
    setCargando(true)
    try {
      await registrarse(email, contrasena, nombre, pais, acepto)
      toast.success(`¡Cuenta creada bajo normativa ${JURISDICCIONES[pais].pais}!`)
      navegar('/dashboard')
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') toast.error('Email ya registrado')
      else if (error.code === 'auth/weak-password') toast.error('Contraseña muy débil')
      else toast.error(error.message || 'Error al crear cuenta')
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
          <p className="text-[13px] text-white/55 mt-1">Licitaciones · Mediciones · BC3 · Tablero</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <form onSubmit={manejarSubmit} className="space-y-4">
            <CampoTexto etiqueta="Nombre completo" type="text" placeholder="Juan Pérez" value={nombre}
              onChange={e => setNombre(e.target.value)} icono={User} required />
            <CampoTexto etiqueta="Email" type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} icono={Mail} required />

            {/* Selector de país / jurisdicción */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.08em] text-white/45 font-semibold mb-1.5">
                País donde usarás la plataforma
              </label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <select
                  value={pais}
                  onChange={e => setPais(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 appearance-none"
                >
                  {CODIGOS_JURISDICCION.map(c => (
                    <option key={c} value={c} className="bg-[#0f0c1c]">
                      {JURISDICCIONES[c].bandera} {JURISDICCIONES[c].pais} — {JURISDICCIONES[c].moneda}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10.5px] text-white/40 mt-1.5 leading-snug">
                Aplicaremos la normativa de {JURISDICCIONES[pais].pais}.
              </p>
            </div>

            <CampoTexto etiqueta="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={contrasena}
              onChange={e => setContrasena(e.target.value)} icono={Lock} required />
            <CampoTexto etiqueta="Confirmar contraseña" type="password" placeholder="Repite tu contraseña" value={confirmar}
              onChange={e => setConfirmar(e.target.value)} icono={Lock} required />

            {/* Aceptación T&C */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={acepto}
                onChange={e => setAcepto(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-400 focus:ring-offset-0 cursor-pointer flex-shrink-0"
              />
              <span className="text-[11.5px] text-white/65 leading-snug">
                He leído y acepto los{' '}
                <Link to={`/terminos?pais=${pais}`} target="_blank" className="text-violet-300 hover:text-violet-200 font-semibold underline-offset-2 hover:underline">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link to={`/privacidad?pais=${pais}`} target="_blank" className="text-violet-300 hover:text-violet-200 font-semibold underline-offset-2 hover:underline">
                  Política de Privacidad
                </Link>
                . Entiendo que soy responsable de revisar, fiscalizar y aprobar cualquier resultado emitido por la plataforma.
              </span>
            </label>

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
