const express = require('express');
const cors = require('cors');
const machineRoutes = require('./routes/machineRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/machines', machineRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/predict', aiRoutes); // Expose the new AI endpoint

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

module.exports = app;
