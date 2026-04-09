# 🚀 Configuración de AWS S3 para Tech Guard Pro

## 📋 Descripción

Este documento explica cómo configurar la integración con AWS S3 para el almacenamiento de archivos (fotos, documentos) en el dashboard administrativo de Tech Guard Pro.

## 🔧 Configuración Inicial

### 1. Crear Bucket S3 en AWS

1. **Acceder a AWS Console**
   - Ir a [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Hacer clic en "Create bucket"

2. **Configurar Bucket**
   ```
   Bucket name: marma-supervision-bucket
   Region: us-east-1 (o tu región preferida)
   ```

3. **Configurar Permisos Públicos**
   - Desactivar "Block all public access"
   - Marcar "I acknowledge that the current settings might result in this bucket and the objects within it becoming public"

4. **Configurar Política de Bucket**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::marma-supervision-bucket/*"
       }
     ]
   }
   ```

### 2. Crear Usuario IAM

1. **Acceder a IAM Console**
   - Ir a [AWS IAM Console](https://console.aws.amazon.com/iam/)

2. **Crear Usuario**
   ```
   Username: marma-s3-user
   Access type: Programmatic access
   ```

3. **Asignar Política**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::marma-supervision-bucket",
           "arn:aws:s3:::marma-supervision-bucket/*"
         ]
       }
     ]
   }
   ```

4. **Guardar Credenciales**
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...`

## 🖥️ Configuración en el Dashboard

### 1. Acceder a la Configuración

1. **Abrir el Dashboard**
   - Ir a `formulario.html`
   - Hacer login con `tgpro.marma.db@gmail.com`

2. **Configurar S3**
   - Hacer clic en "Configurar S3" en el header
   - O ir a "Almacenamiento" → "Configurar S3" en el sidebar

### 2. Completar Configuración

```
Región de AWS: us-east-1
Nombre del Bucket: marma-supervision-bucket
Access Key ID: AKIA...
Secret Access Key: ...
URL Pública del Bucket: https://marma-supervision-bucket.s3.amazonaws.com
```

## 🔄 Funcionalidades Disponibles

### 1. Subida Automática de Fotos
- Las fotos de supervisión se suben automáticamente a S3
- Se organizan por carpetas: `supervision/{area}`
- Fallback a base64 si S3 no está disponible

### 2. Gestión de Archivos
- **Ver Archivos**: Lista todos los archivos en el bucket
- **Descargar**: Descargar archivos individuales
- **Eliminar**: Eliminar archivos del bucket
- **Actualizar**: Refrescar lista de archivos

### 3. Organización de Archivos
```
marma-supervision-bucket/
├── supervision/
│   ├── piscinas/
│   │   ├── 1703123456789_abc123.jpg
│   │   └── 1703123456790_def456.jpg
│   ├── zonas_comunes/
│   └── zonas_externas/
└── documentos/
    └── reportes/
```

## 🛠️ Endpoints del Backend Requeridos

Para que funcione completamente, necesitas implementar estos endpoints en tu backend:

### 1. Subir Archivo
```
POST /api/tenant/upload-s3
Content-Type: multipart/form-data
Headers: x-user-email, Authorization

Body:
- file: archivo
- fileName: nombre del archivo
- bucketName: nombre del bucket
- region: región de AWS
```

### 2. Eliminar Archivo
```
DELETE /api/tenant/delete-s3
Content-Type: application/json
Headers: x-user-email, Authorization

Body:
{
  "fileName": "supervision/piscinas/1703123456789_abc123.jpg",
  "bucketName": "marma-supervision-bucket"
}
```

### 3. Listar Archivos
```
GET /api/tenant/list-s3?folder=supervision
Headers: x-user-email, Authorization

Response:
{
  "success": true,
  "files": [
    {
      "name": "1703123456789_abc123.jpg",
      "key": "supervision/piscinas/1703123456789_abc123.jpg",
      "url": "https://marma-supervision-bucket.s3.amazonaws.com/supervision/piscinas/1703123456789_abc123.jpg",
      "size": "2.5 MB",
      "lastModified": "2024-01-15T10:30:00.000Z",
      "type": "image/jpeg"
    }
  ]
}
```

## 🔒 Consideraciones de Seguridad

### 1. Credenciales
- **NUNCA** hardcodear credenciales en el frontend
- Usar variables de entorno en el backend
- Rotar credenciales regularmente

### 2. Permisos Mínimos
- Solo permisos necesarios para el bucket específico
- No permisos administrativos

### 3. CORS
- Configurar CORS en el bucket S3:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://tu-dominio.com"],
    "ExposeHeaders": []
  }
]
```

## 🚨 Solución de Problemas

### 1. Error de CORS
- Verificar configuración CORS del bucket
- Comprobar dominio en AllowedOrigins

### 2. Error de Permisos
- Verificar política IAM del usuario
- Comprobar permisos del bucket

### 3. Error de Conexión
- Verificar credenciales
- Comprobar región del bucket
- Verificar conectividad de red

### 4. Fallback a Base64
- Si S3 no está disponible, las fotos se almacenan en base64
- Se muestra "Guardado (local)" en el estado

## 📊 Monitoreo

### 1. Logs del Navegador
- Abrir DevTools (F12)
- Ver logs de S3 en la consola
- Buscar errores de subida

### 2. Métricas de AWS
- CloudWatch para métricas del bucket
- Costos en AWS Cost Explorer

## 🔄 Actualizaciones

### 1. Cambiar Bucket
- Actualizar configuración en el dashboard
- Los archivos existentes seguirán funcionando

### 2. Migrar Archivos
- Usar AWS CLI para migrar archivos
- Actualizar URLs en la base de datos

## 📞 Soporte

Para problemas técnicos:
- Revisar logs del navegador
- Verificar configuración de AWS
- Contactar al administrador del sistema

---

**Nota**: Esta configuración permite el almacenamiento escalable y confiable de archivos para el sistema de supervisión de Tech Guard Pro.

