// middleware/upload.js
// const multer = require('multer');

// const storage = multer.memoryStorage();  // Store files in memory as a Buffer
// const upload = multer({ storage });

// module.exports = upload;


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
    cb(null, uploadDirectory);  // Destination directory for uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);  // Unique filename
  }
});

const upload = multer({ storage });

module.exports = upload;

