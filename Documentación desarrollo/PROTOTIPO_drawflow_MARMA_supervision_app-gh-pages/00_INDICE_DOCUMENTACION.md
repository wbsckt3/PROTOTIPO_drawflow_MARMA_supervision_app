# 📚 Índice de Documentación - Tech Guard Pro

## 🎯 Guía de Navegación

Esta es la documentación completa del sistema **Tech Guard Pro**. Organizada por roles y funcionalidades para facilitar la navegación.

---

## 📋 Documentación Principal

### **🏠 README Principal**
- **[README_DOCUMENTACION.md](./README_DOCUMENTACION.md)** - Visión general del sistema y arquitectura

---

## 👥 Documentación por Roles

### **1. 🏢 Dueño del Tenant (4 endpoints)**
- **[01_TENANT_OWNER_API.md](./01_TENANT_OWNER_API.md)** - Configuración inicial y gestión de empresas
  - Autenticación con Google Sign-In
  - Creación de empresas
  - Relación de usuarios con empresas
  - Gestión de roles

### **2. 👷 Supervisor (2 endpoints)**
- **[02_SUPERVISOR_API.md](./02_SUPERVISOR_API.md)** - Ejecución de supervisiones en campo
  - Obtener bitácoras asignadas
  - Llenar formularios de supervisión
  - Calificaciones, comentarios y evidencias
  - **✅ FUNCIONANDO COMPLETAMENTE**

### **3. 👨‍💼 Administrador (7 endpoints)**
- **[03_ADMIN_API.md](./03_ADMIN_API.md)** - Gestión del sistema y programación
  - Gestión de unidades residenciales
  - Programación de visitas
  - Monitoreo de bitácoras
  - Gestión de daños y propuestas
  - **⚠️ EN DESARROLLO** - Falta conectar con formulario.html

---

## 🔧 Herramientas de Desarrollo

### **Colecciones Postman**
- **[4_endpoints_POSTMAN_api_tenant_collection.json](./4_endpoints_POSTMAN_api_tenant_collection.json)** - Endpoints de tenant
- **[15_endpoints_POSTMAN_reglas_negocio.json](./15_endpoints_POSTMAN_reglas_negocio.json)** - Endpoints de reglas de negocio

### **Herramientas de Diagnóstico**
- **[test_api_connection.html](./test_api_connection.html)** - Prueba de conectividad API

---

## 📱 Aplicaciones Frontend

### **Aplicaciones Funcionales**
- **[formulario_v2.html](./formulario_v2.html)** - Aplicación del supervisor ✅
- **[auth.js](./auth.js)** - Sistema de autenticación Google

### **Aplicaciones en Desarrollo**
- **[formulario.html](./formulario.html)** - Dashboard del administrador ⚠️

### **Aplicaciones Futuras**
- **[formulario_v3.html](./formulario_v3.html)** - Aplicación del técnico 🔮
- **[formulario_v4.html](./formulario_v4.html)** - Aplicación del cliente 🔮

---

## 📊 Documentación Técnica

### **Modelos de Datos**
- **[5 modelos api_tenant y reglas_negocio.md](./5%20modelos%20api_tenant%20y%20reglas_negocio.md)** - Estructura de datos

### **Documentación de API**
- **[API_PROPUESTAS_DOCUMENTACION.md](./API_PROPUESTAS_DOCUMENTACION.md)** - API de propuestas
- **[DOCUMENTACION_API_TECH_GUARD_PRO.md](./DOCUMENTACION_API_TECH_GUARD_PRO.md)** - Documentación general

### **Optimización y Rendimiento**
- **[OPTIMIZACION_LOADING_RENDIMIENTO.md](./OPTIMIZACION_LOADING_RENDIMIENTO.md)** - Mejoras de rendimiento

---

## 🚀 Guías de Inicio Rápido

### **Para Desarrolladores**
1. **Leer** [README_DOCUMENTACION.md](./README_DOCUMENTACION.md)
2. **Configurar** entorno con MongoDB
3. **Importar** colecciones Postman
4. **Probar** con [test_api_connection.html](./test_api_connection.html)

### **Para Supervisores**
1. **Abrir** [formulario_v2.html](./formulario_v2.html)
2. **Iniciar sesión** con Google
3. **Ver bitácoras** asignadas
4. **Completar supervisiones**

### **Para Administradores**
1. **Configurar** empresa con endpoints de tenant
2. **Crear** unidades residenciales
3. **Programar** visitas de supervisión
4. **Monitorear** progreso (formulario.html en desarrollo)

---

## 🔍 Búsqueda Rápida

### **Por Funcionalidad**
- **Autenticación** → [01_TENANT_OWNER_API.md](./01_TENANT_OWNER_API.md)
- **Supervisión** → [02_SUPERVISOR_API.md](./02_SUPERVISOR_API.md)
- **Administración** → [03_ADMIN_API.md](./03_ADMIN_API.md)
- **Propuestas** → [API_PROPUESTAS_DOCUMENTACION.md](./API_PROPUESTAS_DOCUMENTACION.md)

### **Por Estado de Desarrollo**
- **✅ Funcionando** → [formulario_v2.html](./formulario_v2.html)
- **⚠️ En Desarrollo** → [formulario.html](./formulario.html)
- **🔮 Futuro** → [formulario_v3.html](./formulario_v3.html), [formulario_v4.html](./formulario_v4.html)

### **Por Tipo de Archivo**
- **📚 Documentación** → Archivos .md
- **🌐 Frontend** → Archivos .html
- **🔧 Backend** → Archivos .js, .json
- **🛠️ Utilidades** → Archivos .py, .html

---

## 📞 Soporte

### **Problemas Comunes**
- **Error de conexión** → Usar [test_api_connection.html](./test_api_connection.html)
- **Problemas de autenticación** → Revisar [auth.js](./auth.js)
- **Errores de API** → Consultar documentación específica por rol

### **Estado del Sistema**
- **Backend** ✅ Funcionando
- **Base de datos** ✅ Conectada
- **Supervisor** ✅ 100% funcional
- **Admin** ⚠️ En desarrollo
- **Técnico/Cliente** 🔮 Futuro

---

## 🎯 Próximos Pasos

1. **Completar** formulario.html (dashboard admin)
2. **Probar** flujo completo del sistema
3. **Desarrollar** aplicaciones de técnico y cliente
4. **Optimizar** rendimiento y experiencia de usuario

---

**¡Bienvenido a Tech Guard Pro! 🚀**

*Sistema de supervisión y mantenimiento para unidades residenciales*


