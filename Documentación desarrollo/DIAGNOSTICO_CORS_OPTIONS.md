# Diagnóstico: CORS Missing Allows Origin

## Situación Actual

1. **Postman funciona** (200 OK) - Normal, Postman no aplica CORS
2. **Backend muestra "Origin: No origin"** - Normal, Postman no envía Origin
3. **Frontend muestra "CORS Missing Allows Origin"** - ❌ Problema

## Diagnóstico

### Paso 1: Verificar si el OPTIONS llega al backend

Cuando haces una petición desde el frontend, deberías ver en los logs del backend:

```
🔍 OPTIONS Preflight recibido en backend: { ... }
✅ Headers CORS configurados: { ... }
✅ Enviando respuesta OPTIONS 204 con headers CORS
```

**Si NO ves estos logs**, significa que Nginx está interceptando el OPTIONS y el backend nunca lo recibe.

### Paso 2: Verificar qué está pasando

1. **Abre DevTools en el navegador** (F12)
2. **Ve a la pestaña Network**
3. **Filtra por "OPTIONS"**
4. **Haz una petición desde el frontend**
5. **Revisa la respuesta OPTIONS:**
   - ¿Qué código de estado tiene? (debería ser 204)
   - ¿Qué headers tiene en la respuesta?
   - ¿Incluye `Access-Control-Allow-Origin`?

### Paso 3: Verificar logs del backend

Cuando haces la petición desde el frontend, revisa los logs del backend:

```bash
# Si usas PM2
pm2 logs marma

# O si usas directamente
# Revisa la consola donde corre el servidor
```

**Busca:**
- `🔍 OPTIONS Preflight recibido en backend` - Si aparece, el OPTIONS está llegando
- `📥 GET /api/tenant/bitacoras-supervision` - Esto aparece cuando llega el GET

## Soluciones

### Solución 1: Hacer que Nginx pase OPTIONS al backend (Recomendada)

Si el OPTIONS NO está llegando al backend, necesitas modificar Nginx para que lo pase:

```nginx
location / {
    # ❌ ELIMINAR o COMENTAR este bloque:
    # if ($request_method = 'OPTIONS') {
    #     ...
    #     return 204;
    # }
    
    # ✅ Solo dejar el proxy:
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin $http_origin;
}
```

### Solución 2: Asegurar que Nginx añada Access-Control-Allow-Origin

Si prefieres que Nginx maneje el OPTIONS, asegúrate de que añada el header:

```nginx
if ($request_method = 'OPTIONS') {
    # CRÍTICO: Añadir Access-Control-Allow-Origin
    add_header 'Access-Control-Allow-Origin' $http_origin always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, Origin, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Max-Age' '1728000' always;
    add_header 'Content-Length' 0;
    add_header 'Content-Type' 'text/plain';
    return 204;
}
```

**IMPORTANTE:** El `always` es crítico para que funcione con `return 204`.

## Verificación Final

Después de aplicar la solución:

1. **Reinicia el servidor Node.js** (si cambiaste `server.js`)
2. **Recarga Nginx:** `sudo systemctl reload nginx`
3. **Prueba desde el frontend**
4. **Verifica los logs:**
   - Si usas Solución 1: Deberías ver logs de OPTIONS en el backend
   - Si usas Solución 2: El OPTIONS debería tener `Access-Control-Allow-Origin` en la respuesta

## Pregunta Clave

**¿Ves en los logs del backend el mensaje "🔍 OPTIONS Preflight recibido en backend" cuando haces una petición desde el frontend?**

- **SÍ** → El OPTIONS está llegando, el problema está en cómo el backend responde
- **NO** → Nginx está interceptando el OPTIONS, necesitas aplicar Solución 1 o 2

