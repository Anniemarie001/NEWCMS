// scripts/seedProviderTypes.js
const mongoose = require('mongoose');
const ProviderType = require('../models/providerType');

const providerTypes = [
  'Allergist/immunologist',
  'Anesthesiologist',
  'Cardiologist',
  'Cardiothoracic',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'General Surgeon',
  'Geneticist',
  'Hematologist',
  'Infectious disease Physician',
  'Internal Medicine',
  'Nephrologist',
  'Neurosurgery',
  'Neurologist',
  'Obstetrician/gynecologist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopeadic',
  'ENT surgery',
  'Pathologist',
  'Pediatrician',
  'Plastic surgeon',
  'Podiatrist',
  'Psychiatrist',
  'Pulmonologist',
  'Radiologist',
  'Rheumatologist',
  'Paediatric Surgery',
  'Urologist',
  'Oral &Maxillofacial Surgeon',
  'Neonatology'
];

async function seedProviderTypes() {
  await mongoose.connect('mongodb://localhost:27017/contractManagement', { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await ProviderType.insertMany(providerTypes.map(type => ({ name: type })));
    console.log('Provider types inserted successfully');
  } catch (err) {
    console.error('Error inserting provider types:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedProviderTypes();
