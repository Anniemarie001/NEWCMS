// routes/contractRoutes.js
const express = require('express');
const router = express.Router();
const Contract = require('../models/contract');
const multipleUpload = require('../middleware/uploads');
const auth = require('../middleware/auth');
const Renewal = require('../models/renewals');
const ProviderType = require('../models/providerType');
const DoctorSubspeciality = require('../models/doctorSubspeciality');
const path = require('path');
//const fs = require('fs').promises;
const fs = require('fs'); 
const nodemailer = require('nodemailer');


// Get provider types for dropdown
router.get('/provider-types', auth, async (req, res) => {
  try {
    const types = await ProviderType.find().select('_id name');
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching provider types', error: err.message });
  }
});
// Get doctors specialties for dropdown
router.get('/doctor-subspecialty', auth, async (req, res) => {
  try {
    const specialty = await DoctorSubspeciality.find().select('_id name');
    res.json(specialty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching provider types', error: err.message });
  }
});

router.post('/create', [auth, multipleUpload], async (req, res) => {
  try {
    const { 
      providerName, 
      contractId, 
      clinicCode, 
      startDate, 
      endDate, 
      contractNumber, 
      physicalLocation,
      providerTypeId,
      doctorSubspecialityId
    } = req.body;
    
    //console.log('Received data:', req.body);
    //console.log('Received files:', req.files);

    if (!req.files || !req.files['contracts']) {
      return res.status(400).json({ message: 'No contract files uploaded' });
    }

    const contractFiles = req.files['contracts'];
    const uploadedContractPaths = contractFiles.map(file => file.path);

    // Validate provider type
    let providerType;
    try {
      providerType = await ProviderType.findById(providerTypeId);
      if (!providerType) {
        return res.status(400).json({ message: 'Invalid provider type' });
      }
    } catch (error) {
      console.error('Error finding provider type:', error);
      return res.status(400).json({ message: 'Error validating provider type', error: error.message });
    }

    // Validate doctor subspeciality
    let doctorSubspeciality;
    try {
      doctorSubspeciality = await DoctorSubspeciality.findById(doctorSubspecialityId);
      if (!doctorSubspeciality) {
        return res.status(400).json({ message: 'Invalid doctor subspeciality' });
      }
    } catch (error) {
      console.error('Error finding doctor subspeciality:', error);
      return res.status(400).json({ message: 'Error validating doctor subspeciality', error: error.message });
    }
    
    const contract = new Contract({
      providerName,
      contractId,
      clinicCode,
      startDate,
      endDate,
      contractNumber,
      physicalLocation,
      uploadedContracts: uploadedContractPaths,
      providerType: providerType.name,
      providerTypeId: providerType._id, // Also store the ID for reference
      doctorSubspeciality: doctorSubspeciality.name,
      doctorSubspecialityId: doctorSubspeciality._id,
      contractStatus: 'active' // Set status to 'active' upon creation
    });

    try {
      await contract.save();
      res.status(201).json({ message: 'Contract created successfully', contractId: contract.contractId });
    } catch (error) {
      console.error('Error saving contract:', error);
      return res.status(400).json({ message: 'Error saving contract', error: error.message });
    }
  } catch (err) {
    console.error('Error creating contract:', err);
    res.status(400).json({ message: 'Error creating contract', error: err.message });
  }
});
// Renew a contract
router.post('/renew/:contractId', [auth, multipleUpload], async (req, res) => {
  const { contractId } = req.params;
  const { newStartDate, newEndDate, renewalStatus } = req.body;

  try {
    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const renewalDocuments = req.files['renewalDocuments'];
    const renewalDocumentPaths = renewalDocuments.map(file => file.path);

    const renewal = new Renewal({
      contractId: contract._id,
      newStartDate,
      newEndDate,
      renewalStatus,
      renewalDocuments: renewalDocumentPaths
    });

    await renewal.save();

    // Update the original contract with new dates
    contract.startDate = newStartDate;
    contract.endDate = newEndDate;
    contract.contractStatus = 'active'; // Reset status to 'active' upon renewal
    await contract.save();

    res.status(200).json({ message: 'Contract renewed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Error renewing contract', error: err.message });
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
// New route to remove a file from a contract
router.delete('/remove-file/:contractId/:fileIndex', auth, async (req, res) => {
  try {
    const { contractId, fileIndex } = req.params;
    const parsedFileIndex = parseInt(fileIndex);

    //console.log(`Attempting to remove file. ContractId: ${contractId}, FileIndex: ${parsedFileIndex}`);

    // Find the original contract
    const contract = await Contract.findOne({ contractId });

    if (!contract) {
      //console.log(`Contract not found for contractId: ${contractId}`);
      return res.status(404).json({ message: 'Contract not found' });
    }

    //console.log(`Contract found: ${contract._id}`);
    //console.log(`Original contract files: ${JSON.stringify(contract.uploadedContracts)}`);

    // Find all renewals for this contract
    const renewals = await Renewal.find({ contractId: contract._id });
    //console.log(`Renewals found: ${renewals.length}`);

    let filePath;
    let fileRemoved = false;

    // Check if the file is from the original contract
    if (parsedFileIndex < contract.uploadedContracts.length) {
      filePath = contract.uploadedContracts[parsedFileIndex];
      //console.log(`Attempting to remove file from original contract: ${filePath}`);
      
      try {
        await fs.unlink(filePath);
       // console.log(`File successfully deleted from filesystem: ${filePath}`);
      } catch (unlinkError) {
        //console.log(`Error deleting file from filesystem: ${unlinkError.message}`);
        // Continue with removing the file reference even if the file doesn't exist
      }

      contract.uploadedContracts.splice(parsedFileIndex, 1);
      await contract.save();
      //console.log(`File reference removed from contract document`);
      fileRemoved = true;
    } else {
      // Search for the file in renewals
      let remainingIndex = parsedFileIndex - contract.uploadedContracts.length;
      for (const renewal of renewals) {
        //console.log(`Checking renewal: ${renewal._id}, Remaining index: ${remainingIndex}`);
        if (remainingIndex < renewal.renewalDocuments.length) {
          filePath = renewal.renewalDocuments[remainingIndex];
         // console.log(`Attempting to remove file from renewal: ${filePath}`);
          
          try {
            await fs.unlink(filePath);
            //console.log(`File successfully deleted from filesystem: ${filePath}`);
          } catch (unlinkError) {
           // console.log(`Error deleting file from filesystem: ${unlinkError.message}`);
            // Continue with removing the file reference even if the file doesn't exist
          }

          renewal.renewalDocuments.splice(remainingIndex, 1);
          await renewal.save();
          //console.log(`File reference removed from renewal document`);
          fileRemoved = true;
          break;
        }
        remainingIndex -= renewal.renewalDocuments.length;
      }
    }

    if (!fileRemoved) {
      //console.log(`File not found for removal. ContractId: ${contractId}, FileIndex: ${parsedFileIndex}`);
      return res.status(400).json({ message: 'Invalid file index' });
    }

    res.json({ message: 'File removed successfully' });
  } catch (err) {
    console.error('Error removing file:', err);
    res.status(500).json({ message: 'Error removing file', error: err.message, stack: err.stack });
  }
});
// View contract files
router.get('/files/:contractId', auth, async (req, res) => {
  try {
    //console.log('Searching for contract with ID:', req.params.contractId);
    
    // Fetch the original contract using the string contractId
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    //console.log('Found contract:', contract);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Fetch all renewals for this contract using the _id of the contract
    const renewals = await Renewal.find({ contractId: contract._id });
    //console.log('Found renewals:', renewals);

    let allFiles = [];

    // Add files from the original contract
    if (contract.uploadedContracts) {
      allFiles = contract.uploadedContracts.map((filePath, index) => ({
        index,
        name: path.basename(filePath),
        path: filePath,
        type: 'original'
      }));
    }

    // Add files from renewals
    renewals.forEach((renewal, renewalIndex) => {
      if (renewal.renewalDocuments) {
        const renewalFiles = renewal.renewalDocuments.map((filePath, fileIndex) => ({
          index: allFiles.length + fileIndex,
          name: path.basename(filePath),
          path: filePath,
          type: 'renewal',
          renewalIndex
        }));
        allFiles = allFiles.concat(renewalFiles);
      }
    });

    if (allFiles.length === 0) {
      //console.log('No files found for this contract');
      return res.status(404).json({ message: 'No contract files found' });
    }

    res.json({ files: allFiles });
  } catch (err) {
    console.error('Error retrieving contract files:', err);
    res.status(500).json({ message: 'Error retrieving contract files', error: err.message });
  }
});

router.get('/file/:contractId/:fileIndex', auth, async (req, res) => {
  try {
    const fileIndex = parseInt(req.params.fileIndex);
    
    // Fetch the original contract using the string contractId
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Fetch all renewals for this contract using the _id of the contract
    const renewals = await Renewal.find({ contractId: contract._id });

    let filePath;
    let fileName;

    // Check if the file is from the original contract
    if (contract.uploadedContracts && fileIndex < contract.uploadedContracts.length) {
      filePath = contract.uploadedContracts[fileIndex];
      fileName = `contract-${contract.contractId}-original-${fileIndex}.pdf`;
    } else {
      // Search for the file in renewals
      let remainingIndex = fileIndex - (contract.uploadedContracts ? contract.uploadedContracts.length : 0);
      for (const renewal of renewals) {
        if (renewal.renewalDocuments && remainingIndex < renewal.renewalDocuments.length) {
          filePath = renewal.renewalDocuments[remainingIndex];
          fileName = `contract-${contract.contractId}-renewal-${remainingIndex}.pdf`;
          break;
        }
        remainingIndex -= (renewal.renewalDocuments ? renewal.renewalDocuments.length : 0);
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Contract file not found' });
    }

    // Set the appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    // Create a read stream and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    console.error('Error retrieving contract file:', err);
    res.status(500).json({ message: 'Error retrieving contract file', error: err.message });
  }
});


router.get('/reports2', auth, async (req, res) => {
  try {
    const { startDate, endDate, providerName, contractStatus } = req.query;
    
    //console.log('Query parameters:', { startDate, endDate, providerName });

    // Construct a filter object
    const filter = {};

    // Add the providerName filter if provided
    if (providerName && providerName.trim() !== '') {
      filter.providerName = { $regex: providerName.trim(), $options: 'i' };
      //console.log('Added providerName filter:', filter.providerName);
    }
     // Add the providerName filter if provided
     if (contractStatus && contractStatus.trim() !== '') {
      filter.contractStatus = { $regex: contractStatus.trim(), $options: 'i' };
      //console.log('Added providerName filter:', filter.providerName);
    }

    // Add the date range filter if startDate and/or endDate are provided
    if (startDate && startDate.trim() !== '' || endDate && endDate.trim() !== '') {
      filter.startDate = {};

      if (startDate && startDate.trim() !== '') {
        filter.startDate.$gte = new Date(startDate);
        //console.log('Added startDate filter:', filter.startDate.$gte);
      }

      if (endDate && endDate.trim() !== '') {
        filter.startDate.$lte = new Date(endDate);
        //console.log('Added endDate filter:', filter.startDate.$lte);
      }
    }

    //console.log('Final filter object:', filter);

    // Find contracts with the constructed filter
    const contracts = await Contract.find(filter);
    //console.log('Number of contracts found:', contracts.length);

    res.json(contracts);
  } catch (err) {
    console.error('Error in /reports2 endpoint:', err);
    res.status(500).send('Server error');
  }
});

// New endpoint to handle contract status updates
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate the status
    if (status !== 'suspended' && status !== 'terminated') {
      return res.status(400).json({ message: 'Invalid status. Must be either "suspended" or "terminated".' });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Update the contract status
    contract.contractStatus = status;
    await contract.save();

    res.json({ message: `Contract ${status} successfully`, contract });
  } catch (err) {
    console.error('Error updating contract status:', err);
    res.status(500).json({ message: 'Error updating contract status', error: err.message });
  }
});

// New endpoint for editing contract details
router.put('/:id/edit', auth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const editedBy = req.user.id; // Assuming you have user info in the request after authentication

  try {
    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Record changes
    const changes = {};
    for (let [key, value] of Object.entries(updates)) {
      if (contract[key] !== value) {
        changes[key] = { oldValue: contract[key], newValue: value };
      }
    }

    // Update contract fields
    Object.assign(contract, updates);

    // Add to edit history if there are changes
    if (Object.keys(changes).length > 0) {
      contract.editHistory.push({
        editedBy,
        changes
      });
    }

    await contract.save();

    res.json({ message: 'Contract updated successfully', contract });
  } catch (err) {
    console.error('Error updating contract:', err);
    res.status(500).json({ message: 'Error updating contract', error: err.message });
  }
});

// Get edit history for a contract
router.get('/:id/history', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(contract.editHistory);
  } catch (err) {
    console.error('Error fetching contract history:', err);
    res.status(500).json({ message: 'Error fetching contract history', error: err.message });
  }
});
// New route for fetching notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    // Fetch contracts based on contractStatus
    const contracts = await Contract.find({
      contractStatus: { $in: ['due_for_renewal', 'expired', 'suspended', 'terminated'] }
    });

    const notifications = contracts.map(contract => {
      let title, message;
      switch (contract.contractStatus) {
        case 'due_for_renewal':
          title = 'Contract Due for Renewal';
          message = `The contract for ${contract.providerName} is due for renewal in 3 months.`;
          break;
        case 'expired':
          title = 'Contract Expired';
          message = `The contract for ${contract.providerName} has expired.`;
          break;
        case 'suspended':
          title = 'Contract Suspended';
          message = `The contract for ${contract.providerName} has been suspended.`;
          break;
        case 'terminated':
          title = 'Contract Terminated';
          message = `The contract for ${contract.providerName} has been terminated.`;
          break;
        default:
          title = 'Contract Status Update';
          message = `The contract for ${contract.providerName} has a status update: ${contract.contractStatus}.`;
      }
      return { title, message };
    });

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

  module.exports = router;