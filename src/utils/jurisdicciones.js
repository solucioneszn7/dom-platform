// ===== Jurisdicciones legales soportadas =====
// Cada entrada define la normativa aplicable al usuario según el país declarado al
// registrarse. La aplicación usa esta tabla para mostrar la versión correcta de
// Política de Privacidad y Términos & Condiciones, así como la moneda y las
// referencias legales en informes y dictámenes.

export const JURISDICCIONES = {
  CL: {
    codigo: 'CL',
    pais: 'Chile',
    bandera: '🇨🇱',
    moneda: 'CLP',
    monedaSimbolo: '$',
    autoridadProteccionDatos: 'Consejo para la Transparencia',
    leyProteccionDatos: 'Ley N° 19.628 sobre Protección de la Vida Privada',
    leyConsumidor: 'Ley N° 19.496 sobre Protección de los Derechos de los Consumidores',
    normativaTecnica: 'Ordenanza General de Urbanismo y Construcciones (OGUC) y NCh aplicables',
    organismoFiscalizador: 'Dirección de Obras Municipales (DOM) y SERVIU',
    legislacionContractual: 'Código Civil de Chile y Ley de Contratos del Estado N° 19.886',
  },
  ES: {
    codigo: 'ES',
    pais: 'España',
    bandera: '🇪🇸',
    moneda: 'EUR',
    monedaSimbolo: '€',
    autoridadProteccionDatos: 'Agencia Española de Protección de Datos (AEPD)',
    leyProteccionDatos: 'Reglamento (UE) 2016/679 (RGPD) y LO 3/2018 (LOPDGDD)',
    leyConsumidor: 'Real Decreto Legislativo 1/2007, Ley General para la Defensa de Consumidores',
    normativaTecnica: 'Código Técnico de la Edificación (CTE) y normas UNE/EN aplicables',
    organismoFiscalizador: 'Ayuntamientos y Comunidades Autónomas',
    legislacionContractual: 'Ley 9/2017 de Contratos del Sector Público',
  },
  OTRO: {
    codigo: 'OTRO',
    pais: 'Otro país',
    bandera: '🌐',
    moneda: 'USD',
    monedaSimbolo: 'US$',
    autoridadProteccionDatos: 'Autoridad de protección de datos del país de residencia del usuario',
    leyProteccionDatos: 'Normativa local de protección de datos personales',
    leyConsumidor: 'Normativa local de defensa del consumidor',
    normativaTecnica: 'Normativa técnica de construcción del país declarado',
    organismoFiscalizador: 'Autoridad competente local',
    legislacionContractual: 'Legislación contractual del país declarado',
  },
}

export function obtenerJurisdiccion(codigo) {
  if (!codigo) return JURISDICCIONES.OTRO
  const c = String(codigo).toUpperCase()
  return JURISDICCIONES[c] || JURISDICCIONES.OTRO
}

export const CODIGOS_JURISDICCION = Object.keys(JURISDICCIONES)
