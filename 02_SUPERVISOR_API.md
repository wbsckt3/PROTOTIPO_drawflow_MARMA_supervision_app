# 👷 API para Supervisor - Tech Guard Pro

## 📋 Descripción General

Esta documentación cubre los **2 endpoints principales** que utiliza el **supervisor** para gestionar sus bitácoras de supervisión desde `formulario_v2.html`. Estos endpoints permiten:

- Ver las bitácoras de supervisión asignadas
- Llenar y completar las bitácoras con calificaciones, comentarios y evidencias

---

## 🔗 Endpoints Disponibles

### 1. **Obtener Bitácoras del Supervisor**
**GET** `/api/tenant/bitacoras-supervision`

Obtiene todas las bitácoras de supervisión asignadas al supervisor autenticado.

#### Headers
```
x-user-email: supervisor@ejemplo.com
Accept: application/json
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "bitacora_123",
      "companyId": "bcb1a6db71f9973ff91c00103a33e873",
      "companyName": "Marma S.A.S.",
      "unidadResidencialId": "unidad_456",
      "unidadNombre": "Conjunto Residencial Marma",
      "unidadResidencial": {
        "_id": "unidad_456",
        "nombre": "Conjunto Residencial Marma",
        "direccion": "Carrera 15 #93-47, Bogotá",
        "tipo": "condominio",
        "areas": {
          "piscinas": {
            "name": "PISCINAS",
            "color": "#3b82f6",
            "items": ["BAÑOS", "ROMPE OLAS", "ANDENES", "LAVA PIES - DUCHA"]
          },
          "zonas_comunes": {
            "name": "ZONAS COMUNES",
            "color": "#22c55e",
            "items": ["GIMNASIO", "SALÓN SOCIAL", "ANDENES", "PORTERÍA"]
          }
        }
      },
      "supervisorEmail": "supervisor@ejemplo.com",
      "supervisor": "Juan Pérez",
      "cliente": "Marma S.A.S.",
      "fecha": "2024-01-15T10:00:00.000Z",
      "fechaProgramada": "2024-01-15T10:00:00.000Z",
      "observaciones": "Supervisión programada para revisión general",
      "estado": "programada",
      "createdAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Estados de Bitácora
- `programada`: Bitácora creada, esperando supervisión
- `en_progreso`: Supervisor inició la supervisión
- `con_novedad`: Supervisión completada con calificaciones "R"
- `completada`: Supervisión completada sin novedades
- `cancelada`: Bitácora cancelada

---

### 2. **Llenar Bitácora de Supervisión**
**POST** `/api/tenant/bitacoras-supervision/{bitacoraId}/llenar`

Completa una bitácora de supervisión con calificaciones, comentarios y evidencias fotográficas.

#### Headers
```
x-user-email: supervisor@ejemplo.com
Content-Type: application/json
Accept: application/json
```

#### Body
```json
{
  "areas": {
    "piscinas": {
      "BAÑOS": "E",
      "ROMPE OLAS": "B",
      "ANDENES": "R",
      "LAVA PIES - DUCHA": "E"
    },
    "zonas_comunes": {
      "GIMNASIO": "E",
      "SALÓN SOCIAL": "B",
      "ANDENES": "E",
      "PORTERÍA": "R"
    }
  },
  "comentarios": {
    "piscinas": {
      "ANDENES": "Requiere reparación en el sistema de filtración",
      "LAVA PIES - DUCHA": "Excelente estado de mantenimiento"
    },
    "zonas_comunes": {
      "PORTERÍA": "Necesita limpieza profunda y pintura"
    }
  },
  "evidencias": {
    "piscinas": {
      "ANDENES": {
        "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "metadata": {
          "originalSize": 2048576,
          "compressedSize": 512000,
          "dimensions": "800x600",
          "compression": "75%",
          "timestamp": "2024-01-15T14:30:00.000Z",
          "geolocation": {
            "latitude": 6.2442,
            "longitude": -75.5812,
            "accuracy": 10,
            "timestamp": "2024-01-15T14:30:00.000Z"
          }
        }
      }
    }
  },
  "deshabilitadas": {
    "oficinas": true
  },
  "estado": "con_novedad"
}
```

#### Calificaciones Disponibles
- `E`: Excelente
- `B`: Bueno  
- `R`: Regular (requiere comentario y foto obligatoria)

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Bitácora completada exitosamente",
  "data": {
    "_id": "bitacora_123",
    "estado": "con_novedad",
    "areas": {
      "piscinas": {
        "BAÑOS": "E",
        "ROMPE OLAS": "B",
        "ANDENES": "R",
        "LAVA PIES - DUCHA": "E"
      }
    },
    "comentarios": {
      "piscinas": {
        "ANDENES": "Requiere reparación en el sistema de filtración"
      }
    },
    "evidencias": {
      "piscinas": {
        "ANDENES": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      }
    },
    "deshabilitadas": {
      "oficinas": true
    },
    "resumen": {
      "totalAreas": 5,
      "areasCompletadas": 4,
      "totalElementos": 20,
      "elementosCompletados": 18
    },
    "completedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

---

## 🔄 Flujo de Trabajo del Supervisor

### Paso 1: Ver Bitácoras Asignadas
1. El supervisor inicia sesión en `formulario_v2.html`
2. Se ejecuta automáticamente `GET /bitacoras-supervision`
3. Se muestran las bitácoras en el dashboard

### Paso 2: Seleccionar Bitácora
1. El supervisor hace clic en una bitácora
2. Se carga la información de la unidad residencial
3. Se muestran las áreas de supervisión disponibles

### Paso 3: Llenar Bitácora
1. El supervisor califica cada elemento (E/B/R)
2. Agrega comentarios para elementos "R"
3. Toma fotos con geolocalización para elementos "R"
4. Puede deshabilitar áreas no aplicables

### Paso 4: Completar Supervisión
1. Se ejecuta `POST /bitacoras-supervision/{id}/llenar`
2. Se determina el estado final (completada/con_novedad)
3. Se genera PDF automáticamente
4. Se crean daños automáticamente para calificaciones "R"

---

## 📱 Integración con Frontend

### Desde `formulario_v2.html`
- **Dashboard**: Muestra bitácoras asignadas
- **Formulario**: Interfaz para llenar bitácoras
- **Calificaciones**: Radio buttons E/B/R
- **Comentarios**: Textarea para observaciones
- **Fotos**: Cámara con geolocalización
- **PDF**: Generación automática al completar

### Funcionalidades Especiales
- **Geolocalización**: Fotos incluyen coordenadas GPS
- **Compresión**: Imágenes se comprimen automáticamente
- **Draft**: Guardado automático en localStorage
- **Modo Demo**: Funciona sin servidor para pruebas

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Campos obligatorios faltantes |
| 401 | Email de supervisor no proporcionado |
| 403 | Supervisor no tiene acceso a esta bitácora |
| 404 | Bitácora no encontrada |
| 500 | Error interno del servidor |

---

## 🚀 Ejemplo de Uso Completo

```javascript
// 1. Obtener bitácoras del supervisor
const bitacorasResponse = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
  method: 'GET',
  headers: {
    'x-user-email': 'supervisor@ejemplo.com',
    'Accept': 'application/json'
  }
});

