import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ===== SECURITY: Keys loaded from .env (never hardcoded) =====
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate config at startup
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API key missing. Create a .env file from .env.example')
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export const proveedorGoogle = new GoogleAuthProvider()

export const proveedorGoogleCalendar = new GoogleAuthProvider()
proveedorGoogleCalendar.addScope('https://www.googleapis.com/auth/calendar')
proveedorGoogleCalendar.addScope('https://www.googleapis.com/auth/calendar.events')

export const proveedorGoogleDrive = new GoogleAuthProvider()
proveedorGoogleDrive.addScope('https://www.googleapis.com/auth/drive.file')
proveedorGoogleDrive.addScope('https://www.googleapis.com/auth/drive.readonly')

export default app
