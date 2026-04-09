const { mongoose } = require('../../mongoose'); 
const { Schema } = mongoose;

// Modelo en la BD principal
const companyGoogleSigninUserSchema = new Schema({
  googlesigninuserId: {
    type: String,
    required: true,
    ref: 'GoogleSigninUser'
  },
  companyId: {
    type: String,
    required: true,
    ref: 'Company'
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'editor', 'viewer'], // Roles originales del sistema
    default: 'admin'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
companyGoogleSigninUserSchema.index({ googlesigninuserId: 1, companyId: 1 }, { unique: true });
companyGoogleSigninUserSchema.index({ companyId: 1 });
companyGoogleSigninUserSchema.index({ role: 1 });

module.exports = mongoose.model('CompanyGoogleSigninUser', companyGoogleSigninUserSchema);
