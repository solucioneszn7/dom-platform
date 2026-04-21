// ===== Indicadores de Equipo y Proyectos =====
import { useState, useEffect } from 'react'
import { Users, Trophy, Clock, Activity, Briefcase, Timer } from 'lucide-react'
import { escucharUsuariosActivos, escucharTablerosActivos, obtenerProyectosAdjudicados } from '../../servicios/monitoreo'

function tiempoTranscurrido(fechaInicio) {
  if (!fechaInicio) return '—'
  const inicio = fechaInicio?.toDate ? fechaInicio.toDate() : new Date(fechaInicio)
  const ahora = new Date()
  const diff = ahora - inicio
  const horas = Math.floor(diff / 3600000)
  const dias = Math.floor(horas / 24)
  if (dias > 0) return `${dias}d ${horas % 24}h`
  return `${horas}h`
}

export default function IndicadoresEquipo() {
  const [usuarios, setUsuarios] = useState([])
  const [tableros, setTableros] = useState([])
  const [adjudicadas, setAdjudicadas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsubUsuarios = escucharUsuariosActivos(setUsuarios)
    const unsubTableros = escucharTablerosActivos(setTableros)
    
    obtenerProyectosAdjudicados().then(data => {
      setAdjudicadas(data)
      setCargando(false)
    })

    return () => { unsubUsuarios(); unsubTableros() }
  }, [])

  const usuariosActivos = usuarios.filter(u => {
    return tableros.some(t => 
      t.board?.groups?.some(g => 
        g.items?.some(i => i.cells?.owner === u.iniciales || i.cells?.owner === u.nombre)
      )
    )
  })

  const fasesEnProgreso = tableros.reduce((acc, t) => {
    t.board?.groups?.forEach(g => {
      g.items?.forEach(i => {
        if (i.cells?.estado === 'working') acc.working++
        else if (i.cells?.estado === 'done') acc.done++
        else if (i.cells?.estado === 'stuck') acc.stuck++
      })
    })
    return acc
  }, { working: 0, done: 0, stuck: 0 })

  if (cargando) return <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />

  return (
    <div className="space-y-4">
      {/* INDICADOR 1: Equipo Activo */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-600" />
            <h3 className="text-[13px] font-bold text-gray-800">Equipo Activo</h3>
          </div>
          <span className="text-[11px] font-medium text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
            {usuariosActivos.length} online
          </span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[200px] overflow-y-auto">
          {usuariosActivos.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              <Users className="h-6 w-6 mx-auto mb-2 text-gray-300" />
              Sin usuarios activos en proyectos
            </div>
          ) : (
            usuariosActivos.map(u => {
              let proyectoActual = 'Sin asignación'
              let faseActual = '—'
              let tiempo = '—'
              
              tableros.forEach(t => {
                t.board?.groups?.forEach(g => {
                  g.items?.forEach(i => {
                    if (i.cells?.owner === u.iniciales || i.cells?.owner === u.nombre) {
                      proyectoActual = t.tituloLicitacion || t.board?.name || 'Proyecto'
                      faseActual = i.cells?.fase || g.name || 'En curso'
                      tiempo = tiempoTranscurrido(t.creadoEn || t.actualizadoEn)
                    }
                  })
                })
              })

              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {u.iniciales || u.nombre?.split(' ').map(n => n[0]).join('').slice(0,2) || '??'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800">{u.nombre || 'Usuario'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{u.rol || 'Técnico'} · {proyectoActual}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">{faseActual}</span>
                    <p className="text-[9px] text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                      <Timer className="h-2.5 w-2.5" />{tiempo}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* INDICADOR 2: Proyectos Adjudicados */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-600" />
            <h3 className="text-[13px] font-bold text-gray-800">Control de Obra — Adjudicadas</h3>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            {adjudicadas.length} obras
          </span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[200px] overflow-y-auto">
          {adjudicadas.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              <Briefcase className="h-6 w-6 mx-auto mb-2 text-gray-300" />
              Sin proyectos adjudicados
            </div>
          ) : (
            adjudicadas.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 truncate">{a.titulo}</p>
                  <p className="text-[10px] text-gray-500">{a.cliente} · {a.empresaAdjudicataria}</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {a.licitacionIVA ? `${(a.licitacionIVA/1000000).toFixed(1)}M€` : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* INDICADOR 3: Fases en Progreso */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h3 className="text-[13px] font-bold text-gray-800">Fases en Progreso</h3>
          </div>
          <div className="flex gap-1.5">
            <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">{fasesEnProgreso.working} en curso</span>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">{fasesEnProgreso.done} listos</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
          <div className="px-3 py-3 text-center">
            <p className="text-[20px] font-bold text-amber-500">{fasesEnProgreso.working}</p>
            <p className="text-[9px] text-gray-500 uppercase font-medium">En curso</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-[20px] font-bold text-emerald-500">{fasesEnProgreso.done}</p>
            <p className="text-[9px] text-gray-500 uppercase font-medium">Completados</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-[20px] font-bold text-red-500">{fasesEnProgreso.stuck}</p>
            <p className="text-[9px] text-gray-500 uppercase font-medium">Detenidos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
