const mongoose = require('mongoose');

const telemetrySnapshotSchema = new mongoose.Schema({
  machineId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  coreTemp: { type: Number, required: true },
  vibration: { type: Number, required: true },
  sysLoad: { type: Number, required: true },
  powerDraw: { type: Number, required: true },
  failureProbability: { type: Number, required: true },
  riskLevel: { type: String, required: true }
});

module.exports = mongoose.model('TelemetrySnapshot', telemetrySnapshotSchema);
