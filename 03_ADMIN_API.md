# 👨‍💼 API para Administrador - Tech Guard Pro

## 📋 Descripción General

Esta documentación cubre los **7 endpoints principales** que utiliza el **administrador** para gestionar el sistema desde `formulario.html` (dashboard admin). Estos endpoints permiten:

- Gestionar unidades residenciales
- Agregar supervisores al sistema
- Programar visitas de supervisión
- Monitorear bitácoras y reportes
- Gestionar daños y propuestas

---

## 🔗 Endpoints Disponibles

### 1. **Crear Unidad Residencial**
**POST** `/api/tenant/unidades-residenciales`

Crea una nueva unidad residencial con sus áreas de supervisión.

#### Headers
```
x-user-email: admin@ejemplo.com
Content-Type: application/json
```

#### Body
```json
{
  "companyId": "bcb1a6db71f9973ff91c00103a33e873",
  "nombre": "Condominio Las Palmas",
  "direccion": "Carrera 15 #93-47, Bogotá",
  "tipo": "condominio",
  "areas": {
    "piscinas": {
      "name": "PISCINAS",
      "color": "#3b82f6",
      "items": ["BAÑOS", "ROMPE OLAS", "ANDENES", "LAVA PIES - DUCHA", "SAUNA", "JACUZZI"]
    },
    "zonas_comunes": {
      "name": "ZONAS COMUNES",
      "color": "#22c55e",
      "items": ["GIMNASIO", "SALÓN SOCIAL", "SALÓN DE JUEGOS", "ANDENES", "PORTERÍA"]
    },
    "zonas_externas": {
      "name": "ZONAS EXTERNAS",
      "color": "#f59e0b",
      "items": ["ZONA VERDES", "CAÑUELAS", "PARQUE INFANTIL", "PAREDES", "VIDRIOS - VENTANAS"]
    }
  }
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Unidad residencial creada exitosamente",
  "data": {
    "_id": "unidad_456",
    "companyId": "bcb1a6db71f9973ff91c00103a33e873",
    "nombre": "Condominio Las Palmas",
    "direccion": "Carrera 15 #93-47, Bogotá",
    "tipo": "condominio",
    "areas": {
      "piscinas": {
        "name": "PISCINAS",
        "color": "#3b82f6",
        "items": ["BAÑOS", "ROMPE OLAS", "ANDENES", "LAVA PIES - DUCHA"]
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. **Obtener Unidades Residenciales**
**GET** `/api/tenant/unidades-residenciales`

Obtiene todas las unidades residenciales de la empresa del admin.

#### Headers
```
x-user-email: admin@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "unidad_456",
      "companyId": "bcb1a6db71f9973ff91c00103a33e873",
      "nombre": "Condominio Las Palmas",
      "direccion": "Carrera 15 #93-47, Bogotá",
      "tipo": "condominio",
      "areas": {
        "piscinas": {
          "name": "PISCINAS",
          "color": "#3b82f6",
          "items": ["BAÑOS", "ROMPE OLAS", "ANDENES"]
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. **Crear Bitácora de Supervisión**
**POST** `/api/tenant/bitacoras-supervision`

Programa una nueva visita de supervisión asignada a un supervisor específico.

#### Headers
```
x-user-email: admin@ejemplo.com
Content-Type: application/json
```

#### Body
```json
{
  "companyId": "bcb1a6db71f9973ff91c00103a33e873",
  "unidadResidencialId": "unidad_456",
  "supervisorEmail": "supervisor@ejemplo.com",
  "cliente": "Condominio Las Palmas",
  "fecha": "2024-01-15T10:00:00.000Z",
  "supervisor": "Juan Pérez",
  "observaciones": "Supervisión programada para revisión general",
  "fechaProgramada": "2024-01-15T10:00:00.000Z"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Bitácora de supervisión creada exitosamente",
  "data": {
    "_id": "bitacora_123",
    "companyId": "bcb1a6db71f9973ff91c00103a33e873",
    "unidadResidencialId": "unidad_456",
    "supervisorEmail": "supervisor@ejemplo.com",
    "supervisor": "Juan Pérez",
    "cliente": "Condominio Las Palmas",
    "fecha": "2024-01-15T10:00:00.000Z",
    "fechaProgramada": "2024-01-15T10:00:00.000Z",
    "observaciones": "Supervisión programada para revisión general",
    "estado": "programada",
    "createdAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 4. **Obtener Bitácoras por Unidad Residencial**
**GET** `/api/tenant/unidades-residenciales/{unidadId}/bitacoras-supervision`

Obtiene todas las bitácoras de supervisión de una unidad residencial específica.

#### Headers
```
x-user-email: admin@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "bitacora_123",
      "unidadResidencialId": "unidad_456",
      "supervisorEmail": "supervisor@ejemplo.com",
      "supervisor": "Juan Pérez",
      "fecha": "2024-01-15T10:00:00.000Z",
      "estado": "completada",
      "resumen": {
        "totalAreas": 5,
        "areasCompletadas": 5,
        "totalElementos": 20,
        "elementosCompletados": 20
      }
    }
  ],
  "count": 1
}
```

---

### 5. **Obtener Bitácoras por Supervisor**
**GET** `/api/tenant/bitacoras-supervision/supervisor/{supervisorEmail}`

Obtiene todas las bitácoras asignadas a un supervisor específico.

#### Headers
```
x-user-email: admin@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "bitacora_123",
      "supervisorEmail": "supervisor@ejemplo.com",
      "supervisor": "Juan Pérez",
      "unidadNombre": "Condominio Las Palmas",
      "fecha": "2024-01-15T10:00:00.000Z",
      "estado": "completada",
      "resumen": {
        "totalAreas": 5,
        "areasCompletadas": 5
      }
    }
  ],
  "count": 1
}
```

---

### 6. **Obtener Daños con Propuestas (Admin)**
**GET** `/api/tenant/damages/{damageId}/with-proposals`

Obtiene un daño específico con todas las propuestas recibidas de técnicos.

#### Headers
```
x-user-email: admin@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "_id": "damage_789",
    "item": "Reparación de sistema de filtración",
    "area": "piscinas",
    "description": "Sistema con fuga en tubería principal",
    "rating": "R",
    "severity": "high",
    "status": "reported",
    "location": {
      "latitude": 6.2442,
      "longitude": -75.5812,
      "accuracy": 10
    },
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "companyName": "Marma S.A.S.",
    "unidadNombre": "Condominio Las Palmas",
    "createdAt": "2024-01-15T14:30:00.000Z",
    "proposals": [
      {
        "_id": "proposal_456",
        "technician": {
          "email": "tecnico@ejemplo.com",
          "name": "Carlos Mendoza",
          "phone": "+57 300 123 4567"
        },
        "proposal": {
          "price": 150000,
          "duration": 3,
          "description": "Reparación completa del sistema de filtración",
          "experience": "5 años de experiencia en sistemas de piscinas",
          "materials": "Bomba nueva, filtros, tuberías PVC"
        },
        "status": "pending",
        "submittedAt": "2024-01-15T16:00:00.000Z"
      }
    ],
    "proposalsCount": 1
  }
}
```

---

### 7. **Actualizar Estado de Propuesta (Admin)**
**PUT** `/api/tenant/proposals/{proposalId}/status`

Permite al admin aceptar o rechazar propuestas de técnicos.

#### Headers
```
x-user-email: admin@ejemplo.com
Content-Type: application/json
```

#### Body
```json
{
  "status": "accepted",
  "adminComment": "Propuesta aceptada. Contactar al técnico para coordinar la reparación.",
  "adminRating": 5
}
```

#### Estados Disponibles
- `accepted`: Propuesta aceptada
- `rejected`: Propuesta rechazada
- `completed`: Trabajo completado
- `cancelled`: Propuesta cancelada

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Estado de propuesta actualizado exitosamente",
  "data": {
    "_id": "proposal_456",
    "status": "accepted",
    "adminComment": "Propuesta aceptada. Contactar al técnico para coordinar la reparación.",
    "adminRating": 5,
    "updatedAt": "2024-01-15T17:00:00.000Z"
  }
}
```

