const { mongoose } = require('../../mongoose'); 
const { Schema } = mongoose;

// Modelo en la segunda BD (saas_platform)
const saasConnection = mongoose.connection.useDb('saas_platform');

const bitacoraSupervisionSchema = new Schema({
  _id: String, // UUID como string
  companyId: {
    type: String,
    required: true,
    ref: 'Company'
  },
  unidadResidencialId: {
    type: String,
    required: true,
    ref: 'UnidadResidencial'
  },
  supervisorEmail: {
    type: String,
    required: true
  },
  // Datos de la supervisión
  cliente: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  supervisor: {
    type: String,
    required: true
  },
  observaciones: {
    type: String,
    default: ''
  },
  comentarioGlobal: {
    type: String,
    default: ''
  },
  // Estado de la bitácora
  estado: {
    type: String,
    enum: ['programada', 'en_progreso', 'completada', 'cancelada'],
    default: 'programada'
  },
  // Datos de las áreas supervisadas
  areas: {
    type: Map,
    of: {
      type: Map,
      of: String // E, B, R para cada elemento
    },
    default: {}
  },
  // Comentarios por área y elemento
  comentarios: {
    type: Map,
    of: {
      type: Map,
      of: String
    },
    default: {}
  },
  // Evidencias fotográficas por área y elemento
  evidencias: {
    type: Map,
    of: {
      type: Map,
      of: Schema.Types.Mixed // Puede ser String (base64/URL) u objeto con {url, geolocation, timestamp}
    },
    default: {}
  },
  // Áreas deshabilitadas
  deshabilitadas: {
    type: Map,
    of: Boolean,
    default: {}
  },
  // Resumen de la supervisión
  resumen: {
    totalAreas: { type: Number, default: 0 },
    areasCompletadas: { type: Number, default: 0 },
    totalElementos: { type: Number, default: 0 },
    elementosCompletados: { type: Number, default: 0 }
  },
  // Metadatos
  metadata: {
    timestamp: { type: Date, default: Date.now },
    numero: String,
    demo: { type: Boolean, default: false }
  },
  // Fechas de control
  fechaProgramada: {
    type: Date,
    required: true
  },
  fechaInicio: {
    type: Date
  },
  fechaFin: {
    type: Date
  },
  isActive: { 
    type: Boolean, 
    default: true 
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

// Índices para optimizar consultas
bitacoraSupervisionSchema.index({ companyId: 1 });
bitacoraSupervisionSchema.index({ unidadResidencialId: 1 });
bitacoraSupervisionSchema.index({ supervisorEmail: 1 });
bitacoraSupervisionSchema.index({ estado: 1 });
bitacoraSupervisionSchema.index({ fechaProgramada: 1 });
bitacoraSupervisionSchema.index({ fecha: -1 }); // Para ordenar por fecha descendente
// Índice compuesto para consultas comunes de supervisor
bitacoraSupervisionSchema.index({ companyId: 1, supervisorEmail: 1, fecha: -1 });
// Índice compuesto para consultas de admin
bitacoraSupervisionSchema.index({ companyId: 1, estado: 1, fecha: -1 });

module.exports = saasConnection.model('BitacoraSupervision', bitacoraSupervisionSchema);
