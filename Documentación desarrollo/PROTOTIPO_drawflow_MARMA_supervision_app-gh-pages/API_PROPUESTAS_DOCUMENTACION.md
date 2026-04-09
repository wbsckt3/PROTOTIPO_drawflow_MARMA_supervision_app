# 📋 API de Propuestas - Documentación

## 🎯 Descripción General

La API de Propuestas permite a los técnicos enviar propuestas de solución a las oportunidades de servicio (damages R) creadas por las empresas, y a los clientes gestionar estas propuestas.

Nota: La lógica de estos endpoints está integrada en `reglas-negocio.controller.js` (antes estaba en `proposal.controller.js`). Los endpoints y contratos no cambian.

## 🔗 Endpoints Disponibles

### A. Flujos formulario_v4 (Perfiles Cliente y Técnico)

#### A1. Cliente crea solicitud (Damage R con foto)
**POST** `/api/tenant/damages`

Crea una oportunidad de servicio a partir de una solicitud del cliente. Admite foto en base64 y metadatos de geolocalización.

**Headers:**
```
x-user-email: cliente@ejemplo.com
Content-Type: application/json
```

**Body (Formulario_v4 - Empresa):**
```json
{
  "item": "Reparación de sistema de filtración",
  "area": "piscinas",
  "description": "Sistema con fuga en tubería principal\n\nPresupuesto estimado: $200,000 COP\nUrgencia: urgent\nUbicación específica: Torre A, Piscina principal\nSolicitado por: Empresa XYZ (cliente@ejemplo.com)",
  "rating": "R",
  "latitude": 6.2442,
  "longitude": -75.5812,
  "accuracy": 10,
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "severity": "high",
  "comment": ""
}
```

**Body (Formulario_v2 - Bitácora):**
```json
{
  "bitacoraId": "uuid-bitacora",
  "item": "Reparación de sistema de filtración",
  "area": "piscinas",
  "description": "Sistema con fuga en tubería principal",
  "rating": "R",
  "latitude": 6.2442,
  "longitude": -75.5812,
  "accuracy": 10,
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "severity": "high",
  "comment": "Comentario adicional del supervisor"
}
```

