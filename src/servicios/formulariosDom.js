// ===== Catálogo Completo de Formularios DOM — MINVU =====
// Fuente oficial: https://www.minvu.gob.cl/elementos-tecnicos/formularios/
// Art. 1.4.3 OGUC — Formularios Únicos Nacionales
// 18 Grupos de Trámites ante Direcciones de Obras Municipales

// ===================================================================
// GRUPO 1 — Permisos de Obra Menor
// ===================================================================
const GRUPO_1 = {
  id: 1,
  nombre: 'Permisos de Obra Menor',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-de-permisos-de-obra-menor/',
  subtipos: {
    ampliacion_100m2: {
      nombre: 'Ampliación hasta 100 m²',
      articulo: 'Art. 5.1.4 N°1 letra A OGUC',
      formularios: [
        { codigo: '1-1.1', nombre: 'Solicitud Permiso Obra Menor — Ampliación hasta 100 m²', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '1-2.1', nombre: 'Permiso Obra Menor — Ampliación hasta 100 m²', etapa: 'permiso', requerido: true },
        { codigo: '1-3.1', nombre: 'Solicitud Modificación Proyecto — Ampliación hasta 100 m²', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '1-4.1', nombre: 'Resolución Aprueba Modificación — Ampliación hasta 100 m²', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '1-5.1', nombre: 'Solicitud Recepción Definitiva — Ampliación hasta 100 m²', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '1-6.1', nombre: 'Certificado Recepción Definitiva — Ampliación hasta 100 m²', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    modificacion_sin_alterar: {
      nombre: 'Modificación sin alterar estructura',
      articulo: 'Art. 5.1.4 N°1 letra B OGUC',
      formularios: [
        { codigo: '1-1.2', nombre: 'Solicitud Permiso Obra Menor — Modificación sin alterar estructura', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '1-2.2', nombre: 'Permiso Obra Menor — Modificación sin alterar estructura', etapa: 'permiso', requerido: true },
        { codigo: '1-5.2', nombre: 'Solicitud Recepción Definitiva — Modificación sin alterar estructura', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '1-6.2', nombre: 'Certificado Recepción Definitiva — Modificación sin alterar estructura', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    vivienda_social: {
      nombre: 'Ampliación Vivienda Social y otras',
      articulo: 'Art. 166 LGUC / Art. 5.1.4 N°2 letra A OGUC',
      formularios: [
        { codigo: '1-1.3', nombre: 'Solicitud Permiso Obra Menor — Ampliación Vivienda Social', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '1-2.3', nombre: 'Permiso Obra Menor — Ampliación Vivienda Social', etapa: 'permiso', requerido: true },
        { codigo: '1-3.2', nombre: 'Solicitud Modificación Proyecto — Ampliación Vivienda Social', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '1-4.2', nombre: 'Resolución Aprueba Modificación — Ampliación Vivienda Social', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '1-5.3', nombre: 'Solicitud Recepción Definitiva — Ampliación Vivienda Social', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '1-6.3', nombre: 'Certificado Recepción Definitiva — Ampliación Vivienda Social', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    regularizacion_antigua: {
      nombre: 'Regularización Edificación Antigua (anterior 31-07-1959)',
      articulo: 'Art. 5.1.4 N°2 letra B OGUC',
      formularios: [
        { codigo: '1-1.4', nombre: 'Solicitud Regularización Edificación Antigua', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '1-6.4', nombre: 'Certificado Regularización Edificación Antigua', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    radicacion: {
      nombre: 'Proyectos de Radicación',
      articulo: 'Art. 6.2.9 inciso 2° OGUC',
      formularios: [
        { codigo: '1-1.5', nombre: 'Solicitud Permiso Obra Menor — Radicación', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '1-2.4', nombre: 'Permiso Obra Menor — Radicación', etapa: 'permiso', requerido: true },
        { codigo: '1-3.3', nombre: 'Solicitud Modificación Proyecto — Radicación', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '1-4.3', nombre: 'Resolución Aprueba Modificación — Radicación', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '1-5.4', nombre: 'Solicitud Recepción Definitiva — Radicación', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '1-6.5', nombre: 'Certificado Recepción Definitiva — Radicación', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 2 — Permisos de Edificación
// ===================================================================
const GRUPO_2 = {
  id: 2,
  nombre: 'Permisos de Edificación',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-de-permisos-de-edificacion/',
  subtipos: {
    obra_nueva: {
      nombre: 'Obra Nueva',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '2-1.1', nombre: 'Solicitud Aprobación Anteproyecto — Obra Nueva', etapa: 'anteproyecto', requerido: false },
        { codigo: '2-2.1', nombre: 'Resolución Aprobación Anteproyecto — Obra Nueva', etapa: 'resolucion_anteproyecto', requerido: false },
        { codigo: '2-3.1', nombre: 'Solicitud Permiso Edificación — Obra Nueva', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '2-4.1', nombre: 'Permiso Edificación — Obra Nueva', etapa: 'permiso', requerido: true },
        { codigo: '2-5.1', nombre: 'Solicitud Modificación Proyecto — Obra Nueva', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '2-6.1', nombre: 'Resolución Aprueba Modificación — Obra Nueva', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '2-7.1', nombre: 'Solicitud Recepción Definitiva — Obra Nueva', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '2-8.1', nombre: 'Certificado Recepción Definitiva — Obra Nueva', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    ampliacion_mayor: {
      nombre: 'Ampliación Mayor a 100 m²',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '2-1.2', nombre: 'Solicitud Aprobación Anteproyecto — Ampliación Mayor 100 m²', etapa: 'anteproyecto', requerido: false },
        { codigo: '2-2.2', nombre: 'Resolución Aprobación Anteproyecto — Ampliación Mayor 100 m²', etapa: 'resolucion_anteproyecto', requerido: false },
        { codigo: '2-3.2', nombre: 'Solicitud Permiso Edificación — Ampliación Mayor 100 m²', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '2-4.2', nombre: 'Permiso Edificación — Ampliación Mayor 100 m²', etapa: 'permiso', requerido: true },
        { codigo: '2-5.2', nombre: 'Solicitud Modificación Proyecto — Ampliación Mayor 100 m²', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '2-6.2', nombre: 'Resolución Aprueba Modificación — Ampliación Mayor 100 m²', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '2-7.2', nombre: 'Solicitud Recepción Definitiva — Ampliación Mayor 100 m²', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '2-8.2', nombre: 'Certificado Recepción Definitiva — Ampliación Mayor 100 m²', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    alteracion: {
      nombre: 'Alteración',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '2-1.3', nombre: 'Solicitud Aprobación Anteproyecto — Alteración', etapa: 'anteproyecto', requerido: false },
        { codigo: '2-2.3', nombre: 'Resolución Aprobación Anteproyecto — Alteración', etapa: 'resolucion_anteproyecto', requerido: false },
        { codigo: '2-3.3', nombre: 'Solicitud Permiso Edificación — Alteración', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '2-4.3', nombre: 'Permiso Edificación — Alteración', etapa: 'permiso', requerido: true },
        { codigo: '2-5.3', nombre: 'Solicitud Modificación Proyecto — Alteración', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '2-6.3', nombre: 'Resolución Aprueba Modificación — Alteración', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '2-7.3', nombre: 'Solicitud Recepción Definitiva — Alteración', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '2-8.3', nombre: 'Certificado Recepción Definitiva — Alteración', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    reconstruccion: {
      nombre: 'Reconstrucción',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '2-1.4', nombre: 'Solicitud Aprobación Anteproyecto — Reconstrucción', etapa: 'anteproyecto', requerido: false },
        { codigo: '2-2.4', nombre: 'Resolución Aprobación Anteproyecto — Reconstrucción', etapa: 'resolucion_anteproyecto', requerido: false },
        { codigo: '2-3.4', nombre: 'Solicitud Permiso Edificación — Reconstrucción', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '2-4.4', nombre: 'Permiso Edificación — Reconstrucción', etapa: 'permiso', requerido: true },
        { codigo: '2-5.4', nombre: 'Solicitud Modificación Proyecto — Reconstrucción', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '2-6.4', nombre: 'Resolución Aprueba Modificación — Reconstrucción', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '2-7.4', nombre: 'Solicitud Recepción Definitiva — Reconstrucción', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '2-8.4', nombre: 'Certificado Recepción Definitiva — Reconstrucción', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    reparacion: {
      nombre: 'Reparación',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '2-3.5', nombre: 'Solicitud Permiso Edificación — Reparación', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '2-4.5', nombre: 'Permiso Edificación — Reparación', etapa: 'permiso', requerido: true },
        { codigo: '2-7.5', nombre: 'Solicitud Recepción Definitiva — Reparación', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '2-8.5', nombre: 'Certificado Recepción Definitiva — Reparación', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 3 — Subdivisión y Urbanización
// ===================================================================
const GRUPO_3 = {
  id: 3,
  nombre: 'Subdivisión y Urbanización',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-subdivision-y-urbanizacion/',
  subtipos: {
    subdivision_urbanizacion: {
      nombre: 'Subdivisión, Fusión, Urbanización y Loteos',
      articulo: 'Art. 3.1.2 / 3.1.3 / 3.1.7 OGUC',
      formularios: [
        { codigo: '3.1', nombre: 'Solicitud Aprobación Anteproyecto de Loteo', etapa: 'anteproyecto', requerido: false },
        { codigo: '3.2', nombre: 'Resolución Aprobación Anteproyecto de Loteo', etapa: 'resolucion_anteproyecto', requerido: false },
        { codigo: '3.3', nombre: 'Solicitud Aprobación Subdivisión, Fusión, Urbanización, Loteo', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '3.4', nombre: 'Resolución Aprobación Subdivisión o Fusión', etapa: 'permiso', requerido: true },
        { codigo: '3.5', nombre: 'Resolución Aprobación Loteo, Urbanización, Loteo con construcción', etapa: 'permiso', requerido: true },
        { codigo: '3.6', nombre: 'Solicitud Modificación Loteo, Urbanización', etapa: 'solicitud_modificacion', requerido: false },
        { codigo: '3.7', nombre: 'Resolución Aprueba Modificación Loteo, Urbanización', etapa: 'resolucion_modificacion', requerido: false },
        { codigo: '3.8', nombre: 'Solicitud Recepción Definitiva Obras de Urbanización', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '3.9', nombre: 'Certificado Recepción Definitiva Obras de Urbanización', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 4 — División del Suelo y Condominios con afectación Utilidad Pública
// ===================================================================
const GRUPO_4 = {
  id: 4,
  nombre: 'División del Suelo y Condominios con afectación a Utilidad Pública',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-division-del-suelo-y-condominios-con-afectacion-a-utilidad-publica/',
  subtipos: {
    division_condominios: {
      nombre: 'División de predios y Condominios con afectación',
      articulo: 'Art. 70 LGUC / Ley 19.537',
      formularios: [
        { codigo: '4.1', nombre: 'Solicitud División Predial con afectación a Utilidad Pública', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '4.2', nombre: 'Resolución División Predial con afectación a Utilidad Pública', etapa: 'permiso', requerido: true },
        { codigo: '4.3', nombre: 'Solicitud Condominio con afectación a Utilidad Pública', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '4.4', nombre: 'Resolución Condominio con afectación a Utilidad Pública', etapa: 'permiso', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 5 — Solicitudes y Certificaciones Varias
// ===================================================================
const GRUPO_5 = {
  id: 5,
  nombre: 'Solicitudes y Certificaciones Varias',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-de-solicitudes-y-certificaciones-varias/',
  subtipos: {
    certificaciones: {
      nombre: 'Certificaciones y Solicitudes Varias',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '5.1', nombre: 'Solicitud Certificado Informaciones Previas', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '5.2', nombre: 'Certificado de Informaciones Previas', etapa: 'certificado_recepcion', requerido: true },
        { codigo: '5.3', nombre: 'Solicitud Certificado de Número', etapa: 'solicitud_permiso', requerido: false },
        { codigo: '5.4', nombre: 'Certificado de Número', etapa: 'certificado_recepcion', requerido: false },
        { codigo: '5.5', nombre: 'Solicitud Certificado de No Expropiación', etapa: 'solicitud_permiso', requerido: false },
        { codigo: '5.6', nombre: 'Certificado de No Expropiación', etapa: 'certificado_recepcion', requerido: false },
        { codigo: '5.7', nombre: 'Solicitud Certificado de Habitabilidad', etapa: 'solicitud_permiso', requerido: false },
        { codigo: '5.8', nombre: 'Certificado de Habitabilidad', etapa: 'certificado_recepcion', requerido: false },
      ],
    },
  },
}

// ===================================================================
// GRUPO 6 — Regularización Viviendas Sociales (Ley 20.671)
// ===================================================================
const GRUPO_6 = {
  id: 6,
  nombre: 'Regularización de Viviendas Sociales (Ley 20.671)',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-de-regularizacion-de-viviendas-sociales-ley-20-671-y-sus-modificaciones/',
  subtipos: {
    regularizacion_vivienda_social: {
      nombre: 'Regularización Viviendas Sociales',
      articulo: 'Ley 20.671',
      formularios: [
        { codigo: '6.1', nombre: 'Solicitud Regularización Vivienda Social — Ley 20.671', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '6.2', nombre: 'Certificado Regularización Vivienda Social — Ley 20.671', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 7 — Encuesta Edificación INE
// ===================================================================
const GRUPO_7 = {
  id: 7,
  nombre: 'Encuesta Edificación INE',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/encuesta-edificacion-ine/',
  subtipos: {
    encuesta_ine: {
      nombre: 'Formulario Único Estadísticas de Edificación',
      articulo: 'Art. 1.4.3 OGUC / INE',
      formularios: [
        { codigo: '7.1', nombre: 'Formulario Único Estadísticas de Edificación INE', etapa: 'solicitud_permiso', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 8 — Construcciones en Zonas de Catástrofe
// ===================================================================
const GRUPO_8 = {
  id: 8,
  nombre: 'Construcciones en Zonas Declaradas Afectadas por Catástrofes',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-para-construcciones-en-zonas-declaradas-afectadas-por-catastrofes/',
  subtipos: {
    catastrofe: {
      nombre: 'Permisos en Zonas de Catástrofe',
      articulo: 'Art. 5.1.4 OGUC / Ley Catástrofes',
      formularios: [
        { codigo: '8.1', nombre: 'Solicitud Permiso Edificación en Zona de Catástrofe', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '8.2', nombre: 'Permiso Edificación en Zona de Catástrofe', etapa: 'permiso', requerido: true },
        { codigo: '8.3', nombre: 'Solicitud Recepción Definitiva en Zona de Catástrofe', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '8.4', nombre: 'Certificado Recepción Definitiva en Zona de Catástrofe', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 9 — Viviendas Unifamiliares (Art. Transitorio OGUC D.S. 2)
// ===================================================================
const GRUPO_9 = {
  id: 9,
  nombre: 'Permisos y Recepciones Viviendas Unifamiliares (Art. Transitorio OGUC)',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-permisos-y-recepciones-de-viviendas-unifamiliares-art-transitorio-oguc-d-s-2-d-o-24-03-11/',
  subtipos: {
    vivienda_unifamiliar: {
      nombre: 'Viviendas Unifamiliares D.S. 2',
      articulo: 'Art. Transitorio OGUC D.S. 2 (D.O. 24.03.11)',
      formularios: [
        { codigo: '9.1', nombre: 'Solicitud Permiso Vivienda Unifamiliar', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '9.2', nombre: 'Permiso Vivienda Unifamiliar', etapa: 'permiso', requerido: true },
        { codigo: '9.3', nombre: 'Solicitud Recepción Vivienda Unifamiliar', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '9.4', nombre: 'Certificado Recepción Vivienda Unifamiliar', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 10 — Regularización Microempresas (Ley 20.563)
// ===================================================================
const GRUPO_10 = {
  id: 10,
  nombre: 'Regularización construcción Microempresas y Equipamiento Social (Ley 20.563)',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formulario-para-regularizar-construccion-de-bienes-raices-destinados-a-microempresas-y-equipamiento-social-ley-20-563/',
  subtipos: {
    microempresas: {
      nombre: 'Regularización Microempresas',
      articulo: 'Ley 20.563',
      formularios: [
        { codigo: '10.1', nombre: 'Solicitud Regularización Microempresas — Ley 20.563', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '10.2', nombre: 'Certificado Regularización Microempresas — Ley 20.563', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 11 — Torres Soporte de Antenas
// ===================================================================
const GRUPO_11 = {
  id: 11,
  nombre: 'Permisos Instalación Torres Soporte de Antenas',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-de-permisos-de-instalacion-de-torres-soporte-de-antenas/',
  subtipos: {
    antenas: {
      nombre: 'Torres Soporte de Antenas',
      articulo: 'Ley 20.599 / Art. 5.1.4 OGUC',
      formularios: [
        { codigo: '11.1', nombre: 'Solicitud Permiso Instalación Torre Soporte Antenas', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '11.2', nombre: 'Permiso Instalación Torre Soporte Antenas', etapa: 'permiso', requerido: true },
        { codigo: '11.3', nombre: 'Solicitud Recepción Torre Soporte Antenas', etapa: 'solicitud_recepcion', requerido: true },
        { codigo: '11.4', nombre: 'Certificado Recepción Torre Soporte Antenas', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 12 — Regularización Ley N°20.898
// ===================================================================
const GRUPO_12 = {
  id: 12,
  nombre: 'Regularización Ley N°20.898',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-regularizacion-ley-n20-898/',
  subtipos: {
    titulo_1: {
      nombre: 'Regularización Título I Art. 1° — Ley N°20.898',
      articulo: 'Ley N°20.898 Título I Art. 1°',
      formularios: [
        { codigo: '12.1', nombre: 'Solicitud Regularización Título I Art. 1° Ley 20.898 (Permiso y Recepción)', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '12.2', nombre: 'Certificado Regularización Título I Art. 1° Ley 20.898', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
    titulo_2: {
      nombre: 'Regularización Título II Art. 2° — Ley N°20.898',
      articulo: 'Ley N°20.898 Título II Art. 2°',
      formularios: [
        { codigo: '12.3', nombre: 'Solicitud Regularización Título II Art. 2° Ley 20.898', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '12.4', nombre: 'Certificado Regularización Título II Art. 2° Ley 20.898', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 13 — Regularización Ley N°20.301 y Ley N°21.052
// ===================================================================
const GRUPO_13 = {
  id: 13,
  nombre: 'Regularización Ley N°20.301 y Ley N°21.052',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/formularios-de-regularizacion-ley-n20-301-y-ley-n21-052/',
  subtipos: {
    regularizacion_20301: {
      nombre: 'Regularización — Ley N°20.301 y Ley N°21.052',
      articulo: 'Ley N°20.301 / Ley N°21.052',
      formularios: [
        { codigo: '13.1', nombre: 'Solicitud Regularización — Ley N°20.301', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '13.2', nombre: 'Certificado Regularización — Ley N°20.301', etapa: 'certificado_recepcion', requerido: true },
        { codigo: '13.3', nombre: 'Solicitud Regularización — Ley N°21.052', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '13.4', nombre: 'Certificado Regularización — Ley N°21.052', etapa: 'certificado_recepcion', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 14 — Saneamiento y Regularización de Loteos (Ley 20.234)
// ===================================================================
const GRUPO_14 = {
  id: 14,
  nombre: 'Saneamiento y Regularización de Loteos Ley 20.234',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/14-formularios-procedimiento-de-saneamiento-y-regularizacion-de-loteos-ley-20-234/',
  subtipos: {
    saneamiento_loteos: {
      nombre: 'Saneamiento y Regularización de Loteos',
      articulo: 'Ley 20.234',
      formularios: [
        { codigo: '14.1', nombre: 'Solicitud Saneamiento de Loteo — Ley 20.234', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '14.2', nombre: 'Resolución Saneamiento de Loteo — Ley 20.234', etapa: 'permiso', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 15 — Informes Revisor Independiente
// ===================================================================
const GRUPO_15 = {
  id: 15,
  nombre: 'Formato Tipo de Informes Revisor Independiente',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/grupo-15-formato-tipo-de-informes-revisor-independiente/',
  subtipos: {
    revisor_independiente: {
      nombre: 'Informes Revisor Independiente',
      articulo: 'Art. 116 bis LGUC / Ley 20.071',
      formularios: [
        { codigo: '15.1', nombre: 'Informe Revisor Independiente — Anteproyecto', etapa: 'anteproyecto', requerido: false },
        { codigo: '15.2', nombre: 'Informe Revisor Independiente — Permiso', etapa: 'permiso', requerido: false },
        { codigo: '15.3', nombre: 'Informe Revisor Independiente — Recepción', etapa: 'solicitud_recepcion', requerido: false },
      ],
    },
  },
}

// ===================================================================
// GRUPO 16 — Declaraciones Juradas
// ===================================================================
const GRUPO_16 = {
  id: 16,
  nombre: 'Declaraciones Juradas',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/grupo-16-declaraciones-juradas/',
  subtipos: {
    declaraciones: {
      nombre: 'Declaraciones Juradas',
      articulo: 'Art. 1.4.3 OGUC',
      formularios: [
        { codigo: '16.1', nombre: 'Declaración Jurada Simple del Propietario', etapa: 'solicitud_permiso', requerido: false },
        { codigo: '16.2', nombre: 'Declaración Jurada Simple del Arquitecto', etapa: 'solicitud_permiso', requerido: false },
        { codigo: '16.3', nombre: 'Declaración Jurada Simple del Constructor', etapa: 'solicitud_recepcion', requerido: false },
      ],
    },
  },
}

// ===================================================================
// GRUPO 17 — Resoluciones Publicidad Municipal
// ===================================================================
const GRUPO_17 = {
  id: 17,
  nombre: 'Modelos de Resoluciones — Publicidad Municipal Art. 116 bis C LGUC',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/17-modelos-de-resoluciones-publicidad-municipal-art-116-bis-c-de-la-lguc/',
  subtipos: {
    publicidad_municipal: {
      nombre: 'Publicidad Municipal',
      articulo: 'Art. 116 bis C LGUC',
      formularios: [
        { codigo: '17.1', nombre: 'Solicitud Autorización Publicidad Municipal', etapa: 'solicitud_permiso', requerido: true },
        { codigo: '17.2', nombre: 'Resolución Autorización Publicidad Municipal', etapa: 'permiso', requerido: true },
      ],
    },
  },
}

// ===================================================================
// GRUPO 18 — Silencio Administrativo Negativo
// ===================================================================
const GRUPO_18 = {
  id: 18,
  nombre: 'Silencio Administrativo Negativo — Art. 118 LGUC',
  url: 'https://www.minvu.gob.cl/elementos-tecnicos/formularios/18-silencio-administrativo-negativo-art-118-de-la-lguc/',
  subtipos: {
    silencio_administrativo: {
      nombre: 'Silencio Administrativo Negativo',
      articulo: 'Art. 118 LGUC',
      formularios: [
        { codigo: '18.1', nombre: 'Resolución Silencio Administrativo Negativo', etapa: 'permiso', requerido: true },
      ],
    },
  },
}

// ===================================================================
// CATÁLOGO MAESTRO — Todos los grupos
// ===================================================================
export const CATALOGO_MINVU = [
  GRUPO_1, GRUPO_2, GRUPO_3, GRUPO_4, GRUPO_5, GRUPO_6,
  GRUPO_7, GRUPO_8, GRUPO_9, GRUPO_10, GRUPO_11, GRUPO_12,
  GRUPO_13, GRUPO_14, GRUPO_15, GRUPO_16, GRUPO_17, GRUPO_18,
]

// ===================================================================
// MAPA PLANO: tipo tramitación → formularios
// Para compatibilidad con el componente FormulariosDomIntegrados
// ===================================================================
function construirMapaFormularios() {
  const mapa = {}
  for (const grupo of CATALOGO_MINVU) {
    for (const [subtipoKey, subtipo] of Object.entries(grupo.subtipos)) {
      const formularios = subtipo.formularios.map(f => ({
        ...f,
        articulo: subtipo.articulo,
        grupo: grupo.id,
        grupoNombre: grupo.nombre,
        carpetaGoogle: mapearCarpeta(f.etapa),
      }))
      mapa[subtipoKey] = formularios
    }
  }
  return mapa
}

function mapearCarpeta(etapa) {
  const mapaCarpetas = {
    anteproyecto: '01_Formularios',
    resolucion_anteproyecto: '04_Certificados',
    solicitud_permiso: '01_Formularios',
    permiso: '04_Certificados',
    solicitud_modificacion: '01_Formularios',
    resolucion_modificacion: '04_Certificados',
    solicitud_recepcion: '06_Recepcion',
    certificado_recepcion: '06_Recepcion',
  }
  return mapaCarpetas[etapa] || '01_Formularios'
}

export const FORMULARIOS_OGUC = construirMapaFormularios()

// ===================================================================
// FUNCIONES PÚBLICAS
// ===================================================================

// Obtener formularios para un tipo de tramitación (subtipo key)
export function obtenerFormulariosParaTipo(tipoTramitacion) {
  const tipo = (tipoTramitacion || '').toLowerCase().trim()
  return FORMULARIOS_OGUC[tipo] || []
}

// Obtener un formulario por código (busca en todo el catálogo)
export function obtenerFormularioPorCodigo(codigo) {
  for (const lista of Object.values(FORMULARIOS_OGUC)) {
    const encontrado = lista.find((f) => f.codigo === codigo)
    if (encontrado) return encontrado
  }
  return null
}

// Validar si todos los formularios requeridos están completados
export function validarFormulariosCompletos(formularios, tipoTramitacion) {
  const requeridos = obtenerFormulariosParaTipo(tipoTramitacion).filter((f) => f.requerido)
  if (requeridos.length === 0) return true
  const completados = requeridos.filter((f) =>
    formularios?.some((comp) => comp.codigo === f.codigo && comp.completado)
  )
  return completados.length === requeridos.length
}

// Listar todos los tipos (subtipos) disponibles
export function listarTiposDisponibles() {
  const tipos = []
  for (const grupo of CATALOGO_MINVU) {
    for (const [key, subtipo] of Object.entries(grupo.subtipos)) {
      tipos.push({
        key,
        nombre: subtipo.nombre,
        articulo: subtipo.articulo,
        grupo: grupo.id,
        grupoNombre: grupo.nombre,
        totalFormularios: subtipo.formularios.length,
        requeridos: subtipo.formularios.filter(f => f.requerido).length,
      })
    }
  }
  return tipos
}

// Obtener un grupo completo por ID
export function obtenerGrupo(grupoId) {
  return CATALOGO_MINVU.find(g => g.id === grupoId) || null
}

// Listar todos los grupos (para selector en UI)
export function listarGrupos() {
  return CATALOGO_MINVU.map(g => ({
    id: g.id,
    nombre: g.nombre,
    url: g.url,
    cantidadSubtipos: Object.keys(g.subtipos).length,
    cantidadFormularios: Object.values(g.subtipos)
      .reduce((sum, s) => sum + s.formularios.length, 0),
  }))
}

// Etapas estándar del flujo documental
export const ETAPAS_FLUJO = [
  { id: 'anteproyecto', nombre: 'Anteproyecto', orden: 1 },
  { id: 'resolucion_anteproyecto', nombre: 'Resolución Anteproyecto', orden: 2 },
  { id: 'solicitud_permiso', nombre: 'Solicitud Permiso', orden: 3 },
  { id: 'permiso', nombre: 'Permiso', orden: 4 },
  { id: 'solicitud_modificacion', nombre: 'Solicitud Modificación', orden: 5 },
  { id: 'resolucion_modificacion', nombre: 'Resolución Modificación', orden: 6 },
  { id: 'solicitud_recepcion', nombre: 'Solicitud Recepción', orden: 7 },
  { id: 'certificado_recepcion', nombre: 'Certificado Recepción', orden: 8 },
]
