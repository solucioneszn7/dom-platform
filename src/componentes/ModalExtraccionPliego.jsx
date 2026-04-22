// FILE: src/componentes/ModalExtraccionPliego.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Agente: Programador 1 — Arquitecto de Datos y Extracción
// Misión: Al cargar un PDF/DOCX de pliego, extrae con IA:
//   · Presupuesto base + IVA   · Plazo de ejecución
//   · Ubicación                · Requisitos de clasificación
// y opcionalmente pre-rellena el formulario de la licitación.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import {
  X, Upload, FileText, Sparkles, CheckCircle2,
  AlertCircle, Loader2, MapPin, Clock, DollarSign,
  ShieldCheck, ClipboardCopy, ArrowRight, FileSearch,
} from 'lucide-react'

// ─── Llamada al API de Claude para extraer datos del pliego ──────────────────
async function extraerDatosConIA(base64Data, mediaType) {
  const prompt = `Eres un experto en licitaciones públicas españolas. Analiza este pliego de condiciones y extrae la siguiente información en formato JSON puro (sin markdown, sin texto adicional):

{
  "presupuestoBaseImponible": <número en euros, null si no encontrado>,
  "presupuestoConIVA": <número en euros, null si no encontrado>,
  "porcentajeIVA": <número, normalmente 21, null si no encontrado>,
  "plazoEjecucionMeses": <número de meses, null si no encontrado>,
  "plazoEjecucionTexto": <"ej: 24 meses", null si no encontrado>,
  "ubicacion": <"Ciudad, Provincia", null si no encontrado>,
  "clasificacionRequerida": [<"Grupo X, Subgrupo Y, Categoría Z">, ...],
  "organismo": <"nombre del organismo licitador", null si no encontrado>,
  "tipoProcedimiento": <"Abierto Ordinario|Negociado|Restringido|...", null>,
  "criteriosAdjudicacion": <"Varios Criterios|Sólo Precio|...", null>,
  "resumenEjecutivo": <"2-3 frases describiendo el objeto del contrato">,
  "referenciaCODICE": <"código CODICE o expediente", null si no encontrado>,
  "fechaLimiteOferta": <"YYYY-MM-DD", null si no encontrado>
}

Sé preciso con los importes. Si aparecen varios importes, usa el Presupuesto Base de Licitación (PBL). Responde SOLO con el JSON.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error API: ${response.status}`)
  }

  const data = await response.json()
  const texto = data.content?.map(b => b.text || '').join('') || ''
  const clean = texto.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ─── Formato de cifras ────────────────────────────────────────────────────────
const FMT_EUR = n => n
  ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  : '—'

