const { mongoose } = require('../../mongoose'); 
const { Schema } = mongoose;
const { v4: uuidv4 } = require('../utils/uuid-wrapper');

// Modelo en la segunda BD (saas_platform)
const saasConnection = mongoose.connection.useDb('saas_platform');

const propuestaServicioSchema = new Schema({
  _id: {
    type: String,
    default: () => uuidv4()
  },
  // Referencia a la bitácora
  bitacoraId: {
    type: String,
    required: true,
    ref: 'BitacoraSupervision'
  },
  // Área y elemento específico de la bitácora
  area: {
    type: String,
    required: true
  },
  item: {
    type: String,
    required: true
  },
  // Datos del proveedor
  proveedorEmail: {
    type: String,
    required: true
  },
  proveedorNombre: {
    type: String,
    required: true
  },
  // Propuesta
  propuestaTexto: {
    type: String,
    required: true
  },
  whatsapp: {
    type: String,
    required: true
  },
  // Estado de la propuesta
  estado: {
    type: String,
    enum: ['pendiente', 'aceptada', 'rechazada', 'completada'],
    default: 'pendiente'
  },
  // Datos de la unidad residencial (para referencia rápida)
  unidadResidencialId: {
    type: String,
    required: true
  },
  unidadResidencialNombre: {
    type: String
  },
  companyId: {
    type: String,
    required: true
  },
  // Coordenadas del problema (para referencia)
  geolocation: {
    latitude: Number,
    longitude: Number
  },
  // URL de la imagen del problema
  imagenUrl: {
    type: String
  },
  // Respuesta del admin (opcional)
  respuestaAdmin: {
    type: String
  },
  fechaRespuesta: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  versionKey: '__v'
});

// Índices
propuestaServicioSchema.index({ bitacoraId: 1, area: 1, item: 1 });
propuestaServicioSchema.index({ proveedorEmail: 1 });
propuestaServicioSchema.index({ companyId: 1 });
propuestaServicioSchema.index({ estado: 1 });
propuestaServicioSchema.index({ createdAt: -1 });

module.exports = saasConnection.model('PropuestaServicio', propuestaServicioSchema);
