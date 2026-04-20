// ===== Mapeo CPV (Common Procurement Vocabulary) → Clasificación Española =====
// Los códigos CPV son los estándares europeos. Se mapean al sistema español
// de Grupo/Subgrupo/Categoría usado en clasificación empresarial de obras.

// Tabla de los CPV más comunes en obras públicas españolas
const CPV_A_CLASIFICACION = {
  // ─── Construcción general ─────────────────────────────────
  '45000000': [{ grupo: 'C', subgrupo: '1', categoria: '' }], // Edificación obra nueva
  '45100000': [{ grupo: 'A', subgrupo: '1', categoria: '' }], // Preparación terrenos
  '45110000': [{ grupo: 'A', subgrupo: '1', categoria: '' }], // Demolición / preparación
  '45111000': [{ grupo: 'A', subgrupo: '1', categoria: '' }],
  '45112000': [{ grupo: 'A', subgrupo: '2', categoria: '' }], // Movimiento tierras
  '45113000': [{ grupo: 'A', subgrupo: '1', categoria: '' }],

  // ─── Ingeniería civil ─────────────────────────────────────
  '45200000': [{ grupo: 'B', subgrupo: '1', categoria: '' }], // Obras ingeniería civil
  '45210000': [{ grupo: 'C', subgrupo: '2', categoria: '' }], // Edificación completa
  '45211000': [{ grupo: 'C', subgrupo: '1', categoria: '' }], // Viviendas
  '45212000': [{ grupo: 'C', subgrupo: '4', categoria: '' }], // Equipamientos/deportivos
  '45213000': [{ grupo: 'C', subgrupo: '2', categoria: '' }], // Industrial/comercial
  '45214000': [{ grupo: 'C', subgrupo: '2', categoria: '' }], // Educativos/investigación
  '45215000': [{ grupo: 'C', subgrupo: '2', categoria: '' }], // Sanitarios/sociales

  // ─── Obras hidráulicas ────────────────────────────────────
  '45220000': [{ grupo: 'B', subgrupo: '1', categoria: '' }], // Obras ingeniería / puentes
  '45221000': [{ grupo: 'B', subgrupo: '2', categoria: '' }], // Puentes
  '45222000': [{ grupo: 'E', subgrupo: '1', categoria: '' }], // Obras hidráulicas
  '45230000': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Ingeniería civil tuberías/comunicaciones
  '45231000': [{ grupo: 'E', subgrupo: '1', categoria: '' }], // Tuberías gas/agua
  '45231100': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232000': [{ grupo: 'E', subgrupo: '1', categoria: '' }], // Tuberías largo alcance
  '45232100': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232150': [{ grupo: 'E', subgrupo: '1', categoria: '' }], // Abastecimiento aguas
  '45232151': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232400': [{ grupo: 'E', subgrupo: '5', categoria: '' }], // Saneamiento / EDAR
  '45232410': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232411': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232420': [{ grupo: 'E', subgrupo: '5', categoria: '' }],
  '45232430': [{ grupo: 'E', subgrupo: '5', categoria: '' }], // Depuradoras
  '45232440': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232450': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232460': [{ grupo: 'E', subgrupo: '1', categoria: '' }],
  '45232470': [{ grupo: 'E', subgrupo: '5', categoria: '' }],

  // ─── Infraestructuras transporte ──────────────────────────
  '45233000': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Carreteras y autopistas
  '45233100': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233110': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Autovías
  '45233120': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Carreteras
  '45233130': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233140': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233200': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233220': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Pavimentación
  '45233221': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Señalización
  '45233222': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233250': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233251': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45233252': [{ grupo: 'G', subgrupo: '4', categoria: '' }], // Pavimentación calles
  '45233260': [{ grupo: 'G', subgrupo: '4', categoria: '' }],
  '45234000': [{ grupo: 'D', subgrupo: '1', categoria: '' }], // Ferrocarriles
  '45234100': [{ grupo: 'D', subgrupo: '1', categoria: '' }],
  '45234200': [{ grupo: 'D', subgrupo: '1', categoria: '' }],
  '45235000': [{ grupo: 'B', subgrupo: '3', categoria: '' }], // Aeropuertos / pistas
  '45236000': [{ grupo: 'C', subgrupo: '4', categoria: '' }], // Superficies deportivas

  // ─── Obras marítimas / portuarias ─────────────────────────
  '45240000': [{ grupo: 'F', subgrupo: '1', categoria: '' }], // Obras hidráulicas
  '45241000': [{ grupo: 'F', subgrupo: '1', categoria: '' }], // Puertos
  '45243000': [{ grupo: 'F', subgrupo: '1', categoria: '' }], // Defensa costera
  '45244000': [{ grupo: 'F', subgrupo: '2', categoria: '' }], // Obras marítimas
  '45246000': [{ grupo: 'E', subgrupo: '4', categoria: '' }], // Regulación ríos
  '45247000': [{ grupo: 'E', subgrupo: '4', categoria: '' }], // Presas / canales

  // ─── Obras especiales ─────────────────────────────────────
  '45250000': [{ grupo: 'K', subgrupo: '2', categoria: '' }], // Obras plantas/minería
  '45251000': [{ grupo: 'I', subgrupo: '1', categoria: '' }], // Plantas eléctricas
  '45252000': [{ grupo: 'E', subgrupo: '5', categoria: '' }], // Depuración aguas residuales

  // ─── Construcción edificación ─────────────────────────────
  '45260000': [{ grupo: 'C', subgrupo: '3', categoria: '' }], // Cubiertas
  '45261000': [{ grupo: 'C', subgrupo: '3', categoria: '' }], // Tejados
  '45262000': [{ grupo: 'C', subgrupo: '1', categoria: '' }], // Edificación
  '45262500': [{ grupo: 'C', subgrupo: '1', categoria: '' }], // Albañilería
  '45262600': [{ grupo: 'C', subgrupo: '1', categoria: '' }],
  '45262700': [{ grupo: 'C', subgrupo: '1', categoria: '' }], // Reformas
  '45262800': [{ grupo: 'C', subgrupo: '1', categoria: '' }],

  // ─── Instalaciones ────────────────────────────────────────
  '45300000': [{ grupo: 'J', subgrupo: '2', categoria: '' }], // Instalaciones edificios
  '45310000': [{ grupo: 'I', subgrupo: '6', categoria: '' }], // Instalaciones eléctricas
  '45311000': [{ grupo: 'I', subgrupo: '6', categoria: '' }],
  '45312000': [{ grupo: 'I', subgrupo: '7', categoria: '' }], // Telecomunicaciones
  '45313000': [{ grupo: 'J', subgrupo: '4', categoria: '' }], // Ascensores
  '45314000': [{ grupo: 'I', subgrupo: '7', categoria: '' }], // Equipos telecomunicaciones
  '45315000': [{ grupo: 'I', subgrupo: '6', categoria: '' }], // Calefacción eléctrica
  '45316000': [{ grupo: 'I', subgrupo: '6', categoria: '' }], // Alumbrado
  '45317000': [{ grupo: 'I', subgrupo: '6', categoria: '' }],
  '45320000': [{ grupo: 'J', subgrupo: '5', categoria: '' }], // Aislamientos
  '45330000': [{ grupo: 'J', subgrupo: '1', categoria: '' }], // Fontanería / sanitarios
  '45331000': [{ grupo: 'J', subgrupo: '2', categoria: '' }], // Calefacción / ventilación
  '45332000': [{ grupo: 'J', subgrupo: '1', categoria: '' }],
  '45333000': [{ grupo: 'J', subgrupo: '3', categoria: '' }], // Gas
  '45340000': [{ grupo: 'I', subgrupo: '7', categoria: '' }], // Barandillas / contraincendios
  '45343000': [{ grupo: 'J', subgrupo: '5', categoria: '' }], // PCI
  '45350000': [{ grupo: 'J', subgrupo: '2', categoria: '' }], // Instalaciones mecánicas

  // ─── Acabados ─────────────────────────────────────────────
  '45400000': [{ grupo: 'C', subgrupo: '6', categoria: '' }], // Acabados edificios
  '45410000': [{ grupo: 'C', subgrupo: '6', categoria: '' }],
  '45420000': [{ grupo: 'C', subgrupo: '7', categoria: '' }], // Carpintería
  '45430000': [{ grupo: 'C', subgrupo: '9', categoria: '' }], // Revestimientos
  '45440000': [{ grupo: 'C', subgrupo: '8', categoria: '' }], // Pintura / cristalería
  '45450000': [{ grupo: 'C', subgrupo: '8', categoria: '' }],

  // ─── Restauración ─────────────────────────────────────────
  '45453000': [{ grupo: 'K', subgrupo: '7', categoria: '' }], // Restauración
  '45454000': [{ grupo: 'K', subgrupo: '7', categoria: '' }],

  // ─── Paisajismo / Jardinería ──────────────────────────────
  '45112710': [{ grupo: 'K', subgrupo: '6', categoria: '' }], // Paisajismo
  '45112711': [{ grupo: 'K', subgrupo: '6', categoria: '' }], // Parques
  '45112712': [{ grupo: 'K', subgrupo: '6', categoria: '' }],
  '77310000': [{ grupo: 'K', subgrupo: '6', categoria: '' }], // Jardinería
}