const bitacoras = await bitacorasResponse.json();
console.log('Bitácoras asignadas:', bitacoras.data);

// 2. Llenar bitácora específica
const bitacoraId = bitacoras.data[0]._id;
const llenarResponse = await fetch(`${API_BASE_URL}/bitacoras-supervision/${bitacoraId}/llenar`, {
  method: 'POST',
  headers: {
    'x-user-email': 'supervisor@ejemplo.com',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    areas: {
      "piscinas": {
        "BAÑOS": "E",
        "ROMPE OLAS": "B",
        "ANDENES": "R"
      }
    },
    comentarios: {
      "piscinas": {
        "ANDENES": "Requiere reparación urgente"
      }
    },
    evidencias: {
      "piscinas": {
        "ANDENES": "data:image/jpeg;base64,/9j/4AAQ..."
      }
    },
    deshabilitadas: {
      "oficinas": true
    },
    estado: "con_novedad"
  })
});

const resultado = await llenarResponse.json();
console.log('Bitácora completada:', resultado.data);
```

---

## 📋 Notas Importantes

- **Calificaciones R**: Requieren comentario y foto obligatorios
- **Geolocalización**: Se obtiene automáticamente al tomar fotos
- **Compresión**: Las fotos se comprimen a 70% de calidad
- **Draft**: Se guarda automáticamente cada cambio
- **PDF**: Se genera automáticamente al completar
- **Daños**: Se crean automáticamente para calificaciones "R"

---

## 🔗 Próximos Pasos

Una vez completada la bitácora:
1. **Se genera PDF** automáticamente
2. **Se crean daños** para calificaciones "R"
3. **Se notifica al admin** sobre novedades
4. **Se actualiza el estado** de la bitácora
5. **Se puede descargar** el reporte PDF


