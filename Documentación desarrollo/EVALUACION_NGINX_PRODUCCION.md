# Evaluación de la Configuración de Nginx en Producción

## Análisis de la Configuración Actual

### ✅ Lo que está bien:

1. **Redirección HTTP → HTTPS**: Correcta
2. **SSL/TLS configurado**: Let's Encrypt correctamente configurado
3. **Headers CORS básicos**: Están presentes
4. **Header `x-user-email` incluido**: ✅ En `Access-Control-Allow-Headers`
5. **Proxy al backend**: Configurado correctamente

### ❌ Problemas Identificados:

#### Problema 1: El OPTIONS no llega al backend

**Línea problemática:**
```nginx
if ($request_method = 'OPTIONS') {
    add_header 'Content-Length' 0;
    add_header 'Content-Type' 'text/plain';
    return 204;  # ❌ Esto responde directamente, el backend nunca ve el OPTIONS
}
```

**Consecuencia:**
- Nginx responde al OPTIONS directamente
- El backend nunca recibe el OPTIONS
- Si hay algún problema con los headers CORS en Nginx, el navegador bloquea la petición

#### Problema 2: Headers CORS dentro del `if` pueden no aplicarse

Cuando usas `return 204` dentro de un `if`, Nginx puede no aplicar todos los headers CORS que están fuera del `if`. Aunque uses `always`, puede haber problemas.

#### Problema 3: El `cors_origin` puede estar vacío

Si el `$http_origin` no coincide con el regex, `$cors_origin` queda vacío, y entonces `Access-Control-Allow-Origin` será una cadena vacía, lo cual causa errores CORS.

## Solución Recomendada

### Opción 1: Pasar OPTIONS al Backend (Recomendada)

Hacer que Nginx pase el OPTIONS al backend. El backend ya está configurado para manejarlo correctamente.

```nginx
location /api/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin $http_origin;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # No cachear respuestas
    proxy_cache_bypass $http_upgrade;
    proxy_no_cache $http_upgrade;
    
    # ❌ ELIMINAR el bloque if ($request_method = 'OPTIONS')
    # El backend manejará el OPTIONS correctamente
}
```

**Ventajas:**
- El backend recibe el OPTIONS y responde con headers CORS correctos
- Todo el manejo de CORS está en un solo lugar (el backend)
- Más fácil de mantener y debuggear

### Opción 2: Mejorar el Manejo de OPTIONS en Nginx

Si prefieres que Nginx maneje el OPTIONS, mejora la configuración:

```nginx
location /api/ {
    # Determinar el origin permitido ANTES del if
    set $cors_origin "";
    if ($http_origin = "https://www.techguard.pro") {
        set $cors_origin "https://www.techguard.pro";
    }
    if ($http_origin = "https://techguard.pro") {
        set $cors_origin "https://techguard.pro";
    }
    if ($http_origin = "https://d1b516p7fooukz.cloudfront.net") {
        set $cors_origin "https://d1b516p7fooukz.cloudfront.net";
    }
    # Si no está en la lista, usar default
    if ($cors_origin = "") {
        set $cors_origin "https://www.techguard.pro";
    }

    # Manejar OPTIONS ANTES del proxy
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' "$cors_origin" always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' '1728000' always;
        add_header 'Vary' 'Origin' always;
        add_header 'Content-Length' '0' always;
        add_header 'Content-Type' 'text/plain' always;
        return 204;
    }

    # Proxy al backend para peticiones no-OPTIONS
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin $http_origin;

    # Headers CORS para respuestas del backend
    add_header 'Access-Control-Allow-Origin' "$cors_origin" always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Type' always;
    add_header 'Vary' 'Origin' always;
}
```

## Configuración Mejorada Completa

```nginx
# ============================================================
# API Backend - TechGuard Pro (con Let's Encrypt SSL válido)
# ============================================================

# --- Redirección HTTP → HTTPS ---
server {
    listen 80;
    server_name api.techguard.pro;
    return 301 https://$host$request_uri;
}

# --- Servidor HTTPS ---
server {
    listen 443 ssl;
    http2 on;
    server_name api.techguard.pro;

    # Certificado emitido por Let's Encrypt
    ssl_certificate     /etc/letsencrypt/live/api.techguard.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.techguard.pro/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ========================================================
    # Proxy al backend Node.js
    # ========================================================
    location /api/ {
        # Determinar el origin permitido
        set $cors_origin "";
        if ($http_origin = "https://www.techguard.pro") {
            set $cors_origin "https://www.techguard.pro";
        }
        if ($http_origin = "https://techguard.pro") {
            set $cors_origin "https://techguard.pro";
        }
        if ($http_origin = "https://d1b516p7fooukz.cloudfront.net") {
            set $cors_origin "https://d1b516p7fooukz.cloudfront.net";
        }
        if ($cors_origin = "") {
            set $cors_origin "https://www.techguard.pro";
        }

        # OPCIÓN 1: Pasar OPTIONS al backend (RECOMENDADA)
        # Eliminar el bloque if ($request_method = 'OPTIONS') y dejar que el backend lo maneje
        
        # OPCIÓN 2: Manejar OPTIONS en Nginx (si prefieres)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' "$cors_origin" always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' '1728000' always;
            add_header 'Vary' 'Origin' always;
            add_header 'Content-Length' '0' always;
            add_header 'Content-Type' 'text/plain' always;
            return 204;
        }

        # Proxy al backend Node.js
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;

        # Headers CORS para respuestas del backend
        add_header 'Access-Control-Allow-Origin' "$cors_origin" always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Type' always;
        add_header 'Vary' 'Origin' always;
    }

    # Endpoint de salud
    location = /health {
        return 200 'OK - nginx is alive';
        add_header Content-Type text/plain;
    }

    # Redirige HTTP mal formateado a HTTPS
    error_page 497 https://$host$request_uri;
}
```

## Recomendación Final

**Usa la Opción 1**: Elimina el bloque `if ($request_method = 'OPTIONS')` y deja que el backend maneje el OPTIONS. Esto es más simple, más fácil de mantener, y el backend ya está configurado correctamente.

## Pasos para Aplicar

1. **Haz backup de la configuración actual:**
   ```bash
   sudo cp /etc/nginx/sites-available/api-techguard.conf /etc/nginx/sites-available/api-techguard.conf.backup
   ```

2. **Edita la configuración:**
   ```bash
   sudo nano /etc/nginx/sites-available/api-techguard.conf
   ```

3. **Elimina o comenta el bloque `if ($request_method = 'OPTIONS')`**

4. **Verifica y recarga:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Verifica los logs del backend:**
   Deberías ver `🔍 OPTIONS Preflight recibido en backend` cuando haces una petición desde el frontend.

