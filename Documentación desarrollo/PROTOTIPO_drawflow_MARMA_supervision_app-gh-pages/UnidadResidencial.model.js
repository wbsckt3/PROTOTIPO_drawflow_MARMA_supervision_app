const { mongoose } = require('../../mongoose'); 
const { Schema } = mongoose;

// Modelo en la segunda BD (saas_platform)
const saasConnection = mongoose.connection.useDb('saas_platform');

const unidadResidencialSchema = new Schema({
  _id: String, // UUID como string
  companyId: {
    type: String,
    required: true,
    ref: 'Company'
  },
  nombre: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['condominio', 'edificio', 'conjunto_residencial', 'urbanizacion'],
    default: 'condominio'
  },
  areas: {
    piscinas: {
      name: { type: String, default: 'PISCINAS' },
      color: { type: String, default: '#3b82f6' },
      items: [{
        type: String
      }],
      default: ['BAÑOS','ROMPE OLAS','ANDENES','LAVA PIES - DUCHA','SAUNA','JACUZZI','TURCO','COLOR VISUAL','PH','CLORO','CUARTO DE MÁQUINAS','HALL']
    },
    zonas_comunes: {
      name: { type: String, default: 'ZONAS COMUNES' },
      color: { type: String, default: '#22c55e' },
      items: [{
        type: String
      }],
      default: ['GIMNASIO','SALÓN SOCIAL','SALÓN DE JUEGOS','ANDENES','PORTERÍA','PARQUEADERO']
    },
    zonas_externas: {
      name: { type: String, default: 'ZONAS EXTERNAS' },
      color: { type: String, default: '#f59e0b' },
      items: [{
        type: String
      }],
      default: ['ZONA VERDES','CAÑUELAS','PARQUE INFANTIL','PAREDES','VIDRIOS - VENTANAS','PASAMANOS','TAPAS SHUT','GABINETES - EXTINTORES','BARRIO - TRAPEADO','ASCENSORES','TUBERÍA VOLÁTIL','ESCALAS','PISOS','SHUT BASURAS']
    },
    oficinas: {
      name: { type: String, default: 'OFICINAS' },
      color: { type: String, default: '#8b5cf6' },
      items: [{
        type: String
      }],
      default: ['ESCRITORIOS','PAPELERAS','SALA DE JUNTAS','AULAS','BAÑOS','RECEPCIÓN','COMPUTADORES','PAREDES','CIELO RASO','COCINETA','ENTRADAS PRINCIPAL']
    },
    operario: {
      name: { type: String, default: 'OPERARIO' },
      color: { type: String, default: '#ec4899' },
      items: [{
        type: String
      }],
      default: ['PRODUCTIVIDAD','PRESENTACIÓN','CARNET','ELEMENTOS EPP','CONTROL DE HORARIO','ACTITUD']
    }
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

// Índices
unidadResidencialSchema.index({ companyId: 1 });
unidadResidencialSchema.index({ nombre: 1 });

module.exports = saasConnection.model('UnidadResidencial', unidadResidencialSchema);
