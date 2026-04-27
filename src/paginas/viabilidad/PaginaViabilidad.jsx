// ===== Viabilidad — Glass Aurora · Project-Manager grade · riesgo editable =====
// Trabaja con el BC3 cargado en Firebase. Añade parámetros de riesgo, flujo de
// caja, VAN/TIR/Payback, análisis de sensibilidad y dictamen ejecutivo.
// Disclaimer integrado: el usuario debe revisar y aprobar todo resultado.
import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft, AlertTriangle, CheckCircle, Users,
  BarChart3, Shield, Target, Download, Save, Plus, Trash2,
  ShieldCheck, ShieldAlert, ShieldX, Printer,
  ChevronRight, FolderKanban, X, TrendingUp, Activity, Sliders,
  Wallet, Calendar, Info,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { escucharProyectos } from '../../servicios/proyectos'
import {
  obtenerPartidas, obtenerPresupuesto, obtenerViabilidad,
  guardarViabilidad,
} from '../../servicios/presupuestos'
import { PERMISOS } from '../../constantes/tramitaciones'
import { obtenerJurisdiccion } from '../../utils/jurisdicciones'
import Boton from '../../componentes/ui/Boton'
import Cargando from '../../componentes/ui/Cargando'
import toast from 'react-hot-toast'

const PCT = (n, d = 1) => (n != null && !isNaN(n)) ? `${(n * 100).toFixed(d)}%` : '—'

const INDIRECTOS_TEMPLATE = [
  { id: 'jo', cat: 'PERSONAL', cargo: 'Jefe de obra', uds: 1, meses: 22, precio: 6000 },
  { id: 'jp', cat: 'PERSONAL', cargo: 'Jefe de producción', uds: 1, meses: 22, precio: 5000 },
  { id: 'enc', cat: 'PERSONAL', cargo: 'Encargado', uds: 1, meses: 22, precio: 5000 },
  { id: 'peon', cat: 'PERSONAL', cargo: 'Peón', uds: 2, meses: 22, precio: 3200 },
  { id: 'adm', cat: 'PERSONAL', cargo: 'Administrativo', uds: 1, meses: 20, precio: 3600 },
  { id: 'grua', cat: 'MAQUINARIA', cargo: 'Grúa torre', uds: 1, meses: 21, precio: 1300 },
  { id: 'plat', cat: 'MAQUINARIA', cargo: 'Plataformas', uds: 1, meses: 5, precio: 5000 },
  { id: 'and', cat: 'MEDIOS AUX', cargo: 'Andamios', uds: 1, meses: 6, precio: 6000 },
  { id: 'cas', cat: 'INST. PROV', cargo: 'Casetas', uds: 4, meses: 22, precio: 500 },
  { id: 'elec', cat: 'INST. PROV', cargo: 'Electricidad', uds: 1, meses: 22, precio: 1400 },
  { id: 'agua', cat: 'INST. PROV', cargo: 'Agua', uds: 1, meses: 22, precio: 400 },
  { id: 'vig', cat: 'VARIOS', cargo: 'Vigilancia', uds: 1, meses: 22, precio: 2000 },
  { id: 'veh', cat: 'VARIOS', cargo: 'Vehículos', uds: 3, meses: 22, precio: 600 },
  { id: 'ferr', cat: 'VARIOS', cargo: 'Ferretería', uds: 1, meses: 22, precio: 2400 },
]

// Defaults de riesgo PM-grade (editables por usuario)
const RIESGO_DEFAULT = {
  contingenciaPct: 0.03,         // Buffer técnico aplicado al CD
  escalacionAnualPct: 0.025,     // Inflación anual de costes
  costeFinancieroAnualPct: 0.06, // Interés sobre saldo deudor durante la obra
  segurosAvalesPct: 0.012,       // Avales + seguros sobre PEC
  retencionPct: 0.05,            // Retención por garantía habitual
  diasCobroMedio: 60,            // Plazo medio de cobro de certificaciones
  tasaDescuentoAnualPct: 0.08,   // Tasa para VAN
  consumoContingenciaPct: 0.5,   // % de contingencia que se asume consumida (escenario base)
}

const TABS = [
  { id: 'datos',   label: 'Datos & Cierre',   icon: Target },
  { id: 'riesgo',  label: 'Riesgo PM',        icon: Sliders },
  { id: 'indir',   label: 'Indirectos',       icon: Users },
  { id: 'flujo',   label: 'Flujo · VAN · TIR', icon: TrendingUp },
  { id: 'sens',    label: 'Sensibilidad',     icon: Activity },
  { id: 'pareto',  label: 'Pareto Capítulos', icon: BarChart3 },
  { id: 'dictamen', label: 'Dictamen',        icon: Shield },
]