**Respuesta 201:**
```json
{
  "success": true,
  "message": "Daño creado exitosamente",
  "data": {
    "_id": "uuid-daño",
    "item": "Reparación de sistema de filtración",
    "area": "piscinas",
    "rating": "R",
    "description": "Sistema con fuga en tubería principal...",
    "location": {
      "latitude": 6.2442,
      "longitude": -75.5812,
      "accuracy": 10,
      "timestamp": "2024-01-15T14:30:00.000Z"
    },
    "image": "data:image/jpeg;base64,...",
    "severity": "high",
    "status": "reported",
    "companyName": "Empresa XYZ",
    "unidadNombre": "Solicitud directa",
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Campos obligatorios:**
- `item`: Título del servicio
- `area`: Categoría (piscinas, zonas_comunes, etc.)
- `description`: Descripción detallada
- `rating`: Debe ser "R" para oportunidades visibles
- `latitude`: Latitud GPS
- `longitude`: Longitud GPS
- `image`: Imagen en base64 (puede ser placeholder)

**Campos opcionales:**
- `bitacoraId`: Solo para formulario_v2 (bitácoras)
- `accuracy`: Precisión GPS (default: 0)
- `severity`: Nivel de urgencia (default: "medium")
- `comment`: Comentario adicional

**Notas:**
- Para formulario_v4 (empresas): NO incluir `bitacoraId`
- Para formulario_v2 (bitácoras): SÍ incluir `bitacoraId`
- `rating` debe ser "R" para que sea visible a técnicos
- La imagen puede ser placeholder si no se tiene foto real

#### A2. Cliente ve propuestas recibidas
**GET** `/api/tenant/proposals/client`

Headers:
```
x-user-email: cliente@ejemplo.com
```

Respuesta 200:
```json
{
  "success": true,
  "data": [
    {
      "_id": "prop123",
      "damageId": { "_id": "dam456", "item": "Reparación...", "area": "piscinas" },
      "technician": { "email": "tec@ejemplo.com", "name": "Carlos", "phone": "+57 300..." },
      "proposal": { "price": 180000, "duration": 2, "description": "Solución...", "experience": "10 años" },
      "status": "pending",
      "submittedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

#### A3. Cliente acepta o rechaza propuesta
**PUT** `/api/tenant/proposals/:proposalId/accept`
**PUT** `/api/tenant/proposals/:proposalId/reject`

Headers:
```
x-user-email: cliente@ejemplo.com
```

Respuesta 200 (accept):
```json
{ "success": true, "message": "Propuesta aceptada exitosamente", "data": { "_id": "prop123", "status": "accepted" } }
```

Respuesta 200 (reject):
```json
{ "success": true, "message": "Propuesta rechazada exitosamente", "data": { "_id": "prop123", "status": "rejected" } }
```

Notas:
- Al aceptar, las demás propuestas `pending` del mismo damage quedan `rejected` automáticamente.

#### A4. Estadísticas de propuestas
**GET** `/api/tenant/proposals/stats`

Headers:
```
x-user-email: usuario@ejemplo.com
```

Respuesta 200:
```json
{
  "success": true,
  "data": {
    "technician": [{ "_id": "pending", "count": 3 }],
    "client": [{ "_id": "accepted", "count": 2 }],
    "totalDamages": 3
  }
}
```

### 1. Crear Propuesta
**POST** `/api/tenant/proposals`

Crea una nueva propuesta de solución para una oportunidad de servicio.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
Content-Type: application/json
```

#### Body
```json
{
  "damageId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "price": 150000,
  "duration": 3,
  "description": "Reparación completa del sistema de filtración con materiales de primera calidad",
  "experience": "15 años de experiencia en sistemas de piscinas",
  "materials": "Bomba nueva, filtros, tuberías PVC",
  "technicianName": "Carlos Mendoza",
  "technicianPhone": "+57 300 123 4567"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Propuesta enviada exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "damageId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "technician": {
      "email": "carlos@ejemplo.com",
      "name": "Carlos Mendoza",
      "phone": "+57 300 123 4567"
    },
    "proposal": {
      "price": 150000,
      "duration": 3,
      "description": "Reparación completa del sistema de filtración...",
      "experience": "15 años de experiencia en sistemas de piscinas",
      "materials": "Bomba nueva, filtros, tuberías PVC"
    },
    "status": "pending",
    "submittedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

---

### 2. Obtener Propuestas por Damage ID
**GET** `/api/tenant/proposals/damage/:damageId`

Obtiene todas las propuestas para una oportunidad de servicio específica.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "damageId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "item": "Reparación de Piscina",
        "area": "piscinas",
        "description": "Sistema de filtración con fuga..."
      },
      "technician": {
        "email": "carlos@ejemplo.com",
        "name": "Carlos Mendoza",
        "phone": "+57 300 123 4567"
      },
      "proposal": {
        "price": 150000,
        "duration": 3,
        "description": "Reparación completa del sistema...",
        "experience": "15 años de experiencia...",
        "materials": "Bomba nueva, filtros..."
      },
      "status": "pending",
      "submittedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Obtener Propuestas por Técnico
**GET** `/api/tenant/proposals/technician/:technicianEmail`

Obtiene todas las propuestas enviadas por un técnico específico.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "damageId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "item": "Reparación de Piscina",
        "area": "piscinas"
      },
      "proposal": {
        "price": 150000,
        "duration": 3,
        "description": "Reparación completa del sistema..."
      },
      "status": "pending",
      "submittedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4. Obtener Propuestas por Cliente
**GET** `/api/tenant/proposals/client`

Obtiene todas las propuestas recibidas para las solicitudes creadas por el cliente.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "damageId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "item": "Reparación de Piscina",
        "area": "piscinas"
      },
      "technician": {
        "email": "carlos@ejemplo.com",
        "name": "Carlos Mendoza",
        "phone": "+57 300 123 4567"
      },
      "proposal": {
        "price": 150000,
        "duration": 3,
        "description": "Reparación completa del sistema..."
      },
      "status": "pending",
      "submittedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Aceptar Propuesta
**PUT** `/api/tenant/proposals/:proposalId/accept`

Acepta una propuesta específica. Automáticamente rechaza las demás propuestas para el mismo damage.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Propuesta aceptada exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "status": "accepted",
    "acceptedAt": "2024-01-15T16:45:00.000Z"
  }
}
```

---

### 6. Rechazar Propuesta
**PUT** `/api/tenant/proposals/:proposalId/reject`

Rechaza una propuesta específica.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Propuesta rechazada exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "status": "rejected"
  }
}
```

---

### 7. Obtener Estadísticas
**GET** `/api/tenant/proposals/stats`

Obtiene estadísticas de propuestas para el usuario actual.

