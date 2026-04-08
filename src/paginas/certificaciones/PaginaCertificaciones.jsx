// ===== Certificaciones — Edit/Delete + Origen-Anterior-Actual + Bloqueo =====
import { useState, useEffect, useMemo } from 'react'
import {
  FileCheck2, Plus, X, DollarSign, Clock, CheckCircle,
  Send, ChevronRight, FileText, ArrowLeft, FolderKanban,
  Lock, Edit2, Trash2, Save,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import {
  obtenerPartidas, obtenerCertificaciones, generarCertificacion,
  cambiarEstadoCertificacion, actualizarCertificacion, eliminarCertificacion,
} from '../../servicios/presupuestos'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

const EST = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  pendiente: { label: 'Pendiente Firma', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  aprobada: { label: 'Aprobada', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  facturada: { label: 'Facturada', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
}

export default function PaginaCertificaciones() {
  const { usuario, esAdmin } = useAuth()
  const [proyectos, setProyectos] = useState([])
  const [proyectoId, setProyectoId] = useState(null)
  const [proyectoNombre, setProyectoNombre] = useState('')
  const [cargando, setCargando] = useState(true)
  const [partidas, setPartidas] = useState([])
  const [certs, setCerts] = useState([])
  const [certSel, setCertSel] = useState(null)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null) // cert being edited
  const [formEdit, setFormEdit] = useState({})

  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, d => { setProyectos(d.filter(p => p.tienePresupuesto)); setCargando(false) })
  }, [usuario, esAdmin])

  useEffect(() => {
    if (!proyectoId) return
    setCargando(true)
    Promise.all([obtenerPartidas(proyectoId), obtenerCertificaciones(proyectoId)])
      .then(([p, c]) => { setPartidas(p); setCerts(c) }).finally(() => setCargando(false))
  }, [proyectoId])

  async function crearCert() {
    setCreando(true)
    try {
      const nueva = await generarCertificacion(proyectoId)
      setCerts(prev => [nueva, ...prev])
      toast.success(`Cert. #${nueva.numero} creada`)
    } catch (err) { toast.error('Error: ' + err.message) }
    finally { setCreando(false) }
  }

  async function cambiarEst(certId, estado) {
    try {
      await cambiarEstadoCertificacion(proyectoId, certId, estado)
      setCerts(prev => prev.map(c => c.id === certId ? { ...c, estado } : c))
      if (certSel?.id === certId) setCertSel(prev => ({ ...prev, estado }))
      toast.success(`Estado → ${EST[estado].label}`)
      if (estado === 'aprobada') toast('Partidas bloqueadas', { icon: '🔒' })
    } catch { toast.error('Error') }
  }

  async function borrarCert(certId) {
    const cert = certs.find(c => c.id === certId)
    if (!cert || cert.estado !== 'borrador') { toast.error('Solo se eliminan borradores'); return }
    if (!window.confirm(`¿Eliminar Cert. #${cert.numero}?`)) return
    try {
      await eliminarCertificacion(proyectoId, certId)
      setCerts(prev => prev.filter(c => c.id !== certId))
      if (certSel?.id === certId) setCertSel(null)
      toast.success('Certificación eliminada')
    } catch { toast.error('Error al eliminar') }
  }

  function empezarEditar(cert) {
    if (cert.estado !== 'borrador') { toast.error('Solo se editan borradores'); return }
    setEditando(cert.id)
    setFormEdit({ importeOrigen: cert.importeOrigen || 0, importeAnterior: cert.importeAnterior || 0, importeActual: cert.importeActual || 0, mes: cert.mes, anio: cert.anio })
  }

  async function guardarEdicion() {
    try {
      await actualizarCertificacion(proyectoId, editando, formEdit)
      setCerts(prev => prev.map(c => c.id === editando ? { ...c, ...formEdit } : c))
      if (certSel?.id === editando) setCertSel(prev => ({ ...prev, ...formEdit }))
      setEditando(null)
      toast.success('Certificación actualizada')
    } catch { toast.error('Error al guardar') }
  }

  const totalCert = certs.filter(c => c.estado === 'aprobada' || c.estado === 'facturada').reduce((s, c) => s + (c.importeActual || 0), 0)
  const presTotal = partidas.filter(p => p.tipo !== 'capitulo').reduce((s, p) => s + (p.cantidadPresupuestada || 0) * (p.precioUnitario || 0), 0)
  const pctCert = presTotal > 0 ? Math.round((totalCert / presTotal) * 100) : 0

  // Selector proyecto
  if (!proyectoId) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Certificaciones</h1><p className="text-sm text-gray-400 mt-1">Certificaciones mensuales con bloqueo automático</p></div>
        {cargando ? <Cargando /> : (
          <Tarjeta>{proyectos.length === 0 ? <div className="py-12 text-center"><FolderKanban className="h-10 w-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Carga un BC3 primero.</p></div> : (
            <div className="divide-y divide-gray-50">{proyectos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/30 cursor-pointer" onClick={() => { setProyectoId(p.id); setProyectoNombre(`${p.numeroCaso} — ${p.nombre}`) }}>
                <div><span className="font-mono text-[10px] text-dom-600 bg-dom-50 px-1.5 py-0.5 rounded mr-2">{p.numeroCaso}</span><span className="text-[13px] font-semibold text-gray-900">{p.nombre}</span></div>
                <ChevronRight className="h-4 w-4 text-gray-300" /></div>))}</div>)}</Tarjeta>)}
      </div>
    )
  }

  if (cargando) return <Cargando texto="Cargando certificaciones..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setProyectoId(null); setCerts([]); setPartidas([]) }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><ArrowLeft className="h-4 w-4" /></button>
          <div><h1 className="text-xl font-bold text-gray-900">Certificaciones</h1><p className="text-[12px] text-gray-400">{proyectoNombre}</p></div>
        </div>
        <Boton icono={Plus} tamano="sm" cargando={creando} onClick={crearCert}>Generar Certificación</Boton>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Presupuesto', presTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 }), 'bg-gray-100 text-gray-700', DollarSign],
          ['Certificado', totalCert.toLocaleString('es-ES', { maximumFractionDigits: 0 }), 'bg-emerald-50 text-emerald-700', FileCheck2],
          ['Pendiente', (presTotal - totalCert).toLocaleString('es-ES', { maximumFractionDigits: 0 }), 'bg-amber-50 text-amber-700', Clock],
          ['% Cert.', `${pctCert}%`, 'bg-dom-50 text-dom-700', CheckCircle],
        ].map(([l, v, c, I]) => (
          <div key={l} className={`rounded-lg px-3 py-2.5 ${c.split(' ')[1]}`}>
            <div className="flex items-center gap-1.5 mb-0.5"><I className={`h-3.5 w-3.5 ${c.split(' ')[0]}`} /><span className={`text-[10px] font-medium uppercase ${c.split(' ')[0]}`}>{l}</span></div>
            <p className={`text-sm font-bold ${c.split(' ')[0]}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Donut */}
      <Tarjeta><TarjetaCuerpo>
        <div className="flex items-center justify-center gap-8 py-2">
          <svg viewBox="0 0 120 120" width="100" height="100"><circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" /><circle cx="60" cy="60" r="50" fill="none" stroke="#3371ff" strokeWidth="12" strokeDasharray={`${pctCert * 3.14} ${314 - pctCert * 3.14}`} strokeLinecap="round" transform="rotate(-90 60 60)" /><text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1F2937" fontFamily="system-ui">{pctCert}%</text><text x="60" y="72" textAnchor="middle" fontSize="10" fill="#9b9b9b" fontFamily="system-ui">certificado</text></svg>
          <div className="space-y-1.5 text-[12px]">
            {['facturada', 'aprobada', 'pendiente', 'borrador'].map(est => {
              const t = certs.filter(c => c.estado === est).reduce((s, c) => s + (c.importeActual || 0), 0)
              return t > 0 ? <div key={est} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${EST[est].dot}`} /><span className="text-gray-600 min-w-[100px]">{EST[est].label}</span><span className="font-semibold text-gray-800">{t.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span></div> : null
            })}
          </div>
        </div>
      </TarjetaCuerpo></Tarjeta>

      {/* List with EDIT and DELETE */}
      <Tarjeta>
        <div className="px-5 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-800">Historial de Certificaciones</h2></div>
        {certs.length === 0 ? <div className="py-12 text-center"><FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Sin certificaciones.</p></div> : (
          <div className="divide-y divide-gray-50">{certs.map(cert => {
            const e = EST[cert.estado] || EST.borrador
            const isEditing = editando === cert.id
            return (
              <div key={cert.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                {isEditing ? (
                  /* EDIT MODE */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-gray-900">Editando Cert. #{cert.numero}</span>
                      <div className="flex items-center gap-2">
                        <Boton tamano="xs" icono={Save} onClick={guardarEdicion}>Guardar</Boton>
                        <button onClick={() => setEditando(null)} className="p-1 rounded-md hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Mes</label><input value={formEdit.mes || ''} onChange={e => setFormEdit({ ...formEdit, mes: e.target.value })} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-dom-500 focus:outline-none" /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Año</label><input type="number" value={formEdit.anio || ''} onChange={e => setFormEdit({ ...formEdit, anio: +e.target.value })} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-dom-500 focus:outline-none" /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase block mb-1">A Origen</label><input type="number" value={formEdit.importeOrigen || ''} onChange={e => setFormEdit({ ...formEdit, importeOrigen: +e.target.value })} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-dom-500 focus:outline-none" /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase block mb-1">Actual</label><input type="number" value={formEdit.importeActual || ''} onChange={e => setFormEdit({ ...formEdit, importeActual: +e.target.value })} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-dom-500 focus:outline-none" /></div>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setCertSel(cert)}>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${e.color}`}><FileCheck2 className="h-4 w-4" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-gray-900">Cert. #{cert.numero}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${e.color}`}><span className={`h-1.5 w-1.5 rounded-full ${e.dot}`} />{e.label}</span>
                          {(cert.estado === 'aprobada' || cert.estado === 'facturada') && <Lock className="h-3 w-3 text-amber-500" />}
                        </div>
                        <p className="text-[11px] text-gray-400">{cert.mes} {cert.anio} · {(cert.lineas || []).length} partidas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <p className="text-[13px] font-bold text-gray-900">{(cert.importeActual || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-gray-400">Origen: {(cert.importeOrigen || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                      </div>
                      {/* ACTION BUTTONS */}
                      {cert.estado === 'borrador' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => empezarEditar(cert)} className="p-1.5 rounded-md text-gray-400 hover:text-dom-600 hover:bg-dom-50 transition-colors" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => borrarCert(cert.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}</div>
        )}
      </Tarjeta>

      {/* Detail panel */}
      {certSel && (
        <Tarjeta>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div><h3 className="text-sm font-semibold text-gray-900">Cert. #{certSel.numero} — {certSel.mes} {certSel.anio}</h3></div>
            <div className="flex items-center gap-2">
              {certSel.estado === 'borrador' && <Boton variante="secundario" tamano="xs" icono={Send} onClick={() => cambiarEst(certSel.id, 'pendiente')}>Enviar a Firma</Boton>}
              {certSel.estado === 'pendiente' && <Boton variante="exito" tamano="xs" icono={CheckCircle} onClick={() => cambiarEst(certSel.id, 'aprobada')}>Aprobar</Boton>}
              {certSel.estado === 'aprobada' && <Boton tamano="xs" icono={FileCheck2} onClick={() => cambiarEst(certSel.id, 'facturada')}>Facturar</Boton>}
              <button onClick={() => setCertSel(null)} className="p-1 rounded-md hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
            </div>
          </div>
          <TarjetaCuerpo>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">A Origen</p><p className="text-base font-bold text-gray-900 mt-1">{(certSel.importeOrigen || 0).toLocaleString('es-ES')}</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Anterior</p><p className="text-base font-bold text-gray-700 mt-1">{(certSel.importeAnterior || 0).toLocaleString('es-ES')}</p></div>
              <div className="text-center p-3 bg-dom-50 rounded-lg"><p className="text-[10px] text-dom-600 uppercase font-medium">Actual</p><p className="text-base font-bold text-dom-700 mt-1">{(certSel.importeActual || 0).toLocaleString('es-ES')}</p></div>
            </div>
            {certSel.capitulos?.length > 0 && (
              <div className="mb-5"><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Capítulos</h4>
                <table className="w-full text-[12px]"><thead><tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase"><th className="text-left py-2 px-2">Cap.</th><th className="text-right py-2 px-2">Origen</th><th className="text-right py-2 px-2">Actual</th></tr></thead>
                  <tbody>{certSel.capitulos.map((c, i) => <tr key={i} className="border-b border-gray-50"><td className="py-1.5 px-2 text-gray-700">{c.nombre}</td><td className="py-1.5 px-2 text-right text-gray-600">{(c.origen || 0).toLocaleString('es-ES')}</td><td className="py-1.5 px-2 text-right font-semibold text-gray-900">{(c.actual || 0).toLocaleString('es-ES')}</td></tr>)}</tbody></table></div>)}
            {certSel.lineas?.length > 0 && (
              <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Partidas ({certSel.lineas.length})</h4>
                <div className="max-h-[300px] overflow-y-auto"><table className="w-full text-[11px]"><thead><tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px]"><th className="text-left py-1.5 px-1">Código</th><th className="text-left py-1.5 px-1">Partida</th><th className="text-right py-1.5 px-1">Avance</th><th className="text-right py-1.5 px-1">P.U.</th><th className="text-right py-1.5 px-1">Importe</th><th className="text-left py-1.5 px-1">Empresa</th></tr></thead>
                  <tbody>{certSel.lineas.map((l, i) => <tr key={i} className="border-b border-gray-50"><td className="py-1 px-1 font-mono text-dom-600">{l.codigo}</td><td className="py-1 px-1 text-gray-700 max-w-[120px] truncate">{l.nombre}</td><td className="py-1 px-1 text-right text-gray-600">{l.avanceAcumulado}/{l.cantidadPresupuestada}</td><td className="py-1 px-1 text-right text-gray-500">{(l.precioUnitario || 0).toFixed(0)}</td><td className="py-1 px-1 text-right font-semibold text-gray-800">{(l.importeEjecutado || 0).toFixed(0)}</td><td className="py-1 px-1 text-gray-400">{l.empresa || '—'}</td></tr>)}</tbody></table></div></div>)}
            {/* Workflow */}
            <div className="mt-6 flex items-center gap-1.5">
              {['borrador', 'pendiente', 'aprobada', 'facturada'].map((est, i) => {
                const cur = certSel.estado === est, past = ['borrador', 'pendiente', 'aprobada', 'facturada'].indexOf(certSel.estado) > i
                return <div key={est} className="flex items-center gap-1.5 flex-1"><div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${cur ? 'bg-dom-600 text-white' : past ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{past ? '✓' : i + 1}</div><span className={`text-[10px] ${cur ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{EST[est].label}</span>{i < 3 && <div className={`flex-1 h-0.5 ${past ? 'bg-emerald-400' : 'bg-gray-200'}`} />}</div>
              })}
            </div>
            {certSel.estado === 'aprobada' && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2"><Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" /><p className="text-[12px] text-amber-800">Partidas incluidas están <strong>bloqueadas</strong>.</p></div>
            )}
          </TarjetaCuerpo>
        </Tarjeta>
      )}
    </div>
  )
}
