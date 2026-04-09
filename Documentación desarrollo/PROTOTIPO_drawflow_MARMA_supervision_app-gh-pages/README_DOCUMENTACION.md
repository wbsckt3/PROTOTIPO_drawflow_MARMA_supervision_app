# 📚 Documentación Tech Guard Pro - Sistema de Supervisión

## 🎯 Descripción General

**Tech Guard Pro** es un sistema completo de supervisión y mantenimiento para unidades residenciales que permite:

- **Gestión de empresas** y configuración de tenants
- **Programación de visitas** de supervisión
- **Ejecución de supervisiones** con calificaciones y evidencias
- **Gestión de daños** y propuestas de técnicos
- **Generación de reportes** automáticos

---

## 🏗️ Arquitectura del Sistema

### **Roles del Sistema:**
1. **🏢 Dueño del Tenant** - Configuración inicial y gestión de empresas
2. **👨‍💼 Administrador** - Gestión de unidades, supervisores y programación
3. **👷 Supervisor** - Ejecución de supervisiones en campo
4. **🔧 Técnico** - Propuestas de solución para daños (futuro)

### **Aplicaciones Frontend:**
- **`formulario.html`** - Dashboard del administrador
- **`formulario_v2.html`** - Aplicación del supervisor (✅ FUNCIONANDO)
- **`formulario_v3.html`** - Aplicación del técnico (futuro)
- **`formulario_v4.html`** - Aplicación del cliente (futuro)

---

## 📋 Documentación por Roles

### 1. **🏢 Dueño del Tenant** - 4 Endpoints
**Archivo:** `01_TENANT_OWNER_API.md`

**Funcionalidades:**
- Autenticación con Google Sign-In
- Creación de empresas
- Relación de usuarios con empresas
- Gestión de roles (admin, supervisor, viewer)

**Endpoints:**
- `POST /auth/google-signin` - Autenticación
- `POST /companies` - Crear empresa
- `POST /companies/relate-user` - Relacionar usuario
- `GET /companies` - Obtener empresas

---

### 2. **👷 Supervisor** - 2 Endpoints
**Archivo:** `02_SUPERVISOR_API.md`

**Funcionalidades:**
- Ver bitácoras asignadas
- Llenar formularios de supervisión
- Calificar elementos (E/B/R)
- Agregar comentarios y evidencias fotográficas
- Generación automática de PDFs

**Endpoints:**
- `GET /bitacoras-supervision` - Obtener bitácoras
- `POST /bitacoras-supervision/{id}/llenar` - Completar bitácora

**Estado:** ✅ **FUNCIONANDO COMPLETAMENTE**

---

### 3. **👨‍💼 Administrador** - 7 Endpoints
**Archivo:** `03_ADMIN_API.md`

**Funcionalidades:**
- Gestión de unidades residenciales
- Programación de visitas de supervisión
- Monitoreo de bitácoras y reportes
- Gestión de daños y propuestas
- Dashboard administrativo

**Endpoints:**
- `POST /unidades-residenciales` - Crear unidad
- `GET /unidades-residenciales` - Obtener unidades
- `POST /bitacoras-supervision` - Programar visita
- `GET /unidades-residenciales/{id}/bitacoras-supervision` - Bitácoras por unidad
- `GET /bitacoras-supervision/supervisor/{email}` - Bitácoras por supervisor
- `GET /damages/{id}/with-proposals` - Daños con propuestas
- `PUT /proposals/{id}/status` - Gestionar propuestas

**Estado:** ⚠️ **EN DESARROLLO** - Falta conectar con `formulario.html`

---

## 🔄 Flujo de Trabajo Completo

### **Paso 1: Configuración Inicial (Dueño del Tenant)**
1. Inicia sesión con Google
2. Crea su empresa
3. Se asigna como administrador
4. Invita supervisores al sistema

### **Paso 2: Configuración Operativa (Administrador)**
1. Crea unidades residenciales
2. Define áreas de supervisión
3. Programa visitas de supervisión
4. Asigna supervisores a las visitas

### **Paso 3: Ejecución de Supervisiones (Supervisor)**
1. Ve sus bitácoras asignadas
2. Ejecuta la supervisión en campo
3. Califica elementos (E/B/R)
4. Agrega comentarios y fotos
5. Completa la bitácora

### **Paso 4: Seguimiento (Administrador)**
1. Monitorea el progreso de las supervisiones
2. Revisa reportes generados
3. Gestiona daños reportados
4. Toma decisiones sobre propuestas

---

## 🛠️ Estado Actual del Desarrollo

