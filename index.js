const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const port = 5000;
const authRoutes = require('./routes/authRoutes');  // Import routes
const equipmentRoutes = require('./routes/addEquipment') //route for adding or viewing rental equipments
const notificationRoute = require('./routes/notificationRoute');
const agricultralData = require('./routes/agriculturalData')

dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));  // Serve static files from the uploads directory
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// Set up routes
app.use('/api/auth', authRoutes);  // Use the authentication routes
app.use('/api/rentalSystem',equipmentRoutes);
app.use('/api',notificationRoute);
app.use('/api', agricultralData);
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
