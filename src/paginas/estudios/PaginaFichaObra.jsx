// ===== Ficha de Obra — Detalle con checklist por fases =====
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../servicios/firebase'
import {
  ArrowLeft, Save, Building2, Calendar, DollarSign, Users, FileText,
  CheckCircle, XCircle, AlertTriangle, Shield, Edit2, Trash2, X,
  Clock, Eye, Award, ChevronRight, Briefcase, Lock, ExternalLink, KanbanSquare,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { obtenerEstudio, actualizarEstudio, eliminarEstudio } from '../../servicios/estudios'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

const FMT = n => n ? Number(n).toLocaleString('es-ES', { maximumFractionDigits: 0 }) : '—'
const FASES_WORKFLOW = ['captacion', 'oferta', 'administrativa', 'apertura', 'subsanacion', 'resultado']
const FASE_LABELS = { captacion: 'Captación', oferta: 'Oferta', administrativa: 'Administrativa', apertura: 'Apertura', subsanacion: 'Subsanación', resultado: 'Resultado' }

export default function PaginaFichaObra() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { datosUsuario } = useAuth()
  const [obra, setObra] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(false)

  useEffect(() => { if (id) obtenerEstudio(id).then(d => { setObra(d); setCargando(false) }) }, [id])

  async function guardar() {
    setGuardando(true)
    try { await actualizarEstudio(id, obra); toast.success('Guardado'); setEditando(false) }
    catch (err) { toast.error('Error: ' + err.message) }
    finally { setGuardando(false) }
  }

  async function borrar() {
    if (!window.confirm('¿Eliminar este estudio?')) return
    try { await eliminarEstudio(id); toast.success('Eliminado'); navigate('/estudios') }
    catch { toast.error('Error') }
  }

  function cambiarFase(fase) { setObra({ ...obra, faseActual: fase }) }
  function toggle(campo) { setObra({ ...obra, [campo]: !obra[campo] }) }
  function set(campo, valor) { setObra({ ...obra, [campo]: valor }) }

  if (cargando) return <Cargando texto="Cargando ficha..." />
  if (!obra) return <p className="text-center text-gray-400 py-12">Obra no encontrada</p>

  const cerrada = !!obra.empresaAdjudicataria
  const faseIdx = FASES_WORKFLOW.indexOf(obra.faseActual || 'captacion')

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/estudios')} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 mt-1"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{obra.titulo || 'Sin título'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="h-3.5 w-3.5 text-gray-400" /><span className="text-[12px] text-gray-500">{obra.cliente || '—'}</span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] text-gray-400">{obra.procedimiento}</span>
              {cerrada && <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">CERRADA</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {obra?.vamos && (
            <Boton variante="secundario" tamano="xs" icono={KanbanSquare} onClick={() => navigate(`/tablero?licitacion=${id}`)}>
              Tablero
            </Boton>
          )}
          <Boton icono={Save} tamano="xs" cargando={guardando} onClick={guardar}>Guardar</Boton>
          <Boton variante="secundario" tamano="xs" icono={Trash2} onClick={borrar}>Eliminar</Boton>
        </div>
      </div>

      {/* Workflow bar */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-2">
        {FASES_WORKFLOW.map((fase, i) => {
          const cur = obra.faseActual === fase, past = faseIdx > i
          return (
            <div key={fase} className="flex items-center gap-1 flex-1 cursor-pointer" onClick={() => cambiarFase(fase)}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${cur ? 'bg-dom-600 text-white' : past ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}>{past ? '✓' : i + 1}</div>
              <span className={`text-[10px] hidden sm:block ${cur ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{FASE_LABELS[fase]}</span>
              {i < 5 && <div className={`flex-1 h-0.5 ${past ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Datos generales */}
        <div className="lg:col-span-2 space-y-4">
          {/* FASE A: OFERTA */}
          <Tarjeta>
            <FaseHeader letra="A" titulo="Oferta — Datos Económicos" color="blue" />
            <TarjetaCuerpo>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Licitación IVA excl." value={obra.licitacionIVA} type="number" onChange={v => set('licitacionIVA', +v)} />
                <Field label="Importe Ofertado Guamar" value={obra.importeOfertado} type="number" onChange={v => set('importeOfertado', +v)} />
                <Field label="Coste Estudio" value={obra.costeEstudio} type="number" onChange={v => set('costeEstudio', +v)} />
                <Field label="Procedimiento" value={obra.procedimiento} onChange={v => set('procedimiento', v)} />
              </div>
              {obra.licitacionIVA > 0 && obra.importeOfertado > 0 && (
                <div className="mt-3 p-2 bg-dom-50 rounded-lg text-[11px]">
                  <span className="text-dom-600 font-medium">Baja: </span>
                  <span className="text-dom-800 font-bold">{((1 - obra.importeOfertado / obra.licitacionIVA) * 100).toFixed(2)}%</span>
                  <span className="text-dom-600 ml-2">({FMT(obra.licitacionIVA - obra.importeOfertado)} €)</span>
                </div>
              )}
              <div className="mt-3"><label className="text-[10px] text-gray-400 uppercase block mb-1">Clasificación</label>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Grupo" value={obra.grupo1} onChange={v => set('grupo1', v)} small />
                  <Field label="Subgrupo" value={obra.subgrupo1} onChange={v => set('subgrupo1', v)} small />
                  <Field label="Categoría" value={obra.categoria1} onChange={v => set('categoria1', v)} small />
                </div>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* FASE B: DOC. TÉCNICA */}
          <Tarjeta>
            <FaseHeader letra="B" titulo="Documentación Técnica" color="teal" />
            <TarjetaCuerpo>
              <div className="space-y-2">
                <CheckItem label="Documentación Técnica completa" checked={obra.docTecnica} onChange={() => toggle('docTecnica')} />
                <CheckItem label="Seguridad y Salud" checked={obra.seguridadSalud} onChange={() => toggle('seguridadSalud')} />
                <CheckItem label="Calidad y MA" checked={obra.calidadMA} onChange={() => toggle('calidadMA')} />
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* FASE C: DOC. ADMINISTRATIVA */}
          <Tarjeta>
            <FaseHeader letra="C" titulo="Documentación Administrativa" color="purple" />
            <TarjetaCuerpo>
              <CheckItem label="Documentación Administrativa completa" checked={obra.docAdministrativa} onChange={() => toggle('docAdministrativa')} desc="Solvencia económica, técnica, escrituras, CIF" />
            </TarjetaCuerpo>
          </Tarjeta>

          {/* FASE D: DOC. ECONÓMICA + BC3 */}
          <Tarjeta>
            <FaseHeader letra="D" titulo="Documentación Económica — BC3" color="amber" />
            <TarjetaCuerpo>
              <CheckItem label="Estudio Económico completo" checked={obra.estudioEconomico} onChange={() => toggle('estudioEconomico')} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center hover:border-dom-300 cursor-pointer" onClick={() => navigate('/planificacion')}>
                  <FileText className="h-6 w-6 text-dom-500 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-gray-800">BC3 Coste</p>
                  <p className="text-[9px] text-gray-400">Presupuesto interno</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center hover:border-dom-300 cursor-pointer" onClick={() => navigate('/viabilidad')}>
                  <Shield className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-gray-800">BC3 Cierre</p>
                  <p className="text-[9px] text-gray-400">Viabilidad + oferta final</p>
                </div>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* RESULTADO */}
          <Tarjeta>
            <FaseHeader letra="R" titulo="Resultado — Adjudicación" color="emerald" />
            <TarjetaCuerpo>
              <Field label="Empresa Adjudicataria" value={obra.empresaAdjudicataria} onChange={v => set('empresaAdjudicataria', v)} placeholder="Vacío = aún en proceso" />
              <div className="mt-3">
                <Field label="Observaciones del resultado" value={obra.observaciones} onChange={v => set('observaciones', v)} textarea />
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>

        {/* RIGHT: Sidebar info */}
        <div className="space-y-4">
          {/* Estado */}
          <Tarjeta>
            <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Estado</h3></div>
            <TarjetaCuerpo>
              <label className="flex items-center gap-3 py-2 cursor-pointer"><input type="checkbox" checked={obra.vamos} onChange={() => toggle('vamos')} className="accent-emerald-600 h-4 w-4" /><span className="text-sm font-semibold text-gray-800">¡VAMOS!</span></label>
              {obra.vamos && (
                <button onClick={crearProyectoEnTablero} disabled={guardando} className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[12px] font-semibold rounded-lg border border-sky-200 transition-colors disabled:opacity-50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  Crear proyecto en tablero
                </button>
              )}
              <label className="flex items-center gap-3 py-2 cursor-pointer"><input type="checkbox" checked={obra.apertura} onChange={() => toggle('apertura')} className="accent-amber-600 h-4 w-4" /><span className="text-sm text-gray-700">Apertura realizada</span></label>
              <Field label="Valoración" value={obra.valoracion} onChange={v => set('valoracion', v)} />
            </TarjetaCuerpo>
          </Tarjeta>

          {/* Fechas */}
          <Tarjeta>
            <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Fechas</h3></div>
            <TarjetaCuerpo>
              <Field label="Fecha Interna" value={obra.fechaInterna} type="date" onChange={v => set('fechaInterna', v)} />
              <Field label="Fecha Presentación" value={obra.fechaPresentacion} type="date" onChange={v => set('fechaPresentacion', v)} />
              <Field label="Hora Presentación" value={obra.horaPresentacion} onChange={v => set('horaPresentacion', v)} />
              <Field label="Fecha Apertura" value={obra.fechaApertura} type="date" onChange={v => set('fechaApertura', v)} />
              <Field label="Hora Apertura" value={obra.horaApertura} onChange={v => set('horaApertura', v)} />
              {obra.fechaInterna && new Date(obra.fechaInterna) <= new Date(Date.now() + 7 * 864e5) && new Date(obra.fechaInterna) >= new Date() && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" /><span className="text-[11px] text-red-700 font-medium">Fecha interna vence en menos de 7 días</span></div>
              )}
            </TarjetaCuerpo>
          </Tarjeta>

          {/* UTE */}
          <Tarjeta>
            <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">UTE / Participantes</h3></div>
            <TarjetaCuerpo>
              <Field label="% Guamar" value={obra.pctGuamar} type="number" onChange={v => set('pctGuamar', +v)} />
              <Field label="Componente UTE 1" value={obra.componenteUTE1} onChange={v => set('componenteUTE1', v)} />
              {obra.componenteUTE1 && <Field label="% Componente 1" value={obra.pctComponente1} type="number" onChange={v => set('pctComponente1', +v)} />}
              <Field label="Componente UTE 2" value={obra.componenteUTE2} onChange={v => set('componenteUTE2', v)} />
              {obra.componenteUTE2 && <Field label="% Componente 2" value={obra.pctComponente2} type="number" onChange={v => set('pctComponente2', +v)} />}
            </TarjetaCuerpo>
          </Tarjeta>

          {/* Links */}
          <Tarjeta>
            <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Acciones</h3></div>
            <TarjetaCuerpo>
              <div className="space-y-2">
                <ActionLink label="Planificación BC3" desc="Cargar presupuesto" to="/planificacion" icon={FileText} />
                <ActionLink label="Viabilidad" desc="Análisis económico" to="/viabilidad" icon={Shield} />
                <ActionLink label="Certificaciones" desc="Control de pagos" to="/certificaciones" icon={CheckCircle} />
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}

// ===== UI Components =====
function FaseHeader({ letra, titulo, color }) {
  return <div className={`px-4 py-2.5 border-b border-gray-100 flex items-center gap-2`}><div className={`h-6 w-6 rounded-md bg-${color}-100 text-${color}-700 flex items-center justify-center text-[11px] font-bold`}>{letra}</div><h3 className="text-[13px] font-semibold text-gray-800">{titulo}</h3></div>
}

function Field({ label, value, onChange, type = 'text', placeholder, textarea, small }) {
  const cls = `w-full rounded-md border border-gray-200 px-2.5 py-1.5 ${small ? 'text-[11px]' : 'text-sm'} focus:border-dom-500 focus:outline-none`
  return (
    <div className={small ? '' : 'mt-2'}>
      <label className={`text-[10px] text-gray-400 uppercase block mb-1`}>{label}</label>
      {textarea ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2} placeholder={placeholder} className={`${cls} resize-none`} /> : <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  )
}

function CheckItem({ label, checked, onChange, desc }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-emerald-600 h-4 w-4 mt-0.5 flex-shrink-0" />
      <div><span className={`text-[13px] ${checked ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>{label}</span>{desc && <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>}</div>
      {checked && <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />}
    </label>
  )
}

function ActionLink({ label, desc, to, icon: I }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate(to)}>
      <I className="h-4 w-4 text-dom-500 flex-shrink-0" /><div className="flex-1"><p className="text-[12px] font-medium text-gray-800">{label}</p><p className="text-[10px] text-gray-400">{desc}</p></div><ChevronRight className="h-3.5 w-3.5 text-gray-300" />
    </div>
  )
}
