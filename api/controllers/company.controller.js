//const User = require('../models/user.model');
const { mongoose } = require('../../mongoose');

// BD test (conexi�n default en variables.api.env MONGODB_URI)
const GoogleSigninUser = require('../models/GoogleSigninUser.js');

// BD saas_platform (en variables.api.env MONGODB_URI en el model se configura la BD)
const CompanyGoogleSigninUser = require('../models/CompanyGoogleSigninUser.model');
const Company = require('../models/company.model');

exports.getCompanies = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();

    if (!userEmail) {
      return res.status(401).json({ error: 'Email no proporcionado' });
    }

    // 1. Buscar usuario en BD test (conexi�n default)
    const user = await GoogleSigninUser.findOne({ Email: userEmail }).lean();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    } 

    console.log('User ID:', user._id, 'Type:', typeof user._id);

    const { ObjectId } = require('mongoose').Types; // o require('mongodb').ObjectId

    // 2. Buscar relaciones en saas_platform
    const relations = await CompanyGoogleSigninUser.find({ 
      googlesigninuserId: user._id.toString() 
    });

    // 3. Obtener compa��as desde saas_platform
    const companyIds = relations.map(rel => rel.companyId);
    const companies = await Company.find({ 
      _id: { $in: companyIds } 
    });

    res.json(companies);
        
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];
    const { name, subdomain, description } = req.body;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!name || !subdomain) {
      return res.status(400).json({ error: 'Nombre y subdominio son requeridos' });
    }

    const user = await GoogleSigninUser.findOne({ Email: userEmail }).lean();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingCompany = await Company.findOne({ subdomain });
    if (existingCompany) {
      return res.status(400).json({ error: 'El subdominio ya existe' });
    }

    const newCompany = new Company({
      _id: new mongoose.Types.ObjectId().toString(),
      name,
      subdomain,
      description: description || '',
      adminUserId: user._id,
      isActive: true
    });

    await newCompany.save();
    res.status(201).json(newCompany);
    
  } catch (error) {
    console.error('Error creando empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.relateUserToCompany = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];
    const { companyId, role } = req.body;

    if (!userEmail) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Se requiere companyId' });
    }

    const user = await GoogleSigninUser.findOne({ Email: userEmail }).lean();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ error: 'Compa��a no encontrada' });
    }

    const existingRelation = await CompanyGoogleSigninUser.findOne({
      companyId,
      googlesigninuserId: user._id.toString()
    });

    if (existingRelation) {
      return res.status(400).json({ error: 'Ya existe una relaci�n entre el usuario y la compa��a' });
    }

    const newRelation = new CompanyGoogleSigninUser({
      companyId,
      googlesigninuserId: user._id.toString(),
      role: role || 'viewer'
    });

    await newRelation.save();

    res.status(201).json({ message: 'Usuario relacionado con la compa��a', relation: newRelation });

  } catch (error) {
    console.error('Error al relacionar usuario con compa��a:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};