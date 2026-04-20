// ===== Panel de Sincronización de Fuentes Externas =====
// Gestiona la conexión con feeds públicos de licitaciones (PLACE y otros).
// Se abre como modal desde el botón "Sync fuentes" en PaginaEstudios.
import { useState, useEffect } from 'react'
import {
  X, RefreshCw, CheckCircle, AlertCircle, Clock, Zap, Settings2,
  ExternalLink, Database, Radio,
} from 'lucide-react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../servicios/firebase'
import {
  obtenerLicitacionesPLACE, sincronizarDesdePLACE, TIPOS_CONTRATO,
} from '../servicios/place'
import Boton from './ui/Boton'
import toast from 'react-hot-toast'

// URL de la Cloud Function HTTP en producción
const CLOUD_FN_URL = import.meta.env.VITE_SYNC_PLACE_URL ||
  'https://europe-west1-tramitacion-webdom.cloudfunctions.net/syncPlace'

export default function PanelSincronizacion({ onClose, onCompletado }) {
  const [config, setConfig] = useState({
    fechaDesde: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    tipContrato: 2,
    importeMin: 500000,
    modo: 'cloud', // 'cloud' | 'browser'
  })
  const [estado, setEstado] = useState('idle') // idle | cargando | sincronizando | ok | error
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [ultimasSync, setUltimasSync] = useState([])

  // Cargar últimas 5 sincronizaciones
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'sincronizaciones'),
          orderBy('timestamp', 'desc'),
          limit(5)
        ))
        setUltimasSync(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {}
    })()
  }, [resultado])

  async function sincronizarCloud() {
    setEstado('cargando'); setProgreso(20); setResultado(null)
    try {
      const r = await fetch(CLOUD_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaDesde: config.fechaDesde,
          tipContrato: config.tipContrato,
          importeMin: config.importeMin,
        }),
      })
      setProgreso(60)
      const data = await r.json()
      setProgreso(100)
      if (!data.ok) throw new Error(data.error || 'Error desconocido')
      setResultado(data)
      setEstado('ok')
      toast.success(`${data.importadas} licitaciones importadas`)
      onCompletado?.()
    } catch (err) {
      setEstado('error')
      setResultado({ error: err.message })
      toast.error('Error: ' + err.message)
    }
  }

  async function sincronizarBrowser() {
    setEstado('cargando'); setProgreso(10); setResultado(null)
    try {
      setProgreso(30)
      const licitaciones = await obtenerLicitacionesPLACE({
        fechaDesde: config.fechaDesde,
        importeMin: config.importeMin,
        tipContrato: config.tipContrato,
      })
      setProgreso(60)
      setEstado('sincronizando')
      const r = await sincronizarDesdePLACE(licitaciones)
      setProgreso(100)
      setResultado(r)
      setEstado('ok')
      toast.success(`${r.importadas} licitaciones importadas (${r.duplicadas} duplicadas)`)
      onCompletado?.()
    } catch (err) {
      setEstado('error')
      setResultado({ error: err.message })
      toast.error('Error: ' + err.message)
    }
  }

  const ejecutar = () => config.modo === 'cloud' ? sincronizarCloud() : sincronizarBrowser()

  const cargando = estado === 'cargando' || estado === 'sincronizando'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">Sincronización fuentes públicas</h2>
              <p className="text-[11px] text-gray-400">PLACE · Plataforma de Contratación del Sector Público</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Modo */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2">Modo de ejecución</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfig(c => ({ ...c, modo: 'cloud' }))}
                disabled={cargando}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${config.modo === 'cloud' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[12px] font-semibold text-gray-900">Cloud Function</span>
                </div>
                <p className="text-[10px] text-gray-500">Recomendado · Sin CORS · Producción</p>
              </button>
              <button
                onClick={() => setConfig(c => ({ ...c, modo: 'browser' }))}
                disabled={cargando}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${config.modo === 'browser' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Database className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[12px] font-semibold text-gray-900">Browser (proxy)</span>
                </div>
                <p className="text-[10px] text-gray-500">Desarrollo · Usa allorigins</p>
              </button>
            </div>
          </div>

          {/* Configuración */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Parámetros</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Fecha desde</label>
                <input
                  type="date" value={config.fechaDesde}
                  onChange={e => setConfig({ ...config, fechaDesde: e.target.value })}
                  disabled={cargando}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] focus:border-blue-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Tipo contrato</label>
                <select
                  value={config.tipContrato}
                  onChange={e => setConfig({ ...config, tipContrato: +e.target.value })}
                  disabled={cargando}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] focus:border-blue-400 focus:outline-none bg-white"
                >
                  {Object.entries(TIPOS_CONTRATO).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-500 block mb-1">Importe mínimo (€)</label>
                <input
                  type="number" value={config.importeMin}
                  onChange={e => setConfig({ ...config, importeMin: +e.target.value })}
                  disabled={cargando}
                  step="50000"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] focus:border-blue-400 focus:outline-none bg-white"
                />
                <p className="text-[9px] text-gray-400 mt-0.5">Filtra licitaciones con importe superior (IVA excluido)</p>
              </div>
            </div>
          </div>

          {/* Barra progreso */}
          {cargando && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600 font-medium flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {estado === 'cargando' ? 'Descargando feed...' : 'Sincronizando con Firestore...'}
                </span>
                <span className="text-[11px] text-gray-500">{progreso}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          )}

          {/* Resultado */}
          {resultado && estado === 'ok' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-emerald-900 mb-2">Sincronización completada</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-[18px] font-bold text-emerald-600">{resultado.importadas || 0}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Nuevas</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-[18px] font-bold text-gray-400">{resultado.duplicadas || 0}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Duplicadas</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-[18px] font-bold text-red-500">{resultado.errores?.length || 0}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Errores</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {resultado && estado === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-red-900">Error de sincronización</p>
                  <p className="text-[11px] text-red-600 mt-1 font-mono">{resultado.error}</p>
                  {config.modo === 'cloud' && (
                    <p className="text-[10px] text-red-500 mt-2">
                      ¿La Cloud Function está desplegada? Revisa que `VITE_SYNC_PLACE_URL` apunte a tu endpoint correcto.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Histórico */}
          {ultimasSync.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Últimas sincronizaciones</span>
              </div>
              <div className="space-y-1.5">
                {ultimasSync.map(s => {
                  const fecha = s.timestamp?.toDate?.() || new Date()
                  return (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${s.tipo === 'scheduled' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                        <span className="text-[11px] text-gray-700">{fecha.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {s.tipo === 'scheduled' && <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">auto</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-600 font-semibold">+{s.resultado?.importadas || 0}</span>
                        <span className="text-[10px] text-gray-400">/ {s.resultado?.total || 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg p-3 flex items-start gap-2">
            <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <div>
              <p>Las licitaciones se deduplican por número de expediente antes de insertarse.</p>
              <p className="mt-0.5">Fuente: <code className="bg-gray-100 px-1 rounded">contrataciondelestado.es</code> · Feed ATOM público</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-end gap-2">
          <Boton variante="secundario" tamano="sm" onClick={onClose} disabled={cargando}>Cerrar</Boton>
          <Boton
            icono={cargando ? null : RefreshCw}
            tamano="sm"
            onClick={ejecutar}
            disabled={cargando}
          >
            {cargando ? 'Sincronizando...' : 'Sincronizar ahora'}
          </Boton>
        </div>
      </div>
    </div>
  )
}
