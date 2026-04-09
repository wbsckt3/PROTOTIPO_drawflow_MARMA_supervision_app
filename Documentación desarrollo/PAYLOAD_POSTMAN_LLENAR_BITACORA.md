# Payload para Postman - Llenar Bitácora de Supervisión

## Endpoint
```
POST https://api.techguard.pro/api/tenant/bitacoras-supervision/{BITACORA_ID}/llenar
```

## Headers
```
x-user-email: wbsckt2@gmail.com
Content-Type: application/json
Accept: application/json
```

## Estructura del Payload

### ✅ Estructura CORRECTA (la que espera el backend)

El backend espera:
- `areas`: objeto con nombres de items como claves y calificaciones como valores
- `comentarios`: objeto separado con nombres de items como claves
- `evidencias`: objeto separado con nombres de items como claves y base64 como valores
- `estado`: opcional, se calcula automáticamente si hay calificaciones "R"

### ✅ Estructura CORRECTA (la que espera el backend)

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
      "GIMNASIO": "E"
    },
    "zonas_externas": {
      "ZONA VERDES": "B",
      "VIDRIOS - VENTANAS": "R"
    }
  },
  "comentarios": {
    "piscinas": {
      "ANDENES": "Requiere reparación en el sistema de filtración"
    },
    "zonas_externas": {
      "VIDRIOS - VENTANAS": "Necesita limpieza profunda"
    }
  },
  "evidencias": {
    "piscinas": {
      "ANDENES": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    },
    "zonas_externas": {
      "VIDRIOS - VENTANAS": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    }
  },
  "estado": "con_novedad"
}
```

## Notas Importantes

### Calificaciones
- `E` = Excelente
- `B` = Bueno
- `R` = Regular (requiere comentario y foto obligatoria)

### Fotos en Base64
- Las fotos deben estar en formato base64 con el prefijo `data:image/jpeg;base64,` o `data:image/png;base64,`
- El tamaño máximo recomendado es de 2-3 MB por foto
- Ejemplo de foto base64 (muy pequeña para ejemplo):
  ```
  data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=
  ```

### Áreas Disponibles
- `piscinas`: Piscinas
- `zonas_comunes`: Zonas Comunes
- `zonas_externas`: Zonas Externas
- `oficinas`: Oficinas
- `operario`: Operario

### Items por Área

#### Piscinas (índices 0-10)
- 0: BAÑOS
- 1: ROMPE OLAS
- 2: ANDENES
- 3: LAVA PIES - DUCHA
- 4: SAUNA
- 5: JACUZZI
- 6: TURCO
- 7: COLOR VISUAL
- 8: PH
- 9: CLORO
- 10: HOLL

#### Zonas Comunes (índice 0)
- 0: GIMNASIO

#### Zonas Externas (índices 0-13)
- 0: ZONA VERDES
- 1: CAÑUELAS
- 2: PARQUE INFANTIL
- 3: PAREDES
- 4: VIDRIOS - VENTANAS
- 5: PASAMANOS
- 6: TAPAS SHUT
- 7: GABINETES - EXTINTORES
- 8: BARRIO - TRAPEADO
- 9: ASCENSORES
- 10: TUBERÍA VOLÁTIL
- 11: ESCALAS
- 12: PISOS
- 13: SHUT BASURAS

#### Oficinas (índices 0-10)
- 0: ESCRITORIOS
- 1: PAPELERAS
- 2: SALA DE JUNTAS
- 3: AULAS
- 4: BAÑOS
- 5: RECEPCIÓN
- 6: COMPUTADORES
- 7: PAREDES
- 8: CIELO RASO
- 9: COCINETA
- 10: ENTRADAS PRINCIPAL

#### Operario (índices 0-5)
- 0: PRODUCTIVIDAD
- 1: PRESENTACIÓN
- 2: CARNET
- 3: ELEMENTOS EPP
- 4: CONTROL DE HORARIO
- 5: ACTITUD

## Ejemplo Completo Mínimo

```json
{
  "areas": {
    "piscinas": {
      "BAÑOS": "E"
    }
  }
}
```

## Ejemplo Completo con Foto

```json
{
  "areas": {
    "piscinas": {
      "BAÑOS": "R"
    }
  },
  "comentarios": {
    "piscinas": {
      "BAÑOS": "Requiere limpieza profunda"
    }
  },
  "evidencias": {
    "piscinas": {
      "BAÑOS": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    }
  },
  "estado": "con_novedad"
}
```

## Response Esperado

```json
{
  "success": true,
  "message": "Bitácora llenada exitosamente",
  "data": {
    "_id": "bitacora-id",
    "estado": "completada",
    "areas": { ... },
    "comentarios": { ... },
    "evidencias": { ... },
    "updatedAt": "2025-01-20T15:30:00.000Z"
  }
}
```