// Descripciones legibles para mostrar en UI
const CPV_DESCRIPCIONES = {
  '45000000': 'Trabajos de construcción',
  '45100000': 'Preparación de obras',
  '45200000': 'Obras de ingeniería civil',
  '45210000': 'Trabajos de construcción de edificios',
  '45211000': 'Edificios residenciales',
  '45212000': 'Edificios para ocio, deportes, cultura',
  '45214000': 'Edificios educativos y de investigación',
  '45215000': 'Edificios sanitarios y sociales',
  '45220000': 'Obras de ingeniería y construcción',
  '45221000': 'Puentes, túneles, pozos, pasos subterráneos',
  '45230000': 'Tuberías, comunicaciones y líneas eléctricas',
  '45232150': 'Obras relacionadas con tuberías de abastecimiento de agua',
  '45232400': 'Obras de saneamiento',
  '45232430': 'Obras de depuración de aguas',
  '45233000': 'Carreteras y autopistas',
  '45233120': 'Construcción de carreteras',
  '45233130': 'Construcción de autopistas',
  '45233140': 'Obras viales',
  '45234000': 'Construcción de ferrocarriles',
  '45240000': 'Obras hidráulicas',
  '45241000': 'Obras portuarias',
  '45247000': 'Presas, canales y diques',
  '45252000': 'Depuración de aguas residuales',
  '45260000': 'Cubiertas y obras auxiliares',
  '45300000': 'Instalaciones en edificios',
  '45310000': 'Instalaciones eléctricas',
  '45330000': 'Fontanería',
  '45400000': 'Acabado de edificios',
  '45453000': 'Obras de restauración',
  '77310000': 'Jardinería',
}

