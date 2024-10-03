const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const contractRoutes = require('./routes/contractRoutes');

const scheduleNotifications = require('./scripts/scheduledTasks');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Initialize scheduled tasks
scheduleNotifications();
// Routes
app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
