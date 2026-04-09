
Endpoints incluidos:

POST /auth/google-signin - Autenticación Google
GET /companies - Obtener empresa del admin
POST /companies/relate-user - Crear/relacionar supervisor
GET /companies/:companyId/supervisores - Listar supervisores (corregido)
POST /unidades-residenciales - Crear unidad
GET /unidades-residenciales - Listar unidades
POST /bitacoras-supervision - Crear bitácora
GET /bitacoras-supervision - Listar bitácoras (con filtros para admin)
GET /bitacoras-supervision/:bitacoraId - Ver detalle de bitácora
GET /unidades-residenciales/:unidadId/bitacoras - Bitácoras por unidad
GET /bitacoras-supervision/supervisor - Bitácoras por supervisor

Endpoints usados en el dashboard admin (frontend)

Desde vue3_vite_local/src/stores/admin.js:
loadCompany() → GET /companies
loadUsuarios() → GET /companies/:companyId/supervisores
crearUsuario() → POST /companies/relate-user
loadUnidades() → GET /unidades-residenciales
crearUnidad() → POST /unidades-residenciales
loadBitacoras() → GET /bitacoras-supervision (con filtros)
crearBitacora() → POST /bitacoras-supervision
getBitacoraById() → GET /bitacoras-supervision/:bitacoraId
getBitacorasByUnidad() → GET /unidades-residenciales/:unidadId/bitacoras
getBitacorasBySupervisor() → GET /bitacoras-supervision/supervisor

