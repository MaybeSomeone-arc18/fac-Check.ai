const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const app = require('./app');
const { initializeSocket } = require('./websocket/socketManager');
const csvLoader = require('./services/csvLoader');
const aiService = require('./services/aiService');

const PORT = process.env.PORT || 3001;
const CSV_PATH = path.join(__dirname, '../../predictive_maintenance_dataset.csv');
const MONGO_URI = 'mongodb+srv://admin:admin123@sans.w2sndm7.mongodb.net/?appName=sans';

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSockets
initializeSocket(server);

// Start listening after loading the dataset, training the AI, and connecting to Mongo
const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB Atlas.');

    console.log(`Loading predictive maintenance dataset from ${CSV_PATH}...`);
    await csvLoader.loadCSV(CSV_PATH);
    
    // Train the AI model
    await aiService.trainModel();
    
    server.listen(PORT, () => {
      console.log(`Backend modular server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