#### Headers Requeridos
```
x-user-email: email@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "technician": [
      { "_id": "pending", "count": 3 },
      { "_id": "accepted", "count": 1 },
      { "_id": "rejected", "count": 2 }
    ],
    "client": [
      { "_id": "pending", "count": 5 },
      { "_id": "accepted", "count": 2 }
    ],
    "totalDamages": 3
  }
}
```

---

## 🔄 Estados de Propuesta

| Estado | Descripción |
|--------|-------------|
| `pending` | Propuesta enviada, esperando respuesta del cliente |
| `accepted` | Propuesta aceptada por el cliente |
| `rejected` | Propuesta rechazada por el cliente |
| `completed` | Trabajo completado |
| `cancelled` | Propuesta cancelada |

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Campos obligatorios faltantes |
| 401 | Email de usuario no proporcionado |
| 403 | Sin permisos para la operación |
| 404 | Recurso no encontrado |
| 409 | Propuesta ya enviada para este damage |
| 500 | Error interno del servidor |

---

## 🔗 Relación con Damages

- **1 Damage** puede tener **N Propuestas** (relación 1:N)
- Las propuestas se asocian a damages mediante `damageId`
- Solo se puede enviar **1 propuesta por técnico por damage**
- Al aceptar una propuesta, las demás se rechazan automáticamente

---

## 📱 Integración con Formulario v4

### Para Técnicos:
- Usar `POST /proposals` para enviar propuestas
- Usar `GET /proposals/technician/:email` para ver sus propuestas

### Para Clientes:
- Usar `GET /proposals/client` para ver propuestas recibidas
- Usar `PUT /proposals/:id/accept` para aceptar propuestas
- Usar `PUT /proposals/:id/reject` para rechazar propuestas

---

## 🚀 Ejemplo de Uso Completo

```javascript
// 1. Cliente crea solicitud (damage R)
const damage = await fetch('/api/tenant/damages', {
  method: 'POST',
  headers: { 'x-user-email': 'cliente@ejemplo.com' },
  body: JSON.stringify({
    item: 'Reparación de Piscina',
    area: 'piscinas',
    description: 'Sistema de filtración con fuga...',
    rating: 'R'
  })
});

// 2. Técnico envía propuesta
const proposal = await fetch('/api/tenant/proposals', {
  method: 'POST',
  headers: { 'x-user-email': 'tecnico@ejemplo.com' },
  body: JSON.stringify({
    damageId: damage._id,
    price: 150000,
    duration: 3,
    description: 'Reparación completa...'
  })
});

// 3. Cliente acepta propuesta
await fetch(`/api/tenant/proposals/${proposal._id}/accept`, {
  method: 'PUT',
  headers: { 'x-user-email': 'cliente@ejemplo.com' }
});
```

---

## 📍 **ENDPOINT DE BÚSQUEDA POR UBICACIÓN**

### B1. Técnico busca oportunidades cercanas (CUALQUIER DAMAGE por ubicación)
**GET** `/api/tenant/damages/nearby`

Obtiene **CUALQUIER** daño cercano a la ubicación del técnico, sin importar la empresa. Esto permite que los técnicos encuentren oportunidades de servicio de cualquier cliente basándose únicamente en la proximidad geográfica.

**Headers:**
```
x-user-email: tecnico@ejemplo.com
```