---

## 🔄 Flujo de Trabajo del Admin

### Paso 1: Configurar Unidades Residenciales
1. Crear unidades residenciales con `POST /unidades-residenciales`
2. Definir áreas de supervisión para cada unidad
3. Verificar configuración con `GET /unidades-residenciales`

### Paso 2: Gestionar Supervisores
1. Agregar supervisores usando los endpoints de tenant owner
2. Asignar roles de supervisor a usuarios
3. Verificar supervisores disponibles

### Paso 3: Programar Visitas
1. Crear bitácoras de supervisión con `POST /bitacoras-supervision`
2. Asignar supervisor y unidad residencial
3. Definir fecha y observaciones

### Paso 4: Monitorear Progreso
1. Ver bitácoras por unidad con `GET /unidades-residenciales/{id}/bitacoras-supervision`
2. Ver bitácoras por supervisor con `GET /bitacoras-supervision/supervisor/{email}`
3. Revisar reportes y PDFs generados

### Paso 5: Gestionar Daños y Propuestas
1. Revisar daños reportados por supervisores
2. Ver propuestas de técnicos con `GET /damages/{id}/with-proposals`
3. Aceptar o rechazar propuestas con `PUT /proposals/{id}/status`

---

## 📱 Integración con Frontend

### Desde `formulario.html` (Dashboard Admin)
- **Gestión de Unidades**: CRUD de unidades residenciales
- **Programación de Visitas**: Calendario y formularios de bitácoras
- **Monitoreo**: Dashboards con métricas y reportes
- **Gestión de Daños**: Revisión de propuestas y toma de decisiones

