// ===== Viabilidad de Obra — RBAC + Exportación + Análisis 5 pasos =====
import { useState, useMemo, useRef } from 'react'
import {
  Upload, FileText, ArrowLeft, AlertTriangle, CheckCircle, XCircle,
  DollarSign, Users, Building2, BarChart3, TrendingUp, Shield,
  Clock, Layers, ChevronDown, ChevronRight, Target, Zap, Download,
  AlertCircle, ShieldCheck, ShieldAlert, ShieldX, Briefcase, Eye,
  EyeOff, FileSpreadsheet, FileDown, Filter, Printer, Lock,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import Tarjeta, { TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

const FMT = (n, dec = 0) => n ? Number(n).toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'
const PCT = (n) => n ? `${(n * 100).toFixed(1)}%` : '—'
const MSYM = { CLP: '$', EUR: '€', USD: '$', CAD: 'C$' }

export default function PaginaViabilidad() {
  const { datosUsuario, puedeVerMargenes, puedeAprobar, puedeExportarTodo, esAdmin } = useAuth()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [moneda, setMoneda] = useState('EUR')
  const [mostrarExport, setMostrarExport] = useState(false)
  const [exportOpts, setExportOpts] = useState({ alcance: 'completo', incluirMargenes: true, fase: 'estudio', formato: 'pdf' })
  const inputRef = useRef(null)

  // Role check: verMargenes
  const verMargenes = puedeVerMargenes !== false // default true if not set

  async function cargarExcel(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCargando(true)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const ab = await file.arrayBuffer()
      const wb = XLSX.read(ab, { type: 'array' })
      const cierre = parseCierre(wb, XLSX)
      const indirectos = parseIndirectos(wb, XLSX)
      const coefPaso = parseCoefPaso(wb, XLSX)
      const capitulos = parseCapitulos(wb, XLSX)
      setDatos({ archivo: file.name, pestanas: wb.SheetNames, cierre, indirectos, coefPaso, capitulos, _wb: wb, _XLSX: XLSX })
      toast.success(`${wb.SheetNames.length} pestañas cargadas`)
    } catch (err) { console.error(err); toast.error('Error: ' + err.message) }
    finally { setCargando(false) }
  }

  const analisis = useMemo(() => {
    if (!datos) return null
    const { cierre: c, indirectos, coefPaso, capitulos } = datos
    if (!c) return null
    const costoTotal = (c.costeDirectoOferta || 0) + (c.costeIndirecto || 0) + (c.costesPropOferta || 0) + (c.ggOferta || 0)
    const precioVenta = c.pecOferta || 0
    const margenAbs = precioVenta - costoTotal
    const margenPct = precioVenta > 0 ? margenAbs / precioVenta : 0
    const totalInd = indirectos?.total || 0
    const plazo = c.plazoIndirectos || c.plazoOfertado || 22
    const indMensual = plazo > 0 ? totalInd / plazo : 0
    const indPctCD = c.costeDirectoOferta > 0 ? totalInd / c.costeDirectoOferta : 0
    const caps = [...(capitulos || [])].sort((a, b) => (b.importe || 0) - (a.importe || 0))
    const totalCaps = caps.reduce((s, c) => s + (c.importe || 0), 0)
    let acum = 0
    const pareto = caps.map(cap => { acum += cap.importe || 0; return { ...cap, pctAcum: totalCaps > 0 ? acum / totalCaps : 0, pct: totalCaps > 0 ? (cap.importe || 0) / totalCaps : 0 } })
    const pareto80 = pareto.filter(p => p.pctAcum <= 0.82 || p.pct > 0.08)
    let dictamen = 'VIABLE', dictamenColor = 'emerald'
    const alertas = []
    if (margenPct < 0.02) { alertas.push('Margen inferior al 2%'); dictamen = 'VIABLE CON RIESGOS'; dictamenColor = 'amber' }
    if (margenPct < 0) { alertas.push('Margen NEGATIVO'); dictamen = 'NO VIABLE'; dictamenColor = 'red' }
    if (indPctCD > 0.15) { alertas.push('Indirectos > 15% del CD'); if (dictamenColor === 'emerald') { dictamen = 'VIABLE CON RIESGOS'; dictamenColor = 'amber' } }
    if (c.bajaPct > 0.20) { alertas.push(`Baja agresiva: ${PCT(c.bajaPct)}`); dictamenColor = 'amber'; dictamen = 'VIABLE CON RIESGOS' }
    const personalMensual = (indirectos?.personalTotal || 0) / plazo
    if (personalMensual > indMensual * 0.7) alertas.push('Personal > 70% de indirectos mensuales')
    return { margenAbs, margenPct, costoTotal, precioVenta, totalInd, plazo, indMensual, indPctCD, pareto, pareto80, dictamen, dictamenColor, alertas, personalMensual }
  }, [datos])

  // ===== EXPORT: PDF =====
  async function exportarPDF() {
    if (!datos || !analisis) return
    const c = datos.cierre || {}, a = analisis, sym = MSYM[moneda] || '€'
    const inclMarg = exportOpts.incluirMargenes && verMargenes

    let html = `<html><head><meta charset="utf-8"><title>Viabilidad - ${c.obra || 'Proyecto'}</title>
    <style>body{font-family:'DM Sans',Arial,sans-serif;padding:40px;color:#1a1a1a;font-size:12px;line-height:1.5}
    h1{font-size:18px;color:#1b51f5;margin-bottom:4px}h2{font-size:14px;color:#333;border-bottom:2px solid #3371ff;padding-bottom:4px;margin-top:24px}
    .badge{display:inline-block;padding:4px 12px;border-radius:8px;font-weight:700;font-size:14px}
    .green{background:#d1fae5;color:#065f46}.amber{background:#fef3c7;color:#92400e}.red{background:#fee2e2;color:#991b1b}
    table{width:100%;border-collapse:collapse;margin:8px 0}td,th{padding:6px 8px;border:1px solid #e5e7eb;text-align:left;font-size:11px}
    th{background:#f9fafb;font-weight:600;color:#6b7280;text-transform:uppercase;font-size:10px}
    .right{text-align:right}.bold{font-weight:700}.small{font-size:10px;color:#9ca3af}
    .header{display:flex;justify-content:space-between;align-items:center}
    .reco{background:#f0f5ff;border-left:3px solid #3371ff;padding:8px 12px;margin:6px 0;border-radius:0 6px 6px 0}
    </style></head><body>`

    html += `<div class="header"><div><h1>INFORME DE VIABILIDAD DE OBRA</h1><p class="small">Generado ${new Date().toLocaleDateString('es-ES')} · ${datos.archivo} · Modo: ${exportOpts.fase}</p></div>`
    html += `<span class="badge ${a.dictamenColor === 'emerald' ? 'green' : a.dictamenColor === 'amber' ? 'amber' : 'red'}">${a.dictamen}</span></div>`

    // 1. Mapeo
    html += `<h2>1. MAPEO DEL PROYECTO</h2><table><tr><th>Campo</th><th>Valor</th></tr>`
    html += `<tr><td>Obra</td><td class="bold">${c.obra || '—'}</td></tr>`
    html += `<tr><td>Cliente</td><td>${c.cliente || '—'}</td></tr>`
    html += `<tr><td>Plazo ofertado</td><td>${c.plazoOfertado || '—'} meses</td></tr>`
    html += `<tr><td>Baja adjudicación</td><td>${PCT(c.bajaPct)}</td></tr>`
    if (c.uteParticipantes?.length) c.uteParticipantes.forEach(u => { html += `<tr><td>UTE: ${u.nombre}</td><td>${PCT(u.participacion)} — ${sym}${FMT(u.importe)}</td></tr>` })
    html += `<tr><td>PEC Oferta</td><td class="bold">${sym}${FMT(c.pecOferta)}</td></tr>`
    if (inclMarg) html += `<tr><td>Coste Directo</td><td>${sym}${FMT(c.costeDirectoOferta)}</td></tr><tr><td>Coste Indirecto</td><td>${sym}${FMT(c.costeIndirecto)}</td></tr>`
    html += `</table>`

    // 2. Indirectos
    if (datos.indirectos && inclMarg) {
      const ind = datos.indirectos
      html += `<h2>2. COSTES INDIRECTOS</h2><table><tr><th>Concepto</th><th class="right">Importe</th><th class="right">% Total</th></tr>`
      ;[['Personal', ind.personalTotal], ['Maquinaria', ind.maquinariaTotal], ['Med. Auxiliares', ind.medAuxTotal], ['Inst. Provisionales', ind.instProvTotal], ['Varios', ind.variosTotal]].forEach(([n, v]) => {
        html += `<tr><td>${n}</td><td class="right">${sym}${FMT(v)}</td><td class="right">${a.totalInd > 0 ? PCT((v || 0) / a.totalInd) : '—'}</td></tr>`
      })
      html += `<tr><td class="bold">TOTAL</td><td class="right bold">${sym}${FMT(a.totalInd)}</td><td></td></tr></table>`
      html += `<p>Gasto mensual: ${sym}${FMT(a.indMensual)}/mes · ${PCT(a.indPctCD)} sobre CD · Plazo: ${a.plazo} meses</p>`
    }

    // 3. Margen (only if allowed)
    if (inclMarg) {
      html += `<h2>3. MARGEN REAL ESPERADO</h2><table><tr><th>Concepto</th><th class="right">Importe</th></tr>`
      html += `<tr><td>Precio venta (PEC)</td><td class="right">${sym}${FMT(a.precioVenta)}</td></tr>`
      html += `<tr><td>Coste total previsto</td><td class="right">${sym}${FMT(a.costoTotal)}</td></tr>`
      html += `<tr><td class="bold">Margen real</td><td class="right bold">${sym}${FMT(a.margenAbs)} (${PCT(a.margenPct)})</td></tr></table>`
    }

    // 4. Pareto
    html += `<h2>4. ANÁLISIS PARETO POR CAPÍTULOS</h2><table><tr><th>Capítulo</th><th class="right">Importe</th><th class="right">% Peso</th><th class="right">% Acum.</th></tr>`
    a.pareto.forEach(p => { html += `<tr><td>${p.nombre}</td><td class="right">${sym}${FMT(p.importe)}</td><td class="right">${PCT(p.pct)}</td><td class="right">${PCT(p.pctAcum)}</td></tr>` })
    html += `</table><p><strong>Capítulos críticos (80%):</strong> ${a.pareto80.map(p => p.nombre).join(', ')}</p>`

    // 5. Dictamen
    html += `<h2>5. DICTAMEN Y RECOMENDACIONES</h2>`
    html += `<p><strong>Dictamen:</strong> <span class="badge ${a.dictamenColor === 'emerald' ? 'green' : a.dictamenColor === 'amber' ? 'amber' : 'red'}">${a.dictamen}</span></p>`
    if (a.alertas.length) { html += `<p><strong>Alertas:</strong></p><ul>`; a.alertas.forEach(al => { html += `<li>⚠️ ${al}</li>` }); html += `</ul>` }
    html += `<div class="reco"><strong>1.</strong> Cerrar contratos con subcontratistas para ${a.pareto80.slice(0, 3).map(p => p.nombre).join(', ')} antes de iniciar obra.</div>`
    html += `<div class="reco"><strong>2.</strong> Gasto mensual indirectos: ${sym}${FMT(a.indMensual)}/mes (${PCT(a.indPctCD)} del CD). ${a.indPctCD > 0.12 ? 'Optimizar.' : 'Aceptable.'}</div>`
    html += `<div class="reco"><strong>3.</strong> Blindar margen mediante compras anticipadas, pagos aplazados y control estricto de mediciones.</div>`
    html += `<p class="small" style="margin-top:24px">DOM Platform · Informe generado automáticamente · ${new Date().toISOString()}</p></body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) { setTimeout(() => { win.print() }, 500) }
    toast.success('PDF listo para imprimir')
  }

  // ===== EXPORT: Excel =====
  async function exportarExcel() {
    if (!datos) return
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const wb = XLSX.utils.book_new()
      const c = datos.cierre || {}, a = analisis, ind = datos.indirectos || {}
      const inclMarg = exportOpts.incluirMargenes && verMargenes

      // Sheet 1: DASHBOARD
      const dash = [
        ['INFORME DE VIABILIDAD — ' + (c.obra || '')],
        ['Generado', new Date().toLocaleDateString('es-ES')],
        [], ['INDICADORES CLAVE'], [],
        ['PEM Total', c.pemOferta || ''],
        ['PEC Total', c.pecOferta || ''],
        ['Coste Indirectos', a?.totalInd || ''],
      ]
      if (inclMarg) {
        dash.push(['Margen Real (%)', a?.margenPct || ''])
        dash.push(['Margen Real (abs)', a?.margenAbs || ''])
      }
      dash.push([], ['DICTAMEN', a?.dictamen || ''])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dash), 'DASHBOARD')

      // Sheet 2: VIABILIDAD Y RIESGOS
      const risk = [['Capítulo', 'Importe', '% Peso', '% Acumulado', 'Riesgo']]
      ;(a?.pareto || []).forEach(p => {
        risk.push([p.nombre, p.importe, p.pct, p.pctAcum, p.pctAcum <= 0.82 ? 'ALTO — Cerrar precio' : 'Medio'])
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(risk), 'RIESGOS PARETO')

      // Sheet 3: INDIRECTOS
      if (inclMarg && ind.detallePersonal) {
        const indSheet = [['COSTES INDIRECTOS — Desglose'], [], ['Categoría', 'Concepto', 'Uds', 'Meses', 'Importe Ud', 'Total']]
        ;(ind.detallePersonal || []).filter(p => p.total > 0).forEach(p => { indSheet.push(['Personal', p.cargo, p.uds, p.meses, p.importe, p.total]) })
        indSheet.push([], ['RESUMEN', '', '', '', '', ''])
        ;[['Personal', ind.personalTotal], ['Maquinaria', ind.maquinariaTotal], ['Med. Auxiliares', ind.medAuxTotal], ['Inst. Prov.', ind.instProvTotal], ['Varios', ind.variosTotal], ['TOTAL', ind.total]].forEach(([n, v]) => indSheet.push([n, '', '', '', '', v]))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(indSheet), 'INDIRECTOS')
      }

      // Sheet 4: COEF PASO
      if (inclMarg && datos.coefPaso) {
        const cp = datos.coefPaso
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
          ['COEFICIENTES DE PASO'], [],
          ['CD', cp.cd], ['PEM', cp.pem], ['Coef PEM', cp.coefPEM], ['GG', cp.gg], ['BI', cp.bi], ['PEC', cp.pec], ['Coef PEC', cp.coefPEC]
        ]), 'COEF PASO')
      }

      XLSX.writeFile(wb, `Viabilidad_${(c.obra || 'proyecto').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.xlsx`)
      toast.success('Excel descargado')
    } catch (err) { toast.error('Error: ' + err.message) }
  }

  const sym = MSYM[moneda] || '€'
  const rolActual = datosUsuario?.rol || 'gestor'

  // ===== LANDING (sin datos) =====
  if (!datos) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Viabilidad de Obra</h1>
          <p className="text-sm text-gray-400 mt-1">Análisis pre-ejecución · Rol: {rolActual}</p></div>

        {/* RBAC Info */}
        <Tarjeta>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-gray-800">Matriz de accesos (tu rol)</h3>
            <span className="text-[10px] font-medium text-dom-600 bg-dom-50 px-2 py-0.5 rounded-full">{rolActual}</span>
          </div>
          <TarjetaCuerpo>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <RBACBadge label="Ver márgenes" allowed={verMargenes} icon={verMargenes ? Eye : EyeOff} />
              <RBACBadge label="Aprobar proyectos" allowed={puedeAprobar} icon={CheckCircle} />
              <RBACBadge label="Exportar completo" allowed={puedeExportarTodo} icon={Download} />
              <RBACBadge label="Editar indirectos" allowed={['admin', 'tecnico_estudio', 'gestor'].includes(rolActual)} icon={FileSpreadsheet} />
            </div>
          </TarjetaCuerpo>
        </Tarjeta>

        <Tarjeta><div className="px-5 py-16 text-center">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={cargarExcel} className="hidden" />
          {cargando ? <Cargando texto="Analizando cierre económico..." /> : (
            <>
              <Shield className="h-14 w-14 text-dom-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Cargar Cierre Económico</h2>
              <p className="text-sm text-gray-400 max-w-lg mx-auto mb-4">Sube el Excel con pestañas CIERRE, INDIRECTOS, COEF. PASO y CAPITULOS. Lectura read-only.</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <select value={moneda} onChange={e => setMoneda(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-dom-500 focus:outline-none">
                  <option value="EUR">🇪🇺 EUR</option><option value="CLP">🇨🇱 CLP</option><option value="USD">🇺🇸 USD</option><option value="CAD">🇨🇦 CAD</option>
                </select>
              </div>
              <Boton icono={Upload} onClick={() => inputRef.current?.click()}>Seleccionar Excel</Boton>
            </>
          )}
        </div></Tarjeta>

        {/* Methodology */}
        <Tarjeta>
          <div className="px-5 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-800">Metodología</h2></div>
          <TarjetaCuerpo>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[['1. Mapeo', 'Resumen ejecutivo', Target], ['2. Indirectos', 'Estructura fija', Users], ['3. Coeficientes', 'CD→PEM→PEC', TrendingUp], ['4. Pareto', 'Riesgo 80/20', BarChart3], ['5. Dictamen', 'Viable/No viable', Shield]].map(([t, d, I]) => (
                <div key={t} className="p-3 bg-gray-50 rounded-lg text-center"><I className="h-5 w-5 text-dom-500 mx-auto mb-2" /><p className="text-[12px] font-semibold text-gray-800">{t}</p><p className="text-[10px] text-gray-400">{d}</p></div>
              ))}
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      </div>
    )
  }

  const c = datos.cierre || {}, a = analisis
  if (!a) return <p>Error en análisis</p>

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setDatos(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><ArrowLeft className="h-4 w-4" /></button>
          <div><h1 className="text-xl font-bold text-gray-900">Análisis de Viabilidad</h1><p className="text-[12px] text-gray-400">{datos.archivo} · Rol: {rolActual}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="secundario" tamano="xs" icono={Download} onClick={() => setMostrarExport(!mostrarExport)}>Exportar</Boton>
          {puedeAprobar && <Boton variante="exito" tamano="xs" icono={CheckCircle}>Aprobar</Boton>}
          <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${a.dictamenColor === 'emerald' ? 'bg-emerald-50 border border-emerald-200' : a.dictamenColor === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
            {a.dictamenColor === 'emerald' ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : a.dictamenColor === 'amber' ? <ShieldAlert className="h-4 w-4 text-amber-600" /> : <ShieldX className="h-4 w-4 text-red-600" />}
            <span className={`text-[12px] font-bold ${a.dictamenColor === 'emerald' ? 'text-emerald-700' : a.dictamenColor === 'amber' ? 'text-amber-700' : 'text-red-700'}`}>{a.dictamen}</span>
          </div>
        </div>
      </div>

      {/* ===== EXPORT PANEL ===== */}
      {mostrarExport && (
        <Tarjeta>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-gray-800">Generador de Informes</h3>
            <button onClick={() => setMostrarExport(false)} className="p-1 rounded hover:bg-gray-100"><XCircle className="h-4 w-4 text-gray-400" /></button>
          </div>
          <TarjetaCuerpo>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Alcance</p>
                {['resumen', 'completo', 'pareto'].map(v => (
                  <label key={v} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="alcance" value={v} checked={exportOpts.alcance === v} onChange={e => setExportOpts({ ...exportOpts, alcance: e.target.value })} className="accent-dom-600" />
                    <span className="text-[12px] text-gray-700">{v === 'resumen' ? 'Resumen Ejecutivo (1 hoja)' : v === 'completo' ? 'Desglose Completo' : 'Solo Capítulos Pareto'}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Datos económicos</p>
                <label className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={exportOpts.incluirMargenes} onChange={e => setExportOpts({ ...exportOpts, incluirMargenes: e.target.checked })}
                    disabled={!verMargenes} className="accent-dom-600" />
                  <span className={`text-[12px] ${verMargenes ? 'text-gray-700' : 'text-gray-400'}`}>
                    {verMargenes ? 'Incluir Márgenes y BI' : '🔒 Presupuesto ciego (sin márgenes)'}
                  </span>
                </label>
                {!verMargenes && <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><Lock className="h-3 w-3" />Tu rol no permite ver márgenes</p>}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Fase</p>
                {['estudio', 'cierre', 'adjudicado'].map(v => (
                  <label key={v} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="fase" value={v} checked={exportOpts.fase === v} onChange={e => setExportOpts({ ...exportOpts, fase: e.target.value })} className="accent-dom-600" />
                    <span className="text-[12px] text-gray-700">{v === 'estudio' ? 'Fase de Estudio' : v === 'cierre' ? 'Cierre Licitación' : 'Adjudicado'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Boton icono={Printer} tamano="sm" onClick={exportarPDF}>Exportar PDF</Boton>
              <Boton variante="secundario" icono={FileSpreadsheet} tamano="sm" onClick={exportarExcel}>Excel Funcional</Boton>
              {!puedeExportarTodo && <span className="text-[10px] text-gray-400">Exportación limitada por rol</span>}
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {/* ===== 1. MAPEO ===== */}
      <SH num="1" titulo="Mapeo del Proyecto" icono={Target} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta><div className="px-5 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Datos generales</h3></div><TarjetaCuerpo>
          <DR l="Obra" v={c.obra || '—'} b /><DR l="Cliente" v={c.cliente || '—'} /><DR l="Plazo ofertado" v={`${c.plazoOfertado || '—'} meses`} /><DR l="Baja" v={PCT(c.bajaPct)} h={c.bajaPct > 0.15} />
          {c.uteParticipantes?.length > 0 && <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-[10px] text-gray-400 uppercase mb-2">UTE</p>{c.uteParticipantes.map((u, i) => <div key={i} className="flex justify-between py-1"><span className="text-[12px] text-gray-700">{u.nombre}</span><span className="text-[12px] font-semibold">{PCT(u.participacion)} · {sym}{FMT(u.importe)}</span></div>)}</div>}
        </TarjetaCuerpo></Tarjeta>
        <Tarjeta><div className="px-5 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Importes clave</h3></div><TarjetaCuerpo>
          {verMargenes ? (<><DR l="Coste Directo" v={`${sym}${FMT(c.costeDirectoOferta)}`} /><DR l="Coste Indirecto" v={`${sym}${FMT(c.costeIndirecto)}`} /><DR l="Costes proporcionales" v={`${sym}${FMT(c.costesPropOferta)}`} /><DR l="GG" v={`${sym}${FMT(c.ggOferta)}`} /></>) : <p className="text-[12px] text-gray-400 italic py-2 flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" />Costes ocultos por tu rol</p>}
          <hr className="border-gray-100 my-1" /><DR l="PEC Oferta" v={`${sym}${FMT(c.pecOferta)}`} b /><DR l="Presupuesto s/IVA" v={`${sym}${FMT(c.presupuestoSinIVA)}`} /><DR l="Presupuesto c/IVA" v={`${sym}${FMT(c.presupuestoConIVA)}`} />
        </TarjetaCuerpo></Tarjeta>
      </div>

      {/* ===== 2. INDIRECTOS ===== */}
      {verMargenes && (<>
        <SH num="2" titulo="Costes Indirectos" icono={Users} />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[['Personal', datos.indirectos?.personalTotal, 'teal'], ['Maquinaria', datos.indirectos?.maquinariaTotal, 'blue'], ['Med. Aux.', datos.indirectos?.medAuxTotal, 'purple'], ['Inst. Prov.', datos.indirectos?.instProvTotal, 'amber'], ['Varios', datos.indirectos?.variosTotal, 'gray']].map(([l, v, col]) => (
            <div key={l} className="rounded-lg p-3 bg-gray-50 border border-gray-200"><p className="text-[10px] font-medium uppercase text-gray-500">{l}</p><p className="text-[14px] font-bold text-gray-900 mt-1">{sym}{FMT(v)}</p><p className="text-[10px] text-gray-400">{a.totalInd > 0 ? PCT((v || 0) / a.totalInd) : '—'}</p></div>
          ))}
        </div>
        <Tarjeta><TarjetaCuerpo>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MM l="Total" v={`${sym}${FMT(a.totalInd)}`} /><MM l="Mensual" v={`${sym}${FMT(a.indMensual)}/mes`} /><MM l="% sobre CD" v={PCT(a.indPctCD)} w={a.indPctCD > 0.12} /><MM l="Personal/mes" v={`${sym}${FMT(a.personalMensual)}`} />
          </div>
        </TarjetaCuerpo></Tarjeta>
      </>)}

      {/* ===== 3. MÁRGENES ===== */}
      {verMargenes && (<>
        <SH num="3" titulo="Coeficientes y Márgenes" icono={TrendingUp} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Tarjeta><div className="px-5 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Conversión</h3></div><TarjetaCuerpo>
            <DR l="CD" v={`${sym}${FMT(datos.coefPaso?.cd)}`} /><DR l="Coef. PEM" v={datos.coefPaso?.coefPEM?.toFixed(4)} /><DR l="PEM" v={`${sym}${FMT(datos.coefPaso?.pem)}`} /><DR l="GG" v={`${sym}${FMT(datos.coefPaso?.gg)}`} /><DR l="BI" v={`${sym}${FMT(datos.coefPaso?.bi)}`} /><DR l="PEC" v={`${sym}${FMT(datos.coefPaso?.pec)}`} b /><DR l="Coef. PEC" v={datos.coefPaso?.coefPEC?.toFixed(4)} />
          </TarjetaCuerpo></Tarjeta>
          <Tarjeta><div className="px-5 py-3 border-b border-gray-100"><h3 className="text-[13px] font-semibold text-gray-800">Margen real</h3></div><TarjetaCuerpo>
            <div className="text-center py-4"><p className="text-[10px] text-gray-400 uppercase">PEC</p><p className="text-xl font-bold text-gray-900">{sym}{FMT(a.precioVenta)}</p><p className="text-[10px] text-gray-400 mt-1">menos coste total</p><p className="text-lg font-bold text-gray-600">- {sym}{FMT(a.costoTotal)}</p><hr className="my-3 border-gray-200" /><p className="text-[10px] text-gray-400 uppercase">Margen</p><p className={`text-2xl font-bold ${a.margenPct >= 0.05 ? 'text-emerald-600' : a.margenPct >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{sym}{FMT(a.margenAbs)} ({PCT(a.margenPct)})</p></div>
          </TarjetaCuerpo></Tarjeta>
        </div>
      </>)}

      {/* ===== 4. PARETO ===== */}
      <SH num="4" titulo="Riesgo por Capítulos (Pareto)" icono={BarChart3} />
      <Tarjeta><TarjetaCuerpo>
        <div className="space-y-1.5 mb-4">{a.pareto.map((cap, i) => {
          const maxImp = a.pareto[0]?.importe || 1, w = ((cap.importe || 0) / maxImp) * 100, is80 = cap.pctAcum <= 0.82
          return <div key={i} className="flex items-center gap-2"><span className="text-[10px] text-gray-500 w-[160px] truncate text-right">{cap.nombre}</span><div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative"><div className={`h-full rounded-full ${is80 ? 'bg-dom-500' : 'bg-gray-300'}`} style={{ width: `${w}%` }} /><span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-gray-700">{sym}{FMT(cap.importe)} ({PCT(cap.pct)})</span></div><span className="text-[9px] text-gray-400 w-[40px] text-right">{PCT(cap.pctAcum)}</span></div>
        })}</div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[12px] font-semibold text-amber-800">Capítulos críticos (80%): </p><p className="text-[11px] text-amber-700">{a.pareto80.map(p => p.nombre).join(', ')}</p></div>
      </TarjetaCuerpo></Tarjeta>

      {/* ===== 5. DICTAMEN ===== */}
      <SH num="5" titulo="Dictamen y Estrategia de Compras" icono={Shield} />
      <div className={`rounded-xl border-2 p-6 ${a.dictamenColor === 'emerald' ? 'border-emerald-300 bg-emerald-50/50' : a.dictamenColor === 'amber' ? 'border-amber-300 bg-amber-50/50' : 'border-red-300 bg-red-50/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          {a.dictamenColor === 'emerald' ? <ShieldCheck className="h-8 w-8 text-emerald-600" /> : a.dictamenColor === 'amber' ? <ShieldAlert className="h-8 w-8 text-amber-600" /> : <ShieldX className="h-8 w-8 text-red-600" />}
          <div><p className={`text-xl font-bold ${a.dictamenColor === 'emerald' ? 'text-emerald-700' : a.dictamenColor === 'amber' ? 'text-amber-700' : 'text-red-700'}`}>{a.dictamen}</p>
            {verMargenes && <p className="text-[12px] text-gray-500">Margen: {sym}{FMT(a.margenAbs)} ({PCT(a.margenPct)})</p>}
          </div>
        </div>
        {a.alertas.length > 0 && <div className="mb-4 space-y-1">{a.alertas.map((al, i) => <div key={i} className="flex items-center gap-2 text-[12px] text-amber-800"><AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{al}</div>)}</div>}
        <div className="space-y-2 mt-4"><p className="text-[11px] font-semibold text-gray-600 uppercase">Recomendaciones Compras / Jefe de Obra</p>
          <Reco n={1} t={`Cerrar contratos con subcontratistas para ${a.pareto80.slice(0, 3).map(p => p.nombre).join(', ')} ANTES de iniciar obra (${PCT(a.pareto80.reduce((s, p) => s + p.pct, 0))} del presupuesto).`} />
          <Reco n={2} t={`Indirectos: ${sym}${FMT(a.indMensual)}/mes (${PCT(a.indPctCD)} del CD). ${a.indPctCD > 0.12 ? 'Optimizar personal/maquinaria.' : 'Proporción aceptable.'}`} />
          <Reco n={3} t="Blindar margen: compras anticipadas con precio cerrado, pagos aplazados con proveedores, control estricto de mediciones desde certificación #1." />
        </div>
      </div>
    </div>
  )
}

// ===== PARSERS =====
function parseCierre(wb, XLSX) {
  let ws = null
  for (const n of ['CIERRE', 'CIERRE LANTANIA', 'Cierre']) { if (wb.Sheets[n]) { ws = wb.Sheets[n]; break } }
  if (!ws) return {}
  const v = (r, c) => { const cell = ws[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })]; return cell?.v }
  const ute = []
  if (v(10, 6)) ute.push({ nombre: v(10, 6), participacion: v(10, 9), importe: v(10, 11) })
  if (v(11, 6)) ute.push({ nombre: v(11, 6), participacion: v(11, 9), importe: v(11, 11) })
  return { obra: v(4, 4), cliente: v(5, 4), presupuestoSinIVA: v(10, 4), presupuestoConIVA: v(12, 4), ivaPct: v(11, 3), plazoPliego: v(14, 4), plazoOfertado: v(15, 4), plazoIndirectos: v(16, 4), costeDirectoEstudio: v(34, 4), costeDirectoOferta: v(34, 6), costeIndirecto: v(35, 6), costesPropEstudio: v(39, 4), costesPropOferta: v(39, 6), ggEstudio: v(40, 4), ggOferta: v(40, 6), pecOferta: v(42, 6), pemOferta: v(42, 6), bajaPct: v(51, 3), uteParticipantes: ute }
}
function parseIndirectos(wb, XLSX) {
  const ws = wb.Sheets['INDIRECTOS']; if (!ws) return null
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  let pT = 0, mqT = 0, maT = 0, ipT = 0, vT = 0, sec = '', dP = []
  for (const row of data) {
    const a = String(row[0] || '').toUpperCase()
    if (a.includes('PERSONAL')) sec = 'p'; else if (a.includes('MAQUINARIA')) sec = 'mq'; else if (a.includes('MED')) sec = 'ma'; else if (a.includes('INSTALACIONES')) sec = 'ip'; else if (a.includes('VARIOS')) sec = 'v'
    const t = parseFloat(row[7]) || 0; if (!t) continue
    if (sec === 'p') { pT += t; if (row[1]) dP.push({ cargo: row[1], uds: row[3] || 1, meses: row[4] || 0, importe: row[6] || 0, total: t }) }
    else if (sec === 'mq') mqT += t; else if (sec === 'ma') maT += t; else if (sec === 'ip') ipT += t; else if (sec === 'v') vT += t
  }
  return { personalTotal: pT, maquinariaTotal: mqT, medAuxTotal: maT, instProvTotal: ipT, variosTotal: vT, total: pT + mqT + maT + ipT + vT, detallePersonal: dP }
}
function parseCoefPaso(wb, XLSX) {
  const ws = wb.Sheets['COEF. PASO']; if (!ws) return null
  const v = (r, c) => { const cell = ws[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })]; return cell?.v }
  return { cd: v(4, 4), pec: v(5, 4), coefPEC: v(6, 4), pem: v(7, 4), coefPEM: v(8, 4), gg: v(9, 4), bi: v(10, 4) }
}
function parseCapitulos(wb, XLSX) {
  const ws = wb.Sheets['CAPITULOS Y PARTIDAS']; if (!ws) return null
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }), caps = []
  for (let i = 3; i < data.length; i++) { const r = data[i], n = r[3], imp = parseFloat(r[7]) || 0; if (n && imp > 0) caps.push({ numero: r[1], nombre: n, importe: imp }) }
  return caps
}

// ===== UI =====
function SH({ num, titulo, icono: I }) { return <div className="flex items-center gap-3 pt-2"><div className="h-8 w-8 rounded-lg bg-dom-100 flex items-center justify-center text-dom-700 font-bold text-[13px]">{num}</div><I className="h-4 w-4 text-dom-500" /><h2 className="text-[15px] font-semibold text-gray-900">{titulo}</h2></div> }
function DR({ l, v, b, h }) { return <div className="flex items-center justify-between py-1"><span className="text-[12px] text-gray-500">{l}</span><span className={`text-[12px] ${b ? 'font-bold text-gray-900' : 'text-gray-700'} ${h ? 'text-red-600 font-semibold' : ''}`}>{v}</span></div> }
function MM({ l, v, w }) { return <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">{l}</p><p className={`text-[14px] font-bold mt-1 ${w ? 'text-amber-600' : 'text-gray-900'}`}>{v}</p></div> }
function Reco({ n, t }) { return <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg"><div className="h-6 w-6 rounded-full bg-dom-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">{n}</div><p className="text-[12px] text-gray-700 leading-relaxed">{t}</p></div> }
function RBACBadge({ label, allowed, icon: I }) { return <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${allowed ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}><I className={`h-4 w-4 ${allowed ? 'text-emerald-600' : 'text-gray-400'}`} /><div><p className="text-[11px] font-medium text-gray-800">{label}</p><p className={`text-[10px] ${allowed ? 'text-emerald-600' : 'text-gray-400'}`}>{allowed ? 'Permitido' : 'Restringido'}</p></div></div> }
