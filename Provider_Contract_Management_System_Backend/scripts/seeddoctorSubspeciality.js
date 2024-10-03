// scripts/seedProviderTypes.js
const mongoose = require('mongoose');
const doctorSubspeciality = require('../models/doctorSubspeciality');

const doctorSubspecialities = [
    "Hospital",
     "Outpatient Clinic",
      "Doctors",
       "Optical",
        "Dental",
         "Counseling",
          "Rehab Centers", 
          "Psychiatry hospital", 
          "Ambulance", 
          "Physiotherapy/Occupational",
           "Speech therapist", 
           "Audiology",
            "Imaging services",
             "Laboratory Services",
              "Homecare services",
               "Pharmacy",
                "other Institutions", 
                "Other Individuals"
];

async function seeddoctorSubspeciality() {
  await mongoose.connect('mongodb://localhost:27017/contractManagement', { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await doctorSubspeciality.insertMany(doctorSubspecialities.map(type => ({ name: type })));
    console.log('Doctor Subspeciality inserted successfully');
  } catch (err) {
    console.error('Error inserting provider types:', err);
  } finally {
    mongoose.disconnect();
  }
}

seeddoctorSubspeciality();