### Funcionalidades del Dashboard
- **Vista General**: Resumen de todas las operaciones
- **Calendario**: Programación visual de visitas
- **Reportes**: PDFs y estadísticas de supervisión
- **Alertas**: Notificaciones de novedades y daños

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Campos obligatorios faltantes |
| 401 | Email de admin no proporcionado |
| 403 | Sin permisos de administrador |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: supervisor ya asignado) |
| 500 | Error interno del servidor |

---

## 🚀 Ejemplo de Uso Completo

```javascript
// 1. Crear unidad residencial
const unidadResponse = await fetch(`${API_BASE_URL}/unidades-residenciales`, {
  method: 'POST',
  headers: {
    'x-user-email': 'admin@ejemplo.com',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyId: 'bcb1a6db71f9973ff91c00103a33e873',
    nombre: 'Condominio Las Palmas',
    direccion: 'Carrera 15 #93-47, Bogotá',
    tipo: 'condominio',
    areas: {
      piscinas: {
        name: 'PISCINAS',
        color: '#3b82f6',
        items: ['BAÑOS', 'ROMPE OLAS', 'ANDENES']
      }
    }
  })
});

const unidad = await unidadResponse.json();
const unidadId = unidad.data._id;

// 2. Programar visita de supervisión
const bitacoraResponse = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
  method: 'POST',
  headers: {
    'x-user-email': 'admin@ejemplo.com',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyId: 'bcb1a6db71f9973ff91c00103a33e873',
    unidadResidencialId: unidadId,
    supervisorEmail: 'supervisor@ejemplo.com',
    cliente: 'Condominio Las Palmas',
    fecha: '2024-01-15T10:00:00.000Z',
    supervisor: 'Juan Pérez',
    observaciones: 'Supervisión programada para revisión general'
  })
});

const bitacora = await bitacoraResponse.json();
console.log('Bitácora programada:', bitacora.data);

// 3. Ver bitácoras por unidad
const bitacorasUnidad = await fetch(`${API_BASE_URL}/unidades-residenciales/${unidadId}/bitacoras-supervision`, {
  headers: { 'x-user-email': 'admin@ejemplo.com' }
});

const bitacoras = await bitacorasUnidad.json();
console.log('Bitácoras de la unidad:', bitacoras.data);

// 4. Gestionar propuesta de daño
const damageResponse = await fetch(`${API_BASE_URL}/damages/damage_789/with-proposals`, {
  headers: { 'x-user-email': 'admin@ejemplo.com' }
});

const damage = await damageResponse.json();
console.log('Daño con propuestas:', damage.data);

// 5. Aceptar propuesta
await fetch(`${API_BASE_URL}/proposals/proposal_456/status`, {
  method: 'PUT',
  headers: {
    'x-user-email': 'admin@ejemplo.com',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'accepted',
    adminComment: 'Propuesta aceptada. Contactar al técnico.',
    adminRating: 5
  })
});
```

---

## 📋 Notas Importantes

- **Permisos**: Solo usuarios con rol `admin` pueden usar estos endpoints
- **CompanyId**: Todos los recursos se asocian a la empresa del admin
- **Estados**: Las bitácoras tienen estados que se actualizan automáticamente
- **Propuestas**: Al aceptar una propuesta, las demás se rechazan automáticamente
- **Reportes**: Se generan PDFs automáticamente al completar bitácoras

---

## 🔗 Próximos Pasos

Una vez configurado el sistema:
1. **Los supervisores** pueden ver sus bitácoras asignadas
2. **Se ejecutan las supervisiones** desde formulario_v2.html
3. **Se generan reportes** automáticamente
4. **Se crean daños** para calificaciones "R"
5. **Los técnicos** pueden enviar propuestas
6. **El admin** gestiona y decide sobre las propuestas


