# Guía: Cómo Aplicar la Configuración de Nginx para api.techguard.pro

## Opción 1: Editar el archivo directamente en el servidor

### Paso 1: Conectarte al servidor
```bash
ssh usuario@tu-servidor
# o
ssh usuario@50.17.36.133
```

### Paso 2: Editar el archivo de configuración de Nginx

```bash
# Editar el archivo de configuración (puede estar en diferentes ubicaciones)
sudo nano /etc/nginx/sites-available/api-techguard.conf
# o
sudo nano /etc/nginx/conf.d/api-techguard.conf
# o si es la configuración por defecto:
sudo nano /etc/nginx/sites-available/default
```

### Paso 3: Copiar y pegar esta configuración completa

```nginx
# Configuración de Nginx para api.techguard.pro

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name api.techguard.pro;
    
    # Redirigir todo a HTTPS
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    server_name api.techguard.pro;

    # Certificados SSL (ajustar rutas según tu configuración)
    # Si usas Let's Encrypt:
    # ssl_certificate /etc/letsencrypt/live/api.techguard.pro/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.techguard.pro/privkey.pem;
    
    # Si usas certificados de otro proveedor, ajusta las rutas:
    # ssl_certificate /ruta/a/cert.pem;
    # ssl_certificate_key /ruta/a/key.pem;

    # Configuración SSL básica
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # CRÍTICO: Manejar OPTIONS (preflight) ANTES de cualquier otra cosa
    location / {
        # IMPORTANTE: Manejar OPTIONS ANTES del proxy
        if ($request_method = 'OPTIONS') {
            # Orígenes permitidos
            set $cors_origin "";
            if ($http_origin ~* "^https://(www\.)?techguard\.pro$") {
                set $cors_origin $http_origin;
            }
            if ($http_origin ~* "^https://d1b516p7fooukz\.cloudfront\.net$") {
                set $cors_origin $http_origin;
            }
            if ($cors_origin = "") {
                set $cors_origin "https://www.techguard.pro";
            }
            
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            # 👇 CRÍTICO: Incluir x-user-email aquí
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' '1728000' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy al servidor Node.js
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # Headers importantes para el proxy
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Pasar el Origin para que el backend pueda usarlo
        proxy_set_header Origin $http_origin;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # No cachear respuestas
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;

        # CRÍTICO: Añadir headers CORS a TODAS las respuestas (incluyendo errores)
        # Orígenes permitidos
        set $cors_origin "";
        if ($http_origin ~* "^https://(www\.)?techguard\.pro$") {
            set $cors_origin $http_origin;
        }
        if ($http_origin ~* "^https://d1b516p7fooukz\.cloudfront\.net$") {
            set $cors_origin $http_origin;
        }
        if ($cors_origin = "") {
            set $cors_origin "https://www.techguard.pro";
        }
        
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        # 👇 CRÍTICO: Incluir x-user-email aquí también
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Type' always;
    }

    # Logging específico para debug
    access_log /var/log/nginx/api-techguard-access.log;
    error_log /var/log/nginx/api-techguard-error.log;
}
```

### Paso 4: Guardar el archivo
- En `nano`: Presiona `Ctrl + X`, luego `Y`, luego `Enter`
- En `vi`: Presiona `Esc`, luego escribe `:wq` y presiona `Enter`

### Paso 5: Habilitar el sitio (si creaste un archivo nuevo)
```bash
# Solo si creaste un archivo nuevo en sites-available
sudo ln -s /etc/nginx/sites-available/api-techguard.conf /etc/nginx/sites-enabled/
```

### Paso 6: Verificar que la configuración sea válida
```bash
sudo nginx -t
```

Deberías ver:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Paso 7: Recargar Nginx
```bash
sudo systemctl reload nginx
# o
sudo service nginx reload
```

## Opción 2: Si ya existe una configuración para api.techguard.pro

Si ya tienes una configuración de Nginx para `api.techguard.pro`, solo necesitas **modificar la sección de `location /`** para incluir el manejo de OPTIONS y los headers CORS con `x-user-email`.

### Buscar la configuración existente:
```bash
# Ver todas las configuraciones
sudo ls -la /etc/nginx/sites-available/
sudo ls -la /etc/nginx/sites-enabled/

# Ver qué configuración está activa para api.techguard.pro
sudo grep -r "api.techguard.pro" /etc/nginx/
```

### Modificar solo la parte importante:

Busca la sección `location /` y asegúrate de que tenga:

1. **Manejo de OPTIONS ANTES del proxy:**
```nginx
if ($request_method = 'OPTIONS') {
    # ... (código de arriba)
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
    # ...
}
```

2. **Headers CORS en todas las respuestas:**
```nginx
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
```

## Verificar que funciona

### Test 1: Probar OPTIONS manualmente
```bash
curl -X OPTIONS https://api.techguard.pro/api/tenant/bitacoras-supervision \
  -H "Origin: https://www.techguard.pro" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: x-user-email" \
  -v
```

Deberías ver en la respuesta:
```
< access-control-allow-headers: Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With
```

### Test 2: Ver logs de Nginx
```bash
sudo tail -f /var/log/nginx/api-techguard-access.log
sudo tail -f /var/log/nginx/api-techguard-error.log
```

## Solución de Problemas

### Si `nginx -t` da error:
- Revisa que no haya errores de sintaxis
- Verifica que los certificados SSL existan (si los estás usando)
- Asegúrate de que no haya llaves `{` o `}` sin cerrar

### Si Nginx no recarga:
```bash
# Ver el estado de Nginx
sudo systemctl status nginx

# Ver errores recientes
sudo journalctl -u nginx -n 50
```

### Si sigue sin funcionar:
- Verifica que el servidor Node.js esté corriendo en el puerto 8080
- Verifica que Nginx esté escuchando en el puerto 443
- Revisa los logs de error de Nginx

