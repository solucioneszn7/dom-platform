// ===== Política de Privacidad — versión por jurisdicción =====
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Shield, Globe2 } from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { JURISDICCIONES, CODIGOS_JURISDICCION } from '../../utils/jurisdicciones'
import { politicaPrivacidad } from '../../utils/textosLegales'

export default function PaginaPrivacidad() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { datosUsuario } = useAuth()
  const codigoInicial = searchParams.get('pais') || datosUsuario?.pais || 'OTRO'
  const [codigo, setCodigo] = useState(codigoInicial)

  const contenido = useMemo(() => politicaPrivacidad(codigo), [codigo])

  function cambiarPais(nuevo) {
    setCodigo(nuevo)
    setSearchParams({ pais: nuevo })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-blob animate-float" style={{ top: '-10%', left: '-10%', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(124,77,255,.4), transparent 70%)' }} />
      <div className="bg-blob animate-float" style={{ bottom: '-15%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(77,199,255,.25), transparent 70%)', animationDelay: '6s' }} />

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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-white tracking-tight">Política de Privacidad</h1>
              <p className="text-[12px] text-white/55 mt-0.5">
                Vigente desde {contenido.vigencia} · Jurisdicción aplicable: {contenido.jurisdiccion.bandera} {contenido.jurisdiccion.pais}
              </p>
            </div>
          </div>

          <p className="text-[13px] text-white/75 leading-relaxed mb-6 pb-5 border-b border-white/10">
            {contenido.intro}
          </p>

          <div className="space-y-5">
            {contenido.secciones.map((s, i) => (
              <section key={i}>
                <h2 className="text-[14px] font-semibold text-violet-300 mb-1.5">{s.titulo}</h2>
                <p className="text-[12.5px] text-white/70 leading-relaxed">{s.texto}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-white/40">
              Para cualquier solicitud relativa a sus datos personales escriba a la dirección indicada en la sección 1.
            </p>
            <Link to={`/terminos?pais=${codigo}`} className="text-[12px] text-violet-300 hover:text-violet-200 font-semibold">
              Ver Términos y Condiciones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