### ✅ **Completado y Funcionando:**
- **Backend API** - Todos los endpoints implementados
- **Autenticación** - Google Sign-In funcionando
- **Formulario_v2.html** - Aplicación del supervisor 100% funcional
- **Base de datos** - MongoDB configurado y funcionando
- **Generación de PDFs** - Automática al completar bitácoras
- **Geolocalización** - Fotos con coordenadas GPS
- **Modo demo** - Funciona sin servidor para pruebas

### ⚠️ **En Desarrollo:**
- **Formulario.html** - Dashboard del administrador
  - Falta conectar con los 7 endpoints de admin
  - Interfaz básica creada, necesita integración API

### 🔮 **Futuro:**
- **Formulario_v3.html** - Aplicación del técnico
- **Formulario_v4.html** - Aplicación del cliente
- **Notificaciones** - Sistema de alertas
- **Reportes avanzados** - Dashboards con métricas

---

## 🚀 Cómo Empezar

### **Para Desarrolladores:**
1. **Revisar documentación** por roles según necesidad
2. **Configurar entorno** con MongoDB y Node.js
3. **Importar colecciones Postman** para pruebas
4. **Desarrollar frontend** siguiendo los ejemplos

### **Para Usuarios:**
1. **Supervisores** - Usar `formulario_v2.html` (listo)
2. **Administradores** - Usar `formulario.html` (en desarrollo)
3. **Dueños de Tenant** - Configurar empresa inicial

---

## 📁 Estructura de Archivos

```
PROTOTIPO_drawflow_MARMA_supervision_app-gh-pages/
├── 📚 DOCUMENTACIÓN/
│   ├── 01_TENANT_OWNER_API.md      # Dueño del tenant (4 endpoints)
│   ├── 02_SUPERVISOR_API.md        # Supervisor (2 endpoints)
│   ├── 03_ADMIN_API.md             # Administrador (7 endpoints)
│   └── README_DOCUMENTACION.md     # Este archivo
├── 🌐 FRONTEND/
│   ├── formulario.html              # Dashboard admin (⚠️ en desarrollo)
│   ├── formulario_v2.html          # App supervisor (✅ funcionando)
│   ├── formulario_v3.html          # App técnico (🔮 futuro)
│   ├── formulario_v4.html          # App cliente (🔮 futuro)
│   └── auth.js                     # Autenticación Google
├── 📊 POSTMAN/
│   ├── 4_endpoints_POSTMAN_api_tenant_collection.json
│   └── 15_endpoints_POSTMAN_reglas_negocio.json
└── 🔧 UTILIDADES/
    ├── test_api_connection.html     # Herramienta de diagnóstico
    └── generar_pdf.py              # Generador de PDFs
```

---

## 🔧 Herramientas de Desarrollo

### **Postman Collections:**
- **4 endpoints** - Configuración de tenant
- **15 endpoints** - Reglas de negocio y operaciones

### **Herramientas de Diagnóstico:**
- **test_api_connection.html** - Prueba conectividad API
- **Logs de consola** - Debugging en formulario_v2.html

### **Generación de PDFs:**
- **Automática** - Al completar bitácoras
- **Manual** - Scripts Python disponibles

---

## 📞 Soporte y Contacto

### **Problemas Conocidos:**
- **MongoDB desconectado** - Error "Topology is closed" (solucionado)
- **Formulario.html** - Falta integración con API (en desarrollo)

### **Solución de Problemas:**
1. **Revisar logs** de consola del navegador
2. **Usar test_api_connection.html** para diagnóstico
3. **Verificar conectividad** con el servidor
4. **Revisar autenticación** Google Sign-In

---

## 🎯 Próximos Pasos

### **Inmediato:**
1. **Completar formulario.html** - Conectar con API de admin
2. **Probar flujo completo** - Desde configuración hasta supervisión
3. **Optimizar rendimiento** - Carga y respuesta de la aplicación

### **Corto Plazo:**
1. **Implementar formulario_v3.html** - Aplicación del técnico
2. **Sistema de notificaciones** - Alertas y recordatorios
3. **Reportes avanzados** - Dashboards con métricas

### **Largo Plazo:**
1. **Aplicación móvil** - Versión nativa
2. **Integración IoT** - Sensores y monitoreo automático
3. **IA y Machine Learning** - Predicción de mantenimiento

---

## 📈 Métricas de Éxito

### **Técnicas:**
- ✅ **13 endpoints** funcionando correctamente
- ✅ **1 aplicación** (supervisor) 100% funcional
- ✅ **Base de datos** estable y conectada
- ✅ **Autenticación** segura implementada

### **Funcionales:**
- ✅ **Supervisores** pueden completar bitácoras
- ✅ **PDFs** se generan automáticamente
- ✅ **Geolocalización** funciona correctamente
- ✅ **Modo demo** permite pruebas sin servidor

---

**¡El sistema Tech Guard Pro está listo para supervisar y mantener unidades residenciales de manera eficiente y profesional!** 🚀


