// ===== Tipos de tramitación y sus documentos requeridos =====
// Cada tipo define qué documentos se necesitan para ese trámite en la DOM

export const TIPOS_TRAMITACION = {
  OBRA_NUEVA: {
    id: 'obra_nueva',
    nombre: 'Obra Nueva',
    descripcion: 'Permiso de edificación para construcción nueva',
    color: '#2563eb',
    plazoRevision: 30, // días hábiles
    documentos: [
      { nombre: 'FUS firmado', requerido: true, carpeta: '01_Formularios' },
      { nombre: 'Certificado Informaciones Previas', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Título de dominio', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Certificado avalúo fiscal (SII)', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Planos de Arquitectura', requerido: true, carpeta: '02_Planos' },
      { nombre: 'Especificaciones técnicas', requerido: true, carpeta: '05_Informes' },
      { nombre: 'Proyecto Cálculo Estructural', requerido: true, carpeta: '03_Calculos' },
      { nombre: 'Informe Revisor Independiente', requerido: false, carpeta: '05_Informes' },
      { nombre: 'Estudio Mecánica de Suelos', requerido: true, carpeta: '05_Informes' },
      { nombre: 'Proyecto agua potable/alcantarillado', requerido: true, carpeta: '02_Planos' },
      { nombre: 'Proyecto eléctrico', requerido: true, carpeta: '02_Planos' },
      { nombre: 'Proyecto gas', requerido: false, carpeta: '02_Planos' },
      { nombre: 'Presupuesto detallado', requerido: true, carpeta: '05_Informes' },
    ],
  },

  OBRA_MENOR: {
    id: 'obra_menor',
    nombre: 'Obra Menor (Ampliación hasta 100m²)',
    descripcion: 'Permiso para ampliaciones menores hasta 100 metros cuadrados',
    color: '#059669',
    plazoRevision: 15, // días hábiles
    documentos: [
      { nombre: 'Formulario Obra Menor', requerido: true, carpeta: '01_Formularios' },
      { nombre: 'Croquis/plano simplificado', requerido: true, carpeta: '02_Planos' },
      { nombre: 'Especificaciones técnicas resumidas', requerido: true, carpeta: '05_Informes' },
      { nombre: 'Título de dominio', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Certificado Informaciones Previas', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Presupuesto estimado', requerido: true, carpeta: '05_Informes' },
    ],
  },

  REGULARIZACION: {
    id: 'regularizacion',
    nombre: 'Regularización (Ley 20.898)',
    descripcion: 'Regularización de construcciones existentes según Ley 20.898',
    color: '#d97706',
    plazoRevision: 30,
    documentos: [
      { nombre: 'Formulario Regularización', requerido: true, carpeta: '01_Formularios' },
      { nombre: 'Informe arquitecto', requerido: true, carpeta: '05_Informes' },
      { nombre: 'Plano edificación existente', requerido: true, carpeta: '02_Planos' },
      { nombre: 'Declaración jurada propietario', requerido: true, carpeta: '01_Formularios' },
      { nombre: 'Título de dominio', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Certificado avalúo fiscal', requerido: true, carpeta: '04_Certificados' },
    ],
  },

  RECEPCION_DEFINITIVA: {
    id: 'recepcion_definitiva',
    nombre: 'Recepción Definitiva',
    descripcion: 'Solicitud de recepción final de la obra construida',
    color: '#7c3aed',
    plazoRevision: 30,
    documentos: [
      { nombre: 'Formulario Solicitud Recepción', requerido: true, carpeta: '01_Formularios' },
      { nombre: 'Permiso de edificación original', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Planos As-Built', requerido: true, carpeta: '02_Planos' },
      { nombre: 'Certificado TE4 (eléctrico)', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Certificado TE6 gas', requerido: false, carpeta: '04_Certificados' },
      { nombre: 'Certificado sanitario', requerido: true, carpeta: '04_Certificados' },
      { nombre: 'Informe ascensores', requerido: false, carpeta: '05_Informes' },
      { nombre: 'Libro de obras', requerido: true, carpeta: '06_Recepcion' },
    ],
  },
}

// Lista simple para usar en selects/dropdowns
export const LISTA_TIPOS = Object.values(TIPOS_TRAMITACION)

// ===== Fases de tramitación =====
export const FASES = {
  PREPARACION: {
    id: 'preparacion',
    nombre: 'Preparación',
    descripcion: 'Se están recopilando los documentos necesarios',
    color: '#6b7280',   // gris
    icono: 'FileText',
    orden: 1,
  },
  INGRESO_DOM: {
    id: 'ingreso_dom',
    nombre: 'Ingreso DOM',
    descripcion: 'El expediente fue presentado en la municipalidad',
    color: '#3b82f6',   // azul
    icono: 'Building2',
    orden: 2,
  },
  EN_REVISION: {
    id: 'en_revision',
    nombre: 'En Revisión',
    descripcion: 'La DOM está revisando el expediente',
    color: '#f59e0b',   // amarillo
    icono: 'Clock',
    orden: 3,
  },
  OBSERVACIONES: {
    id: 'observaciones',
    nombre: 'Observaciones',
    descripcion: 'La DOM hizo observaciones que deben subsanarse',
    color: '#ef4444',   // rojo
    icono: 'AlertTriangle',
    orden: 4,
  },
  APROBADO: {
    id: 'aprobado',
    nombre: 'Aprobado',
    descripcion: 'El permiso fue otorgado',
    color: '#10b981',   // verde
    icono: 'CheckCircle',
    orden: 5,
  },
  RECHAZADO: {
    id: 'rechazado',
    nombre: 'Rechazado',
    descripcion: 'La solicitud fue rechazada',
    color: '#dc2626',   // rojo oscuro
    icono: 'XCircle',
    orden: 6,
  },
  RECEPCION: {
    id: 'recepcion',
    nombre: 'Recepción',
    descripcion: 'En proceso de recepción final de la obra',
    color: '#8b5cf6',   // morado
    icono: 'Award',
    orden: 7,
  },
}

export const LISTA_FASES = Object.values(FASES).sort((a, b) => a.orden - b.orden)

// ===== Subcarpetas de Google Drive =====
export const CARPETAS_DRIVE = [
  '01_Formularios',
  '02_Planos',
  '03_Calculos',
  '04_Certificados',
  '05_Informes',
  '06_Recepcion',
]

// ===== Roles de usuario =====
export const ROLES = {
  ADMIN: 'admin',
  GESTOR: 'gestor',
  CLIENTE: 'cliente',
}

// ===== Estados de proyecto =====
export const ESTADOS_PROYECTO = {
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  ARCHIVADO: 'archivado',
}
