// ===== Textos legales por jurisdicción =====
// Se usan en PaginaPrivacidad y PaginaTerminos. El texto cambia según el país
// declarado por el usuario al registrarse. Si el usuario declara "OTRO" se
// muestra una versión genérica internacional con remisión a su normativa local.

import { JURISDICCIONES } from './jurisdicciones'

const FECHA_VIGENCIA = '26 de abril de 2026'
const DESARROLLADOR = 'ZN Estudio · Soluciones ZN7'
const CONTACTO = 'rvillalon.es@gmail.com'

// ====================== POLÍTICA DE PRIVACIDAD ============================
export function politicaPrivacidad(codigoPais) {
  const j = JURISDICCIONES[codigoPais] || JURISDICCIONES.OTRO

  const intro = `Esta Política de Privacidad describe cómo Acua Conect recoge, utiliza y protege la información personal de los usuarios que acceden a la plataforma. La normativa aplicable a este usuario, según el país declarado al registrarse (${j.pais}), es: ${j.leyProteccionDatos}.`

  const secciones = [
    {
      titulo: '1. Responsable del tratamiento',
      texto: `El responsable del tratamiento de los datos personales es ${DESARROLLADOR}. Para ejercer derechos de acceso, rectificación, supresión, oposición, limitación o portabilidad, el usuario puede contactar mediante: ${CONTACTO}.`,
    },
    {
      titulo: '2. Datos recogidos',
      texto: `Recogemos: (a) datos de identificación (nombre, email, teléfono opcional), (b) datos profesionales declarados por el usuario (cargo, empresa), (c) datos técnicos (IP, navegador, registros de actividad), (d) contenidos cargados voluntariamente (presupuestos BC3, archivos de obra, fotografías, mediciones). No recogemos categorías especiales de datos sin consentimiento expreso.`,
    },
    {
      titulo: '3. Finalidad y base legal',
      texto: `Los datos se tratan para prestar el servicio contratado, gestionar la cuenta, generar informes técnicos y económicos solicitados, y comunicar actualizaciones del servicio. La base legal es el consentimiento prestado al registrarse y la ejecución del contrato de uso. En ${j.pais} aplica además: ${j.leyProteccionDatos}.`,
    },
    {
      titulo: '4. Conservación',
      texto: 'Los datos se conservan mientras el usuario mantenga su cuenta activa y, tras la baja, durante el plazo legal de prescripción de responsabilidades. El usuario puede solicitar la eliminación anticipada, salvo obligaciones legales de conservación.',
    },
    {
      titulo: '5. Cesión a terceros',
      texto: 'Solo se ceden datos a terceros que prestan servicios técnicos imprescindibles (hosting Firebase/Google Cloud, autenticación, almacenamiento). No se realizan transferencias con fines comerciales ni se venden datos. Los proveedores cuentan con cláusulas contractuales tipo y certificaciones aplicables a transferencias internacionales.',
    },
    {
      titulo: '6. Derechos del usuario',
      texto: `El usuario puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${CONTACTO}. Asimismo, puede presentar reclamación ante la autoridad competente: ${j.autoridadProteccionDatos}.`,
    },
    {
      titulo: '7. Seguridad',
      texto: 'Aplicamos medidas técnicas y organizativas razonables para proteger la información: cifrado en tránsito (TLS), reglas de acceso a la base de datos por rol, copias de seguridad y registros de auditoría. Ningún sistema es completamente inviolable; el usuario debe usar contraseñas robustas y proteger sus credenciales.',
    },
    {
      titulo: '8. Cookies y almacenamiento local',
      texto: 'La plataforma usa almacenamiento local del navegador estrictamente necesario para autenticación y persistencia de sesión. No se utilizan cookies con fines publicitarios ni de seguimiento de terceros.',
    },
    {
      titulo: '9. Modificaciones',
      texto: `Esta política puede actualizarse para reflejar cambios normativos o del servicio. La versión vigente es la publicada en la propia plataforma con fecha ${FECHA_VIGENCIA}. El uso continuado tras una actualización implica aceptación.`,
    },
  ]

  return { intro, secciones, vigencia: FECHA_VIGENCIA, jurisdiccion: j }
}

