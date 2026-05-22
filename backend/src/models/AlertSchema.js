const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true },
  machineId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, required: true }, // e.g. WARNING, CRITICAL
  message: { type: String, required: true }
});

module.exports = mongoose.model('Alert', alertSchema);
