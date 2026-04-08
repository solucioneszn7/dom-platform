# 🚀 Guía de Despliegue — DOM Platform en AWS

## Prerrequisitos

- Node.js 18+ instalado en tu PC
- Cuenta AWS (free tier OK)
- Git instalado

---

## PASO 1: Preparar el build en tu PC

```bash
# 1. Descomprime el ZIP en una carpeta
unzip dom-platform-v8-full.zip -d dom-platform
cd dom-platform

# 2. Instala dependencias
npm install

# 3. Ejecuta en local para verificar
npm run dev
# → Abre http://localhost:5173

# 4. Genera el build de producción
npm run build
# → Crea la carpeta /dist con los archivos estáticos
```

---

## OPCIÓN A: AWS Amplify (⭐ MÁS FÁCIL — Recomendado)

### ¿Qué es?
Amplify es el servicio de AWS para hosting de SPAs (Single Page Apps). 
Gratis dentro del free tier: 1000 minutos de build/mes, 15 GB de hosting.

### Pasos:

#### 1. Sube tu código a GitHub
```bash
cd dom-platform
git init
git add .
git commit -m "DOM Platform v8"
git remote add origin https://github.com/TU_USUARIO/dom-platform.git
git push -u origin main
```

#### 2. Conecta a Amplify
1. Ve a **AWS Console** → busca **Amplify**
2. Click **"Crear aplicación"** → **"Alojar aplicación web"**
3. Elige **GitHub** → autoriza acceso
4. Selecciona tu repositorio `dom-platform` y la rama `main`
5. Amplify detectará Vite automáticamente. Si no, configura:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Click **"Guardar e implementar"**
7. Espera 2-3 minutos → te da una URL tipo `https://main.d1abc123.amplifyapp.com`

#### 3. Dominio personalizado (opcional)
- En Amplify → **Administración de dominios** → añade tu dominio
- Amplify genera certificado SSL gratis

---

## OPCIÓN B: S3 + CloudFront (Hosting estático clásico)

### 1. Crear bucket S3
```bash
# Desde AWS CLI (o hazlo desde la consola web)
aws s3 mb s3://dom-platform-web

# Subir el build
aws s3 sync dist/ s3://dom-platform-web --delete
```

### 2. Configurar como sitio web estático
1. AWS Console → S3 → tu bucket → **Propiedades**
2. Activa **"Alojamiento de sitios web estáticos"**
3. Documento índice: `index.html`
4. Documento error: `index.html` (IMPORTANTE para React Router)

### 3. Política de bucket (hacer público)
En **Permisos** → **Política de bucket**, pega:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::dom-platform-web/*"
  }]
}
```

### 4. CloudFront (HTTPS + CDN)
1. AWS Console → CloudFront → **Crear distribución**
2. Origin: tu bucket S3
3. En **Error pages**: añade regla 403/404 → redirigir a `/index.html` con código 200
4. Espera ~15 min → URL tipo `d1234.cloudfront.net`

---

## OPCIÓN C: EC2 (Si ya tienes un servidor)

Si ya creaste una instancia EC2 (Amazon Linux o Ubuntu):

### 1. Conéctate por SSH
```bash
ssh -i tu-clave.pem ec2-user@TU_IP_PUBLICA
# o ubuntu@TU_IP_PUBLICA si es Ubuntu
```

### 2. Instala Node.js y Nginx
```bash
# Amazon Linux 2023
sudo dnf install -y nginx
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Ubuntu
sudo apt update
sudo apt install -y nginx nodejs npm
```

### 3. Sube y construye el proyecto
```bash
# Desde tu PC, sube el ZIP:
scp -i tu-clave.pem dom-platform-v8-full.zip ec2-user@TU_IP:~

# En el servidor:
mkdir ~/dom-platform && cd ~/dom-platform
unzip ~/dom-platform-v8-full.zip
npm install
npm run build
```

### 4. Configura Nginx
```bash
sudo nano /etc/nginx/conf.d/dom.conf
```
Pega:
```nginx
server {
    listen 80;
    server_name TU_IP_O_DOMINIO;
    root /home/ec2-user/dom-platform/dist;
    index index.html;

    # React Router - TODAS las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo nginx -t          # Verificar config
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. Abrir puertos
En AWS Console → EC2 → Security Groups → tu instancia:
- Añade regla **Inbound**: HTTP (80) desde 0.0.0.0/0
- Añade regla **Inbound**: HTTPS (443) desde 0.0.0.0/0

### 6. HTTPS con Certbot (gratuito)
```bash
sudo dnf install -y certbot python3-certbot-nginx   # Amazon Linux
# o
sudo apt install -y certbot python3-certbot-nginx    # Ubuntu

sudo certbot --nginx -d tu-dominio.com
```

---

## PASO FINAL (CRÍTICO): Configurar Firebase

Sin importar qué opción elijas, debes:

### 1. Añadir dominio autorizado en Firebase
1. Ve a **Firebase Console** → tu proyecto `tramitacion-webdom`
2. **Authentication** → **Settings** → **Authorized domains**
3. Añade tu dominio:
   - `main.d1abc123.amplifyapp.com` (Amplify)
   - `d1234.cloudfront.net` (CloudFront)
   - `tu-dominio.com` (personalizado)
   - `TU_IP_EC2` (si usas EC2 directo)

### 2. Actualizar OAuth redirect en Google Cloud
1. Ve a **Google Cloud Console** → APIs & Services → Credentials
2. En tu OAuth 2.0 Client → **Authorized redirect URIs** añade:
   ```
   https://TU_DOMINIO/__/auth/handler
   ```

### 3. Habilitar APIs (si usas Calendar/Drive)
- Google Calendar API → **Enable**
- Google Drive API → **Enable**

---

## Actualizar después de cambios

```bash
# Opción A (Amplify): solo haz push a GitHub
git add . && git commit -m "update" && git push

# Opción B (S3):
npm run build
aws s3 sync dist/ s3://dom-platform-web --delete

# Opción C (EC2):
cd ~/dom-platform
git pull   # o sube el nuevo ZIP
npm run build
# Nginx sirve el /dist automáticamente
```

---

## Resumen de costos (Free Tier)

| Servicio | Free Tier | Después |
|----------|-----------|---------|
| Amplify | 12 meses gratis (1000 min build, 15 GB) | ~$0.01/GB |
| S3 | 5 GB, 20K GET/mes | ~$0.023/GB |
| CloudFront | 1 TB transferencia/mes, 12 meses | ~$0.085/GB |
| EC2 t2.micro | 750 horas/mes, 12 meses | ~$8.50/mes |
| Firebase (Spark) | Siempre gratis (1GB Firestore, 50K reads/day) | — |