// Busca el código más específico, luego genérico (truncando)
export function cpvAClasificacion(cpv) {
  if (!cpv) return []
  const limpio = String(cpv).replace(/[^0-9]/g, '')
  if (!limpio) return []

  // Intentar coincidencia exacta, luego truncando por niveles jerárquicos CPV
  const candidatos = [
    limpio,
    limpio.slice(0, 6) + '0000'.slice(0, Math.max(0, 8 - limpio.length + limpio.slice(0, 6).length)),
    limpio.slice(0, 5) + '000',
    limpio.slice(0, 4) + '0000',
    limpio.slice(0, 3) + '00000',
    limpio.slice(0, 2) + '000000',
  ].filter((v, i, a) => a.indexOf(v) === i)

  for (const c of candidatos) {
    if (CPV_A_CLASIFICACION[c]) return CPV_A_CLASIFICACION[c]
  }
  return []
}

export function cpvADescripcion(cpv) {
  if (!cpv) return ''
  const limpio = String(cpv).replace(/[^0-9]/g, '')
  const candidatos = [
    limpio,
    limpio.slice(0, 6) + '0000'.slice(0, Math.max(0, 8 - limpio.length + limpio.slice(0, 6).length)),
    limpio.slice(0, 4) + '0000',
    limpio.slice(0, 2) + '000000',
  ].filter((v, i, a) => a.indexOf(v) === i)

  for (const c of candidatos) {
    if (CPV_DESCRIPCIONES[c]) return CPV_DESCRIPCIONES[c]
  }
  return ''
}

export { CPV_A_CLASIFICACION, CPV_DESCRIPCIONES }
