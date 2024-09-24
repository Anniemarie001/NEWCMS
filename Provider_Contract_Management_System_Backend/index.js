const express = require('express');
const dotenv = require('dotenv');
const { initializeMongoDB } = require('./config/dbConfig');
const cors = require('cors')
const path = require('path');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.use(cors())
app.use(express.json()); // This must be called before route handlers
const port = process.env.PORT || 5000;

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


//app.use('/api/example', exampleRoute);
//app.use('/api/auth', authRoutes); // Use the new auth routes

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
//   dbConfig.initializeOracle();
// });

// process.on('SIGINT', () => {
//   dbConfig.closeOracleConnection()
//     .then(() => {
//       console.log('Process terminated');
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error('Error during shutdown', err);
//       process.exit(1);
//     });
// });
