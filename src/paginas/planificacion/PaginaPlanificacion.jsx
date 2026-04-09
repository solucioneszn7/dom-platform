// ===== Planificación — BC3 + APU + Empresas (EDIT) + Gantt (fechas editables) =====
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Upload, FileText, ChevronRight, ChevronDown, Users, Package,
  Wrench, HelpCircle, X, DollarSign, AlertCircle, Plus, Save,
  Layers, BarChart3, ZoomIn, ZoomOut, Building2, Trash2,
  CheckCircle, FolderKanban, ArrowLeft, Search, Briefcase, RefreshCw,
  AlertTriangle, Lock, ExternalLink, Edit2, Calendar,
} from 'lucide-react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, proveedorGoogleDrive } from '../../servicios/firebase'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import { leerArchivoBC3, partidasAGantt } from '../../utils/parserBC3'
import {
  guardarPresupuesto, obtenerPresupuesto, escucharPartidas,
  actualizarPartida, asignarEmpresa, obtenerEmpresas, crearEmpresa,
  eliminarEmpresa, actualizarEmpresa, subirBC3ADrive, descargarBC3DeDrive,
  verificarCambiosDrive,
} from '../../servicios/presupuestos'
import { parsearBC3 } from '../../utils/parserBC3'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

function IconoGantt({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="14" height="3" rx="1" /><rect x="7" y="10.5" width="10" height="3" rx="1" /><rect x="5" y="17" width="16" height="3" rx="1" /></svg>
}

export default function PaginaPlanificacion() {
  const { usuario, esAdmin } = useAuth()
  const [paso, setPaso] = useState('seleccionar')
  const [proyectos, setProyectos] = useState([])
  const [proyectoId, setProyectoId] = useState(null)
  const [proyectoInfo, setProyectoInfo] = useState(null)
  const [cargandoP, setCargandoP] = useState(true)

  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, d => { setProyectos(d); setCargandoP(false) })
  }, [usuario, esAdmin])

  useEffect(() => {
    if (!proyectoId) return
    obtenerPresupuesto(proyectoId).then(p => setPaso(p ? 'gestion' : 'cargar'))
  }, [proyectoId])

  if (paso === 'seleccionar') {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Planificación de Obra</h1><p className="text-sm text-gray-400 mt-1">Selecciona un proyecto</p></div>
        {cargandoP ? <Cargando /> : (
          <Tarjeta><div className="px-5 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-800">Proyectos</h2></div>
            {proyectos.length === 0 ? <div className="py-12 text-center"><FolderKanban className="h-10 w-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Crea un proyecto primero.</p></div> : (
              <div className="divide-y divide-gray-50">{proyectos.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setProyectoId(p.id); setProyectoInfo(p) }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded">{p.numeroCaso}</span>
                      {p.tienePresupuesto && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckCircle className="h-3 w-3" />BC3</span>}
                    </div>
                    <h3 className="text-[13px] font-semibold text-gray-900">{p.nombre}</h3>
                  </div><ChevronRight className="h-4 w-4 text-gray-300" /></div>))}</div>)}</Tarjeta>)}
      </div>
    )
  }

  if (paso === 'cargar') return <CargarBC3 proyectoId={proyectoId} info={proyectoInfo} onVolver={() => { setPaso('seleccionar'); setProyectoId(null) }} onOk={() => setPaso('gestion')} />
  return <Gestion proyectoId={proyectoId} info={proyectoInfo} onVolver={() => { setPaso('seleccionar'); setProyectoId(null) }} onRecargar={() => setPaso('cargar')} />
}

