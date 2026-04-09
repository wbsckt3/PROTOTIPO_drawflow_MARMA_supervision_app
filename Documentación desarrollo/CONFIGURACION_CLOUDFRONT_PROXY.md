# Configuración de CloudFront como Proxy para API

## Problema Actual

El frontend en CloudFront (`https://d1b516p7fooukz.cloudfront.net`) intenta llamar a:
- `https://d1b516p7fooukz.cloudfront.net/api/tenant/bitacoras-supervision`

Pero CloudFront no tiene configurado un **behavior** para manejar rutas `/api/tenant/*`, por lo que devuelve un error "Failed to fetch".

## Solución: Configurar CloudFront como Proxy

### Paso 1: Crear un Origin para el Backend

1. Ve a la consola de AWS CloudFront
2. Selecciona tu distribución: `d1b516p7fooukz.cloudfront.net`
3. Ve a la pestaña **Origins**
4. Click en **Create origin**
5. Configura:
   - **Origin domain**: `50.17.36.133` (o el dominio que corresponda)
   - **Origin path**: (dejar vacío)
   - **Name**: `backend-api-server`
   - **Protocol**: `HTTP only`
   - **HTTP port**: `8080`
   - **Origin request policy**: `CORS-S3Origin` (o crear una personalizada)
   - **Origin response timeout**: `30` segundos

### Paso 2: Crear un Behavior para `/api/tenant/*`

1. En la misma distribución, ve a la pestaña **Behaviors**
2. Click en **Create behavior**
3. Configura:
   - **Path pattern**: `/api/tenant/*`
   - **Origin or origin group**: Selecciona el origin `backend-api-server` creado en el paso 1
   - **Viewer protocol policy**: `Redirect HTTP to HTTPS` (o `HTTPS only`)
   - **Allowed HTTP methods**: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
   - **Cache policy**: 
     - Selecciona **Managed**: `CachingDisabled` (para que no cachee las respuestas de la API)
   - **Origin request policy**:
     - Selecciona **Managed**: `AllViewer` (para pasar todos los headers, query strings y cookies)
     - O crea una personalizada que incluya:
       - Headers: `x-user-email`, `x-editor-email`, `Content-Type`, `Authorization`
       - Query strings: `All`
       - Cookies: `All`
   - **Response headers policy**: 
     - Selecciona **Managed**: `CORS-with-preflight` (para manejar CORS correctamente)
     - O crea una personalizada que permita:
       - `Access-Control-Allow-Origin: *` (o tu dominio específico)
       - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
       - `Access-Control-Allow-Headers: Content-Type, Authorization, x-user-email, x-editor-email`
   - **Compress objects automatically**: `Yes` (opcional)

### Paso 3: Orden de Precedencia de Behaviors

Asegúrate de que el behavior `/api/tenant/*` tenga **mayor precedencia** (número más bajo) que el behavior por defecto (`*`).

CloudFront evalúa los behaviors en orden de precedencia:
1. Primero: `/api/tenant/*` (más específico, debe ir primero)
2. Después: `*` (comodín, para servir archivos estáticos)

### Paso 4: Invalidar Cache (si es necesario)

Después de crear el behavior:
1. Ve a la pestaña **Invalidations**
2. Click en **Create invalidation**
3. Ingresa: `/api/tenant/*`
4. Click en **Create invalidation**

### Paso 5: Verificar Configuración de CORS en el Backend

Asegúrate de que `server.js` tenga configurado CORS para permitir CloudFront:

```javascript
const corsOptions = {
  origin: [
    'https://d1b516p7fooukz.cloudfront.net',
    'https://*.github.io',
    // ... otros orígenes
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-editor-email']
};
```

## Verificación

Después de configurar:

1. Espera 5-10 minutos para que CloudFront propague los cambios
2. Prueba en el navegador:
   - Abre: `https://d1b516p7fooukz.cloudfront.net/api/tenant/bitacoras-supervision`
   - Deberías ver una respuesta JSON o un error de autenticación (pero NO "Failed to fetch")
3. Prueba desde el frontend:
   - Inicia sesión en `https://d1b516p7fooukz.cloudfront.net/dashboard`
   - Verifica que las bitácoras se carguen correctamente

## Notas Importantes

- **Cache Policy**: Usa `CachingDisabled` para APIs dinámicas, o configura tiempos de cache cortos
- **Origin Request Policy**: Debe incluir todos los headers que el backend necesita (`x-user-email`, etc.)
- **Response Headers Policy**: Debe permitir CORS para que el navegador no bloquee las respuestas
- **Timeout**: El backend debe responder en menos de 30 segundos (configurable en Origin)

## Alternativa Temporal (NO recomendada para producción)

Si no puedes configurar CloudFront inmediatamente, puedes cambiar temporalmente el `API_BASE_URL` a:

```javascript
export const API_BASE_URL = 'http://50.17.36.133:8080/api/tenant'
```

⚠️ **ADVERTENCIA**: Esto causará errores de "Mixed Content" en navegadores modernos cuando el frontend esté en HTTPS. Algunos navegadores pueden permitirlo con configuraciones específicas, pero NO es una solución de producción.

