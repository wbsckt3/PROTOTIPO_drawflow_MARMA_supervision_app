# Solución para Mixed Content Error

## Problema
El frontend en HTTPS (CloudFront) no puede hacer llamadas HTTP al backend, causando el error:
```
Se ha bloqueado la carga del contenido activo mixto "http://50.17.36.133.nip.io:8080/..."
```

## Soluciones Disponibles

### ✅ Solución 1: Cloudflare (RECOMENDADA - Más Rápida y Gratis)

Cloudflare puede añadir HTTPS automáticamente a tu dominio nip.io sin necesidad de certificados.

#### Pasos:

1. **Crear cuenta en Cloudflare** (gratis):
   - Ve a https://cloudflare.com
   - Crea una cuenta gratuita

2. **Añadir tu dominio**:
   - En el dashboard de Cloudflare, click en "Add a Site"
   - Ingresa: `50.17.36.133.nip.io`
   - Selecciona el plan "Free"

3. **Configurar DNS**:
   - Cloudflare detectará automáticamente los registros DNS
   - Asegúrate de que hay un registro A apuntando a `50.17.36.133`
   - Si no existe, añádelo:
     - Type: `A`
     - Name: `@` (o `50.17.36.133`)
     - Content: `50.17.36.133`
     - Proxy status: **Proxied** (nube naranja) ⚠️ IMPORTANTE

4. **Configurar SSL/TLS**:
   - Ve a la pestaña **SSL/TLS**
   - Selecciona: **Full (strict)** o **Full**
   - Esto habilitará HTTPS automáticamente

5. **Actualizar nameservers** (si es necesario):
   - Cloudflare te dará nameservers
   - Si tienes control del dominio nip.io, actualiza los nameservers
   - **Nota**: Para nip.io, esto puede no ser necesario ya que nip.io resuelve automáticamente

6. **Actualizar API_BASE_URL en el frontend**:
   ```javascript
   export const API_BASE_URL = 'https://50.17.36.133.nip.io:8080/api/tenant'
   ```
   ⚠️ **Nota**: Con Cloudflare, normalmente no necesitas el puerto 8080 en la URL pública. Cloudflare maneja el puerto 80/443.

#### Configuración en Cloudflare para puerto 8080:

Si necesitas mantener el puerto 8080, puedes:

**Opción A**: Usar Cloudflare Tunnel (Cloudflare Zero Trust - gratis para hasta 50 usuarios)
- Configura un túnel que apunte a `localhost:8080`
- Cloudflare creará una URL HTTPS automáticamente

**Opción B**: Configurar regla de redirección en Cloudflare
- Ve a **Rules** > **Redirect Rules**
- Crea una regla que redirija el tráfico al puerto correcto

**Opción C**: Configurar el backend para escuchar en puerto 80/443 directamente
- Cambia el puerto del backend a 80 (requiere permisos root) o 443 (HTTPS)

### ✅ Solución 2: Configurar HTTPS directamente en Node.js

#### Paso 1: Obtener certificados SSL

**Opción A: Certificado auto-firmado (solo para testing)**
```bash
# Generar certificado auto-firmado
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**Opción B: Let's Encrypt (producción)**
```bash
# Instalar certbot
sudo apt-get install certbot

# Obtener certificado
sudo certbot certonly --standalone -d 50.17.36.133.nip.io
```

#### Paso 2: Configurar variables de entorno

En `variables.env`:
```env
USE_HTTPS=true
SSL_KEY_PATH=/etc/letsencrypt/live/50.17.36.133.nip.io/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/50.17.36.133.nip.io/fullchain.pem
HTTPS_PORT=8443
```

#### Paso 3: Actualizar API_BASE_URL

```javascript
export const API_BASE_URL = 'https://50.17.36.133.nip.io:8443/api/tenant'
```

#### Paso 4: Reiniciar el servidor

```bash
pm2 restart all
# o
npm run server
```

### ✅ Solución 3: Nginx como Reverse Proxy (Producción)

Configura nginx delante del backend para manejar HTTPS.

#### Instalar Nginx:
```bash
sudo apt-get update
sudo apt-get install nginx
```

#### Configurar Nginx:

Crea `/etc/nginx/sites-available/backend`:
```nginx
server {
    listen 80;
    server_name 50.17.36.133.nip.io;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 50.17.36.133.nip.io;

    ssl_certificate /etc/letsencrypt/live/50.17.36.133.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/50.17.36.133.nip.io/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Habilitar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Obtener certificado Let's Encrypt:
```bash
sudo certbot --nginx -d 50.17.36.133.nip.io
```

#### Actualizar API_BASE_URL:
```javascript
export const API_BASE_URL = 'https://50.17.36.133.nip.io/api/tenant'
```

## Recomendación

**Para desarrollo/testing rápido**: Usa **Cloudflare** (Solución 1) - es gratis y funciona en minutos.

**Para producción**: Usa **Nginx con Let's Encrypt** (Solución 3) - más control y mejor rendimiento.

## Verificación

Después de configurar cualquier solución:

1. Verifica que el backend responda en HTTPS:
   ```bash
   curl -k https://50.17.36.133.nip.io/api/tenant/bitacoras-supervision
   ```

2. Actualiza el frontend y haz build:
   ```bash
   cd vue3_vite_local
   npx vite build
   ```

3. Prueba en el navegador:
   - Abre: `https://d1b516p7fooukz.cloudfront.net/dashboard`
   - Verifica que no haya errores de Mixed Content en la consola

