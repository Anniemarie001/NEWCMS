// middleware/upload.js
// const multer = require('multer');

// const storage = multer.memoryStorage();  // Store files in memory as a Buffer
// const upload = multer({ storage });

// module.exports = upload;


// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Define the directory where uploaded files will be stored
// const uploadDirectory = path.join(__dirname, '../uploads/contracts');

// // Ensure the upload directory exists
// if (!fs.existsSync(uploadDirectory)) {
//   fs.mkdirSync(uploadDirectory, { recursive: true });
// }

// // Configure disk storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDirectory);  // Destination directory for uploads
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const fileExtension = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);  // Unique filename
//   }
// });

// const upload = multer({ storage });

// module.exports = upload;

// import multer, { diskStorage } from 'multer';
// import { join, extname } from 'path';
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// // import { existsSync, mkdirSync } from 'fs';

// // Define the directory where uploaded files will be stored
// const uploadDirectory = join(__dirname, '../uploads/contracts');

// // Ensure the upload directory exists
// if (!existsSync(uploadDirectory)) {
//   mkdirSync(uploadDirectory, { recursive: true });
// }

// // Configure disk storage
// const storage = diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDirectory);  // Destination directory for uploads
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const fileExtension = extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);  // Unique filename
//   }
// });

// // Initialize multer upload to handle multiple files
// const upload = multer({ storage });

// // For handling multiple files from two fields
// const multipleUpload = upload.fields([
//   { name: 'contracts', maxCount: 10 },  // Allow up to 10 initial contract files
//   { name: 'renewalDocuments', maxCount: 10 }       // Allow up to 10 renewal documents
// ]);

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the directory where uploaded files will be stored
const uploadDirectory = path.join(__dirname, '../uploads/contracts');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Initialize multer upload to handle multiple files
const upload = multer({ storage });

// For handling multiple files from various fields
const multipleUpload = upload.fields([
  { name: 'contracts', maxCount: 5 },         // For initial contract creation
  { name: 'renewalDocuments', maxCount: 5 }   // For contract renewal
]);

module.exports = multipleUpload;