// ============ CARGAR BC3 ============
function CargarBC3({ proyectoId, info, onVolver, onOk }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const inputRef = useRef(null)

  async function manejarArchivo(e) {
    const file = e.target.files?.[0]
    if (!file || !file.name.toLowerCase().endsWith('.bc3')) { toast.error('Solo .bc3'); return }
    setArchivo(file); setCargando(true); setError(null)
    try { const r = await leerArchivoBC3(file); setPreview(r); toast.success(`${r.resumen.totalCapitulos} capítulos, ${r.resumen.totalPartidas} partidas`) }
    catch (err) { setError(err.message) }
    finally { setCargando(false) }
  }

  async function guardar() {
    if (!preview) return; setGuardando(true)
    try { await guardarPresupuesto(proyectoId, preview, archivo.name); toast.success('Presupuesto guardado'); onOk() }
    catch (err) { toast.error('Error: ' + err.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><button onClick={onVolver} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><ArrowLeft className="h-4 w-4" /></button><div><h1 className="text-xl font-bold text-gray-900">Cargar BC3</h1><p className="text-sm text-gray-400">{info?.numeroCaso} — {info?.nombre}</p></div></div>
      {!preview ? (
        <Tarjeta><div className="px-5 py-16 text-center"><input ref={inputRef} type="file" accept=".bc3" onChange={manejarArchivo} className="hidden" />
          {cargando ? <Cargando texto="Analizando BC3..." /> : error ? <div className="max-w-md mx-auto"><AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-red-600 mb-4">{error}</p><Boton variante="secundario" onClick={() => { setError(null); inputRef.current?.click() }}>Reintentar</Boton></div> : (
            <><IconoGantt className="h-14 w-14 text-dom-400 mx-auto mb-4" /><h2 className="text-lg font-semibold text-gray-900 mb-2">Subir archivo BC3</h2><p className="text-sm text-gray-400 max-w-md mx-auto mb-6">El parser extraerá capítulos, partidas y APU completo.</p><Boton icono={Upload} onClick={() => inputRef.current?.click()}>Seleccionar .bc3</Boton></>
          )}</div></Tarjeta>
      ) : (
        <div className="space-y-4">
          <Tarjeta><div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-800">Vista previa — {archivo?.name}</h2><Boton variante="secundario" tamano="xs" onClick={() => { setPreview(null); inputRef.current?.click() }}>Otro</Boton></div>
            <TarjetaCuerpo>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">{[['Capítulos', preview.resumen.totalCapitulos], ['Partidas', preview.resumen.totalPartidas], ['Conceptos', preview.resumen.totalConceptos], ['Moneda', preview.moneda]].map(([l, v]) => <div key={l} className="bg-gray-50 rounded-lg px-3 py-2"><p className="font-bold text-gray-900 text-sm">{v}</p><p className="text-[10px] text-gray-400 uppercase">{l}</p></div>)}</div>
              <div className="border border-gray-100 rounded-lg max-h-[300px] overflow-y-auto"><TreeView nodos={preview.arbol} nivel={0} /></div>
            </TarjetaCuerpo></Tarjeta>
          <div className="bg-dom-50 border border-dom-200 rounded-lg p-4 flex items-center justify-between">
            <div><p className="text-sm font-semibold text-dom-800">Guardar presupuesto</p><p className="text-[12px] text-dom-600">{preview.resumen.totalPartidas} partidas con APU</p></div>
            <Boton icono={Save} cargando={guardando} onClick={guardar} variante="notion">Guardar en Proyecto</Boton>
          </div>
        </div>
      )}
    </div>
  )
}

function TreeView({ nodos, nivel }) {
  const [open, setOpen] = useState(new Set(nodos.filter(n => n.tipo === 'capitulo').map(n => n.codigo)))
  return <div>{nodos.map((n, i) => {
    const esCap = n.tipo === 'capitulo', tieneH = n.hijos?.length > 0, isOpen = open.has(n.codigo), apuN = (n.apu || []).length
    return <div key={`${n.codigo}-${i}`}>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-50 hover:bg-gray-50/50 ${esCap ? 'bg-gray-50/80' : ''}`} style={{ paddingLeft: 12 + nivel * 18 }}>
        {tieneH ? <button onClick={() => setOpen(p => { const s = new Set(p); s.has(n.codigo) ? s.delete(n.codigo) : s.add(n.codigo); return s })} className="p-0.5 text-gray-400">{isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</button> : <span className="w-4" />}
        <span className={`text-[11px] flex-1 truncate ${esCap ? 'font-semibold text-gray-800' : 'text-gray-600'}`}><span className="font-mono text-dom-600 mr-1">{n.codigo}</span>{n.nombre}</span>
        {!esCap && n.unidad && <span className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{n.unidad}</span>}
        {!esCap && n.precioUnitario > 0 && <span className="text-[10px] font-semibold text-gray-600">{n.precioUnitario.toFixed(0)}</span>}
        {apuN > 0 && <span className="text-[9px] text-dom-600 bg-dom-50 px-1 py-0.5 rounded">{apuN} APU</span>}
      </div>
      {tieneH && isOpen && <TreeView nodos={n.hijos} nivel={nivel + 1} />}
    </div>
  })}</div>
}

// ============ GESTIÓN ============
function Gestion({ proyectoId, info, onVolver, onRecargar }) {
  const [partidas, setPartidas] = useState([])
  const [presupuesto, setPresupuesto] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [exp, setExp] = useState(new Set())
  const [sel, setSel] = useState(null)
  const [vista, setVista] = useState('arbol')
  const [busqueda, setBusqueda] = useState('')
  const [modalEmp, setModalEmp] = useState(false)
  const [zoom, setZoom] = useState(18)
  const [ganttInicio, setGanttInicio] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    if (!proyectoId) return
    const off = escucharPartidas(proyectoId, d => { setPartidas(d); setCargando(false); if (exp.size === 0) setExp(new Set(d.filter(p => p.tipo === 'capitulo').map(p => p.id))) })
    obtenerPresupuesto(proyectoId).then(setPresupuesto)
    obtenerEmpresas(proyectoId).then(setEmpresas)
    return off
  }, [proyectoId])

  const toggleExp = id => setExp(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const visibles = useMemo(() => {
    if (busqueda) return partidas.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo?.includes(busqueda))
    const vis = [], col = new Set()
    for (const p of partidas) { if (p.codigoPadre && col.has(p.codigoPadre)) { if (p.tipo === 'capitulo') col.add(p.codigo); continue }; vis.push(p); if (p.tipo === 'capitulo' && !exp.has(p.id)) col.add(p.codigo) }
    return vis
  }, [partidas, exp, busqueda])

  async function handleAsignar(pid, empId) {
    const emp = empresas.find(e => e.id === empId)
    try { await asignarEmpresa(proyectoId, pid, empId || null, emp?.nombre || '') } catch { toast.error('Error') }
  }

  const resumen = useMemo(() => {
    let pres = 0, ej = 0
    for (const p of partidas) { if (p.tipo !== 'capitulo') { pres += (p.cantidadPresupuestada || 0) * (p.precioUnitario || 0); ej += p.importeEjecutado || 0 } }
    return { pres, ej, pct: pres > 0 ? Math.round((ej / pres) * 100) : 0 }
  }, [partidas])

  const ganttData = useMemo(() => vista === 'gantt' ? partidasAGantt(partidas, new Date(ganttInicio)) : [], [vista, partidas, ganttInicio])

  if (cargando) return <Cargando texto="Cargando presupuesto..." />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><ArrowLeft className="h-4 w-4" /></button>
          <div><h1 className="text-xl font-bold text-gray-900">Control de Presupuesto</h1><p className="text-[12px] text-gray-400">{info?.numeroCaso} — {info?.nombre} · {partidas.filter(p => p.tipo !== 'capitulo').length} partidas</p></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Boton variante="secundario" tamano="xs" icono={Briefcase} onClick={() => setModalEmp(true)}>Empresas ({empresas.length})</Boton>
          <Boton variante="secundario" tamano="xs" icono={Upload} onClick={onRecargar}>Recargar BC3</Boton>
          <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
            <button onClick={() => setVista('arbol')} className={`px-2.5 py-1 text-xs font-medium rounded ${vista === 'arbol' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Partidas</button>
            <button onClick={() => setVista('gantt')} className={`px-2.5 py-1 text-xs font-medium rounded ${vista === 'gantt' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Gantt</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Capítulos', partidas.filter(p => p.tipo === 'capitulo').length, Layers], ['Partidas', partidas.filter(p => p.tipo !== 'capitulo').length, FileText], ['Presupuesto', resumen.pres > 0 ? `${(resumen.pres / 1000).toFixed(0)}K` : '—', DollarSign], ['Avance', `${resumen.pct}%`, CheckCircle]].map(([l, v, I]) => (
          <div key={l} className="bg-white rounded-lg border border-gray-200/80 px-3 py-2.5 flex items-center gap-2.5"><div className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center"><I className="h-3.5 w-3.5 text-gray-500" /></div><div><p className="font-bold text-gray-900 leading-none">{v}</p><p className="text-[10px] text-gray-400 mt-0.5 uppercase">{l}</p></div></div>
        ))}
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><input type="text" placeholder="Buscar partida..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-1.5 text-sm placeholder-gray-400 focus:border-dom-500 focus:outline-none" /></div>

      {/* ARBOL */}
      {vista === 'arbol' && (
        <Tarjeta>
          <div className="hidden lg:grid grid-cols-12 gap-1 px-4 py-2 text-[10px] font-medium text-gray-400 uppercase border-b border-gray-100 bg-gray-50/50">
            <span className="col-span-4">Partida</span><span className="col-span-1 text-center">Ud</span><span className="col-span-1 text-right">P.U.</span><span className="col-span-2">Empresa</span><span className="col-span-1 text-center">Avance</span><span className="col-span-1 text-right">Importe</span><span className="col-span-1 text-center">%</span><span className="col-span-1 text-center">APU</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[550px] overflow-y-auto">
            {visibles.map(p => {
              if (p.tipo === 'capitulo') return <div key={p.id} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 cursor-pointer hover:bg-gray-100/60" style={{ paddingLeft: 12 + (p.nivel || 0) * 16 }} onClick={() => toggleExp(p.id)}>{exp.has(p.id) ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}<span className="font-mono text-[10px] text-dom-600 mr-1">{p.codigo}</span><span className="text-[12px] font-semibold text-gray-800 flex-1 truncate">{p.nombre}</span></div>
              const apuN = (p.apu || []).length, pct = p.porcentaje || 0
              return (
                <div key={p.id} className={`grid grid-cols-1 lg:grid-cols-12 gap-1 items-center px-4 py-2 hover:bg-blue-50/20 cursor-pointer ${sel?.id === p.id ? 'bg-dom-50/50' : ''}`} style={{ paddingLeft: 12 + (p.nivel || 0) * 16 }} onClick={() => setSel(p)}>
                  <div className="lg:col-span-4 min-w-0 flex items-center gap-1.5"><span className="w-4 flex-shrink-0">{p.bloqueado && <Lock className="h-3 w-3 text-amber-500" />}</span><span className="font-mono text-[9px] text-dom-600 bg-dom-50 px-1 py-0.5 rounded">{p.codigo}</span><span className="text-[11px] text-gray-700 truncate">{p.nombre}</span></div>
                  <div className="lg:col-span-1 text-center"><span className="text-[10px] text-gray-400">{p.unidad}</span></div>
                  <div className="lg:col-span-1 text-right"><span className="text-[11px] text-gray-600">{(p.precioUnitario || 0).toFixed(0)}</span></div>
                  <div className="lg:col-span-2"><select value={p.empresaId || ''} onClick={e => e.stopPropagation()} onChange={e => handleAsignar(p.id, e.target.value)} className="w-full text-[10px] rounded border border-gray-200 px-1.5 py-1 focus:border-dom-500 focus:outline-none bg-white"><option value="">Sin asignar</option>{empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}</select></div>
                  <div className="lg:col-span-1 text-center"><span className="text-[11px] text-gray-600">{p.avanceAcumulado || 0}/{p.cantidadPresupuestada || '?'}</span></div>
                  <div className="lg:col-span-1 text-right"><span className="text-[11px] font-semibold text-gray-800">{(p.importeEjecutado || 0).toFixed(0)}</span></div>
                  <div className="lg:col-span-1 text-center"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pct >= 100 ? 'bg-emerald-50 text-emerald-700' : pct > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{pct}%</span></div>
                  <div className="lg:col-span-1 text-center">{apuN > 0 && <span className="text-[9px] text-dom-600 bg-dom-50 px-1 py-0.5 rounded">{apuN}</span>}</div>
                </div>
              )
            })}
          </div>
        </Tarjeta>
      )}

      {/* GANTT con fecha de inicio editable */}
      {vista === 'gantt' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <label className="text-[11px] text-gray-500">Inicio obra:</label>
              <input type="date" value={ganttInicio} onChange={e => setGanttInicio(e.target.value)}
                className="rounded-md border border-gray-200 px-2 py-1 text-[12px] text-gray-700 focus:border-dom-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(6, z - 3))} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="text-[11px] text-gray-400 min-w-[40px] text-center">{zoom}px/d</span>
              <button onClick={() => setZoom(z => Math.min(60, z + 3))} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"><ZoomIn className="h-3.5 w-3.5" /></button>
            </div>
            <span className="text-[10px] text-gray-400">Progreso = medición / cantidad BC3</span>
          </div>
          {ganttData.length > 0 && <GanttReactivo tareas={ganttData} zoom={zoom} onSelect={t => { const f = partidas.find(p => p.codigo === t.codigo); if (f) setSel(f) }} />}
        </>
      )}

      {/* APU Panel */}
      {sel && <PanelAPU partida={sel} empresas={empresas} onCerrar={() => setSel(null)} />}

      {/* Modal Empresas con EDICIÓN */}
      {modalEmp && <ModalEmpresas proyectoId={proyectoId} empresas={empresas} setEmpresas={setEmpresas} onCerrar={() => setModalEmp(false)} />}
    </div>
  )
}

// ============ MODAL EMPRESAS CON EDICIÓN ============
function ModalEmpresas({ proyectoId, empresas, setEmpresas, onCerrar }) {
  const [formEmp, setFormEmp] = useState({ nombre: '', cif: '', contacto: '', telefono: '', email: '', especialidad: '' })
  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({})

  async function handleCrear() {
    if (!formEmp.nombre.trim()) { toast.error('Nombre requerido'); return }
    try {
      const n = await crearEmpresa(proyectoId, formEmp)
      setEmpresas(p => [...p, n]); setFormEmp({ nombre: '', cif: '', contacto: '', telefono: '', email: '', especialidad: '' })
      toast.success('Empresa añadida')
    } catch { toast.error('Error') }
  }

  function empezarEditar(emp) {
    setEditandoId(emp.id)
    setEditForm({ nombre: emp.nombre || '', cif: emp.cif || '', contacto: emp.contacto || '', telefono: emp.telefono || '', email: emp.email || '', especialidad: emp.especialidad || '' })
  }

  async function guardarEdicion() {
    try {
      await actualizarEmpresa(proyectoId, editandoId, editForm)
      setEmpresas(prev => prev.map(e => e.id === editandoId ? { ...e, ...editForm } : e))
      setEditandoId(null); toast.success('Empresa actualizada')
    } catch { toast.error('Error al guardar') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">Empresas / Subcontratas</h3><button onClick={onCerrar} className="p-1 rounded-md hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button></div>

        {empresas.map(e => editandoId === e.id ? (
          <div key={e.id} className="p-3 bg-dom-50 rounded-lg space-y-2 border border-dom-200">
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombre" value={editForm.nombre} onChange={ev => setEditForm({ ...editForm, nombre: ev.target.value })} className="col-span-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
              <input placeholder="CIF/NIF" value={editForm.cif} onChange={ev => setEditForm({ ...editForm, cif: ev.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
              <input placeholder="Especialidad" value={editForm.especialidad} onChange={ev => setEditForm({ ...editForm, especialidad: ev.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
              <input placeholder="Contacto" value={editForm.contacto} onChange={ev => setEditForm({ ...editForm, contacto: ev.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
              <input placeholder="Email" value={editForm.email} onChange={ev => setEditForm({ ...editForm, email: ev.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" tamano="xs" onClick={() => setEditandoId(null)}>Cancelar</Boton>
              <Boton tamano="xs" icono={Save} onClick={guardarEdicion}>Guardar</Boton>
            </div>
          </div>
        ) : (
          <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><p className="text-[13px] font-medium text-gray-900">{e.nombre}</p><p className="text-[11px] text-gray-400">{e.especialidad || ''} {e.cif ? `· ${e.cif}` : ''} {e.contacto ? `· ${e.contacto}` : ''}</p></div>
            <div className="flex items-center gap-1">
              <button onClick={() => empezarEditar(e)} className="p-1.5 rounded text-gray-400 hover:text-dom-600 hover:bg-dom-50"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={async () => { await eliminarEmpresa(proyectoId, e.id); setEmpresas(p => p.filter(x => x.id !== e.id)); toast.success('Eliminada') }} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Añadir empresa</h4>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Nombre *" value={formEmp.nombre} onChange={e => setFormEmp({ ...formEmp, nombre: e.target.value })} className="col-span-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
            <input placeholder="CIF/NIF" value={formEmp.cif} onChange={e => setFormEmp({ ...formEmp, cif: e.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
            <input placeholder="Especialidad" value={formEmp.especialidad} onChange={e => setFormEmp({ ...formEmp, especialidad: e.target.value })} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-dom-500 focus:outline-none" />
          </div>
          <Boton icono={Plus} tamano="sm" onClick={handleCrear} className="w-full">Añadir</Boton>
        </div>
      </div>
    </div>
  )
}

// ============ GANTT REACTIVO ============
function GanttReactivo({ tareas, zoom, onSelect }) {
  if (!tareas.length) return null
  const ROW = 28, NW = 250
  const fechas = tareas.flatMap(t => [new Date(t.inicio), new Date(t.fin)])
  const min = new Date(Math.min(...fechas)), max = new Date(Math.max(...fechas))
  const cW = Math.ceil((max - min) / 864e5 + 5) * zoom, tH = tareas.length * ROW
  const xd = d => ((new Date(d) - min) / 864e5) * zoom
  const hoy = new Date(), progHoy = xd(hoy.toISOString())

  return (
    <Tarjeta>
      <div className="flex overflow-hidden">
        <div className="flex-shrink-0 border-r border-gray-100" style={{ width: NW }}>
          <div className="h-6 border-b border-gray-100 px-3 flex items-center"><span className="text-[10px] font-medium text-gray-400 uppercase">Tarea</span></div>
          {tareas.map(t => (
            <div key={t.id} className="flex items-center gap-1 px-2 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-[10px] truncate" style={{ height: ROW, paddingLeft: 8 + (t.nivel || 0) * 12 }} onClick={() => onSelect(t)}>
              {t.bloqueado && <Lock className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />}
              <span className={t.esCapitulo ? 'font-semibold text-gray-800' : 'text-gray-600'}>{t.nombre}</span>
              {t.empresaNombre && <span className="ml-auto text-[8px] text-purple-600 bg-purple-50 px-1 rounded flex-shrink-0">{t.empresaNombre.slice(0, 8)}</span>}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <svg width={cW} height={tH + 30}>
            {progHoy > 0 && progHoy < cW && <line x1={progHoy} y1={0} x2={progHoy} y2={tH + 30} stroke="#dc2626" strokeDasharray="3 3" opacity="0.4" />}
            {tareas.map((t, i) => {
              const bx = xd(t.inicio), bw = Math.max(((new Date(t.fin) - new Date(t.inicio)) / 864e5) * zoom, 4), y = 6 + i * ROW
              if (t.esCapitulo) return <g key={t.id} className="cursor-pointer" onClick={() => onSelect(t)}><rect x={bx} y={y + 6} width={bw} height={6} rx={2} fill="#374151" opacity="0.6" />{t.progreso > 0 && <rect x={bx} y={y + 6} width={bw * t.progreso / 100} height={6} rx={2} fill="#10b981" />}</g>
              const expectedPct = progHoy > 0 ? Math.min(100, Math.round(((progHoy - bx) / bw) * 100)) : 0
              const behind = t.progreso < expectedPct - 10 && expectedPct > 0
              const barColor = behind ? '#dc2626' : t.progreso >= 100 ? '#10b981' : '#3371ff'
              return <g key={t.id} className="cursor-pointer" onClick={() => onSelect(t)}>
                <rect x={bx} y={y + 2} width={bw} height={16} rx={4} fill="#e5e7eb" opacity="0.5" />
                <rect x={bx} y={y + 2} width={Math.max(bw * t.progreso / 100, 0)} height={16} rx={4} fill={barColor} opacity="0.85" />
                {bw > 28 && <text x={bx + bw / 2} y={y + 11} textAnchor="middle" dominantBaseline="central" fontSize="8" fill={t.progreso > 30 ? 'white' : '#666'} fontWeight="500" fontFamily="system-ui">{t.progreso}%</text>}
                {behind && <circle cx={bx + bw + 6} cy={y + 10} r="3" fill="#dc2626" opacity="0.8" />}
              </g>
            })}
          </svg>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-6 rounded bg-[#3371ff]" />En progreso</span>
        <span className="flex items-center gap-1"><span className="h-2 w-6 rounded bg-[#10b981]" />Completado</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#dc2626]" />Retraso</span>
      </div>
    </Tarjeta>
  )
}

// ============ APU ============
function PanelAPU({ partida, empresas, onCerrar }) {
  const apu = partida.apu || []
  const mo = apu.filter(r => r.tipo === 'mano_obra'), mat = apu.filter(r => r.tipo === 'material'), maq = apu.filter(r => r.tipo === 'maquinaria')
  const sum = arr => arr.reduce((s, r) => s + (r.importe || 0), 0)
  const tMO = sum(mo), tMat = sum(mat), tMaq = sum(maq), total = tMO + tMat + tMaq
  const emp = empresas.find(e => e.id === partida.empresaId)

  return (
    <Tarjeta>
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5"><span className="font-mono text-[10px] text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded">{partida.codigo}</span>{partida.bloqueado && <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1"><Lock className="h-3 w-3" />Cert.</span>}<h3 className="text-sm font-semibold text-gray-900 truncate">{partida.nombre}</h3></div>
          <p className="text-[11px] text-gray-400">{partida.unidad} · P.U.: {(partida.precioUnitario || 0).toFixed(0)} · Cant: {partida.cantidadPresupuestada || 0}</p>
        </div>
        <button onClick={onCerrar} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 ml-3"><X className="h-4 w-4" /></button>
      </div>
      <TarjetaCuerpo>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3"><Building2 className="h-4 w-4 text-gray-400" /><div><p className="text-[10px] text-gray-400 uppercase">Empresa</p><p className="text-[13px] font-medium text-gray-900">{emp?.nombre || 'Sin asignar'}</p></div></div>
        {partida.descripcion && <p className="text-[12px] text-gray-500 mb-4">{partida.descripcion}</p>}
        {apu.length > 0 ? (
          <>
            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">APU — Análisis de Precio Unitario</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[['M.O.', tMO, 'text-teal-700 bg-teal-50', Users], ['Material', tMat, 'text-amber-700 bg-amber-50', Package], ['Maquinaria', tMaq, 'text-purple-700 bg-purple-50', Wrench], ['Total', total, 'text-dom-700 bg-dom-50', DollarSign]].map(([l, v, c, I]) => (
                <div key={l} className={`rounded-lg p-2 ${c.split(' ')[1]}`}><div className="flex items-center gap-1 mb-0.5"><I className={`h-3 w-3 ${c.split(' ')[0]}`} /><span className={`text-[9px] font-medium uppercase ${c.split(' ')[0]}`}>{l}</span></div><p className={`text-sm font-bold ${c.split(' ')[0]}`}>{v.toFixed(0)}</p></div>
              ))}
            </div>
            {[[mo, 'Mano de Obra', Users, 'teal'], [mat, 'Materiales', Package, 'amber'], [maq, 'Maquinaria', Wrench, 'purple']].map(([items, title, Icon, color]) => items.length > 0 && (
              <div key={title} className="mb-3">
                <div className="flex items-center gap-2 mb-1.5"><Icon className={`h-3.5 w-3.5 text-${color}-600`} /><span className="text-[11px] font-semibold text-gray-700 uppercase">{title}</span><span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5">{items.length}</span></div>
                <table className="w-full text-[11px]"><thead><tr className="border-b border-gray-100 text-gray-400 uppercase"><th className="text-left py-1 px-1 font-medium">Código</th><th className="text-left py-1 px-1 font-medium">Descripción</th><th className="text-right py-1 px-1 font-medium">Rend</th><th className="text-right py-1 px-1 font-medium">Precio</th><th className="text-right py-1 px-1 font-medium">Importe</th></tr></thead>
                  <tbody>{items.map((r, i) => <tr key={i}><td className="py-1 px-1 font-mono text-gray-500">{r.codigo}</td><td className="py-1 px-1 text-gray-700 max-w-[140px] truncate">{r.descripcion}</td><td className="py-1 px-1 text-right text-gray-600">{r.rendimiento?.toFixed(3)}</td><td className="py-1 px-1 text-right text-gray-600">{r.precio?.toFixed(0)}</td><td className="py-1 px-1 text-right font-medium text-gray-800">{r.importe?.toFixed(0)}</td></tr>)}</tbody></table>
              </div>
            ))}
          </>
        ) : <p className="text-sm text-gray-400 text-center py-6">Sin APU</p>}
      </TarjetaCuerpo>
    </Tarjeta>
  )
}
