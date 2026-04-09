# Solución para Pantalla Blanca en /orbix/

## Problema

Al acceder a `https://www.techguard.pro/orbix/index.html` se ve una pantalla blanca, aunque los logs muestran que el JavaScript se está ejecutando.

## Diagnóstico

### Paso 1: Verificar en DevTools

Abre DevTools (F12) y verifica:

1. **Console Tab:**
   - ¿Ves el mensaje "🔍 Validando token..."?
   - ¿Hay errores en rojo?
   - ¿Ves "🔧 Router configurado con base URL: /orbix/"?

2. **Network Tab:**
   - Filtra por "JS" y "CSS"
   - Verifica que estos archivos se carguen con código 200:
     - `/orbix/assets/index-*.js`
     - `/orbix/assets/index-*.css`
   - Si alguno da 404, ese es el problema

3. **Elements Tab:**
   - Busca `<div id="app">`
   - ¿Tiene contenido dentro o está vacío?

### Paso 2: Verificar Estructura en S3

En AWS S3 Console, verifica que la estructura sea:

```
bucket/
└── orbix/
    ├── index.html
    ├── assets/
    │   ├── index-*.js
    │   └── index-*.css
    └── favicon.ico
```

**IMPORTANTE:** Los archivos deben estar DENTRO de la carpeta `orbix/`, no en la raíz del bucket.

### Paso 3: Verificar el Build

1. **Hacer un nuevo build:**
   ```bash
   cd vue3_vite_local
   npm run build
   ```

2. **Verificar que el build tenga el base path correcto:**
   - Abre `dist/index.html`
   - Verifica que los assets tengan `/orbix/assets/...`
   - Ejemplo correcto:
     ```html
     <script src="/orbix/assets/index-*.js"></script>
     <link href="/orbix/assets/index-*.css" rel="stylesheet">
     ```

3. **Subir el build a S3:**
   ```bash
   # Opción 1: AWS CLI
   aws s3 sync dist/ s3://TU-BUCKET/orbix/ --delete
   
   # Opción 2: Manualmente desde S3 Console
   # Sube TODO el contenido de dist/ a la carpeta orbix/
   ```

## Soluciones Comunes

### Solución 1: Assets no se cargan (404)

**Síntoma:** En Network tab ves 404 para los archivos JS/CSS

**Causa:** Los archivos no están en la ruta correcta en S3 o CloudFront no está configurado correctamente

**Solución:**
1. Verifica que los archivos estén en `orbix/assets/` en S3
2. Verifica que CloudFront tenga acceso al bucket S3 (OAC - Origin Access Control)
3. Verifica que CloudFront tenga un Behavior configurado para `/orbix/*` o un behavior por defecto
4. Invalida la caché de CloudFront: `/orbix/*`

### Solución 2: Error de JavaScript

**Síntoma:** Hay errores en rojo en la consola

**Causa:** Error en el código que está rompiendo la app

**Solución:**
- Revisa los errores en la consola
- Los logs que añadimos deberían mostrar el error exacto
- Verifica que todas las dependencias estén instaladas

### Solución 3: Router no funciona con base path

**Síntoma:** No ves logs del router o las rutas no funcionan

**Causa:** El router no está configurado correctamente para `/orbix/`

**Solución:**
- El router ya está configurado con `createWebHistory(import.meta.env.BASE_URL)`
- Verifica en la consola que veas: "🔧 Router configurado con base URL: /orbix/"
- Si no lo ves, el build no está usando el base path correcto

### Solución 4: CloudFront no está configurado correctamente

**Síntoma:** Los assets dan 404 pero están en S3

**Causa:** CloudFront no está sirviendo correctamente desde `/orbix/`

**Solución:**
1. Verifica el Origin en CloudFront apunta a tu bucket S3
2. Verifica que hay un Behavior para `/orbix/*` o un behavior por defecto
3. Invalida la caché: `/orbix/*`

## Verificación Rápida

### Test 1: Verificar archivos en S3
```bash
aws s3 ls s3://TU-BUCKET/orbix/ --recursive
```
- Debe mostrar los archivos: `index.html`, `assets/index-*.js`, `assets/index-*.css`
- Si no aparecen → Los archivos no se subieron correctamente

**Nota:** Con CloudFront, el bucket S3 NO necesita acceso público. CloudFront accede a S3 usando OAC (Origin Access Control) y luego sirve el contenido al público.

### Test 2: Acceso a un asset
```
https://www.techguard.pro/orbix/assets/index-*.js
```
- Si carga → Los assets están bien
- Si da 404 → Los assets no están en la ruta correcta

### Test 3: Verificar base path en runtime
En la consola del navegador, ejecuta:
```javascript
console.log('Base URL:', import.meta.env.BASE_URL)
```
- Debería mostrar: `/orbix/`
- Si muestra otra cosa, el build no está usando el base path correcto

## Comandos Útiles

### Verificar estructura en S3
```bash
aws s3 ls s3://TU-BUCKET/orbix/ --recursive
```

### Subir build completo
```bash
cd vue3_vite_local
npm run build
aws s3 sync dist/ s3://TU-BUCKET/orbix/ --delete
```

### Invalidar caché de CloudFront
```bash
aws cloudfront create-invalidation \
  --distribution-id TU-DISTRIBUTION-ID \
  --paths "/orbix/*"
```

## Si Nada Funciona

1. **Verifica que el build se hizo correctamente:**
   - `dist/index.html` debe tener paths con `/orbix/`
   - `dist/assets/` debe existir con los archivos JS/CSS

2. **Verifica que los archivos se subieron correctamente:**
   - En S3, la estructura debe ser exactamente como se muestra arriba

3. **Verifica configuración de CloudFront:**
   - CloudFront debe tener OAC (Origin Access Control) configurado para acceder a S3
   - El bucket S3 debe tener una Bucket Policy que permita a CloudFront acceder (no acceso público directo)
   - CloudFront debe tener un Behavior para `/orbix/*` o un behavior por defecto

4. **Verifica CloudFront:**
   - Origin debe apuntar al bucket S3
   - Error Pages deben redirigir 404/403 a `/orbix/index.html` (para SPA)

