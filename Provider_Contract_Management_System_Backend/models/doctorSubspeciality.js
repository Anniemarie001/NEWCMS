// models/providerType.js
const mongoose = require('mongoose');

const doctorSubspecialitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('doctorSubspeciality', doctorSubspecialitySchema);
