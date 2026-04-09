# Solución para "Access Denied" en S3 - /orbix/

## Problema

Al acceder a `https://www.techguard.pro/orbix` obtienes:
```xml
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```

## Causas Posibles

1. **Los archivos no están en la ruta `/orbix/` en S3**
2. **Los permisos del bucket no permiten acceso público**
3. **CloudFront no está configurado para servir desde `/orbix/`**
4. **El build no se ha subido correctamente**

## Solución Paso a Paso

### Paso 1: Verificar que los archivos estén en S3

1. **Accede a AWS S3 Console**
   - Ve a: https://s3.console.aws.amazon.com/
   - Busca tu bucket (probablemente algo como `techguard-pro` o similar)

2. **Verifica la estructura de carpetas**
   - Deberías ver una carpeta `orbix/` en la raíz del bucket
   - Dentro de `orbix/` deberían estar:
     - `index.html`
     - `assets/` (con los archivos JS, CSS, etc.)

3. **Si NO existe la carpeta `orbix/`:**
   - Necesitas subir el build a esa ruta
   - Ver "Paso 3: Subir el build a S3"

### Paso 2: Verificar Permisos del Bucket

1. **En S3 Console, selecciona tu bucket**
2. **Ve a la pestaña "Permissions"**
3. **Verifica "Block public access":**
   - Si está activado, desactívalo para permitir acceso público
   - Marca la casilla de confirmación

4. **Verifica "Bucket policy":**
   - Debe tener una política que permita `s3:GetObject` público:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::TU-BUCKET-NAME/orbix/*"
       }
     ]
   }
   ```
   ⚠️ Reemplaza `TU-BUCKET-NAME` con el nombre real de tu bucket

5. **Verifica "CORS configuration":**
   - Debe permitir solicitudes desde `https://www.techguard.pro`:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": [
         "https://www.techguard.pro",
         "https://techguard.pro"
       ],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Paso 3: Subir el Build a S3

1. **Hacer el build del frontend:**
   ```bash
   cd vue3_vite_local
   npm run build
   ```

2. **Verificar que el build se creó correctamente:**
   - Deberías ver una carpeta `dist/` con los archivos

3. **Subir a S3:**
   
   **Opción A: Usando AWS CLI**
   ```bash
   # Instalar AWS CLI si no lo tienes
   # https://aws.amazon.com/cli/
   
   # Configurar credenciales
   aws configure
   
   # Subir el contenido de dist/ a la carpeta orbix/
   aws s3 sync dist/ s3://TU-BUCKET-NAME/orbix/ --delete
   ```
   
   **Opción B: Usando la consola de AWS**
   - Ve a S3 Console
   - Selecciona tu bucket
   - Click en "Upload"
   - Arrastra todos los archivos de `dist/`
   - En "Destination", escribe: `orbix/`
   - Click en "Upload"

4. **Verificar que los archivos se subieron:**
   - Deberías ver `orbix/index.html`
   - Deberías ver `orbix/assets/` con los archivos JS/CSS

### Paso 4: Configurar CloudFront (si usas CloudFront)

Si `www.techguard.pro` está detrás de CloudFront:

1. **Verifica el Origin en CloudFront:**
   - Debe apuntar a tu bucket S3
   - O a `TU-BUCKET-NAME.s3.amazonaws.com`

2. **Verifica los Behaviors:**
   - Debe haber un behavior para `/orbix/*`
   - O un behavior por defecto que maneje todas las rutas

3. **Configurar Error Pages (importante para SPA):**
   - Ve a "Error Pages" en CloudFront
   - Crea una regla:
     - **HTTP Error Code:** 403, 404
     - **Response Page Path:** `/orbix/index.html`
     - **HTTP Response Code:** 200

4. **Invalidar caché:**
   - Ve a "Invalidations"
   - Crea una invalidación: `/orbix/*`
   - Espera a que se complete

### Paso 5: Verificar la Configuración de CloudFront para SPA

Para que Vue Router funcione correctamente:

1. **Crear una función Lambda@Edge o usar CloudFront Functions:**
   - Esto redirige todas las rutas a `index.html` para SPA

2. **O configurar Error Pages:**
   - Como se mencionó en el Paso 4

## Verificación Final

1. **Prueba acceder directamente a S3:**
   ```
   https://TU-BUCKET-NAME.s3.amazonaws.com/orbix/index.html
   ```
   - Si funciona aquí pero no en CloudFront, el problema es CloudFront
   - Si no funciona aquí, el problema es S3 (permisos o archivos)

2. **Prueba acceder a través de CloudFront:**
   ```
   https://www.techguard.pro/orbix/
   https://www.techguard.pro/orbix/index.html
   ```

3. **Verifica en DevTools:**
   - Abre DevTools → Network
   - Recarga la página
   - Verifica que los assets se carguen desde `/orbix/assets/...`

## Comandos Útiles

### Verificar contenido de S3
```bash
aws s3 ls s3://TU-BUCKET-NAME/orbix/ --recursive
```

### Subir build completo
```bash
cd vue3_vite_local
npm run build
aws s3 sync dist/ s3://TU-BUCKET-NAME/orbix/ --delete
```

### Verificar permisos
```bash
aws s3api get-bucket-policy --bucket TU-BUCKET-NAME
aws s3api get-bucket-cors --bucket TU-BUCKET-NAME
```

## Si el Problema Persiste

1. **Verifica los logs de CloudFront:**
   - Ve a CloudWatch → Logs
   - Busca logs de tu distribución de CloudFront

2. **Verifica que el dominio esté correctamente configurado:**
   - `www.techguard.pro` debe apuntar a CloudFront
   - Verifica DNS en Route 53 o tu proveedor de DNS

3. **Prueba con un archivo de prueba:**
   - Crea un archivo `test.txt` en `orbix/test.txt`
   - Intenta acceder: `https://www.techguard.pro/orbix/test.txt`
   - Si funciona, el problema es con `index.html` o la configuración de SPA