// ====================== TÉRMINOS Y CONDICIONES ============================
export function terminosCondiciones(codigoPais) {
  const j = JURISDICCIONES[codigoPais] || JURISDICCIONES.OTRO

  const intro = `Estos Términos y Condiciones regulan el uso de Acua Conect. Al registrarse, el usuario declara haber elegido el país «${j.pais}» como jurisdicción aplicable. Por tanto se rigen también por: ${j.legislacionContractual}, ${j.leyConsumidor} y la normativa técnica ${j.normativaTecnica}.`

  const secciones = [
    {
      titulo: '1. Naturaleza del servicio',
      texto: 'Acua Conect es una herramienta digital diseñada para asistir al usuario en tareas de licitación, medición, certificación, planificación BC3, viabilidad económica y gestión de obra. NO sustituye el criterio profesional, la fiscalización técnica ni la responsabilidad legal del usuario o de su organización.',
    },
    {
      titulo: '2. Responsabilidad del usuario (cláusula esencial)',
      texto: `El usuario es el único responsable de revisar, fiscalizar y aprobar cualquier resultado generado por la plataforma antes de utilizarlo en cualquier acto profesional, contractual, administrativo, técnico, económico o penal. La plataforma facilita herramientas de cálculo y estructuración de información, pero no garantiza la exactitud, integridad o aplicabilidad de los datos al caso concreto del usuario, ya que dependen de antecedentes que él mismo ingresa o contrata. Cualquier decisión adoptada o documento emitido a partir de los resultados es de su exclusiva responsabilidad.`,
    },
    {
      titulo: '3. Obligación de comunicar incongruencias',
      texto: 'Si el usuario detecta incongruencias entre los antecedentes ingresados y los cómputos, mediciones, presupuestos, dictámenes o informes generados, deberá comunicarlo al desarrollador a través de los canales de soporte para que la herramienta pueda ser mejorada de forma continua. Esta comunicación NO genera responsabilidad alguna del desarrollador respecto de los actos ya ejecutados por el usuario, ni convierte sus resultados en garantizados.',
    },
    {
      titulo: '4. Limitación de responsabilidad',
      texto: `Salvo dolo o culpa grave imputable al desarrollador y debidamente acreditada, ${DESARROLLADOR} no responde por daños directos, indirectos, lucro cesante, sanciones administrativas, multas, sobrecostes de obra, pérdidas contractuales, errores de cálculo, omisiones o cualquier consecuencia derivada del uso —correcto o incorrecto— de la plataforma. La responsabilidad económica máxima eventual queda limitada al importe efectivamente pagado por el usuario en los doce (12) meses anteriores al hecho que motive la reclamación.`,
    },
    {
      titulo: '5. Veracidad de los datos cargados',
      texto: 'El usuario declara y garantiza que los datos cargados en la plataforma (BC3, mediciones, planos, fotografías, antecedentes catastrales, contratos) son lícitos, ciertos, propios o cuenta con autorización para tratarlos, y respetan los derechos de terceros. La plataforma no audita estos datos.',
    },
    {
      titulo: '6. Uso permitido',
      texto: 'Queda prohibido: realizar ingeniería inversa, suplantar identidad, intentar acceder a cuentas de terceros, sobrecargar el servicio, usar la plataforma para fines ilícitos, o publicar contenido ofensivo o contrario a la normativa aplicable.',
    },
    {
      titulo: '7. Propiedad intelectual',
      texto: `El software, marca, diseño, código fuente y materiales asociados son propiedad de ${DESARROLLADOR}. El usuario conserva la titularidad de los datos y archivos que sube. Concede una licencia limitada al desarrollador, exclusivamente para procesarlos y prestarle el servicio.`,
    },
    {
      titulo: '8. Suspensión y baja',
      texto: 'El desarrollador puede suspender o cancelar cuentas que incumplan estos términos. El usuario puede dar de baja su cuenta en cualquier momento; la conservación de datos posterior se rige por la Política de Privacidad.',
    },
    {
      titulo: '9. Mejora continua sin garantía',
      texto: 'El servicio se ofrece «tal cual» y «según disponibilidad». El desarrollador trabajará por mejorar progresivamente la plataforma incorporando incongruencias notificadas por usuarios, sin que ello implique compromiso de tiempos ni garantía de corrección de errores específicos.',
    },
    {
      titulo: '10. Modificaciones',
      texto: `Estos términos pueden modificarse. La versión publicada en la plataforma con fecha ${FECHA_VIGENCIA} prevalece. Si los cambios son sustanciales, se notificará al usuario en su panel.`,
    },
    {
      titulo: '11. Legislación aplicable y resolución de conflictos',
      texto: `Para usuarios que han declarado «${j.pais}» como jurisdicción, se aplica la normativa local indicada (${j.legislacionContractual}). Las controversias se someterán a los tribunales competentes de ese país, sin perjuicio de los derechos irrenunciables que la legislación aplicable reconozca al usuario consumidor (${j.leyConsumidor}).`,
    },
    {
      titulo: '12. Aceptación expresa',
      texto: 'Para registrarse, el usuario debe marcar la casilla de aceptación. Esa aceptación constituye consentimiento expreso e informado a estos términos y a la Política de Privacidad. Quedará registrada con marca temporal en la cuenta del usuario.',
    },
  ]

  return { intro, secciones, vigencia: FECHA_VIGENCIA, jurisdiccion: j }
}
