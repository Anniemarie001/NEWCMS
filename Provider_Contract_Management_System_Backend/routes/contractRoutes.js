// routes/contractRoutes.js
const express = require('express');
const router = express.Router();
const Contract = require('../models/contract');
const upload = require('../middleware/uploads');
const auth = require('../middleware/auth');

const fs = require('fs'); 
// Create a new contract
router.post('/create', [auth, upload.single('contract')], async (req, res) => {
    const { providerName, contractId, clinicCode, startDate, endDate, contractNumber, physicalLocation } = req.body;
    //const uploadedContract = req.file ? req.file.buffer : null;
    const uploadedContractPath = req.file ? req.file.path : null;
  
    try {
      const contract = new Contract({
        providerName,
        contractId,
        clinicCode,
        startDate,
        endDate,
        contractNumber,
        physicalLocation,
        //uploadedContract
        uploadedContract: uploadedContractPath

      });
      await contract.save();
      res.status(201).json({ message: 'Contract created successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error creating contract', error: err.message });
    }
  });
  
  // Get all contracts
  router.get('/', auth, async (req, res) => {
    try {
      const contracts = await Contract.find();
      res.json(contracts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  // View contract by filename
// Add a route to serve contract files
router.get('/file/:contractId', auth, async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract || !contract.uploadedContract) {
      return res.status(404).json({ message: 'Contract file not found' });
    }
    
    console.log('Contract file path:', contract.uploadedContract);
    
    // Check if the file exists
    if (!fs.existsSync(contract.uploadedContract)) {
      return res.status(404).json({ message: 'Contract file not found on server' });
    }

    // Set the appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contract-${contract.contractId}.pdf"`);

    // Create a read stream and pipe it to the response
    const fileStream = fs.createReadStream(contract.uploadedContract);
    fileStream.pipe(res);

  } catch (err) {
    console.error('Error retrieving contract file:', err);
    res.status(500).json({ message: 'Error retrieving contract file', error: err.message });
  }
});

  
  module.exports = router;