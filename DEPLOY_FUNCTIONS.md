# Deploy Cloud Functions — Sincronización PLACE

## Primera vez

### 1. Instalar Firebase CLI globalmente
```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar proyecto (solo primera vez)
```bash
cd "/Users/znestudio/Library/Mobile Documents/com~apple~CloudDocs/Documents/web/dom-platform"

# Si no tienes .firebaserc:
firebase use --add
# Selecciona: tramitacion-webdom
# Alias: default
```

### 3. Instalar dependencias de Functions
```bash
cd functions
npm install
cd ..
```

### 4. Desplegar Functions
```bash
firebase deploy --only functions --project tramitacion-webdom
```

Si es la primera vez, Firebase pedirá habilitar APIs necesarias (Cloud Build, Cloud Functions, Pub/Sub). Acepta todas.

### 5. Copiar la URL desplegada
Al finalizar el deploy verás:
```
✔ functions[syncPlace(europe-west1)] Successful create operation.
Function URL (syncPlace): https://europe-west1-tramitacion-webdom.cloudfunctions.net/syncPlace
```

Esta URL ya está configurada por defecto en `.env.example`. Verifica que en tu `.env` esté:
```
VITE_SYNC_PLACE_URL=https://europe-west1-tramitacion-webdom.cloudfunctions.net/syncPlace
```

También añade esta variable en **Amplify Console → Hosting → Environment variables**.

---

## Deploys posteriores

```bash
# Solo código frontend
git add . && git commit -m "..." && git push    # Amplify auto-despliega

# Solo Cloud Functions
firebase deploy --only functions

# Solo reglas Firestore
firebase deploy --only firestore:rules

# Todo junto
firebase deploy --only functions,firestore:rules
```

---

## Probar la función manualmente

### Desde curl
```bash
curl -X POST https://europe-west1-tramitacion-webdom.cloudfunctions.net/syncPlace \
  -H "Content-Type: application/json" \
  -d '{
    "fechaDesde": "2026-04-01",
    "tipContrato": 2,
    "importeMin": 500000,
    "dryRun": true
  }'
```

Con `dryRun: true` solo muestra el conteo sin insertar en Firestore.

### Desde la app
Abre `/estudios` → botón azul **Sync PLACE** → selecciona "Cloud Function" → configura parámetros → "Sincronizar ahora".

---

## Scheduled sync (automático cada 6h)

`syncPlaceScheduled` se ejecuta automáticamente en:
- **Zona horaria**: Europe/Madrid
- **Frecuencia**: cada 6 horas
- **Parámetros fijos**: últimos 7 días, obras (tipo 2), importe ≥ 500K€

Para cambiar la frecuencia edita `functions/src/syncPlace.js`:
```js
.pubsub.schedule('every 6 hours')
```

Valores soportados: `every 30 minutes`, `every 1 hours`, `every 12 hours`, `every day 08:00`, etc.

---

## Ver logs

```bash
firebase functions:log --only syncPlace
firebase functions:log --only syncPlaceScheduled
```

O en la consola: https://console.firebase.google.com/project/tramitacion-webdom/functions/logs

---

## Costos

- **Free tier Firebase**: 2M invocaciones/mes, 400K GB-segundos
- **Scheduled cada 6h**: 120 invocaciones/mes ← GRATIS
- **Manual desde app**: ilimitado en práctica (gratis < 2M/mes)

---

## Troubleshooting

| Problema | Solución |
|---|---|
| "The default Firebase app does not exist" | `cd functions && npm install firebase-admin firebase-functions` |
| Error 403 Permission denied | Tu cuenta Google necesita rol Owner/Editor del proyecto |
| CORS error en la app | Verifica que `VITE_SYNC_PLACE_URL` no tenga espacios ni saltos de línea |
| "Firestore write permission denied" | Las CF usan admin SDK → no les afectan las reglas. Revisa `firebase.json` |
| Feed vacío | PLACE puede tardar en publicar. Prueba con `fechaDesde` de hace 30 días |
