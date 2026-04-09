const mongoose = require('mongoose');

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI no está definida. Configúrala en variables.env o en PM2 env.');
}

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado exitosamente'))
  .catch((error) => console.error('Error conectando a MongoDB:', error));

module.exports = { mongoose };
