const mongoose = require('mongoose');

const ContractRenewalSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract', // Reference to the original contract
    required: true
  },
  newStartDate: {
    type: Date,
    required: true
  },
  newEndDate: {
    type: Date,
    required: true
  },
  renewalStatus: { type: String }, 
  renewalDocuments: [{
    type: String // Store the URLs or paths of renewal documents
  }]
}, { timestamps: true });

module.exports = mongoose.model('ContractRenewal', ContractRenewalSchema);
