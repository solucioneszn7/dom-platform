# 🔒 Seguridad — DOM Platform

## 1. Variables de entorno (.env)

Las claves de Firebase ya NO están en el código. Están en `.env`:

```bash
# Crear .env desde la plantilla
cp .env.example .env
```

### Para AWS Amplify (producción):
1. Ve a **Amplify** → tu app → **Hosting** → **Environment variables**
2. Añade cada variable:
   - `VITE_FIREBASE_API_KEY` = `AIzaSyC...`
   - `VITE_FIREBASE_AUTH_DOMAIN` = `tramitacion-webdom.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID` = `tramitacion-webdom`
   - `VITE_FIREBASE_STORAGE_BUCKET` = `tramitacion-webdom.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = `784097657161`
   - `VITE_FIREBASE_APP_ID` = `1:784097657161:web:a5cb0bb6d21c5bb8be5a98`
   - `VITE_FIREBASE_MEASUREMENT_ID` = `G-W82F8HBKEE`
3. Redeploy

## 2. Firestore Security Rules

Despliega las reglas de seguridad:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project tramitacion-webdom
```

Las reglas implementan:
- Autenticación obligatoria en todas las colecciones
- RBAC: cada colección valida el rol del usuario
- Certificaciones: solo admin/director pueden editar aprobadas o eliminar
- Catch-all: todo lo no definido está BLOQUEADO

## 3. Rate Limiting

### Google Cloud Console:
1. Ve a **APIs & Services** → **Credentials**
2. En tu API key → **Restrict key**:
   - Application restrictions: **HTTP referrers**
   - Añade: `main.d2wf0nybtnq2i0.amplifyapp.com/*` y `localhost:5173/*`
   - API restrictions: Solo **Identity Toolkit**, **Cloud Firestore**, **Token Service**
3. Guarda

### Firebase App Check (opcional pero recomendado):
1. Firebase Console → **App Check** → Enable
2. Elige **reCAPTCHA v3** para web
3. Registra tu dominio de Amplify

## 4. Checklist de seguridad

- [x] API keys en .env (no en código)
- [x] .env en .gitignore
- [x] Firestore rules con autenticación + RBAC
- [x] Roles validados en backend (rules), no solo en frontend
- [ ] Restringir API key en Google Cloud Console (hazlo tú)
- [ ] Activar App Check en Firebase Console (hazlo tú)
- [ ] Revocar el token de GitHub expuesto y generar uno nuevo
