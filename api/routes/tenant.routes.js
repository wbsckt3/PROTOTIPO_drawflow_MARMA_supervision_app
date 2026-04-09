const express = require('express');
const router = express.Router();
// CORS ya está configurado globalmente en server.js, no es necesario aquí
// const cors = require('cors');
const { getCompanies, 
		createCompany, 
		relateUserToCompany } = require('../controllers/company.controller');

const authController = require("../controllers/auth.controller")


// Importar el controlador de reglas de negocio para techguard pro tenant supervisi�n formulario.html y formulrio_v2.html 
const { 
  postCrearUnidadResidencial,
  getUnidadesResidenciales,
  putActualizarEstadoUnidad,
  putActualizarUnidadResidencial,
  postCrearBitacoraSupervision,
  getBitacorasSupervision,
  postLlenarBitacoraSupervision,
  getUnidadResidencialBitacorasSupervision,
  getBitacorasSupervisionBySupervisor,
  getProxyImageForPdf,
  getBitacoraSupervisionById,
  putActualizarBitacoraSupervision,
  deleteBitacoraSupervision,
  getSupervisoresByCompany,
} = require('../controllers/reglas-negocio.controller');

// CORS ya está configurado globalmente en server.js antes de montar estas rutas
// No es necesario aplicar CORS aquí para evitar conflictos
// router.use(cors());

// Rutas de autenticación
router.post('/auth/google-signin', authController.googleSignIn);

// Rutas de empresas
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.post('/companies/relate-user', relateUserToCompany );

// Rutas de reglas de negocio - Supervisi�n de unidades residenciales
// 0. POST - Crear Unidad Residencial (Admin)
router.post('/unidades-residenciales', postCrearUnidadResidencial);

// 1. GET - Obtener Unidades Residenciales (Admin)
router.get('/unidades-residenciales', getUnidadesResidenciales);

// 1.1. PUT - Actualizar Estado de Unidad Residencial (Habilitar/Deshabilitar)
router.put('/unidades-residenciales/:unidadResidencialId/estado', putActualizarEstadoUnidad);

// 1.2. PUT - Actualizar Unidad Residencial (Admin)
router.put('/unidades-residenciales/:unidadResidencialId', putActualizarUnidadResidencial);

// 2. POST - Crear Bit�cora de Supervisi�n (Admin)
router.post('/bitacoras-supervision', postCrearBitacoraSupervision);

// 3. GET - Obtener Bit�coras del Supervisor (Frontend)
router.get('/bitacoras-supervision', getBitacorasSupervision);

// 4. POST - Llenar Bit�cora de Supervisi�n (Frontend)
router.post('/bitacoras-supervision/:bitacoraId/llenar', postLlenarBitacoraSupervision);

// 5. GET - Obtener Bit�coras de una Unidad Residencial (Admin)
router.get('/unidades-residenciales/:unidadResidencialId/bitacoras', getUnidadResidencialBitacorasSupervision);

// 6. GET - Obtener Bit�coras de un Supervisor Espec�fico (Admin)
router.get('/bitacoras-supervision/supervisor', getBitacorasSupervisionBySupervisor);

// 7. GET - Obtener Bit�cora Espec�fica por ID (Frontend/Admin)
router.get('/bitacoras-supervision/proxy-image', getProxyImageForPdf);
router.get('/bitacoras-supervision/:bitacoraId', getBitacoraSupervisionById);

// 7.1. PUT - Actualizar Bitácora de Supervisión (Reprogramar) (Admin)
router.put('/bitacoras-supervision/:bitacoraId', putActualizarBitacoraSupervision);

// 7.2. DELETE - Eliminar Bitácora de Supervisión (Solo si está programada) (Admin)
router.delete('/bitacoras-supervision/:bitacoraId', deleteBitacoraSupervision);

// ===== RUTAS DE GESTI�N DE SUPERVISORES (Admin) =====

// 8. GET - Obtener Supervisores de la Empresa (Admin)
router.get('/companies/:companyId/supervisores', getSupervisoresByCompany);

// ===== RUTAS DE PROVEEDORES DE SERVICIO =====
const {
  getOportunidadesCercanas,
  postCrearPropuesta,
  getPropuestasServicio,
  putActualizarPropuesta
} = require('../controllers/proveedores-servicio.controller');

// 9. GET - Obtener oportunidades de servicio cercanas (Proveedor)
router.get('/proveedores/oportunidades', getOportunidadesCercanas);

// 10. POST - Crear propuesta de servicio (Proveedor)
router.post('/proveedores/propuestas', postCrearPropuesta);

// 11. GET - Obtener propuestas de servicio (Admin)
router.get('/proveedores/propuestas', getPropuestasServicio);

// 12. PUT - Actualizar estado de propuesta (Admin)
router.put('/proveedores/propuestas/:propuestaId', putActualizarPropuesta);

module.exports = router;

