// models/Contract.js
const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  contractId: { type: String, unique: true, required: true },
  clinicCode: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  contractNumber: { type: String, required: true },
  physicalLocation: { type: String, required: true },
  uploadedContract: { type: Buffer },  // For storing the uploaded file as binary data
}, { timestamps: true });

const Contract = mongoose.model('Contract', contractSchema);
module.exports = Contract;
