const GoogleSigninUser = require('../../GoogleSigninUsers/GoogleSigninUser.js');
const CompanyGoogleSigninUser = require('../models/CompanyGoogleSigninUser.model');
const Company = require('../models/company.model');
const UnidadResidencial = require('../models/UnidadResidencial.model');
const BitacoraSupervision = require('../models/BitacoraSupervision.model');
const Damage = require('../models/Damage.model');
const Proposal = require('../models/Proposal.model');

const { v4: uuidv4 } = require('uuid');

// ===== GESTIÓN DE SUPERVISORES =====

// 1. GET - Obtener supervisores de la empresa
exports.getSupervisoresByCompany = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { companyId } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'ID de empresa requerido' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    if (!companyIds.includes(companyId)) {
      return res.status(403).json({ error: 'No tienes acceso a esta empresa' });
    }

    // Buscar supervisores (usuarios con rol 'editor') de la empresa
    const relations = await CompanyGoogleSigninUser.find({ 
      companyId: companyId,
      role: 'editor',
      activo: true
    }).populate('googlesigninuserId', 'Email Name Picture createdAt');

    const supervisores = relations.map(rel => ({
      _id: rel._id,
      googlesigninuserId: rel.googlesigninuserId._id,
      companyId: rel.companyId,
      role: rel.role,
      fechaCreacion: rel.fechaCreacion,
      activo: rel.activo,
      usuario: {
        _id: rel.googlesigninuserId._id,
        Email: rel.googlesigninuserId.Email,
        Name: rel.googlesigninuserId.Name,
        Picture: rel.googlesigninuserId.Picture,
        createdAt: rel.googlesigninuserId.createdAt
      }
    }));

    res.json({
      success: true,
      data: supervisores,
      total: supervisores.length
    });

  } catch (error) {
    console.error('Error obteniendo supervisores:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};



// Función auxiliar para validar pertenencia del usuario a una empresa
async function validateUserCompanyAccess(userEmail, requiredRole = null) {
  try {
    // 1. Buscar usuario principal
    const user = await GoogleSigninUser.findOne({ Email: userEmail }).lean();
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const userMongoId = user._id;

    // 2. Buscar relación con empresas
    const relations = await CompanyGoogleSigninUser.find({ 
      googlesigninuserId: userMongoId.toString() 
    });

    if (relations.length === 0) {
      throw new Error('Usuario no tiene acceso a ninguna empresa');
    }

    const companyIds = relations.map(rel => rel.companyId);
    const companies = await Company.find({ _id: { $in: companyIds } });

    // 3. Si se requiere un rol específico, validarlo
    if (requiredRole) {
      const userRelation = relations.find(rel => rel.role === requiredRole);
      if (!userRelation) {
        throw new Error(`Usuario no tiene rol ${requiredRole}`);
      }
    }

    return {
      user,
      relations,
      companies,
      companyIds
    };
  } catch (error) {
    throw error;
  }
}


// 0. POST - Crear Unidad Residencial (Admin)
exports.postCrearUnidadResidencial = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { nombre, direccion, tipo, areas, companyId } = req.body;

    if (!userEmail || !nombre || !direccion || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companies, companyIds } = await validateUserCompanyAccess(userEmail, 'admin');
    
    console.log('🔍 Debug POST unidad - companyIds:', companyIds);
    console.log('🔍 Debug POST unidad - companies:', companies);
    console.log('🔍 Debug POST unidad - companyId enviado:', companyId);

    // Validar que el companyId enviado pertenece al usuario
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      targetCompanyId = companyIds[0]; // Usar la primera si no se especifica
    } else if (!companyIds.includes(targetCompanyId)) {
      return res.status(403).json({ error: 'No tienes acceso a esa empresa' });
    }

    // Crear nueva unidad residencial
    const nuevaUnidad = new UnidadResidencial({
      _id: uuidv4(),
      companyId: targetCompanyId, // Usar la empresa especificada
      nombre,
      direccion,
      tipo,
      // No incluir 'areas' para que use los valores por defecto del modelo
      fechaCreacion: new Date()
    });
    
    // Si se envían áreas personalizadas, actualizarlas
    if (areas && Object.keys(areas).length > 0) {
      nuevaUnidad.areas = areas;
    }

    await nuevaUnidad.save();

    res.status(201).json({
      success: true,
      message: 'Unidad residencial creada exitosamente',
      data: nuevaUnidad
    });

  } catch (error) {
    console.error('Error creando unidad residencial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 1. GET - Obtener Unidades Residenciales (Admin)
exports.getUnidadesResidenciales = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');
    
    console.log('🔍 Debug GET unidades - companyIds:', companyIds);

    // Buscar unidades residenciales de la empresa
    const unidades = await UnidadResidencial.find({ 
      companyId: { $in: companyIds }
    }).lean();
    
    console.log('🔍 Debug GET unidades - encontradas:', unidades.length);
    console.log('🔍 Debug GET unidades - datos:', unidades);

    res.status(200).json({
      success: true,
      data: unidades,
      total: unidades.length
    });

  } catch (error) {
    console.error('Error obteniendo unidades residenciales:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 2. POST - Crear Bitácora de Supervisión (Admin)
exports.postCrearBitacoraSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const supervisorEmail = req.headers['x-editor-email']?.toLowerCase().trim();
    const { unidadResidencialId, fecha, observaciones } = req.body;

    if (!userEmail || !supervisorEmail || !unidadResidencialId || !fecha) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Validar que el supervisor existe y pertenece a la misma empresa
    const supervisorData = await validateUserCompanyAccess(supervisorEmail, 'editor');
    const supervisorCompanyIds = supervisorData.companyIds;

    // Verificar que ambos usuarios pertenecen a la misma empresa
    const commonCompanyIds = companyIds.filter(id => supervisorCompanyIds.includes(id));
    if (commonCompanyIds.length === 0) {
      return res.status(403).json({ error: 'El supervisor no pertenece a la misma empresa' });
    }

    // Verificar que la unidad residencial existe y pertenece a la empresa
    const unidad = await UnidadResidencial.findOne({ 
      _id: unidadResidencialId,
      companyId: { $in: commonCompanyIds }
    });
    
    console.log('🔍 Debug POST bitácora - unidadResidencialId:', unidadResidencialId);
    console.log('🔍 Debug POST bitácora - commonCompanyIds:', commonCompanyIds);
    
    // Buscar todas las unidades de la empresa para debug
    const todasLasUnidades = await UnidadResidencial.find({ 
      companyId: { $in: commonCompanyIds }
    }).lean();
    console.log('🔍 Debug POST bitácora - todas las unidades de la empresa:', todasLasUnidades);
    
    console.log('🔍 Debug POST bitácora - unidad encontrada:', unidad);

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
    }

    // Obtener datos de la empresa
    const empresa = await Company.findById(commonCompanyIds[0]).lean();
    
    // Crear nueva bitácora de supervisión
    const nuevaBitacora = new BitacoraSupervision({
      _id: uuidv4(),
      companyId: commonCompanyIds[0],
      unidadResidencialId,
      supervisorEmail,
      supervisor: supervisorEmail, // Campo requerido
      cliente: empresa ? empresa.name : 'Empresa', // Campo requerido - usar nombre de la empresa
      companyName: empresa ? empresa.name : 'Empresa', // Nombre de la empresa
      unidadNombre: unidad.nombre, // Nombre de la unidad residencial
      fecha: new Date(fecha),
      fechaProgramada: new Date(fecha), // Campo requerido
      estado: 'programada',
      observaciones: observaciones || '',
      areas: {},
      comentarios: {},
      evidencias: [],
      deshabilitadas: {},
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    });

    await nuevaBitacora.save();

    res.status(201).json({
      success: true,
      message: 'Bitácora de supervisión creada exitosamente',
      data: nuevaBitacora
    });

  } catch (error) {
    console.error('Error creando bitácora de supervisión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};


// 3. GET - Obtener Bitácoras de Supervisión del Supervisor (Frontend)
exports.getBitacorasSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    // Validar que el usuario es supervisor
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'editor');

    // Buscar bitácoras asignadas al supervisor
    const bitacoras = await BitacoraSupervision.find({ 
      supervisorEmail: userEmail,
      companyId: { $in: companyIds }
    })
    .sort({ fecha: -1 })
    .lean();

    // Obtener datos de las unidades residenciales por separado
    const unidadIds = bitacoras.map(b => b.unidadResidencialId);
    const unidades = await UnidadResidencial.find({ 
      _id: { $in: unidadIds },
      companyId: { $in: companyIds }
    }).lean();

    // Crear un mapa para acceso rápido
    const unidadesMap = {};
    unidades.forEach(u => {
      unidadesMap[u._id] = u;
    });

    // Agregar datos de la unidad a cada bitácora
    const bitacorasConUnidad = bitacoras.map(bitacora => ({
      ...bitacora,
      unidadResidencial: unidadesMap[bitacora.unidadResidencialId] || null
    }));

    res.status(200).json({
      success: true,
      data: bitacorasConUnidad,
      total: bitacorasConUnidad.length
    });

  } catch (error) {
    console.error('Error obteniendo bitácoras de supervisión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 4. POST - Llenar Bitácora de Supervisión (Frontend)
exports.postLlenarBitacoraSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { bitacoraId } = req.params;
    const { areas, comentarios, evidencias, estado } = req.body;

    if (!userEmail || !bitacoraId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es supervisor
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'editor');

    // Buscar la bitácora y verificar que pertenece al supervisor
    const bitacora = await BitacoraSupervision.findOne({
      _id: bitacoraId,
      supervisorEmail: userEmail,
      companyId: { $in: companyIds }
    });

    if (!bitacora) {
      return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
    }

    // Actualizar la bitácora
    const updateData = {
      fechaActualizacion: new Date()
    };

    if (areas) updateData.areas = areas;
    if (comentarios) updateData.comentarios = comentarios;
    if (evidencias) updateData.evidencias = evidencias;
    if (estado) updateData.estado = estado;

    const bitacoraActualizada = await BitacoraSupervision.findByIdAndUpdate(
      bitacoraId,
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Bitácora actualizada exitosamente',
      data: bitacoraActualizada
    });

  } catch (error) {
    console.error('Error actualizando bitácora de supervisión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 5. GET - Obtener Bitácoras de una Unidad Residencial (Admin)
exports.getUnidadResidencialBitacorasSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { unidadResidencialId } = req.params;

    if (!userEmail || !unidadResidencialId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Verificar que la unidad residencial pertenece a la empresa
    const unidad = await UnidadResidencial.findOne({
      _id: unidadResidencialId,
      companyId: { $in: companyIds }
    });

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
    }

    // Buscar bitácoras de la unidad residencial
    const bitacoras = await BitacoraSupervision.find({
      unidadResidencialId,
      companyId: { $in: companyIds }
    })
    .sort({ fecha: -1 })
    .lean();

    res.status(200).json({
      success: true,
      data: bitacoras,
      total: bitacoras.length,
      unidad: unidad
    });

  } catch (error) {
    console.error('Error obteniendo bitácoras de unidad residencial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 6. GET - Obtener Bitácoras de un Supervisor Específico (Admin)
exports.getBitacorasSupervisionBySupervisor = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const supervisorEmail = req.headers['x-editor-email']?.toLowerCase().trim();

    if (!userEmail || !supervisorEmail) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Validar que el supervisor existe y pertenece a la misma empresa
    const supervisorData = await validateUserCompanyAccess(supervisorEmail, 'editor');
    const supervisorCompanyIds = supervisorData.companyIds;

    // Verificar que ambos usuarios pertenecen a la misma empresa
    const commonCompanyIds = companyIds.filter(id => supervisorCompanyIds.includes(id));
    if (commonCompanyIds.length === 0) {
      return res.status(403).json({ error: 'El supervisor no pertenece a la misma empresa' });
    }

    // Buscar bitácoras del supervisor específico
    const bitacoras = await BitacoraSupervision.find({
      supervisorEmail,
      companyId: { $in: commonCompanyIds }
    })
    .sort({ fecha: -1 })
    .lean();

    res.status(200).json({
      success: true,
      data: bitacoras,
      total: bitacoras.length,
      supervisor: supervisorEmail
    });

  } catch (error) {
    console.error('Error obteniendo bitácoras del supervisor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 7. GET - Obtener Bitácora Específica por ID (Frontend/Admin)
exports.getBitacoraSupervisionById = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { bitacoraId } = req.params;

    if (!userEmail || !bitacoraId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar acceso del usuario (puede ser admin o supervisor)
    const { companyIds } = await validateUserCompanyAccess(userEmail);

    // Buscar la bitácora
    const bitacora = await BitacoraSupervision.findOne({
      _id: bitacoraId,
      companyId: { $in: companyIds }
    })
    .lean();

    // Obtener datos de la unidad residencial por separado
    let unidadResidencial = null;
    if (bitacora && bitacora.unidadResidencialId) {
      unidadResidencial = await UnidadResidencial.findOne({
        _id: bitacora.unidadResidencialId,
        companyId: { $in: companyIds }
      }).lean();
    }

    if (!bitacora) {
      return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
    }

    // Si es supervisor, verificar que la bitácora le pertenece
    const userRelations = await CompanyGoogleSigninUser.find({ 
      googlesigninuserId: (await GoogleSigninUser.findOne({ Email: userEmail }))._id.toString()
    });
    
    const isSupervisor = userRelations.some(rel => rel.role === 'editor');
    if (isSupervisor && bitacora.supervisorEmail !== userEmail) {
      return res.status(403).json({ error: 'No tienes acceso a esta bitácora' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...bitacora,
        unidadResidencial: unidadResidencial
      }
    });

  } catch (error) {
    console.error('Error obteniendo bitácora por ID:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ===== NUEVOS CONTROLADORES PARA FORMULARIO_V3.HTML =====

// 7. Crear Daño desde Bitácora
exports.postCrearDamage = async (req, res) => {
  try {
    const { bitacoraId, area, item, rating, latitude, longitude, accuracy, description, comment, image, severity } = req.body;
    const supervisorEmail = req.headers['x-user-email'];

    if (!supervisorEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    // Validar campos obligatorios (bitacoraId es opcional para formulario_v4)
    if (!area || !item || !rating || !latitude || !longitude || !description || !image) {
      return res.status(400).json({ error: 'Faltan datos requeridos: area, item, rating, latitude, longitude, description, image' });
    }

    if (rating !== 'R') {
      return res.status(400).json({ error: 'Solo se pueden crear daños con calificación R' });
    }

    // Validar acceso del usuario (puede ser supervisor o cliente)
    const { companyIds, user } = await validateUserCompanyAccess(supervisorEmail);

    let bitacora = null;
    let unidad = null;
    let company = null;

    if (bitacoraId) {
      // Formulario_v2: Buscar la bitácora
      bitacora = await BitacoraSupervision.findOne({ 
        _id: bitacoraId, 
        companyId: { $in: companyIds },
        supervisorEmail: supervisorEmail 
      });

      if (!bitacora) {
        return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
      }

      // Buscar la unidad residencial
      unidad = await UnidadResidencial.findOne({ 
        _id: bitacora.unidadResidencialId, 
        companyId: { $in: companyIds } 
      });

      if (!unidad) {
        return res.status(404).json({ error: 'Unidad residencial no encontrada' });
      }

      // Buscar la empresa
      company = await Company.findOne({ _id: bitacora.companyId });
      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }
    } else {
      // Formulario_v4: Usar la primera empresa del usuario
      company = await Company.findOne({ _id: companyIds[0] });
      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }
    }

    // Crear el daño
    const damageId = uuidv4();
    const nuevoDamage = new Damage({
      _id: damageId,
      companyId: company._id,
      bitacoraId: bitacoraId || null, // Opcional para formulario_v4
      unidadResidencialId: unidad ? unidad._id : null, // Opcional para formulario_v4
      supervisorEmail: supervisorEmail,
      area: area,
      item: item,
      rating: rating,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy || 0,
        timestamp: new Date()
      },
      description: description,
      comment: comment || '',
      image: image,
      severity: severity || 'medium',
      status: 'reported',
      unidadNombre: unidad ? unidad.nombre : 'Solicitud directa', // Fallback para formulario_v4
      companyName: company.name
    });

    await nuevoDamage.save();

    res.status(201).json({
      success: true,
      message: 'Daño creado exitosamente',
      data: nuevoDamage
    });

  } catch (error) {
    console.error('Error creando daño:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 8.0. Endpoint de prueba de conectividad
exports.testConnection = async (req, res) => {
  try {
    console.log('🔍 TEST: Endpoint de prueba llamado');
    res.json({
      success: true,
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      userEmail: req.headers['x-user-email'] || 'No proporcionado'
    });
  } catch (error) {
    console.error('Error en testConnection:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 8.1. Endpoint temporal para debug - Ver todos los damages
exports.getAllDamagesDebug = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Obteniendo todos los damages...');
    const damages = await Damage.find({
      status: 'reported',
      isActive: true
    });

    console.log(`🔍 DEBUG: Encontrados ${damages.length} damages en BD`);

    const damagesWithCoords = damages.map(damage => {
      console.log(`🔍 DEBUG: Damage ${damage._id}:`, {
        item: damage.item,
        lat: damage.location.latitude,
        lng: damage.location.longitude,
        company: damage.companyName
      });
      
      return {
        _id: damage._id,
        item: damage.item,
        area: damage.area,
        latitude: damage.location.latitude,
        longitude: damage.location.longitude,
        companyName: damage.companyName,
        createdAt: damage.createdAt
      };
    });

    res.json({
      success: true,
      data: damagesWithCoords,
      total: damagesWithCoords.length
    });

  } catch (error) {
    console.error('Error obteniendo todos los damages:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 8. Obtener Daños Cercanos (Cualquier técnico puede ver cualquier damage basado en ubicación)
exports.getDamagesNearby = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Iniciando getDamagesNearby...');
    const technicianEmail = req.headers['x-user-email'];
    const { latitude, longitude, radius = 1000 } = req.query;

    console.log('🔍 DEBUG: Parámetros recibidos:', {
      technicianEmail,
      latitude,
      longitude,
      radius
    });

    if (!technicianEmail) {
      console.log('❌ DEBUG: Falta x-user-email header');
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    if (!latitude || !longitude) {
      console.log('❌ DEBUG: Faltan coordenadas');
      return res.status(400).json({ error: 'Latitude y longitude requeridos' });
    }

    // Validar que el técnico existe (pero no restringir por empresa)
    console.log('🔍 DEBUG: Validando acceso del técnico...');
    const { user } = await validateUserCompanyAccess(technicianEmail);
    console.log('✅ DEBUG: Técnico validado:', user.Email);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);
    
    console.log('🔍 DEBUG: Coordenadas procesadas:', { lat, lng, rad });

    // Búsqueda por proximidad - CUALQUIER DAMAGE (sin filtro de empresa)
    const damages = await Damage.find({
      status: 'reported',
      isActive: true
    });

    console.log(`🔍 Total damages encontrados en BD: ${damages.length}`);
    console.log(`📍 Búsqueda desde: lat=${lat}, lng=${lng}, radio=${rad}m`);

    // Filtrar por distancia (fórmula de Haversine simplificada)
    const nearbyDamages = damages.filter(damage => {
      // Manejar coordenadas que pueden estar como objetos $numberDouble
      const damageLat = typeof damage.location.latitude === 'object' 
        ? damage.location.latitude.$numberDouble || damage.location.latitude
        : damage.location.latitude;
      const damageLng = typeof damage.location.longitude === 'object' 
        ? damage.location.longitude.$numberDouble || damage.location.longitude
        : damage.location.longitude;
      
      const distance = calculateDistance(lat, lng, parseFloat(damageLat), parseFloat(damageLng));
      console.log(`📏 Damage ${damage._id}: lat=${damageLat}, lng=${damageLng}, distancia=${distance.toFixed(2)}m, límite=${rad}m`);
      return distance <= rad;
    });

    console.log(`🔍 Técnico ${technicianEmail} encontró ${nearbyDamages.length} damages cercanos de ${damages.length} total`);

    res.json({
      success: true,
      data: nearbyDamages,
      total: nearbyDamages.length
    });

  } catch (error) {
    console.error('Error obteniendo daños cercanos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 9. Crear Propuesta de Solución
exports.postCrearProposal = async (req, res) => {
  try {
    const { damageId, price, duration, description, experience, materials, estimatedStartDate, estimatedEndDate } = req.body;
    const technicianEmail = req.headers['x-user-email'];

    if (!technicianEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    if (!damageId || !price || !duration || !description) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar acceso del técnico
    const { companyIds, user } = await validateUserCompanyAccess(technicianEmail);

    // Buscar el daño
    const damage = await Damage.findOne({ 
      _id: damageId, 
      companyId: { $in: companyIds },
      status: 'reported'
    });

    if (!damage) {
      return res.status(404).json({ error: 'Daño no encontrado o no disponible' });
    }

    // Verificar que no haya una propuesta pendiente del mismo técnico
    const existingProposal = await Proposal.findOne({
      damageId: damageId,
      technicianEmail: technicianEmail,
      status: 'pending'
    });

    if (existingProposal) {
      return res.status(400).json({ error: 'Ya tienes una propuesta pendiente para este daño' });
    }

    // Crear la propuesta
    const proposalId = uuidv4();
    const nuevaProposal = new Proposal({
      _id: proposalId,
      companyId: damage.companyId,
      damageId: damageId,
      bitacoraId: damage.bitacoraId,
      technicianEmail: technicianEmail,
      technicianName: user.FullName || user.GivenName || 'Técnico',
      price: parseFloat(price),
      duration: parseInt(duration),
      description: description,
      experience: experience || '',
      status: 'pending',
      materials: materials || [],
      estimatedStartDate: estimatedStartDate ? new Date(estimatedStartDate) : null,
      estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : null
    });

    await nuevaProposal.save();

    res.status(201).json({
      success: true,
      message: 'Propuesta creada exitosamente',
      data: nuevaProposal
    });

  } catch (error) {
    console.error('Error creando propuesta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 10. Obtener Propuestas por Técnico
exports.getProposalsByTechnician = async (req, res) => {
  try {
    const technicianEmail = req.headers['x-user-email'];

    if (!technicianEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    // Validar acceso del técnico
    const { companyIds } = await validateUserCompanyAccess(technicianEmail);

    const proposals = await Proposal.find({
      technicianEmail: technicianEmail,
      companyId: { $in: companyIds },
      isActive: true
    }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: proposals,
      total: proposals.length
    });

  } catch (error) {
    console.error('Error obteniendo propuestas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 11. Obtener Daños por Ubicación
exports.getDamagesByLocation = async (req, res) => {
  try {
    const technicianEmail = req.headers['x-user-email'];
    const { latitude, longitude, radius = 1000, severity } = req.query;

    if (!technicianEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude y longitude requeridos' });
    }

    // Validar acceso del técnico
    const { companyIds } = await validateUserCompanyAccess(technicianEmail);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Construir filtro
    const filter = {
      companyId: { $in: companyIds },
      status: 'reported',
      isActive: true
    };

    if (severity) {
      filter.severity = severity;
    }

    const damages = await Damage.find(filter);

    // Filtrar por distancia
    const nearbyDamages = damages.filter(damage => {
      // Manejar coordenadas que pueden estar como objetos $numberDouble
      const damageLat = typeof damage.location.latitude === 'object' 
        ? damage.location.latitude.$numberDouble || damage.location.latitude
        : damage.location.latitude;
      const damageLng = typeof damage.location.longitude === 'object' 
        ? damage.location.longitude.$numberDouble || damage.location.longitude
        : damage.location.longitude;
      
      const distance = calculateDistance(lat, lng, parseFloat(damageLat), parseFloat(damageLng));
      return distance <= rad;
    });

    res.json({
      success: true,
      data: nearbyDamages,
      total: nearbyDamages.length
    });

  } catch (error) {
    console.error('Error obteniendo daños por ubicación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 12. Actualizar Ubicación de Daño
exports.putUpdateDamageLocation = async (req, res) => {
  try {
    const { damageId } = req.params;
    const { latitude, longitude, accuracy } = req.body;
    const supervisorEmail = req.headers['x-user-email'];

    if (!supervisorEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude y longitude requeridos' });
    }

    // Validar acceso del supervisor
    const { companyIds } = await validateUserCompanyAccess(supervisorEmail, 'editor');

    const damage = await Damage.findOne({
      _id: damageId,
      companyId: { $in: companyIds },
      supervisorEmail: supervisorEmail
    });

    if (!damage) {
      return res.status(404).json({ error: 'Daño no encontrado o no accesible' });
    }

    // Actualizar ubicación
    damage.location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || 0,
      timestamp: new Date()
    };
    damage.updatedAt = new Date();

    await damage.save();

    res.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: damage
    });

  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 13. Obtener Propuestas por Daño
exports.getProposalsByDamage = async (req, res) => {
  try {
    const { damageId } = req.params;
    const technicianEmail = req.headers['x-user-email'];

    if (!technicianEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    // Validar acceso del técnico
    const { companyIds } = await validateUserCompanyAccess(technicianEmail);

    const damage = await Damage.findOne({
      _id: damageId,
      companyId: { $in: companyIds }
    });

    if (!damage) {
      return res.status(404).json({ error: 'Daño no encontrado' });
    }

    const proposals = await Proposal.find({
      damageId: damageId,
      companyId: { $in: companyIds },
      isActive: true
    }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: proposals,
      total: proposals.length
    });

  } catch (error) {
    console.error('Error obteniendo propuestas por daño:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 14. Obtener Daño con Propuestas (Admin)
exports.getDamageWithProposals = async (req, res) => {
  try {
    const { damageId } = req.params;
    const adminEmail = req.headers['x-user-email'];

    if (!adminEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    // Validar acceso del admin
    const { companyIds } = await validateUserCompanyAccess(adminEmail, 'admin');

    const damage = await Damage.findOne({
      _id: damageId,
      companyId: { $in: companyIds }
    });

    if (!damage) {
      return res.status(404).json({ error: 'Daño no encontrado' });
    }

    const proposals = await Proposal.find({
      damageId: damageId,
      companyId: { $in: companyIds },
      isActive: true
    }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        damage: damage,
        proposals: proposals,
        totalProposals: proposals.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo daño con propuestas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// 15. Actualizar Estado de Propuesta (Admin)
exports.putUpdateProposalStatus = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status, adminComment, adminRating } = req.body;
    const adminEmail = req.headers['x-user-email'];

    if (!adminEmail) {
      return res.status(400).json({ error: 'x-user-email header requerido' });
    }

    if (!status || !['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Estado válido requerido' });
    }

    // Validar acceso del admin
    const { companyIds } = await validateUserCompanyAccess(adminEmail, 'admin');

    const proposal = await Proposal.findOne({
      _id: proposalId,
      companyId: { $in: companyIds }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    // Actualizar estado
    proposal.status = status;
    proposal.reviewedAt = new Date();
    proposal.updatedAt = new Date();

    if (adminComment) {
      proposal.adminComment = adminComment;
    }

    if (adminRating) {
      proposal.adminRating = parseInt(adminRating);
    }

    await proposal.save();

    // Si se acepta la propuesta, actualizar el estado del daño
    if (status === 'accepted') {
      await Damage.updateOne(
        { _id: proposal.damageId },
        { 
          status: 'in_progress',
          updatedAt: new Date()
        }
      );
    }

    res.json({
      success: true,
      message: 'Estado de propuesta actualizado exitosamente',
      data: proposal
    });

  } catch (error) {
    console.error('Error actualizando estado de propuesta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
}

// ====== ENDPOINTS ADICIONALES DE PROPUESTAS (Integrados desde proposal.controller.js) ======
// ====== y para formulario_v4.html  ======
// Obtener propuestas por Cliente (damages creados por el cliente)
exports.getProposalsByClient = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Email de usuario requerido en header x-user-email'
      });
    }

    // Buscar damages creados por este cliente (se usa email dentro de la descripción)
    const clientDamages = await Damage.find({
      description: { $regex: userEmail, $options: 'i' }
    });

    if (clientDamages.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const damageIds = clientDamages.map(d => d._id);
    const proposals = await Proposal.find({ damageId: { $in: damageIds } })
      .populate('damageId')
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: proposals, count: proposals.length });
  } catch (error) {
    console.error('❌ Error obteniendo propuestas por cliente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
}

// Aceptar propuesta (Cliente)
exports.acceptProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Email de usuario requerido en header x-user-email'
      });
    }

    const proposal = await Proposal.findById(proposalId).populate('damageId');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });
    }

    // Verificar que el usuario es el cliente que creó el damage (email en la descripción)
    const damage = proposal.damageId;
    if (!damage || !damage.description || !damage.description.includes(userEmail)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para aceptar esta propuesta' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Esta propuesta ya ha sido procesada' });
    }

    await proposal.accept();

    // Rechazar automáticamente las otras propuestas pendientes del mismo daño
    await Proposal.updateMany(
      { damageId: proposal.damageId, _id: { $ne: proposalId }, status: 'pending' },
      { status: 'rejected' }
    );

    res.json({ success: true, message: 'Propuesta aceptada exitosamente', data: proposal });
  } catch (error) {
    console.error('❌ Error aceptando propuesta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
}

// Rechazar propuesta (Cliente)
exports.rejectProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Email de usuario requerido en header x-user-email'
      });
    }

    const proposal = await Proposal.findById(proposalId).populate('damageId');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });
    }

    const damage = proposal.damageId;
    if (!damage || !damage.description || !damage.description.includes(userEmail)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para rechazar esta propuesta' });
    }

    await proposal.reject();

    res.json({ success: true, message: 'Propuesta rechazada exitosamente', data: proposal });
  } catch (error) {
    console.error('❌ Error rechazando propuesta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
}

// Estadísticas de propuestas
exports.getProposalStats = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Email de usuario requerido en header x-user-email' });
    }

    const technicianStats = await Proposal.aggregate([
      { $match: { 'technician.email': userEmail } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const clientDamages = await Damage.find({ description: { $regex: userEmail, $options: 'i' } });
    const damageIds = clientDamages.map(d => d._id);

    const clientStats = await Proposal.aggregate([
      { $match: { damageId: { $in: damageIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: { technician: technicianStats, client: clientStats, totalDamages: clientDamages.length } });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de propuestas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
}

// Función auxiliar para calcular distancia entre dos puntos
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Convertir a metros
  return distance;
}

// Todas las funciones están exportadas con exports.functionName
// No necesitamos module.exports adicional