export default function PaginaViabilidad() {
  const { usuario, datosUsuario, esAdmin, puedeAprobar } = useAuth()
  const rol = datosUsuario?.rol || 'gestor'
  const permisos = PERMISOS[rol] || PERMISOS.gestor || {}
  const puedeEditar = permisos.editarViabilidad !== false
  const jurisdiccion = obtenerJurisdiccion(datosUsuario?.pais)
  // Tabla local de monedas soportadas (símbolo + locale para formateo)
  const MONEDAS = {
    EUR: { simbolo: '€', locale: 'es-ES' },
    CLP: { simbolo: '$', locale: 'es-CL' },
    USD: { simbolo: 'US$', locale: 'en-US' },
    MXN: { simbolo: 'MX$', locale: 'es-MX' },
    ARS: { simbolo: 'AR$', locale: 'es-AR' },
    COP: { simbolo: 'CO$', locale: 'es-CO' },
    PEN: { simbolo: 'S/', locale: 'es-PE' },
  }

  const [proyectos, setProyectos] = useState([])
  const [proyectoId, setProyectoId] = useState(null)
  const [proyectoInfo, setProyectoInfo] = useState(null)
  const [cargandoP, setCargandoP] = useState(true)

  // Data from Firebase
  const [partidas, setPartidas] = useState([])
  const [presupuesto, setPresupuesto] = useState(null)
  const [viabilidad, setViabilidad] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Editable state
  const [tab, setTab] = useState('datos')
  const [indirectos, setIndirectos] = useState([])
  const [cierre, setCierre] = useState({ plazoMeses: 22, bajaPct: 0, ggPct: 0.13, biPct: 0.06, pecOferta: 0, cliente: '', obra: '', moneda: '' })
  const [riesgo, setRiesgo] = useState(RIESGO_DEFAULT)
  const [paretoUmbral, setParetoUmbral] = useState(0.80) // editable: 0.60 / 0.70 / 0.80 / 0.90
  const [guardando, setGuardando] = useState(false)

  // Moneda activa: cierre.moneda override > jurisdicción del usuario
  const monedaActiva = cierre.moneda || jurisdiccion.moneda || 'EUR'
  const monedaInfo = MONEDAS[monedaActiva] || { simbolo: monedaActiva, locale: 'es-ES' }
  const SIM = monedaInfo.simbolo
  const FMT = (n, d = 0) => (n != null && !isNaN(n)) ? Number(n).toLocaleString(monedaInfo.locale, { maximumFractionDigits: d }) : '—'
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    if (!usuario) return
    return escucharProyectos(usuario.uid, esAdmin, d => { setProyectos(d.filter(p => p.tienePresupuesto)); setCargandoP(false) })
  }, [usuario, esAdmin])

  useEffect(() => {
    if (!proyectoId) return
    setCargando(true)
    Promise.all([
      obtenerPartidas(proyectoId),
      obtenerPresupuesto(proyectoId),
      obtenerViabilidad(proyectoId),
    ]).then(([parts, pres, viab]) => {
      setPartidas(parts)
      setPresupuesto(pres)
      if (viab?.indirectos) setIndirectos(viab.indirectos)
      else setIndirectos(INDIRECTOS_TEMPLATE.map(t => ({ ...t })))

      if (viab?.cierre) setCierre(viab.cierre)
      else {
        const info = proyectoInfo || {}
        setCierre(prev => ({ ...prev, obra: info.nombre || '', cliente: info.propietario?.nombre || '' }))
      }

      if (viab?.riesgo) setRiesgo({ ...RIESGO_DEFAULT, ...viab.riesgo })
      if (typeof viab?.paretoUmbral === 'number') setParetoUmbral(viab.paretoUmbral)
      setViabilidad(viab)
    }).finally(() => setCargando(false))
  }, [proyectoId])

  // ===== CALCULATED =====
  const calc = useMemo(() => {
    // Coste Directo desde BC3
    const costeDirecto = partidas.filter(p => p.tipo !== 'capitulo').reduce((s, p) => s + (p.precioUnitario || 0) * (p.cantidadPresupuestada || 0), 0)

    // Indirectos
    const totalInd = indirectos.reduce((s, i) => s + (i.uds || 0) * (i.meses || 0) * (i.precio || 0), 0)
    const indByCat = {}
    for (const i of indirectos) {
      const t = (i.uds || 0) * (i.meses || 0) * (i.precio || 0)
      indByCat[i.cat] = (indByCat[i.cat] || 0) + t
    }

    // RIESGO PM-grade
    const plazoAnios = (cierre.plazoMeses || 22) / 12
    const contingencia = costeDirecto * (riesgo.contingenciaPct || 0)
    const escalacion = costeDirecto * Math.max(0, plazoAnios - 0.5) * (riesgo.escalacionAnualPct || 0)
    const segurosAvales = (cierre.pecOferta > 0 ? cierre.pecOferta : costeDirecto) * (riesgo.segurosAvalesPct || 0)

    const cdAjustado = costeDirecto + contingencia * (riesgo.consumoContingenciaPct || 0) + escalacion

    // Coeficientes
    const gg = costeDirecto * (cierre.ggPct || 0)
    const bi = costeDirecto * (cierre.biPct || 0)
    const pem = costeDirecto + gg + bi
    const pecSinBaja = pem
    const baja = pecSinBaja * (cierre.bajaPct || 0)
    const pecOferta = cierre.pecOferta > 0 ? cierre.pecOferta : pecSinBaja - baja

    // Flujo de caja mensual (modelo simple lineal con desfase de cobro)
    const N = Math.max(1, cierre.plazoMeses || 22)
    const ingresoMensual = pecOferta / N
    const egresoMensualBase = (cdAjustado + totalInd) / N + segurosAvales / N
    const desfaseMeses = Math.max(0, Math.round((riesgo.diasCobroMedio || 0) / 30))
    const retencion = (riesgo.retencionPct || 0)

    const flujo = []
    let acumulado = 0
    for (let m = 1; m <= N + desfaseMeses; m++) {
      // Ingreso del mes m: certificación de hace `desfase` meses, neta de retención
      const ingreso = (m > desfaseMeses && m - desfaseMeses <= N) ? ingresoMensual * (1 - retencion) : 0
      // Devolución de retención al final
      const liberacionRetencion = (m === N + desfaseMeses) ? ingresoMensual * retencion * N : 0
      const egreso = (m <= N) ? egresoMensualBase : 0
      const neto = ingreso + liberacionRetencion - egreso
      acumulado += neto
      flujo.push({ mes: m, ingreso, egreso, neto, acumulado })
    }

    // Coste financiero: interés mensual sobre saldo deudor (acumulado negativo)
    const tasaMensualFinanciera = Math.pow(1 + (riesgo.costeFinancieroAnualPct || 0), 1 / 12) - 1
    let costeFinanciero = 0
    for (const f of flujo) {
      if (f.acumulado < 0) costeFinanciero += -f.acumulado * tasaMensualFinanciera
    }

    // VAN con tasa de descuento mensual
    const tasaDescMensual = Math.pow(1 + (riesgo.tasaDescuentoAnualPct || 0), 1 / 12) - 1
    const van = flujo.reduce((s, f, i) => s + f.neto / Math.pow(1 + tasaDescMensual, i + 1), 0)

    // TIR (búsqueda binaria)
    const tir = calcularTIR(flujo.map(f => f.neto))

    // Payback (primer mes con acumulado > 0 después de mes 1)
    let payback = null
    for (const f of flujo) { if (f.acumulado >= 0 && f.mes > 1) { payback = f.mes; break } }

    // Costos finales y margen
    const costoTotal = cdAjustado + totalInd + segurosAvales + costeFinanciero
    const margenAbs = pecOferta - costoTotal
    const margenPct = pecOferta > 0 ? margenAbs / pecOferta : 0
    const indMensual = (cierre.plazoMeses || 1) > 0 ? totalInd / cierre.plazoMeses : 0
    const indPctCD = costeDirecto > 0 ? totalInd / costeDirecto : 0

    // Pareto por capítulo
    const capMap = new Map()
    for (const p of partidas) {
      if (p.tipo === 'capitulo') { capMap.set(p.codigo, { nombre: p.nombre, importe: 0 }); continue }
      const cap = p.codigoPadre || '__'
      if (!capMap.has(cap)) capMap.set(cap, { nombre: cap, importe: 0 })
      capMap.get(cap).importe += (p.precioUnitario || 0) * (p.cantidadPresupuestada || 0)
    }
    const caps = [...capMap.values()].filter(c => c.importe > 0).sort((a, b) => b.importe - a.importe)
    const totalCaps = caps.reduce((s, c) => s + c.importe, 0)
    let acumPct = 0
    const pareto = caps.map(c => { acumPct += c.importe; return { ...c, pct: totalCaps > 0 ? c.importe / totalCaps : 0, pctAcum: totalCaps > 0 ? acumPct / totalCaps : 0 } })
    // Umbral configurable (60/70/80/90). Buffer +0.02 para no cortar a la mitad.
    const pareto80 = pareto.filter(p => p.pctAcum <= paretoUmbral + 0.02 || p.pct > 0.08)

    // Sensibilidad: 3 escenarios
    const sensibilidad = [
      escenario('OPTIMISTA', { bajaDelta: -0.02, escalacionDelta: -0.01, contingenciaConsumoDelta: -0.3 }, costeDirecto, totalInd, cierre, riesgo, segurosAvales),
      escenario('BASE',      { bajaDelta: 0,    escalacionDelta: 0,     contingenciaConsumoDelta: 0    }, costeDirecto, totalInd, cierre, riesgo, segurosAvales),
      escenario('PESIMISTA', { bajaDelta: 0.05, escalacionDelta: 0.03,  contingenciaConsumoDelta: 0.5  }, costeDirecto, totalInd, cierre, riesgo, segurosAvales),
    ]

    // Dictamen
    let dictamen = 'VIABLE', dictColor = 'emerald'
    const alertas = []
    if (margenPct < 0.05) { alertas.push('Margen < 5%'); dictamen = 'VIABLE CON RIESGOS'; dictColor = 'amber' }
    if (margenPct < 0.02) { alertas.push('Margen crítico < 2%'); dictColor = 'amber' }
    if (margenPct < 0) { alertas.push('Margen NEGATIVO'); dictamen = 'NO VIABLE'; dictColor = 'red' }
    if (indPctCD > 0.15) { alertas.push('Indirectos > 15% del CD'); if (dictColor === 'emerald') { dictColor = 'amber'; dictamen = 'VIABLE CON RIESGOS' } }
    if (cierre.bajaPct > 0.20) alertas.push(`Baja agresiva: ${PCT(cierre.bajaPct)}`)
    if (van < 0) { alertas.push('VAN negativo a tasa exigida'); if (dictColor === 'emerald') { dictColor = 'amber'; dictamen = 'VIABLE CON RIESGOS' } }
    if (sensibilidad[2].margenPct < 0) alertas.push('Escenario pesimista entrega margen negativo')

    return {
      costeDirecto, cdAjustado, contingencia, escalacion, segurosAvales, costeFinanciero,
      totalInd, indByCat, gg, bi, pem, pecOferta, costoTotal, margenAbs, margenPct,
      indMensual, indPctCD, flujo, van, tir, payback,
      sensibilidad, pareto, pareto80, dictamen, dictColor, alertas,
    }
  }, [partidas, indirectos, cierre, riesgo, paretoUmbral])

  // ===== SAVE =====
  async function guardarTodo() {
    setGuardando(true)
    try {
      await guardarViabilidad(proyectoId, {
        indirectos, cierre, riesgo, paretoUmbral,
        calculado: {
          costeDirecto: calc.costeDirecto, totalIndirectos: calc.totalInd,
          contingencia: calc.contingencia, escalacion: calc.escalacion,
          costeFinanciero: calc.costeFinanciero, segurosAvales: calc.segurosAvales,
          pem: calc.pem, pecOferta: calc.pecOferta,
          margenAbs: calc.margenAbs, margenPct: calc.margenPct,
          van: calc.van, tir: calc.tir, payback: calc.payback,
          dictamen: calc.dictamen,
        },
      })
      toast.success('Viabilidad guardada')
    } catch (err) { toast.error('Error: ' + err.message) }
    finally { setGuardando(false) }
  }

  function editarIndirecto(idx, campo, valor) {
    setIndirectos(prev => prev.map((item, i) => i === idx ? { ...item, [campo]: campo === 'cargo' || campo === 'cat' ? valor : parseFloat(valor) || 0 } : item))
  }
  function agregarIndirecto() {
    setIndirectos(prev => [...prev, { id: `n${Date.now()}`, cat: 'VARIOS', cargo: 'Nuevo concepto', uds: 1, meses: cierre.plazoMeses, precio: 0 }])
  }
  function eliminarIndirecto(idx) { setIndirectos(prev => prev.filter((_, i) => i !== idx)) }

  function exportarPDF() {
    const c = calc, ci = cierre
    const html = `<html><head><meta charset="utf-8"><title>Viabilidad — ${ci.obra || ''}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;font-size:11px;color:#1a1a1a}h1{font-size:16px;color:#1b51f5}h2{font-size:13px;border-bottom:2px solid #3371ff;padding-bottom:3px;margin-top:20px}
    table{width:100%;border-collapse:collapse;margin:6px 0}td,th{padding:5px 7px;border:1px solid #e5e7eb;font-size:10px}th{background:#f3f4f6;font-weight:600}
    .r{text-align:right}.b{font-weight:700}.badge{display:inline-block;padding:3px 10px;border-radius:6px;font-weight:700;font-size:12px}
    .green{background:#d1fae5;color:#065f46}.amber{background:#fef3c7;color:#92400e}.red{background:#fee2e2;color:#991b1b}
    .disclaimer{margin-top:24px;padding:12px;border:1px solid #fbbf24;background:#fffbeb;font-size:10px;color:#78350f;border-radius:6px}</style></head><body>
    <h1>INFORME DE VIABILIDAD — ${ci.obra || proyectoInfo?.nombre || ''}</h1>
    <p>Cliente: ${ci.cliente || ''} · Plazo: ${ci.plazoMeses} meses · Jurisdicción: ${jurisdiccion.pais} (${jurisdiccion.moneda}) · ${new Date().toLocaleDateString('es-ES')}</p>
    <span class="badge ${c.dictColor === 'emerald' ? 'green' : c.dictColor === 'amber' ? 'amber' : 'red'}">${c.dictamen}</span>
    <h2>RESUMEN ECONÓMICO</h2>
    <table><tr><th>Concepto</th><th class="r">Importe</th></tr>
    <tr><td>Coste Directo (BC3, ${partidas.filter(p => p.tipo !== 'capitulo').length} partidas)</td><td class="r b">${SIM}${FMT(c.costeDirecto)}</td></tr>
    <tr><td>Contingencia técnica (${PCT(riesgo.contingenciaPct)}, consumo ${PCT(riesgo.consumoContingenciaPct)})</td><td class="r">${SIM}${FMT(c.contingencia * riesgo.consumoContingenciaPct)}</td></tr>
    <tr><td>Escalación de costes</td><td class="r">${SIM}${FMT(c.escalacion)}</td></tr>
    <tr><td>Costes Indirectos (${indirectos.length} conceptos)</td><td class="r">${SIM}${FMT(c.totalInd)}</td></tr>
    <tr><td>Seguros y avales</td><td class="r">${SIM}${FMT(c.segurosAvales)}</td></tr>
    <tr><td>Coste financiero estimado</td><td class="r">${SIM}${FMT(c.costeFinanciero)}</td></tr>
    <tr><td>GG (${PCT(ci.ggPct)})</td><td class="r">${SIM}${FMT(c.gg)}</td></tr>
    <tr><td>BI (${PCT(ci.biPct)})</td><td class="r">${SIM}${FMT(c.bi)}</td></tr>
    <tr><td>PEM</td><td class="r">${SIM}${FMT(c.pem)}</td></tr>
    <tr><td class="b">PEC Oferta</td><td class="r b">${SIM}${FMT(c.pecOferta)}</td></tr>
    <tr><td class="b">Margen Real</td><td class="r b">${SIM}${FMT(c.margenAbs)} (${PCT(c.margenPct)})</td></tr>
    <tr><td>VAN @ ${PCT(riesgo.tasaDescuentoAnualPct)} anual</td><td class="r">${SIM}${FMT(c.van)}</td></tr>
    <tr><td>TIR mensual / anualizada</td><td class="r">${c.tir ? PCT(c.tir, 2) + ' / ' + PCT(Math.pow(1 + c.tir, 12) - 1, 2) : '—'}</td></tr>
    <tr><td>Payback</td><td class="r">${c.payback ? c.payback + ' meses' : 'No recupera en plazo'}</td></tr>
    </table>
    <h2>SENSIBILIDAD</h2>
    <table><tr><th>Escenario</th><th class="r">Coste total</th><th class="r">Margen</th><th class="r">Margen %</th></tr>
    ${c.sensibilidad.map(s => `<tr><td><b>${s.nombre}</b></td><td class="r">${SIM}${FMT(s.costoTotal)}</td><td class="r">${SIM}${FMT(s.margenAbs)}</td><td class="r">${PCT(s.margenPct)}</td></tr>`).join('')}
    </table>
    <h2>PARETO — CAPÍTULOS CRÍTICOS</h2>
    <table><tr><th>Capítulo</th><th class="r">Importe</th><th class="r">%</th><th class="r">Acum</th></tr>
    ${c.pareto.map(p => `<tr><td>${p.nombre}</td><td class="r">${SIM}${FMT(p.importe)}</td><td class="r">${PCT(p.pct)}</td><td class="r">${PCT(p.pctAcum)}</td></tr>`).join('')}</table>
    <h2>DICTAMEN</h2><p class="badge ${c.dictColor === 'emerald' ? 'green' : c.dictColor === 'amber' ? 'amber' : 'red'}">${c.dictamen}</p>
    ${c.alertas.length ? '<ul>' + c.alertas.map(a => `<li>⚠ ${a}</li>`).join('') + '</ul>' : ''}
    <div class="disclaimer">
      <b>AVISO DE RESPONSABILIDAD:</b> este informe se genera automáticamente desde los antecedentes ingresados por el usuario.
      El usuario es responsable de revisar, fiscalizar y aprobar los cómputos, mediciones y resultados aquí presentados antes de
      utilizarlos en cualquier acto profesional, contractual, administrativo o penal. La plataforma facilita herramientas de cálculo;
      no garantiza responsabilidad alguna sobre las decisiones que el usuario adopte. Si detecta incongruencias entre los antecedentes
      y los cómputos, debe comunicarlo al desarrollador para mejora continua del servicio, sin perjuicio de los actos ya ejecutados.
      Normativa aplicable declarada: ${jurisdiccion.legislacionContractual}.
    </div>
    <p style="margin-top:14px;font-size:9px;color:#999">Acua Conect · Generado ${new Date().toISOString()}</p></body></html>`
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300)
  }

  // ===== SELECTOR DE PROYECTO =====
  if (!proyectoId) {
    return (
      <div className="space-y-6 animate-page-enter">
        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Viabilidad de Obra</h1>
          <p className="text-[13px] text-white/55 mt-1">
            Análisis económico desde BC3 · Riesgo · VAN/TIR · Sensibilidad · Jurisdicción {jurisdiccion.bandera} {jurisdiccion.pais}
          </p>
        </div>
        {cargandoP ? <Cargando /> : (
          <div className="card-premium p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="text-[13px] font-semibold text-white/85">Proyectos con presupuesto BC3 cargado</h2>
            </div>
            {proyectos.length === 0 ? (
              <div className="py-14 text-center">
                <FolderKanban className="h-10 w-10 text-white/20 mx-auto mb-3" />
                <p className="text-[13px] text-white/45">Carga un BC3 en Planificación primero.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {proyectos.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { setProyectoId(p.id); setProyectoInfo(p) }}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04] transition-colors text-left">
                    <div>
                      <span className="font-mono text-[10px] text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded mr-2">{p.numeroCaso}</span>
                      <span className="text-[13px] font-semibold text-white">{p.nombre}</span>
                      <p className="text-[11px] text-white/45">{p.presupuestoResumen?.totalPartidas || 0} partidas · {p.moneda || jurisdiccion.moneda}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/30" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (cargando) return <Cargando texto="Cargando datos BC3 del proyecto..." />
  const c = calc

  return (
    <div className="space-y-5 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setProyectoId(null); setPartidas([]) }} className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-white">Viabilidad de Obra</h1>
            <p className="text-[12px] text-white/45">
              {proyectoInfo?.numeroCaso} — {proyectoInfo?.nombre} · {partidas.filter(p => p.tipo !== 'capitulo').length} partidas BC3
              · {jurisdiccion.bandera} {jurisdiccion.pais} ({jurisdiccion.moneda})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {puedeEditar && <Boton icono={Save} tamano="xs" cargando={guardando} onClick={guardarTodo}>Guardar</Boton>}
          <Boton variante="secundario" tamano="xs" icono={Download} onClick={() => setShowExport(!showExport)}>Exportar</Boton>
          {puedeAprobar && <Boton variante="exito" tamano="xs" icono={CheckCircle} onClick={() => toast.success('Proyecto aprobado por responsable')}>Aprobar</Boton>}
          <DictamenBadge c={c} />
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] px-4 py-2.5 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-amber-300 flex-shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-amber-100/85 leading-snug">
          Los cálculos se generan a partir de los antecedentes que tú cargas. <strong>Tú eres responsable de revisar, fiscalizar y aprobar</strong> el dictamen y los cómputos antes de usarlos.
          Si detectas incongruencias, comunícalas para mejora del servicio. Aplica normativa: {jurisdiccion.legislacionContractual}.
        </p>
      </div>

      {showExport && (
        <div className="card-premium p-4 flex items-center gap-3">
          <Boton icono={Printer} tamano="sm" onClick={exportarPDF}>PDF</Boton>
          <Boton variante="secundario" tamano="xs" onClick={() => { setShowExport(false); toast('Excel: próximamente') }}>Excel</Boton>
          <button onClick={() => setShowExport(false)} className="ml-auto p-1 rounded hover:bg-white/[0.06]"><X className="h-4 w-4 text-white/50" /></button>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KPI l="CD ajustado" v={`${SIM}${FMT(c.cdAjustado)}`} sub={`base ${SIM}${FMT(c.costeDirecto)}`} c="violet" />
        <KPI l="Indirectos" v={`${SIM}${FMT(c.totalInd)}`} sub={PCT(c.indPctCD) + ' del CD'} c="cyan" />
        <KPI l="PEC Oferta" v={`${SIM}${FMT(c.pecOferta)}`} sub={`baja ${PCT(cierre.bajaPct)}`} c="pink" />
        <KPI l="Margen" v={`${SIM}${FMT(c.margenAbs)}`} sub={PCT(c.margenPct)} c={c.margenPct >= 0.05 ? 'emerald' : c.margenPct >= 0 ? 'amber' : 'rose'} />
        <KPI l="VAN" v={`${SIM}${FMT(c.van)}`} sub={`@ ${PCT(riesgo.tasaDescuentoAnualPct)}`} c={c.van >= 0 ? 'emerald' : 'rose'} />
        <KPI l="TIR / Payback" v={c.tir ? PCT(Math.pow(1 + c.tir, 12) - 1, 1) : '—'} sub={c.payback ? `Payback m${c.payback}` : 'sin payback'} c="violet" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06]">
        {TABS.map(t => {
          const TIcon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-t-lg text-[12px] font-medium flex items-center gap-1.5 transition-all ${active ? 'bg-white/[0.06] text-white border border-white/10 border-b-transparent' : 'text-white/50 hover:text-white/85 hover:bg-white/[0.03]'}`}>
              <TIcon className="h-3.5 w-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'datos' && (
        <div className="card-premium p-5 space-y-3">
          <SectionTitle icon={Target} title="Datos del proyecto y cierre" hint="Editables. PEC Oferta = 0 calcula automático con la baja." />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Obra" value={cierre.obra} onChange={v => setCierre({ ...cierre, obra: v })} disabled={!puedeEditar} />
            <Field label="Cliente" value={cierre.cliente} onChange={v => setCierre({ ...cierre, cliente: v })} disabled={!puedeEditar} />
            <Field label="Plazo (meses)" value={cierre.plazoMeses} type="number" onChange={v => setCierre({ ...cierre, plazoMeses: +v })} disabled={!puedeEditar} />
            <Field label="Baja adjudicación (%)" value={(cierre.bajaPct * 100).toFixed(2)} type="number" step="0.1" onChange={v => setCierre({ ...cierre, bajaPct: +v / 100 })} disabled={!puedeEditar} />
            <Field label="GG (%)" value={(cierre.ggPct * 100).toFixed(2)} type="number" step="0.1" onChange={v => setCierre({ ...cierre, ggPct: +v / 100 })} disabled={!puedeEditar} />
            <Field label="BI (%)" value={(cierre.biPct * 100).toFixed(2)} type="number" step="0.1" onChange={v => setCierre({ ...cierre, biPct: +v / 100 })} disabled={!puedeEditar} />
            <Field label={`PEC Oferta (${SIM}, 0=auto)`} value={cierre.pecOferta} type="number" onChange={v => setCierre({ ...cierre, pecOferta: +v })} disabled={!puedeEditar} />
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-white/40 font-semibold mb-1">Moneda</label>
              <select
                value={monedaActiva}
                onChange={e => setCierre({ ...cierre, moneda: e.target.value })}
                disabled={!puedeEditar}
                className={`w-full rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none ${!puedeEditar ? 'bg-white/[0.03] border border-white/[0.06] text-white/45 cursor-not-allowed' : 'bg-white/5 border border-white/10 text-white focus:border-violet-400'}`}
              >
                {Object.keys(MONEDAS).map(code => (
                  <option key={code} value={code} className="bg-[#0f0c1c]">{code} ({MONEDAS[code].simbolo})</option>
                ))}
              </select>
              <p className="text-[10px] text-white/40 mt-1">Por defecto: {jurisdiccion.moneda} ({jurisdiccion.pais}). Puedes cambiarla por proyecto.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'riesgo' && (
        <div className="card-premium p-5 space-y-4">
          <SectionTitle icon={Sliders} title="Parámetros de riesgo (PM-grade)" hint="Editables — cada parámetro impacta margen, VAN y dictamen." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <RangoField label="Contingencia técnica" value={riesgo.contingenciaPct} min={0} max={0.15} step={0.005} onChange={v => setRiesgo({ ...riesgo, contingenciaPct: v })} disabled={!puedeEditar} hint="Buffer sobre CD ante imprevistos" />
            <RangoField label="Consumo de contingencia" value={riesgo.consumoContingenciaPct} min={0} max={1} step={0.05} onChange={v => setRiesgo({ ...riesgo, consumoContingenciaPct: v })} disabled={!puedeEditar} hint="% del buffer que asumes consumido" />
            <RangoField label="Escalación anual de costes" value={riesgo.escalacionAnualPct} min={0} max={0.10} step={0.005} onChange={v => setRiesgo({ ...riesgo, escalacionAnualPct: v })} disabled={!puedeEditar} hint="Inflación esperada en plazo de obra" />
            <RangoField label="Coste financiero anual" value={riesgo.costeFinancieroAnualPct} min={0} max={0.20} step={0.005} onChange={v => setRiesgo({ ...riesgo, costeFinancieroAnualPct: v })} disabled={!puedeEditar} hint="Interés sobre saldo deudor" />
            <RangoField label="Seguros y avales" value={riesgo.segurosAvalesPct} min={0} max={0.05} step={0.0025} onChange={v => setRiesgo({ ...riesgo, segurosAvalesPct: v })} disabled={!puedeEditar} hint="% sobre PEC Oferta" />
            <RangoField label="Retención por garantía" value={riesgo.retencionPct} min={0} max={0.10} step={0.005} onChange={v => setRiesgo({ ...riesgo, retencionPct: v })} disabled={!puedeEditar} hint="% retenido en cada certificación" />
            <Field label="Días de cobro medio" value={riesgo.diasCobroMedio} type="number" onChange={v => setRiesgo({ ...riesgo, diasCobroMedio: +v })} disabled={!puedeEditar} />
            <RangoField label="Tasa de descuento (VAN)" value={riesgo.tasaDescuentoAnualPct} min={0} max={0.20} step={0.005} onChange={v => setRiesgo({ ...riesgo, tasaDescuentoAnualPct: v })} disabled={!puedeEditar} hint="Coste de capital exigido" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <MiniStat l="Contingencia consumida" v={`${SIM}${FMT(c.contingencia * riesgo.consumoContingenciaPct)}`} sub={`de ${SIM}${FMT(c.contingencia)} disponibles`} />
            <MiniStat l="Escalación estimada" v={`${SIM}${FMT(c.escalacion)}`} sub={`${cierre.plazoMeses} meses`} />
            <MiniStat l="Coste financiero estimado" v={`${SIM}${FMT(c.costeFinanciero)}`} sub="sobre saldo deudor" w={c.costeFinanciero > c.margenAbs * 0.3} />
          </div>
        </div>
      )}

      {tab === 'indir' && (
        <div className="card-premium p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <SectionTitle icon={Users} title={`Costes indirectos (${indirectos.length} conceptos)`} hint="Editable. Total = Uds × Meses × Precio." />
          </div>
          <div className="hidden lg:grid grid-cols-12 gap-1 px-4 py-2 text-[10px] font-medium text-white/35 uppercase border-b border-white/[0.04]">
            <span className="col-span-2">Categoría</span>
            <span className="col-span-3">Concepto</span>
            <span className="col-span-1 text-center">Uds</span>
            <span className="col-span-1 text-center">Meses</span>
            <span className="col-span-2 text-right">Precio/mes</span>
            <span className="col-span-2 text-right">Total</span>
            <span className="col-span-1"></span>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto sidebar-scroll">
            {indirectos.map((item, idx) => {
              const total = (item.uds || 0) * (item.meses || 0) * (item.precio || 0)
              return (
                <div key={item.id || idx} className="grid grid-cols-1 lg:grid-cols-12 gap-1 items-center px-4 py-1.5">
                  <div className="lg:col-span-2">
                    <select value={item.cat} onChange={e => editarIndirecto(idx, 'cat', e.target.value)} disabled={!puedeEditar}
                      className="w-full text-[10px] rounded bg-white/5 border border-white/10 px-1.5 py-1 text-white focus:border-violet-400 focus:outline-none">
                      {['PERSONAL', 'MAQUINARIA', 'MEDIOS AUX', 'INST. PROV', 'VARIOS'].map(c => <option key={c} value={c} className="bg-[#0f0c1c]">{c}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <input value={item.cargo} onChange={e => editarIndirecto(idx, 'cargo', e.target.value)} disabled={!puedeEditar}
                      className="w-full text-[11px] rounded bg-white/5 border border-white/10 px-2 py-1 text-white focus:border-violet-400 focus:outline-none" />
                  </div>
                  <div className="lg:col-span-1">
                    <input type="number" value={item.uds} onChange={e => editarIndirecto(idx, 'uds', e.target.value)} disabled={!puedeEditar}
                      className="w-full text-[11px] rounded bg-white/5 border border-white/10 px-1.5 py-1 text-center text-white focus:border-violet-400 focus:outline-none" />
                  </div>
                  <div className="lg:col-span-1">
                    <input type="number" value={item.meses} onChange={e => editarIndirecto(idx, 'meses', e.target.value)} disabled={!puedeEditar}
                      className="w-full text-[11px] rounded bg-white/5 border border-white/10 px-1.5 py-1 text-center text-white focus:border-violet-400 focus:outline-none" />
                  </div>
                  <div className="lg:col-span-2">
                    <input type="number" value={item.precio} onChange={e => editarIndirecto(idx, 'precio', e.target.value)} disabled={!puedeEditar}
                      className="w-full text-[11px] rounded bg-white/5 border border-white/10 px-2 py-1 text-right text-white focus:border-violet-400 focus:outline-none" />
                  </div>
                  <div className="lg:col-span-2 text-right">
                    <span className="text-[12px] font-semibold text-white/85">{SIM}{FMT(total)}</span>
                  </div>
                  <div className="lg:col-span-1 text-center">
                    {puedeEditar && (
                      <button onClick={() => eliminarIndirecto(idx)} className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-500/10">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {puedeEditar && (
            <div className="px-4 py-2 border-t border-white/[0.06]">
              <button onClick={agregarIndirecto} className="flex items-center gap-1.5 text-[11px] text-violet-300 hover:text-violet-200 font-medium">
                <Plus className="h-3 w-3" />Añadir concepto
              </button>
            </div>
          )}
          <div className="px-4 py-3 bg-white/[0.03] border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(c.indByCat).map(([cat, total]) => (
              <div key={cat}>
                <p className="text-[9px] text-white/40 uppercase">{cat}</p>
                <p className="text-[12px] font-bold text-white/85">{SIM}{FMT(total)}</p>
              </div>
            ))}
            <div>
              <p className="text-[9px] text-violet-300 uppercase font-semibold">TOTAL</p>
              <p className="text-[14px] font-bold text-violet-200">{SIM}{FMT(c.totalInd)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'flujo' && (
        <div className="space-y-4">
          <div className="card-premium p-5">
            <SectionTitle icon={TrendingUp} title="Flujo de caja proyectado" hint={`Modelo lineal · ${cierre.plazoMeses} meses + ${Math.round(riesgo.diasCobroMedio / 30)} de desfase de cobro · retención ${PCT(riesgo.retencionPct)}`} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              <KPI l="VAN" v={`${SIM}${FMT(c.van)}`} sub={`@ ${PCT(riesgo.tasaDescuentoAnualPct)} anual`} c={c.van >= 0 ? 'emerald' : 'rose'} />
              <KPI l="TIR anualizada" v={c.tir ? PCT(Math.pow(1 + c.tir, 12) - 1, 2) : '—'} sub={c.tir ? `mensual ${PCT(c.tir, 2)}` : 'no calculable'} c="violet" />
              <KPI l="Payback" v={c.payback ? `mes ${c.payback}` : '—'} sub={c.payback ? 'cuando acumulado ≥ 0' : 'no recupera'} c={c.payback && c.payback <= cierre.plazoMeses ? 'emerald' : 'amber'} />
            </div>

            <div className="overflow-x-auto sidebar-scroll">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-white/40 uppercase text-[10px] border-b border-white/[0.06]">
                    <th className="text-left py-2 px-2">Mes</th>
                    <th className="text-right py-2 px-2">Ingreso</th>
                    <th className="text-right py-2 px-2">Egreso</th>
                    <th className="text-right py-2 px-2">Neto</th>
                    <th className="text-right py-2 px-2">Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {c.flujo.map(f => (
                    <tr key={f.mes} className="hover:bg-white/[0.03]">
                      <td className="py-1.5 px-2 text-white/70">{f.mes}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-300">{f.ingreso ? SIM + FMT(f.ingreso) : '—'}</td>
                      <td className="py-1.5 px-2 text-right text-rose-300">{f.egreso ? SIM + FMT(f.egreso) : '—'}</td>
                      <td className={`py-1.5 px-2 text-right ${f.neto >= 0 ? 'text-white/85' : 'text-rose-300'}`}>{SIM}{FMT(f.neto)}</td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${f.acumulado >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{SIM}{FMT(f.acumulado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'sens' && (
        <div className="card-premium p-5">
          <SectionTitle icon={Activity} title="Análisis de sensibilidad" hint="Tres escenarios automáticos: optimista, base y pesimista." />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
            {c.sensibilidad.map(s => {
              const color = s.margenPct >= 0.05 ? 'emerald' : s.margenPct >= 0 ? 'amber' : 'rose'
              return (
                <div key={s.nombre} className={`rounded-xl border p-4 ${color === 'emerald' ? 'border-emerald-400/30 bg-emerald-500/5' : color === 'amber' ? 'border-amber-400/30 bg-amber-500/5' : 'border-rose-400/30 bg-rose-500/5'}`}>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-white/60 mb-2">{s.nombre}</p>
                  <p className="text-[12px] text-white/55 mb-3">{s.descripcion}</p>
                  <div className="space-y-1.5 text-[12px]">
                    <Row k="Coste total" v={`${SIM}${FMT(s.costoTotal)}`} />
                    <Row k="PEC oferta" v={`${SIM}${FMT(s.pecOferta)}`} />
                    <Row k="Margen" v={`${SIM}${FMT(s.margenAbs)}`} bold />
                    <Row k="Margen %" v={PCT(s.margenPct)} bold accent={color} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'pareto' && (
        <div className="card-premium p-5">
          <SectionTitle icon={BarChart3} title={`Riesgo por capítulos (Pareto ${Math.round(paretoUmbral * 100)}/${Math.round((1 - paretoUmbral) * 100)})`} hint="Capítulos críticos donde concentrar negociación con subcontratistas. Ajusta el umbral según el riesgo que asumas." />

          {/* Selector de umbral Pareto */}
          <div className="mt-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wide text-white/45 font-semibold">Umbral Pareto</span>
              <span className="text-[11px] text-violet-300 font-mono">{Math.round(paretoUmbral * 100)}/{Math.round((1 - paretoUmbral) * 100)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.60, 0.70, 0.80, 0.90].map(u => {
                const active = Math.abs(paretoUmbral - u) < 0.001
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => puedeEditar && setParetoUmbral(u)}
                    disabled={!puedeEditar}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${active ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/25 text-white border-violet-400/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08] hover:text-white'} ${!puedeEditar ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {Math.round(u * 100)}/{Math.round((1 - u) * 100)}
                  </button>
                )
              })}
            </div>
            <p className="text-[10.5px] text-white/45 mt-1.5 leading-snug">
              60/40 = más capítulos críticos (mayor cobertura) · 90/10 = menos capítulos críticos (mayor concentración).
            </p>
          </div>

          <div className="space-y-1.5 mt-4 mb-4">
            {c.pareto.map((cap, i) => {
              const maxImp = c.pareto[0]?.importe || 1
              const w = ((cap.importe || 0) / maxImp) * 100
              const isCritico = cap.pctAcum <= paretoUmbral + 0.02
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/55 w-[160px] truncate text-right">{cap.nombre}</span>
                  <div className="flex-1 bg-white/[0.05] rounded-full h-5 overflow-hidden relative">
                    <div className={`h-full rounded-full ${isCritico ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-white/15'}`} style={{ width: `${w}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white/85">{SIM}{FMT(cap.importe)} ({PCT(cap.pct)})</span>
                  </div>
                  <span className="text-[9px] text-white/40 w-[36px] text-right">{PCT(cap.pctAcum)}</span>
                </div>
              )
            })}
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-3">
            <p className="text-[12px] font-semibold text-amber-100/90">Críticos ({Math.round(paretoUmbral * 100)}%): {c.pareto80.map(p => p.nombre).join(', ') || '—'}</p>
          </div>
        </div>
      )}

      {tab === 'dictamen' && (
        <div className={`rounded-xl border-2 p-5 ${c.dictColor === 'emerald' ? 'border-emerald-400/40 bg-emerald-500/[0.06]' : c.dictColor === 'amber' ? 'border-amber-400/40 bg-amber-500/[0.06]' : 'border-rose-400/40 bg-rose-500/[0.06]'}`}>
          <div className="flex items-center gap-3 mb-4">
            {c.dictColor === 'emerald' ? <ShieldCheck className="h-7 w-7 text-emerald-300" /> : c.dictColor === 'amber' ? <ShieldAlert className="h-7 w-7 text-amber-300" /> : <ShieldX className="h-7 w-7 text-rose-300" />}
            <div>
              <p className={`text-[18px] font-bold ${c.dictColor === 'emerald' ? 'text-emerald-200' : c.dictColor === 'amber' ? 'text-amber-200' : 'text-rose-200'}`}>{c.dictamen}</p>
              <p className="text-[12px] text-white/55">
                Margen: {SIM}{FMT(c.margenAbs)} ({PCT(c.margenPct)}) · CD ajustado: {SIM}{FMT(c.cdAjustado)} · PEC: {SIM}{FMT(c.pecOferta)} · VAN: {SIM}{FMT(c.van)}
              </p>
            </div>
          </div>
          {c.alertas.length > 0 && (
            <div className="mb-4 space-y-1">
              {c.alertas.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-amber-100/85">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />{a}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Reco n={1} t={`Cerrar precios con subcontratistas para: ${c.pareto80.slice(0, 3).map(p => p.nombre).join(', ') || '—'} (${PCT(c.pareto80.reduce((s, p) => s + p.pct, 0))} del presupuesto).`} />
            <Reco n={2} t={`Indirectos: ${SIM}${FMT(c.indMensual)}/mes (${PCT(c.indPctCD)} del CD). ${c.indPctCD > 0.12 ? 'Optimizar personal o maquinaria.' : 'Proporción aceptable.'}`} />
            <Reco n={3} t={`VAN ${c.van >= 0 ? 'positivo' : 'negativo'} a tasa ${PCT(riesgo.tasaDescuentoAnualPct)}; payback ${c.payback ? 'mes ' + c.payback : 'no se alcanza'}.`} />
            <Reco n={4} t="Blindar margen: compras anticipadas, anticipos contractuales, control estricto desde la primera certificación. Reservar contingencia." />
            <Reco n={5} t="Validar este informe con dirección de obra y dirección financiera antes de cualquier acto contractual o administrativo." />
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Helpers =====

// Cálculo de TIR por bisección (mensual)
function calcularTIR(flujos) {
  if (!flujos || flujos.length === 0) return null
  const sumPos = flujos.filter(f => f > 0).reduce((s, f) => s + f, 0)
  const sumNeg = flujos.filter(f => f < 0).reduce((s, f) => s + f, 0)
  if (sumPos === 0 || sumNeg === 0) return null

  const npv = (rate) => flujos.reduce((s, f, i) => s + f / Math.pow(1 + rate, i + 1), 0)
  let lo = -0.99, hi = 1
  if (npv(lo) * npv(hi) > 0) return null
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    const v = npv(mid)
    if (Math.abs(v) < 0.01) return mid
    if (npv(lo) * v < 0) hi = mid; else lo = mid
  }
  return (lo + hi) / 2
}

function escenario(nombre, deltas, costeDirecto, totalInd, cierre, riesgo, segurosAvales) {
  const baja = (cierre.bajaPct || 0) + deltas.bajaDelta
  const escalAnual = Math.max(0, (riesgo.escalacionAnualPct || 0) + deltas.escalacionDelta)
  const consumoCont = Math.max(0, Math.min(1, (riesgo.consumoContingenciaPct || 0) + deltas.contingenciaConsumoDelta))
  const plazoAnios = (cierre.plazoMeses || 22) / 12

  const contingencia = costeDirecto * (riesgo.contingenciaPct || 0)
  const escalacion = costeDirecto * Math.max(0, plazoAnios - 0.5) * escalAnual
  const cdAjustado = costeDirecto + contingencia * consumoCont + escalacion

  const gg = costeDirecto * (cierre.ggPct || 0)
  const bi = costeDirecto * (cierre.biPct || 0)
  const pem = costeDirecto + gg + bi
  const pecOferta = cierre.pecOferta > 0 ? cierre.pecOferta : pem * (1 - baja)

  const costoTotal = cdAjustado + totalInd + segurosAvales
  const margenAbs = pecOferta - costoTotal
  const margenPct = pecOferta > 0 ? margenAbs / pecOferta : 0

  const desc = nombre === 'OPTIMISTA' ? 'Baja −2pp · escalación −1pp · menor consumo de contingencia.'
    : nombre === 'PESIMISTA' ? 'Baja +5pp · escalación +3pp · contingencia totalmente consumida.'
    : 'Parámetros declarados por el usuario.'

  return { nombre, descripcion: desc, costoTotal, pecOferta, margenAbs, margenPct }
}

// ===== UI Components (glass theme) =====

function DictamenBadge({ c }) {
  const Icon = c.dictColor === 'emerald' ? ShieldCheck : c.dictColor === 'amber' ? ShieldAlert : ShieldX
  const cls = c.dictColor === 'emerald' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
    : c.dictColor === 'amber' ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
    : 'border-rose-400/30 bg-rose-500/10 text-rose-200'
  return (
    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[12px] font-bold border ${cls}`}>
      <Icon className="h-4 w-4" />{c.dictamen}
    </div>
  )
}

function SectionTitle({ icon: I, title, hint }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-violet-300">
        <I className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-[14px] font-semibold text-white">{title}</h2>
        {hint && <p className="text-[11px] text-white/45 mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step, disabled }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide text-white/40 font-semibold mb-1">{label}</label>
      <input
        type={type} step={step} value={value ?? ''}
        onChange={e => onChange && onChange(e.target.value)} disabled={disabled}
        className={`w-full rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none ${disabled ? 'bg-white/[0.03] border border-white/[0.06] text-white/45 cursor-not-allowed' : 'bg-white/5 border border-white/10 text-white focus:border-violet-400'}`}
      />
    </div>
  )
}

function RangoField({ label, value, min, max, step, onChange, disabled, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wide text-white/40 font-semibold">{label}</label>
        <span className="text-[11px] text-violet-300 font-mono">{(value * 100).toFixed(2)}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-violet-500 disabled:opacity-50"
      />
      {hint && <p className="text-[10px] text-white/35 mt-0.5">{hint}</p>}
    </div>
  )
}

function KPI({ l, v, sub, c = 'violet' }) {
  // bg: gradient suave · label: tono palette · value: blanco fuerte · sub: tono palette suave
  const palette = {
    violet: { bg: 'from-violet-500/25 to-violet-500/5 border-violet-400/25', label: 'text-violet-200/85', sub: 'text-violet-200/60' },
    cyan:   { bg: 'from-cyan-500/25 to-cyan-500/5 border-cyan-400/30',       label: 'text-cyan-100',       sub: 'text-cyan-200/70' },
    pink:   { bg: 'from-pink-500/25 to-pink-500/5 border-pink-400/30',       label: 'text-pink-100',       sub: 'text-pink-200/70' },
    emerald:{ bg: 'from-emerald-500/25 to-emerald-500/5 border-emerald-400/25', label: 'text-emerald-200/85', sub: 'text-emerald-200/65' },
    amber:  { bg: 'from-amber-500/25 to-amber-500/5 border-amber-400/30',    label: 'text-amber-100',      sub: 'text-amber-200/70' },
    rose:   { bg: 'from-rose-500/25 to-rose-500/5 border-rose-400/30',       label: 'text-rose-100',       sub: 'text-rose-200/70' },
  }[c] || { bg: 'from-violet-500/25 to-violet-500/5 border-violet-400/25', label: 'text-violet-200/85', sub: 'text-violet-200/60' }
  return (
    <div className={`rounded-xl p-3 bg-gradient-to-br ${palette.bg} border`}>
      <p className={`text-[10px] uppercase tracking-wide font-semibold ${palette.label}`}>{l}</p>
      <p className="text-[15px] font-bold text-white mt-0.5 drop-shadow-sm">{v}</p>
      {sub && <p className={`text-[10px] mt-0.5 ${palette.sub}`}>{sub}</p>}
    </div>
  )
}

function MiniStat({ l, v, sub, w }) {
  return (
    <div className={`rounded-lg p-3 border ${w ? 'border-amber-400/30 bg-amber-500/5' : 'border-white/[0.06] bg-white/[0.03]'}`}>
      <p className="text-[10px] text-white/40 uppercase">{l}</p>
      <p className={`text-[14px] font-bold mt-0.5 ${w ? 'text-amber-200' : 'text-white/90'}`}>{v}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  )
}

function Row({ k, v, bold, accent }) {
  const accentCls = accent === 'emerald' ? 'text-emerald-300' : accent === 'amber' ? 'text-amber-300' : accent === 'rose' ? 'text-rose-300' : 'text-white/85'
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{k}</span>
      <span className={`${bold ? 'font-semibold' : ''} ${accent ? accentCls : 'text-white/85'}`}>{v}</span>
    </div>
  )
}

function Reco({ n, t }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{n}</div>
      <p className="text-[12px] text-white/75 leading-relaxed">{t}</p>
    </div>
  )
}
