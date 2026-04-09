// ===== Contexto de Autenticación =====
// Maneja el estado del usuario logueado en toda la aplicación
// Proporciona funciones para login, logout y registro

import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, proveedorGoogle } from '../servicios/firebase'
import { ROLES } from '../constantes/tramitaciones'

// Crear el contexto
const ContextoAuth = createContext(null)

// Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  const contexto = useContext(ContextoAuth)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de ProveedorAutenticacion')
  }
  return contexto
}

// Componente proveedor que envuelve toda la app
export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario] = useState(null)        // Datos del usuario
  const [datosUsuario, setDatosUsuario] = useState(null) // Datos extra de Firestore
  const [cargando, setCargando] = useState(true)       // ¿Está cargando?

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      setUsuario(user)

      if (user) {
        // Buscar datos adicionales del usuario en Firestore
        try {
          const docRef = doc(db, 'usuarios', user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            setDatosUsuario({ id: docSnap.id, ...docSnap.data() })
          } else {
            // Si no existe en Firestore, crear registro básico
            const nuevosDatos = {
              uid: user.uid,
              nombre: user.displayName || '',
              email: user.email,
              rut: '',
              telefono: '',
              rol: ROLES.GESTOR, // Por defecto es gestor
              empresa: '',
              fechaCreacion: serverTimestamp(),
            }
            await setDoc(docRef, nuevosDatos)
            setDatosUsuario({ id: user.uid, ...nuevosDatos })
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error)
        }
      } else {
        setDatosUsuario(null)
      }

      setCargando(false)
    })

    return cancelar
  }, [])

  // ----- Funciones de autenticación -----

  // Iniciar sesión con email y contraseña
  async function iniciarSesion(email, contrasena) {
    return signInWithEmailAndPassword(auth, email, contrasena)
  }

  // Registrar nuevo usuario
  async function registrarse(email, contrasena, nombre) {
    const credencial = await createUserWithEmailAndPassword(auth, email, contrasena)

    // Actualizar nombre en Firebase Auth
    await updateProfile(credencial.user, { displayName: nombre })

    // Crear documento en Firestore
    await setDoc(doc(db, 'usuarios', credencial.user.uid), {
      uid: credencial.user.uid,
      nombre,
      email,
      rut: '',
      telefono: '',
      rol: ROLES.GESTOR,
      empresa: '',
      fechaCreacion: serverTimestamp(),
    })

    return credencial
  }

  // Iniciar sesión con Google
  async function iniciarConGoogle() {
    const credencial = await signInWithPopup(auth, proveedorGoogle)

    // Verificar si ya existe en Firestore
    const docRef = doc(db, 'usuarios', credencial.user.uid)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        uid: credencial.user.uid,
        nombre: credencial.user.displayName || '',
        email: credencial.user.email,
        rut: '',
        telefono: '',
        rol: ROLES.GESTOR,
        empresa: '',
        fechaCreacion: serverTimestamp(),
      })
    }

    return credencial
  }

  // Cerrar sesión
  async function cerrarSesion() {
    setDatosUsuario(null)
    return signOut(auth)
  }

  // Valores que estarán disponibles en toda la app
  const valor = {
    usuario,
    datosUsuario,
    cargando,
    iniciarSesion,
    registrarse,
    iniciarConGoogle,
    cerrarSesion,
    esAdmin: datosUsuario?.rol === ROLES.ADMIN,
    esGestor: datosUsuario?.rol === ROLES.GESTOR || datosUsuario?.rol === ROLES.TECNICO_ESTUDIO,
    esCliente: datosUsuario?.rol === ROLES.CLIENTE,
    esDirector: datosUsuario?.rol === ROLES.DIRECTOR_GENERAL,
    esJefeDepto: datosUsuario?.rol === ROLES.JEFE_DEPTO,
    esJefeObra: datosUsuario?.rol === ROLES.JEFE_OBRA,
    puedeVerMargenes: ['admin', 'director_general', 'jefe_depto', 'tecnico_estudio', 'gestor'].includes(datosUsuario?.rol),
    puedeAprobar: ['director_general', 'jefe_depto'].includes(datosUsuario?.rol),
    puedeExportarTodo: ['director_general', 'jefe_depto'].includes(datosUsuario?.rol),
  }

  return (
    <ContextoAuth.Provider value={valor}>
      {children}
    </ContextoAuth.Provider>
  )
}
