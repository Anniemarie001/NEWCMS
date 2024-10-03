const express = require('express');
const dotenv = require('dotenv');
const { initializeMongoDB } = require('./config/dbConfig');
const cors = require('cors')
const path = require('path');
const bodyParser = require('body-parser');
const scheduleNotifications = require('./scripts/scheduledTasks');
dotenv.config();

const app = express();
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

//app.use(cors())
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // Update this to match your front-end origin
  credentials: true,
}));
app.use(express.json()); // This must be called before route handlers
const port = process.env.PORT || 5000;

// Initialize scheduled tasks
scheduleNotifications();

// Initialize MongoDB
initializeMongoDB();

//Routes
const userRoutes = require('./routes/userRoutes');
const contractRoutes = require('./routes/contractRoutes');

// Serve static files from the 'uploads/contracts' directory
app.use('/contracts', express.static(path.join(__dirname, 'uploads/contracts')));

app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);




// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

