// models/providerType.js
const mongoose = require('mongoose');

const ProviderTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('ProviderType', ProviderTypeSchema);