**Query Parameters:**
```
latitude: 6.2442
longitude: -75.5812
radius: 20000 (opcional, default: 1000 metros)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "damage123",
      "item": "Reparación de sistema de filtración",
      "area": "piscinas",
      "description": "Sistema con fuga en tubería principal\n\nPresupuesto estimado: $200,000 COP\nUrgencia: urgent\nUbicación específica: Torre A, Piscina principal\nSolicitado por: Empresa XYZ (cliente@ejemplo.com)",
      "location": {
        "latitude": 6.2442,
        "longitude": -75.5812,
        "accuracy": 10
      },
      "severity": "high",
      "rating": "R",
      "status": "reported",
      "companyName": "Marma S.A.S.",
      "unidadNombre": "Solicitud directa",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

**Nota:** Este endpoint ahora muestra damages de **TODAS las empresas**, permitiendo que los técnicos encuentren oportunidades de servicio de cualquier cliente basándose únicamente en la proximidad geográfica.

---

## 🔧 **CÓMO USAR EL SISTEMA - GUÍA PASO A PASO**

### **Para Técnicos (formulario_v3.html):**

#### 1. **Ver Oportunidades de Servicio Cercanas**
1. Abre `formulario_v3.html` en tu navegador
2. Inicia sesión con Google usando tu email de técnico
3. Presiona el botón **"Oportunidades"** en la navegación inferior
4. El sistema buscará automáticamente damages cercanos a tu ubicación
5. Verás una lista de oportunidades de servicio disponibles

#### 2. **Crear Propuesta para una Oportunidad**
1. En la lista de oportunidades, presiona **"Ver Detalles"** en cualquier oportunidad
2. Completa el formulario de propuesta:
   - **Precio:** Tu cotización en COP
   - **Duración:** Días estimados para completar el trabajo
   - **Descripción:** Detalles de tu solución propuesta
   - **Experiencia:** Tu experiencia relevante
   - **Materiales:** Materiales que usarás
3. Presiona **"Enviar Propuesta"**

#### 3. **Ver Mis Propuestas Enviadas**
1. Presiona el botón **"Propuestas"** en la navegación inferior
2. Verás todas las propuestas que has enviado
3. Podrás ver el estado de cada propuesta (pendiente, aceptada, rechazada)

---

### **Para Clientes/Empresas (formulario_v4.html):**

#### 1. **Crear Solicitud de Servicio**
1. Abre `formulario_v4.html` en tu navegador
2. Selecciona **"Cliente/Empresa"** en la pantalla inicial
3. Inicia sesión con Google usando tu email de empresa
4. Presiona el botón **"Propuestas"** en la navegación inferior
5. Presiona el botón **"+"** (agregar) para crear una nueva solicitud
6. Completa el formulario:
   - **Tipo de Servicio:** Piscinas, Zonas Comunes, etc.
   - **Título:** Descripción breve del problema
   - **Descripción:** Detalles del servicio necesario
   - **Presupuesto:** Tu presupuesto estimado
   - **Urgencia:** Qué tan urgente es el trabajo
   - **Ubicación:** Ubicación específica del problema
   - **Foto:** Opcional, foto del problema
7. Presiona **"Postular Solicitud"**

#### 2. **Ver Mis Solicitudes**
1. Presiona el botón **"Oportunidades"** en la navegación inferior
2. Verás todas las solicitudes que has creado
3. Podrás ver cuántas propuestas has recibido para cada solicitud

#### 3. **Ver Propuestas Recibidas**
1. Presiona el botón **"Propuestas"** en la navegación inferior
2. Verás todas las propuestas que has recibido de técnicos
3. Para cada propuesta podrás:
   - **Contactar WhatsApp:** Contactar directamente al técnico
   - **Aceptar:** Aceptar la propuesta del técnico

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error: "No se pudieron cargar las oportunidades de servicio"**

**Causas posibles:**
1. **Servidor no disponible** - Verifica que el servidor esté funcionando
2. **Problema de conectividad** - Verifica tu conexión a internet
3. **Certificado SSL** - El servidor puede tener problemas de certificado

**Soluciones:**
1. **Reintentar:** Presiona el botón "🔄 Reintentar" en la pantalla de error
2. **Verificar consola:** Abre F12 → Console para ver logs detallados
3. **Contactar soporte:** Si el problema persiste

### **No aparecen oportunidades cercanas**

**Verificaciones:**
1. **Ubicación:** Asegúrate de que el navegador tenga permisos de ubicación
2. **Radio de búsqueda:** El sistema busca en un radio de 20km
3. **Solicitudes activas:** Verifica que haya solicitudes creadas por empresas

### **No puedo enviar propuestas**

**Verificaciones:**
1. **Autenticación:** Asegúrate de estar logueado correctamente
2. **Formulario completo:** Todos los campos son obligatorios
3. **Conexión:** Verifica que tengas conexión a internet

---

## 📱 **ENDPOINTS DE PRUEBA**

### **Test de Conectividad**
**GET** `/api/tenant/test`

Prueba básica para verificar que el servidor está funcionando.

**Headers:**
```
x-user-email: tecnico@ejemplo.com
```

**Response:**
```json
{
  "success": true,
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00Z",
  "userEmail": "tecnico@ejemplo.com"
}
```

### **Ver Todos los Damages (Debug)**
**GET** `/api/tenant/damages/debug`

Endpoint temporal para ver todos los damages en la base de datos.

**Headers:**
```
x-user-email: tecnico@ejemplo.com
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "damage123",
      "item": "Reparación de sistema de filtración",
      "area": "piscinas",
      "latitude": 6.228966,
      "longitude": -75.574211,
      "companyName": "Marma S.A.S.",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```
