// ===== Términos y Condiciones — versión por jurisdicción =====
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Scale, Globe2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { JURISDICCIONES, CODIGOS_JURISDICCION } from '../../utils/jurisdicciones'
import { terminosCondiciones } from '../../utils/textosLegales'

export default function PaginaTerminos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { datosUsuario } = useAuth()
  const codigoInicial = searchParams.get('pais') || datosUsuario?.pais || 'OTRO'
  const [codigo, setCodigo] = useState(codigoInicial)

  const contenido = useMemo(() => terminosCondiciones(codigo), [codigo])

  function cambiarPais(nuevo) {
    setCodigo(nuevo)
    setSearchParams({ pais: nuevo })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-blob animate-float" style={{ top: '-10%', right: '-10%', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(255,90,138,.35), transparent 70%)' }} />
      <div className="bg-blob animate-float" style={{ bottom: '-15%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,77,255,.3), transparent 70%)', animationDelay: '6s' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-white/45" />
            <select
              value={codigo}
              onChange={e => cambiarPais(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-violet-400"
            >
              {CODIGOS_JURISDICCION.map(c => (
                <option key={c} value={c} className="bg-[#0f0c1c]">
                  {JURISDICCIONES[c].bandera} {JURISDICCIONES[c].pais}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-7">
          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-white tracking-tight">Términos y Condiciones</h1>
              <p className="text-[12px] text-white/55 mt-0.5">
                Vigente desde {contenido.vigencia} · Jurisdicción aplicable: {contenido.jurisdiccion.bandera} {contenido.jurisdiccion.pais}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-amber-100/95 leading-relaxed">
              <strong>Cláusula esencial — léase con atención:</strong> el usuario es el responsable de revisar, fiscalizar y aprobar
              cualquier información, dictamen, presupuesto o cómputo emitido por la plataforma antes de utilizarlo en cualquier acto
              profesional, contractual, administrativo o penal. Esta plataforma facilita herramientas, no garantiza resultados.
            </p>
          </div>

          <p className="text-[13px] text-white/75 leading-relaxed mb-6 pb-5 border-b border-white/10">
            {contenido.intro}
          </p>

          <div className="space-y-5">
            {contenido.secciones.map((s, i) => (
              <section key={i}>
                <h2 className="text-[14px] font-semibold text-pink-300 mb-1.5">{s.titulo}</h2>
                <p className="text-[12.5px] text-white/70 leading-relaxed">{s.texto}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-white/40">
              La aceptación queda registrada con marca temporal en la cuenta del usuario.
            </p>
            <Link to={`/privacidad?pais=${codigo}`} className="text-[12px] text-violet-300 hover:text-violet-200 font-semibold">
              ← Ver Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
