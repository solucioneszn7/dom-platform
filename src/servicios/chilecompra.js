// Conector ChileCompra
import { collection, doc, getDocs, query, where, writeBatch, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
const COL = "estudios"

export async function obtenerLicitacionesChile({ ticket, estado = "publicada", fechaInicio } = {}) {
  if (!ticket) throw new Error("Se requiere ticket")
  const params = new URLSearchParams({ ticket, estado })
  if (fechaInicio) params.set("fecha", fechaInicio)
  const r = await fetch("https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?" + params)
  if (!r.ok) throw new Error("ChileCompra HTTP " + r.status)
  const data = await r.json()
  if (!data.Listado) throw new Error("Respuesta inesperada")
  return data.Listado.map(parsearItemChile)
}

function parsearItemChile(item) {
  const toISO = d => { if (!d) return null; try { return new Date(d).toISOString().split("T")[0] } catch { return null } }
  const t = (item.Tipo || "").toLowerCase()
  const proc = t.includes("abierta") ? "Abierto Ordinario" : t.includes("privada") ? "Negociado" : "Abierto Ordinario"
  const codigo = item.CodigoExterno || item.Codigo || ""
  return { anio: new Date().getFullYear(), orden: 0, titulo: item.Nombre || codigo || "Sin titulo", cliente: item.NombreOrganismo || "", procedimiento: proc, licitacionIVA: parseFloat(item.MontoEstimado) || 0, costeEstudio: 0, importeOfertado: 0, importeAdjudicacion: 0, fechaPresentacion: toISO(item.FechaCierre), horaPresentacion: "", fechaInterna: null, fechaApertura: toISO(item.FechaActoApertura), horaApertura: "", vamos: false, apertura: false, empresaAdjudicataria: "", posicionGuamar: "", faseActual: "captacion", docTecnica: false, docAdministrativa: false, estudioEconomico: false, seguridadSalud: false, calidadMA: false, componenteUTE1: "", componenteUTE2: "", pctComponente1: 0, pctComponente2: 0, pctGuamar: 100, pctUTEGuamar: 0, clasificacion: [], cpv: "", cpvDescripcion: "", valoracion: "", observaciones: codigo ? "MP: " + codigo : "", notaInterna: "", origenFuente: "chilecompra", idExterno: codigo, urlPlataforma: codigo ? "https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=" + codigo : "", fechaPublicacionExterna: toISO(item.FechaPublicacion), moneda: "CLP" }
}

export async function sincronizarDesdeChile(licitaciones) {
  const resultado = { importadas: 0, duplicadas: 0, errores: [], total: licitaciones.length }
  if (!licitaciones.length) return resultado
  const ids = licitaciones.map(l => l.idExterno).filter(Boolean)
  const existentes = new Set()
  for (let i = 0; i < ids.length; i += 30) {
    try { const snap = await getDocs(query(collection(db, COL), where("idExterno", "in", ids.slice(i,i+30)))); snap.forEach(d => existentes.add(d.data().idExterno)) } catch (e) { resultado.errores.push(e.message) }
  }
  const nuevas = licitaciones.filter(l => !existentes.has(l.idExterno))
  resultado.duplicadas = licitaciones.length - nuevas.length
  for (let i = 0; i < nuevas.length; i += 400) {
    const batch = writeBatch(db)
    nuevas.slice(i,i+400).forEach(lic => batch.set(doc(collection(db, COL)), { ...lic, fechaCreacion: serverTimestamp(), fechaActualizacion: serverTimestamp() }))
    try { await batch.commit(); resultado.importadas += Math.min(400, nuevas.length-i) } catch (e) { resultado.errores.push(e.message) }
  }
  return resultado
}
