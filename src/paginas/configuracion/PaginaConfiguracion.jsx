// ===== Página de Configuración de Usuario =====
import { useState, useEffect } from 'react'
import {
  User, Mail, Phone, Building2, Shield, Moon, Sun, Save,
  CreditCard, FileCheck, ExternalLink, CheckCircle, Bell, Scale,
} from 'lucide-react'
import { useAuth } from '../../contextos/ContextoAutenticacion'
import { actualizarUsuario } from '../../servicios/usuarios'
import { guardarPreferenciasNotificacion } from '../../servicios/notificaciones'
import Tarjeta, { TarjetaEncabezado, TarjetaCuerpo } from '../../componentes/ui/Tarjeta'
import CampoTexto from '../../componentes/ui/CampoTexto'
import Boton from '../../componentes/ui/Boton'
import toast from 'react-hot-toast'

export default function PaginaConfiguracion() {
  const { usuario, datosUsuario, esAdmin } = useAuth()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rut, setRut] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  // Políticas
  const [politicasAceptadas, setPoliticasAceptadas] = useState(false)
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  const [fechaAceptacion, setFechaAceptacion] = useState(null)
  const [guardandoPoliticas, setGuardandoPoliticas] = useState(false)

  // Notificaciones
  const [emailSemanal, setEmailSemanal] = useState(true)
  const [emailDestino, setEmailDestino] = useState('')
  const [incluirFinanciero, setIncluirFinanciero] = useState(true)
  const [incluirTramitaciones, setIncluirTramitaciones] = useState(true)
  const [guardandoNotifs, setGuardandoNotifs] = useState(false)

  // Tema
  const [temaOscuro, setTemaOscuro] = useState(false)

  // Pestaña activa en legales
  const [tabLegal, setTabLegal] = useState('privacidad')

  useEffect(() => {
    if (datosUsuario) {
      setNombre(datosUsuario.nombre || '')
      setTelefono(datosUsuario.telefono || '')
      setRut(datosUsuario.rut || '')
      setEmpresa(datosUsuario.empresa || '')
      setPoliticasAceptadas(datosUsuario.politicasAceptadas || false)
      setTerminosAceptados(datosUsuario.terminosAceptados || false)
      setFechaAceptacion(datosUsuario.fechaAceptacionPoliticas || null)
      // Notificaciones
      const notifs = datosUsuario.notificaciones || {}
      setEmailSemanal(notifs.emailSemanal ?? true)
      setEmailDestino(notifs.emailDestino || datosUsuario.email || '')
      setIncluirFinanciero(notifs.incluirFinanciero ?? true)
      setIncluirTramitaciones(notifs.incluirTramitaciones ?? true)
    }
  }, [datosUsuario])

  useEffect(() => {
    const temaGuardado = localStorage.getItem('dom-tema-oscuro')
    if (temaGuardado === 'true') { setTemaOscuro(true); document.documentElement.classList.add('dark') }
  }, [])

  async function guardarPerfil() {
    setGuardandoPerfil(true)
    try {
      await actualizarUsuario(usuario.uid, { nombre, telefono, rut, empresa })
      toast.success('Perfil actualizado correctamente')
    } catch (error) {
      toast.error('Error al guardar los cambios')
    } finally {
      setGuardandoPerfil(false)
    }
  }

  async function aceptarPoliticas() {
    if (!politicasAceptadas || !terminosAceptados) {
      toast.error('Debes aceptar ambos documentos para continuar')
      return
    }
    setGuardandoPoliticas(true)
    try {
      const ahora = new Date().toISOString()
      await actualizarUsuario(usuario.uid, { politicasAceptadas: true, terminosAceptados: true, fechaAceptacionPoliticas: ahora })
      setFechaAceptacion(ahora)
      toast.success('Documentos legales aceptados')
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setGuardandoPoliticas(false)
    }
  }

  async function guardarNotificaciones() {
    setGuardandoNotifs(true)
    try {
      await guardarPreferenciasNotificacion(usuario.uid, {
        emailSemanal, diaEnvio: 'lunes', horaEnvio: '12:00',
        emailDestino, incluirFinanciero, incluirTramitaciones,
      })
      toast.success('Preferencias de notificación guardadas')
    } catch (error) {
      toast.error('Error al guardar notificaciones')
    } finally {
      setGuardandoNotifs(false)
    }
  }

  function toggleTema() {
    const nuevo = !temaOscuro
    setTemaOscuro(nuevo)
    localStorage.setItem('dom-tema-oscuro', String(nuevo))
    if (nuevo) { document.documentElement.classList.add('dark') } else { document.documentElement.classList.remove('dark') }
  }

  function formatearRut(valor) {
    let limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase()
    if (limpio.length <= 1) return limpio
    const dv = limpio.slice(-1)
    let cuerpo = limpio.slice(0, -1)
    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${cuerpo}-${dv}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Perfil, privacidad, notificaciones y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== COLUMNA IZQUIERDA ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* PERFIL */}
          <Tarjeta>
            <TarjetaEncabezado><div className="flex items-center gap-2"><User className="h-5 w-5 text-dom-600" /><h2 className="text-base font-semibold text-gray-900">Datos del Perfil</h2></div></TarjetaEncabezado>
            <TarjetaCuerpo>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoTexto etiqueta="Nombre completo" type="text" placeholder="Juan Pérez González" value={nombre} onChange={(e) => setNombre(e.target.value)} icono={User} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div>
                      <input type="email" value={usuario?.email || ''} disabled className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-10 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">El email no se puede modificar</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoTexto etiqueta="Teléfono" type="tel" placeholder="+56 9 1234 5678" value={telefono} onChange={(e) => setTelefono(e.target.value)} icono={Phone} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard className="h-4 w-4 text-gray-400" /></div>
                      <input type="text" placeholder="12.345.678-9" value={rut} onChange={(e) => setRut(formatearRut(e.target.value))} maxLength={12} className="block w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-sm placeholder-gray-400 shadow-sm focus:border-dom-500 focus:outline-none focus:ring-1 focus:ring-dom-500" />
                    </div>
                  </div>
                </div>
                <CampoTexto etiqueta="Empresa / Oficina" type="text" placeholder="Nombre de tu empresa o estudio" value={empresa} onChange={(e) => setEmpresa(e.target.value)} icono={Building2} />
                <div className="flex justify-end pt-2"><Boton icono={Save} cargando={guardandoPerfil} onClick={guardarPerfil}>Guardar Cambios</Boton></div>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* DOCUMENTOS LEGALES */}
          <Tarjeta>
            <TarjetaEncabezado>
              <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-dom-600" /><h2 className="text-base font-semibold text-gray-900">Documentos Legales</h2></div>
            </TarjetaEncabezado>
            <TarjetaCuerpo>
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setTabLegal('privacidad')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${tabLegal === 'privacidad' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Privacidad y Datos</button>
                  <button onClick={() => setTabLegal('terminos')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${tabLegal === 'terminos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Términos y Condiciones</button>
                </div>

                {/* Contenido */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto border border-gray-200 text-sm text-gray-700 space-y-3">
                  {tabLegal === 'privacidad' ? (
                    <>
                      <h3 className="font-bold text-gray-900 text-base">Política de Privacidad y Tratamiento de Datos Personales</h3>
                      <p className="text-xs text-gray-500">Última actualización: abril 2026</p>

                      <p><strong>1. Responsable del Tratamiento.</strong> Acua Conect (en adelante, "la Plataforma"), operada por zn Soluciones, con domicilio en Málaga, España, es responsable del tratamiento de los datos personales de sus usuarios conforme a la Ley N°19.628 sobre Protección de la Vida Privada de Chile y la Ley N°21.719 sobre Protección de Datos Personales y creación de la Agencia de Protección de Datos Personales.</p>

                      <p><strong>2. Datos que Recopilamos.</strong> La Plataforma recopila exclusivamente los siguientes datos: nombre completo, correo electrónico, número de teléfono, RUT, nombre de empresa u oficina profesional. Adicionalmente, se almacena la información técnica relativa a proyectos, tramitaciones, contratos y flujos de caja que el usuario registre voluntariamente.</p>

                      <p><strong>3. Finalidad del Tratamiento.</strong> Los datos personales serán tratados con las siguientes finalidades: (a) gestión y administración de la cuenta del usuario; (b) visualización y seguimiento de tramitaciones ante Direcciones de Obras Municipales; (c) generación de reportes y resúmenes de actividad; (d) envío de notificaciones y resúmenes semanales por correo electrónico, previa autorización del usuario; (e) mejora continua del servicio.</p>

                      <p><strong>4. Base Legal del Tratamiento.</strong> El tratamiento se fundamenta en el consentimiento expreso del titular (artículo 4° de la Ley N°19.628), el cual se otorga mediante la aceptación de la presente política. El usuario podrá revocar su consentimiento en cualquier momento sin efecto retroactivo.</p>

                      <p><strong>5. Almacenamiento y Seguridad.</strong> Los datos se almacenan en infraestructura de Google Cloud Platform (Firebase) con cifrado en tránsito (TLS 1.3) y en reposo (AES-256). El acceso a la base de datos está restringido mediante reglas de seguridad de Firestore y autenticación OAuth 2.0.</p>

                      <p><strong>6. Transferencia Internacional de Datos.</strong> Al utilizar servidores de Google Cloud, los datos pueden ser almacenados en centros de datos ubicados fuera del territorio de Chile. Google LLC cumple con estándares internacionales de protección de datos, incluyendo ISO 27001, SOC 2 y SOC 3.</p>

                      <p><strong>7. Derechos del Titular.</strong> Conforme a la Ley N°19.628 y la Ley N°21.719, el usuario tiene derecho a: (a) Acceder a sus datos personales; (b) Rectificar datos inexactos o incompletos; (c) Cancelar o suprimir sus datos; (d) Oponerse al tratamiento; (e) Portabilidad de sus datos. Para ejercer estos derechos, el usuario puede contactarnos a través de la Plataforma o al correo electrónico del administrador.</p>

                      <p><strong>8. Retención de Datos.</strong> Los datos se conservarán mientras la cuenta del usuario permanezca activa. Ante solicitud de eliminación, los datos serán suprimidos en un plazo máximo de 30 días hábiles, salvo aquellos que deban conservarse por obligación legal.</p>

                      <p><strong>9. Cookies.</strong> La Plataforma utiliza únicamente cookies técnicas esenciales para la autenticación y el funcionamiento del servicio. No se emplean cookies de rastreo, publicidad ni analítica de terceros.</p>

                      <p><strong>10. No Compartición con Terceros.</strong> Los datos personales no serán cedidos, vendidos ni compartidos con terceros, salvo requerimiento de autoridad judicial o administrativa competente conforme a la legislación vigente.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-900 text-base">Términos y Condiciones de Uso — Acua Conect</h3>
                      <p className="text-xs text-gray-500">Última actualización: abril 2026</p>

                      <p><strong>1. Naturaleza del Servicio.</strong> Acua Conect es una <strong>plataforma de gestión interna</strong> diseñada para organizar, visualizar y administrar información de proyectos de construcción, contratos y flujos de caja. La Plataforma es una herramienta de uso interno que facilita el orden y seguimiento de la información ingresada por el usuario.</p>

                      <p><strong>2. Alcance del Servicio.</strong> La Plataforma permite: organizar documentación de proyectos, registrar contratos y presupuestos, hacer seguimiento de avances financieros, y generar reportes internos. <strong>Acua Conect no realiza trámites municipales, no gestiona permisos ante la DOM ni ante ninguna entidad pública o privada.</strong></p>

                      <p><strong>3. Responsabilidad del Usuario.</strong> El usuario es el único responsable de la información que registre en la Plataforma, incluyendo datos de proyectos, montos y documentación. La Plataforma no verifica ni garantiza la exactitud de los datos ingresados.</p>

                      <p><strong>4. Disponibilidad.</strong> El servicio se ofrece según disponibilidad. La Plataforma podrá suspender o modificar funcionalidades previa notificación cuando sea posible.</p>

                      <p><strong>5. Propiedad Intelectual.</strong> El software y diseño de Acua Conect son propiedad de sus desarrolladores. El usuario conserva la titularidad sobre su información.</p>
                    </>
                  )}
                </div>

                {/* Aceptación */}
                {fechaAceptacion ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Documentos legales aceptados</p>
                      <p className="text-xs text-green-600">Aceptados el {new Date(fechaAceptacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={politicasAceptadas} onChange={(e) => setPoliticasAceptadas(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-dom-600 focus:ring-dom-500" />
                      <span className="text-sm text-gray-700">He leído y acepto la <strong>Política de Privacidad y Tratamiento de Datos Personales</strong>, conforme a la Ley 19.628 y Ley 21.719.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={terminosAceptados} onChange={(e) => setTerminosAceptados(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-dom-600 focus:ring-dom-500" />
                      <span className="text-sm text-gray-700">He leído y acepto los <strong>Términos y Condiciones de Uso</strong> de Acua Conect.</span>
                    </label>
                    <Boton icono={FileCheck} cargando={guardandoPoliticas} onClick={aceptarPoliticas} disabled={!politicasAceptadas || !terminosAceptados}>Aceptar Documentos Legales</Boton>
                  </div>
                )}
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* NOTIFICACIONES */}
          <Tarjeta>
            <TarjetaEncabezado><div className="flex items-center gap-2"><Bell className="h-5 w-5 text-dom-600" /><h2 className="text-base font-semibold text-gray-900">Notificaciones</h2></div></TarjetaEncabezado>
            <TarjetaCuerpo>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800"><strong>Resumen semanal por email:</strong> Todos los lunes a las 12:00 hrs recibirás un email con el estado de todos tus proyectos activos, avances financieros y tramitaciones pendientes.</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">Activar resumen semanal</p><p className="text-xs text-gray-500">Envío: lunes 12:00 hrs</p></div>
                    <button onClick={() => setEmailSemanal(!emailSemanal)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailSemanal ? 'bg-dom-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailSemanal ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>

                  {emailSemanal && (
                    <>
                      <CampoTexto etiqueta="Email de destino" type="email" placeholder="tu@email.com" value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} icono={Mail} />
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={incluirFinanciero} onChange={(e) => setIncluirFinanciero(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-dom-600 focus:ring-dom-500" />
                        <span className="text-sm text-gray-700">Incluir información financiera (contratos, avances, montos)</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={incluirTramitaciones} onChange={(e) => setIncluirTramitaciones(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-dom-600 focus:ring-dom-500" />
                        <span className="text-sm text-gray-700">Incluir estado de tramitaciones y formularios OGUC</span>
                      </label>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-2"><Boton icono={Save} cargando={guardandoNotifs} onClick={guardarNotificaciones}>Guardar Notificaciones</Boton></div>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>

        {/* ===== COLUMNA DERECHA ===== */}
        <div className="space-y-6">
          {/* Cuenta */}
          <Tarjeta>
            <TarjetaEncabezado><h2 className="text-base font-semibold text-gray-900">Tu Cuenta</h2></TarjetaEncabezado>
            <TarjetaCuerpo>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-dom-100 mb-3"><span className="text-2xl font-bold text-dom-700">{nombre?.charAt(0)?.toUpperCase() || 'U'}</span></div>
                <h3 className="font-semibold text-gray-900">{nombre || 'Sin nombre'}</h3>
                <p className="text-sm text-gray-500">{usuario?.email}</p>
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Rol</span><span className="font-medium text-gray-900 capitalize">{datosUsuario?.rol || 'gestor'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Teléfono</span><span className="font-medium text-gray-900">{telefono || '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">RUT</span><span className="font-medium text-gray-900">{rut || '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Empresa</span><span className="font-medium text-gray-900">{empresa || '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Docs. legales</span>{fechaAceptacion ? <span className="text-green-600 font-medium">✓ Aceptados</span> : <span className="text-amber-600 font-medium">Pendiente</span>}</div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Email semanal</span><span className="font-medium text-gray-900">{emailSemanal ? '✓ Activo' : 'Desactivado'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Miembro desde</span><span className="font-medium text-gray-900">{datosUsuario?.fechaCreacion?.toDate ? datosUsuario.fechaCreacion.toDate().toLocaleDateString('es-CL') : '—'}</span></div>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* Apariencia */}
          <Tarjeta>
            <TarjetaEncabezado><h2 className="text-base font-semibold text-gray-900">Apariencia</h2></TarjetaEncabezado>
            <TarjetaCuerpo>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {temaOscuro ? <Moon className="h-5 w-5 text-indigo-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  <div><p className="text-sm font-medium text-gray-900">Modo oscuro</p><p className="text-xs text-gray-500">{temaOscuro ? 'Activado' : 'Desactivado'}</p></div>
                </div>
                <button onClick={toggleTema} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${temaOscuro ? 'bg-dom-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${temaOscuro ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>

          {/* Normativa */}
          <Tarjeta>
            <TarjetaEncabezado><h2 className="text-base font-semibold text-gray-900">Normativa</h2></TarjetaEncabezado>
            <TarjetaCuerpo>
              <div className="space-y-3">
                <a href="https://www.minvu.gob.cl/elementos-tecnicos/formularios/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-dom-600 hover:text-dom-700 hover:underline"><ExternalLink className="h-4 w-4" />Formularios OGUC — MINVU</a>
                <a href="https://www.bcn.cl/leychile/navegar?idNorma=61438" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-dom-600 hover:text-dom-700 hover:underline"><ExternalLink className="h-4 w-4" />OGUC — Biblioteca del Congreso</a>
                <a href="https://www.bcn.cl/leychile/navegar?idNorma=141599" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-dom-600 hover:text-dom-700 hover:underline"><ExternalLink className="h-4 w-4" />Ley 19.628 — Protección Datos</a>
                <a href="https://www.bcn.cl/leychile/navegar?idNorma=1202458" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-dom-600 hover:text-dom-700 hover:underline"><ExternalLink className="h-4 w-4" />Ley 21.719 — Datos Personales</a>
              </div>
            </TarjetaCuerpo>
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}
