const { mongoose } = require('../../mongoose'); // ? trae la instancia conectada
const { Schema } = mongoose;

const CompanyGoogleSigninUserSchema = new Schema({
  companyId: {
    type: String, // UUID como string
    required: true,
  },
  // match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'UUID inv�lido']

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

// M�todo est�tico optimizado
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

// �ndices (opcional, pero recomendado)
CompanyGoogleSigninUserSchema.index({ googlesigninuserId: 1 });
CompanyGoogleSigninUserSchema.index({ companyId: 1 });

module.exports = mongoose.model('CompanyGoogleSigninUser', CompanyGoogleSigninUserSchema);