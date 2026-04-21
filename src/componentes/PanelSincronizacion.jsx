// ===== Panel de Sincronización — PLACE + BOE + ChileCompra =====
import { useState, useEffect } from 'react'
import { X, RefreshCw, CheckCircle, AlertCircle, Clock, Zap, Database, Radio, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../servicios/firebase'
import { obtenerLicitacionesPLACE, sincronizarDesdePLACE, TIPOS_CONTRATO } from '../servicios/place'
import { obtenerLicitacionesBOE, parsearItemBOE, sincronizarDesdeBOE } from '../servicios/boe'
import { obtenerLicitacionesChile, sincronizarDesdeChile } from '../servicios/chilecompra'
import Boton from './ui/Boton'
import toast from 'react-hot-toast'

const CLOUD_FN_URL = import.meta.env.VITE_SYNC_PLACE_URL ||
  'https://europe-west1-tramitacion-webdom.cloudfunctions.net/syncPlace'

const FUENTES = [
  { id: 'place', label: 'PLACE', desc: 'España — Contratación del Sector Público', color: 'blue', disponible: true },
  { id: 'boe',   label: 'BOE',   desc: 'España — Boletín Oficial del Estado',      color: 'amber', disponible: true },
  { id: 'chile', label: 'Mercado Público', desc: 'Chile — ChileCompra (requiere ticket)', color: 'red', disponible: false },
]

export default function PanelSincronizacion({ onClose, onCompletado }) {
  const [fuenteActiva, setFuenteActiva] = useState('place')
  const [config, setConfig] = useState({
    fechaDesde: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    tipContrato: 2, importeMin: 500000, modo: 'cloud', ticketChile: '',
  })
  const [estado, setEstado] = useState('idle')
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [ultimasSync, setUltimasSync] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'sincronizaciones'), orderBy('timestamp', 'desc'), limit(5)))
        setUltimasSync(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {}
    })()
  }, [resultado])

  const cargando = estado === 'cargando' || estado === 'sincronizando'

  async function ejecutar() {
    setEstado('cargando'); setProgreso(10); setResultado(null)
    try {
      let licitaciones = []
      if (fuenteActiva === 'place') {
        if (config.modo === 'cloud') {
          setProgreso(30)
          const r = await fetch(CLOUD_FN_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fechaDesde: config.fechaDesde, tipContrato: config.tipContrato, importeMin: config.importeMin }),
          })
          setProgreso(80)
          const data = await r.json()
          if (!data.ok) throw new Error(data.error)
          setResultado(data); setEstado('ok')
          toast.success(`PLACE: ${data.importadas} importadas`); onCompletado?.(); return
        } else {
          licitaciones = await obtenerLicitacionesPLACE({ fechaDesde: config.fechaDesde, importeMin: config.importeMin, tipContrato: config.tipContrato })
          setProgreso(60); setEstado('sincronizando')
          const r = await sincronizarDesdePLACE(licitaciones)
          setResultado(r); setEstado('ok'); toast.success(`PLACE: ${r.importadas} importadas`); onCompletado?.(); return
        }
      } else if (fuenteActiva === 'boe') {
        setProgreso(30)
        const items = await obtenerLicitacionesBOE({ fechaDesde: config.fechaDesde })
        const lics = items.map(parsearItemBOE)
        setProgreso(60); setEstado('sincronizando')
        const r = await sincronizarDesdeBOE(lics)
        setResultado(r); setEstado('ok'); toast.success(`BOE: ${r.importadas} importadas`); onCompletado?.(); return
      } else if (fuenteActiva === 'chile') {
        if (!config.ticketChile) throw new Error('Introduce tu ticket de Mercado Público')
        setProgreso(30)
        licitaciones = await obtenerLicitacionesChile({ ticket: config.ticketChile, fechaInicio: config.fechaDesde })
        setProgreso(60); setEstado('sincronizando')
        const r = await sincronizarDesdeChile(licitaciones)
        setResultado(r); setEstado('ok'); toast.success(`ChileCompra: ${r.importadas} importadas`); onCompletado?.(); return
      }
    } catch (err) {
      setEstado('error'); setResultado({ error: err.message }); toast.error(err.message)
    }
  }

  const fuente = FUENTES.find(f => f.id === fuenteActiva)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Radio className="h-4 w-4" /></div>
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">Sincronización de licitaciones</h2>
              <p className="text-[11px] text-gray-400">PLACE · BOE · Mercado Público Chile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Selector de fuente */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2">Fuente de datos</label>
            <div className="grid grid-cols-3 gap-2">
              {FUENTES.map(f => (
                <button key={f.id} onClick={() => f.disponible && setFuenteActiva(f.id)} disabled={!f.disponible || cargando}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${fuenteActiva === f.id ? `border-${f.color}-500 bg-${f.color}-50` : 'border-gray-200 hover:border-gray-300'} ${!f.disponible ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <p className="text-[12px] font-bold text-gray-900">{f.label}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{f.desc}</p>
                  {!f.disponible && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-1 inline-block">Ticket pendiente</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Config PLACE */}
          {fuenteActiva === 'place' && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 block mb-1">Modo</label>
                  <select value={config.modo} onChange={e => setConfig({...config, modo: e.target.value})} disabled={cargando} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none">
                    <option value="cloud">Cloud Function (recomendado)</option>
                    <option value="browser">Browser / Proxy</option>
                  </select>
                </div>
                <div><label className="text-[10px] text-gray-500 block mb-1">Tipo contrato</label>
                  <select value={config.tipContrato} onChange={e => setConfig({...config, tipContrato: +e.target.value})} disabled={cargando} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none">
                    {Object.entries(TIPOS_CONTRATO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] text-gray-500 block mb-1">Fecha desde</label>
                  <input type="date" value={config.fechaDesde} onChange={e => setConfig({...config, fechaDesde: e.target.value})} disabled={cargando} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none" />
                </div>
                <div><label className="text-[10px] text-gray-500 block mb-1">Importe mínimo (€)</label>
                  <input type="number" value={config.importeMin} onChange={e => setConfig({...config, importeMin: +e.target.value})} disabled={cargando} step="50000" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Config BOE */}
          {fuenteActiva === 'boe' && (
            <div className="bg-amber-50 rounded-xl p-4 space-y-3">
              <p className="text-[11px] text-amber-800 font-medium">Consulta los últimos boletines y extrae anuncios de licitación automáticamente.</p>
              <div><label className="text-[10px] text-gray-500 block mb-1">Desde fecha</label>
                <input type="date" value={config.fechaDesde} onChange={e => setConfig({...config, fechaDesde: e.target.value})} disabled={cargando} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none" />
              </div>
              <p className="text-[10px] text-amber-600">⚠ Solo consulta 7 días máximo para evitar saturación del API del BOE.</p>
            </div>
          )}

          {/* Config Chile */}
          {fuenteActiva === 'chile' && (
            <div className="bg-red-50 rounded-xl p-4 space-y-3">
              <p className="text-[11px] text-red-800 font-medium">Introduce tu ticket de API de Mercado Público cuando lo recibas.</p>
              <div><label className="text-[10px] text-gray-500 block mb-1">Ticket API</label>
                <input type="text" value={config.ticketChile} onChange={e => setConfig({...config, ticketChile: e.target.value})} placeholder="Ej: A1B2C3D4..." disabled={cargando} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none font-mono" />
              </div>
              <div><label className="text-[10px] text-gray-500 block mb-1">Fecha inicio</label>
                <input type="date" value={config.fechaDesde} onChange={e => setConfig({...config, fechaDesde: e.target.value})} disabled={cargando} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] bg-white focus:outline-none" />
              </div>
              <a href="https://api.mercadopublico.cl" target="_blank" rel="noreferrer" className="text-[10px] text-red-600 underline">Solicitar ticket en api.mercadopublico.cl →</a>
            </div>
          )}

          {/* Progreso */}
          {cargando && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600 font-medium flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {estado === 'cargando' ? 'Descargando datos...' : 'Sincronizando con Firestore...'}
                </span>
                <span className="text-[11px] text-gray-500">{progreso}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          )}

          {/* Resultado OK */}
          {resultado && estado === 'ok' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-emerald-900 mb-2">Sincronización completada</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['Nuevas', resultado.importadas||0, 'text-emerald-600'],['Duplicadas', resultado.duplicadas||0, 'text-gray-400'],['Errores', resultado.errores?.length||0, 'text-red-500']].map(([l,v,c]) => (
                      <div key={l} className="bg-white rounded-lg p-2 text-center"><p className={`text-[18px] font-bold ${c}`}>{v}</p><p className="text-[9px] text-gray-500 uppercase">{l}</p></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {resultado && estado === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div><p className="text-[13px] font-semibold text-red-900">Error</p><p className="text-[11px] text-red-600 mt-1 font-mono">{resultado.error}</p></div>
              </div>
            </div>
          )}

          {/* Histórico */}
          {ultimasSync.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Clock className="h-3.5 w-3.5 text-gray-400" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Últimas sincronizaciones</span></div>
              <div className="space-y-1.5">
                {ultimasSync.map(s => {
                  const fecha = s.timestamp?.toDate?.() || new Date()
                  return (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.fuente === 'boe' ? 'bg-amber-100 text-amber-700' : s.fuente === 'chilecompra' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{(s.fuente||'place').toUpperCase()}</span>
                        <span className="text-[11px] text-gray-700">{fecha.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {s.tipo === 'scheduled' && <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">auto</span>}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold">+{s.resultado?.importadas||0}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-end gap-2">
          <Boton variante="secundario" tamano="sm" onClick={onClose} disabled={cargando}>Cerrar</Boton>
          <Boton icono={cargando ? null : RefreshCw} tamano="sm" onClick={ejecutar} disabled={cargando || (fuenteActiva === 'chile' && !config.ticketChile)}>
            {cargando ? 'Sincronizando...' : `Sincronizar ${fuente?.label}`}
          </Boton>
        </div>
      </div>
    </div>
  )
}
