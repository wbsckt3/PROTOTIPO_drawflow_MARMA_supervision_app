const { mongoose } = require('../../mongoose'); 

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

module.exports = mongoose.model('Company', companySchema);