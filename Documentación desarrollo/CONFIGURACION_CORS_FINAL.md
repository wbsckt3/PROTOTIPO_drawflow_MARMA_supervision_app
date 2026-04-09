# Configuración CORS Final - TechGuard Pro

## Arquitectura de CORS

### ✅ Configuración Actual (Correcta)

**Backend (`server.js`)**: Maneja TODOS los headers CORS
**Nginx**: Solo hace proxy, NO añade headers CORS

### ❌ Configuración Incorrecta (Evitar)

**NO hacer esto:**
- Añadir headers CORS en Nginx Y en el backend → Causa duplicación
- Manejar OPTIONS en Nginx → El backend no recibe el OPTIONS

## Configuración del Backend (`server.js`)

El backend maneja CORS completamente en el middleware (líneas 57-187):

```javascript
// CORS básico y directo - DEBE estar ANTES de cualquier otra ruta
app.use((req, res, next) => {
  // Lista de orígenes permitidos
  const allow = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://techguard.pro',
    'https://www.techguard.pro',
    'https://api.techguard.pro',
    'https://d1b516p7fooukz.cloudfront.net'
  ];
  
  // Maneja OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    // Añade todos los headers CORS
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', '... x-user-email ...');
    // ...
    return res.status(204).end();
  }
  
  // Para peticiones no-OPTIONS, también añade headers CORS
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  // ...
});
```

**Headers CORS que el backend añade:**
- `Access-Control-Allow-Origin`: Origen permitido (ej: `https://www.techguard.pro`)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers`: Incluye `x-user-email`, `x-editor-email`, etc.
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `1728000` (20 días)
- `Vary`: `Origin`

## Configuración de Nginx

**Nginx solo hace proxy, NO añade headers CORS:**

```nginx
location /api/ {
    # Proxy al backend Node.js
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin $http_origin;  # 👈 Pasar el Origin al backend

    # ❌ NO añadir headers CORS aquí
    # ❌ NO manejar OPTIONS aquí
    # El backend ya lo hace
}
```

## Flujo de una Petición CORS

### 1. Preflight OPTIONS

```
Navegador (https://www.techguard.pro)
  ↓ OPTIONS /api/tenant/bitacoras-supervision
  ↓ Origin: https://www.techguard.pro
  ↓ Access-Control-Request-Headers: x-user-email
Nginx
  ↓ Pasa OPTIONS al backend (no responde)
Backend (server.js)
  ↓ Recibe OPTIONS
  ↓ Añade headers CORS:
  ↓   Access-Control-Allow-Origin: https://www.techguard.pro
  ↓   Access-Control-Allow-Headers: ... x-user-email ...
  ↓ Responde 204
Nginx
  ↓ Pasa respuesta al navegador (sin modificar headers)
Navegador
  ✅ OPTIONS exitoso, procede con GET
```

### 2. Petición Real GET

```
Navegador (https://www.techguard.pro)
  ↓ GET /api/tenant/bitacoras-supervision
  ↓ Origin: https://www.techguard.pro
  ↓ x-user-email: wbsckt2@gmail.com
Nginx
  ↓ Pasa GET al backend
Backend (server.js)
  ↓ Procesa petición
  ↓ Añade headers CORS a la respuesta
  ↓ Responde con datos (200)
Nginx
  ↓ Pasa respuesta al navegador
Navegador
  ✅ GET exitoso, muestra datos
```

## Orígenes Permitidos

Los siguientes orígenes están permitidos en el backend:

- `http://localhost:3000` (desarrollo)
- `http://localhost:5173` (desarrollo Vite)
- `https://techguard.pro` (producción)
- `https://www.techguard.pro` (producción con www)
- `https://api.techguard.pro` (API misma)
- `https://d1b516p7fooukz.cloudfront.net` (CloudFront)

## Headers Personalizados Permitidos

- `x-user-email` (para identificar usuario)
- `x-editor-email` (para identificar editor)
- `X-User-Email` (variante con mayúsculas)
- `X-Editor-Email` (variante con mayúsculas)

## Configuración del Frontend

El frontend debe:

1. **Incluir `credentials: 'include'`** en todas las peticiones:
   ```javascript
   fetch(url, {
     credentials: 'include',  // 👈 Necesario para CORS con credenciales
     headers: {
       'x-user-email': userEmail
     }
   })
   ```

2. **Enviar el header `x-user-email`** con el email del usuario autenticado

3. **Usar la URL correcta**: `https://api.techguard.pro/api/tenant`

## Troubleshooting

### Si hay errores de CORS:

1. **Verificar que el OPTIONS llegue al backend:**
   - Buscar en logs: `🔍 OPTIONS Preflight recibido en backend`
   - Si no aparece → Nginx está interceptando el OPTIONS

2. **Verificar que no haya headers duplicados:**
   - En DevTools → Network → Headers
   - `Access-Control-Allow-Origin` debe aparecer UNA sola vez
   - Si aparece dos veces → Nginx está añadiendo headers CORS

3. **Verificar el origin:**
   - El `Origin` en la petición debe estar en la lista de permitidos
   - El `Access-Control-Allow-Origin` en la respuesta debe coincidir exactamente

### Si necesitas añadir un nuevo origen:

1. **Editar `server.js`** (línea 60-67):
   ```javascript
   const allow = [
     // ... orígenes existentes ...
     'https://nuevo-origen.com'  // 👈 Añadir aquí
   ];
   ```

2. **Reiniciar el servidor Node.js**

3. **NO modificar Nginx** - el backend maneja todo

## Regla de Oro

**Un solo lugar maneja CORS: el backend (`server.js`)**

- ✅ Backend añade headers CORS
- ✅ Backend maneja OPTIONS
- ✅ Nginx solo hace proxy
- ❌ Nginx NO añade headers CORS
- ❌ Nginx NO maneja OPTIONS

## Fecha de Configuración

Configurado: Noviembre 2025
Última actualización: Después de resolver duplicación de headers CORS