// ─── Sub-componente: tarjeta de dato extraído ─────────────────────────────────
function DataCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'text-blue-500'    },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-500'   },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  icon: 'text-purple-500'  },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`${c.bg} rounded-2xl px-4 py-3`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <p className={`text-[13px] font-semibold ${c.text} leading-snug`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ModalExtraccionPliego({ onClose, onAplicar }) {
  const [fase, setFase] = useState('upload') // upload | procesando | resultado | error
  const [archivo, setArchivo] = useState(null)
  const [arrastre, setArrastre] = useState(false)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [progreso, setProgreso] = useState(0)
  const inputRef = useRef(null)

  // ── Procesar archivo ────────────────────────────────────────────────────────
  const procesar = useCallback(async (file) => {
    const tiposAceptados = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!tiposAceptados.includes(file.type)) {
      setError('Solo se aceptan archivos PDF o DOCX.')
      setFase('error')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('El archivo supera los 25 MB permitidos.')
      setFase('error')
      return
    }

    setArchivo(file)
    setFase('procesando')
    setProgreso(10)

    // Convertir a base64
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.onerror = () => rej(new Error('No se pudo leer el archivo'))
      r.readAsDataURL(file)
    })

    setProgreso(35)

    try {
      const mediaType = file.type === 'application/pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      setProgreso(60)
      const extracted = await extraerDatosConIA(base64, mediaType)
      setProgreso(100)
      setDatos(extracted)
      setFase('resultado')
    } catch (e) {
      setError(e.message || 'Error al analizar el documento.')
      setFase('error')
    }
  }, [])

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setArrastre(false)
    const file = e.dataTransfer.files[0]
    if (file) procesar(file)
  }, [procesar])

  const onDragOver = (e) => { e.preventDefault(); setArrastre(true) }
  const onDragLeave = () => setArrastre(false)

  // ── Aplicar datos extraídos al formulario de licitación ────────────────────
  const handleAplicar = () => {
    if (!datos || !onAplicar) return
    onAplicar({
      titulo: datos.resumenEjecutivo ? datos.resumenEjecutivo.split('.')[0].slice(0, 120) : '',
      cliente: datos.organismo || '',
      licitacionIVA: datos.presupuestoBaseImponible || 0,
      licitacionConIVA: datos.presupuestoConIVA || 0,
      plazoMeses: datos.plazoEjecucionMeses || 0,
      ubicacion: datos.ubicacion || '',
      clasificacionTexto: datos.clasificacionRequerida?.join(', ') || '',
      procedimiento: datos.tipoProcedimiento || 'Abierto Ordinario',
      criteriosValoracion: datos.criteriosAdjudicacion || '',
      fechaPresentacion: datos.fechaLimiteOferta || '',
      observaciones: datos.referenciaCODICE || '',
      extractoPliego: datos.resumenEjecutivo || '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-white w-full max-w-lg overflow-hidden animate-luxury-enter"
        style={{
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div
            className="flex items-center justify-center h-10 w-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #3371ff 0%, #0ea5e9 100%)' }}
          >
            <FileSearch className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Analizador de Pliegos IA
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Extracción automática de datos clave del contrato
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Cuerpo ──────────────────────────────────────────────────────── */}
        <div className="p-6">

          {/* FASE: Upload */}
          {fase === 'upload' && (
            <div>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: arrastre ? '#3371ff' : '#e5e7eb',
                  background: arrastre ? 'rgba(51,113,255,0.04)' : 'transparent',
                  transform: arrastre ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${arrastre ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Upload className={`h-6 w-6 ${arrastre ? 'text-dom-600' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-gray-700">
                    {arrastre ? 'Suelta el archivo aquí' : 'Arrastra el pliego aquí'}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    o haz clic para seleccionar · PDF o DOCX · máx. 25 MB
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={e => { if (e.target.files[0]) procesar(e.target.files[0]) }}
                />
              </div>

              {/* Info pill */}
              <div className="mt-4 flex items-start gap-2.5 bg-blue-50 rounded-xl px-4 py-3">
                <Sparkles className="h-4 w-4 text-dom-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  La IA extrae <strong className="text-gray-800">presupuesto base, IVA, plazos, ubicación y clasificación</strong> requerida automáticamente del documento.
                </p>
              </div>
            </div>
          )}

          {/* FASE: Procesando */}
          {fase === 'procesando' && (
            <div className="py-8 flex flex-col items-center gap-5">
              {/* Archivo cargado */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 w-full">
                <FileText className="h-5 w-5 text-dom-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{archivo?.name}</p>
                  <p className="text-[11px] text-gray-400">{(archivo?.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>

              {/* Spinner + progreso */}
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
                  <div className="absolute inset-0 rounded-full border-2 border-dom-500 border-t-transparent animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-dom-500" />
                </div>
                <p className="text-[13px] font-medium text-gray-700">Analizando pliego con IA…</p>
                <div className="progress-luxury w-full">
                  <div
                    className="progress-luxury-fill"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {progreso < 40 ? 'Leyendo documento…' : progreso < 70 ? 'Identificando cláusulas clave…' : 'Estructurando datos…'}
                </p>
              </div>
            </div>
          )}

          {/* FASE: Resultado */}
          {fase === 'resultado' && datos && (
            <div className="space-y-4">
              {/* Éxito */}
              <div className="flex items-center gap-2.5 bg-emerald-50 rounded-xl px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-[12px] font-medium text-emerald-700">
                  Extracción completada · {archivo?.name}
                </p>
              </div>

              {/* Resumen ejecutivo */}
              {datos.resumenEjecutivo && (
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Objeto del contrato</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed">{datos.resumenEjecutivo}</p>
                </div>
              )}

              {/* Grid de datos clave */}
              <div className="grid grid-cols-2 gap-3">
                <DataCard
                  icon={DollarSign}
                  label="Presupuesto base"
                  value={FMT_EUR(datos.presupuestoBaseImponible)}
                  sub={datos.presupuestoConIVA ? `con IVA: ${FMT_EUR(datos.presupuestoConIVA)}` : null}
                  color="blue"
                />
                <DataCard
                  icon={Clock}
                  label="Plazo de ejecución"
                  value={datos.plazoEjecucionTexto || (datos.plazoEjecucionMeses ? `${datos.plazoEjecucionMeses} meses` : '—')}
                  color="amber"
                />
                <DataCard
                  icon={MapPin}
                  label="Ubicación"
                  value={datos.ubicacion || '—'}
                  color="emerald"
                />
                <DataCard
                  icon={ShieldCheck}
                  label="Clasificación"
                  value={datos.clasificacionRequerida?.length
                    ? datos.clasificacionRequerida.slice(0, 2).join(' · ')
                    : 'No requerida'}
                  color="purple"
                />
              </div>

              {/* Datos adicionales */}
              {(datos.referenciaCODICE || datos.tipoProcedimiento) && (
                <div className="flex flex-wrap gap-2">
                  {datos.referenciaCODICE && (
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      REF: {datos.referenciaCODICE}
                    </span>
                  )}
                  {datos.tipoProcedimiento && (
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-medium">
                      {datos.tipoProcedimiento}
                    </span>
                  )}
                  {datos.criteriosAdjudicacion && (
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-1 rounded-lg font-medium">
                      {datos.criteriosAdjudicacion}
                    </span>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => { setFase('upload'); setDatos(null); setArchivo(null); setProgreso(0) }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Nuevo archivo
                </button>
                {onAplicar && (
                  <button
                    onClick={handleAplicar}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.99]"
                    style={{ background: 'linear-gradient(135deg, #1b51f5 0%, #0ea5e9 100%)' }}
                  >
                    Aplicar a licitación
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FASE: Error */}
          {fase === 'error' && (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900 mb-1">No se pudo analizar el documento</p>
                <p className="text-[12px] text-gray-400 max-w-xs">{error}</p>
              </div>
              <button
                onClick={() => { setFase('upload'); setError(''); setArchivo(null) }}
                className="px-5 py-2 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
