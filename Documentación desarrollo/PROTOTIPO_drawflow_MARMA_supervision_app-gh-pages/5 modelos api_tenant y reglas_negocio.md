
modelos:  

----------------------------------------------
GoogleSigninUser.js
----------------------------------------------
const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

//const Schema = mongoose.Schema;

const googleSigninUserSchema = new Schema({
  _id: { type: Types.ObjectId, auto: true },
  //poner acá el payload degoogle Sinin console
  FullName: String,
  GivenName: String,
  FamilyName: String,
  FechaIngreso: String,
  ImageURL: String,
  Email: String,
  userPay: { type: Boolean, default: false },
  //recipesOk: { type: Object, default: {} },
  recipesOk: { type: [String], default: [] }, // Cambia el tipo a array de strings
  //recipesOkCalificadas: { type: Object, default: {} },
  recipesOkCalificadas: {
    type: Map,
     of: {
      recipe: String, // Tipo del recipeId
      url: String // Tipo de la URL calificada
    }  
  },
  learningPaths: {
    type: Array,
    default: []
  },
  testAutomationPlans: {
    type: Array,
    default: []
  }

});
googleSigninUserSchema.index({ Email: 1 });
module.exports = mongoose.model("GoogleSigninUser", googleSigninUserSchema);

----------------------------------------------
company.model.js
----------------------------------------------
const { mongoose } = require('../../mongoose'); 

// Modelo en la segunda BD (saas_platform)
const saasConnection = mongoose.connection.useDb('saas_platform');

const companySchema = new mongoose.Schema({
  _id: String,
  name: String,
  subdomain: String,
  description: String,
  adminUserId: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = saasConnection.model('Company', companySchema);

----------------------------------------------
CompanyGoogleSigninUser.model.js
----------------------------------------------
// relaciona un usuario con una company

const { mongoose } = require('../../mongoose'); // ? trae la instancia conectada
const { Schema } = mongoose;

// Modelo en la segunda BD (saas_platform)
const saasConnection = mongoose.connection.useDb('saas_platform');

const CompanyGoogleSigninUserSchema = new Schema({
  companyId: {
    type: String, // UUID como string
    required: true,
  },
  // match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'UUID inválido']

  googlesigninuserId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: '__v'
});

// Método estático optimizado
CompanyGoogleSigninUserSchema.statics.findByUser = async function(userId) {
  const relations = await this.find({ googlesigninuserId: userId.toString() });
  
  if (!relations.length) return [];
  
  // Obtener companies manualmente
  const companyIds = relations.map(r => r.companyId);
  const companies = await mongoose.model('Company').find({ 
    _id: { $in: companyIds } 
  });
  
  return companies;
};

// Índices (opcional, pero recomendado)
CompanyGoogleSigninUserSchema.index({ googlesigninuserId: 1 });
CompanyGoogleSigninUserSchema.index({ companyId: 1 });


Crear modelos: 

- UnidadResidencial
- BitacoraSupervisión

con este molde para mongoose y node JS.

