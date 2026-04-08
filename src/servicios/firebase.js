import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCfoQTPAdeChs5xe8uCDwBUasf-DViGj4o",
  authDomain: "tramitacion-webdom.firebaseapp.com",
  projectId: "tramitacion-webdom",
  storageBucket: "tramitacion-webdom.firebasestorage.app",
  messagingSenderId: "784097657161",
  appId: "1:784097657161:web:a5cb0bb6d21c5bb8be5a98",
  measurementId: "G-W82F8HBKEE"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Auth provider base
export const proveedorGoogle = new GoogleAuthProvider()

// Calendar scopes
export const proveedorGoogleCalendar = new GoogleAuthProvider()
proveedorGoogleCalendar.addScope('https://www.googleapis.com/auth/calendar')
proveedorGoogleCalendar.addScope('https://www.googleapis.com/auth/calendar.events')

// Drive scopes (para subir/leer BC3 desde Drive)
export const proveedorGoogleDrive = new GoogleAuthProvider()
proveedorGoogleDrive.addScope('https://www.googleapis.com/auth/drive.file')
proveedorGoogleDrive.addScope('https://www.googleapis.com/auth/drive.readonly')

export default app
