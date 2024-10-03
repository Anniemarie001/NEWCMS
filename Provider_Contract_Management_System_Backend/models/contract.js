
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // For generating unique contract IDs

const contractSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  contractId: { type: String, unique: true }, // System-generated contract ID
  clinicCode: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  contractNumber: { type: String, required: true },
  physicalLocation: { type: String, required: true },
  uploadedContracts: { type: [String] },  // Array of binary data for multiple attachments at initial upload
  contractStatus: { type: String },
  providerType: {type: String,required: true},
  doctorSubspeciality: {type: String,required: true},
  editHistory: [{
    editedBy: { type: String, required: true },
    editedAt: { type: Date, default: Date.now },
    changes: { type: Object, required: true }
  }]
  }, { timestamps: true });

// Pre-save hook to auto-generate contractId
contractSchema.pre('save', function(next) {
  if (!this.contractId) { 
    this.contractId = uuidv4(); // Generate a UUID for the contract ID
  }
  next();
});

const Contract = mongoose.model('Contract', contractSchema);
module.exports = Contract;
