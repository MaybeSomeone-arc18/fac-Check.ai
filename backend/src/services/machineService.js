const csvLoader = require('./csvLoader');
const aiService = require('./aiService');

// Track the current playback index for each device
const simulationState = {};
// Maps device IDs to their ongoing vibration history array
const activeHistories = {};

const MACHINE_TYPES = ['Conveyor Belt', 'Robot Arm', 'Sealing Machine', 'Filling Machine'];

const getMachineType = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MACHINE_TYPES[Math.abs(hash) % MACHINE_TYPES.length];
};

const getMachines = async () => {
  const devices = csvLoader.getUniqueDevices();
  return devices.map(d => ({
    ...d,
    type: getMachineType(d.id)
  }));
};

const getMachineHistory = async (id) => {
  const devices = csvLoader.getUniqueDevices();
  const targetId = (id === 'CNC-042' && devices.length > 0) ? devices[0].id : id;
  
  const map = csvLoader.getDeviceMap();
  const rows = map[targetId] || [];
  
  const type = getMachineType(targetId);

  // Map the primary history array (the chart metric) based on machine type
  // Conveyor: vibration (m2), Robot: jointStress (m4), Sealing: sealingTemp (m7), Filling: flowPressure (m3)
  return rows.slice(0, 20).map(row => {
    const features = csvLoader.extractFeatures(row);
    if (type === 'Conveyor Belt') return features[1] > 0 ? (features[1] / 10 + 50) : (100 + Math.random() * 50); // m2
    if (type === 'Robot Arm') return features[3] > 0 ? (features[3] / 5 + 40) : (80 + Math.random() * 30); // m4
    if (type === 'Sealing Machine') return features[6] > 0 ? (features[6] / 2 + 100) : (150 + Math.random() * 20); // m7
    if (type === 'Filling Machine') return features[2] > 0 ? (features[2] / 10 + 30) : (60 + Math.random() * 40); // m3
    return 100;
  });
};

const mapRowToTelemetry = (row, historyArray, id) => {
  if (!row) return null;

  // Extract the raw features for the AI model
  const featuresArray = csvLoader.extractFeatures(row);
  
  // Ask the AI model for a prediction synchronously
  const prediction = aiService.predict(featuresArray);

  const type = getMachineType(id);
  let chartValue = 0;
  const metrics = {};

  // Extract raw values for mapping
  // m1=f[0], m2=f[1], m3=f[2], m4=f[3], m5=f[4], m6=f[5], m7=f[6], m8=f[7], m9=f[8]
  const f = featuresArray;

  if (type === 'Conveyor Belt') {
    metrics.metricA = { label: 'Motor Load', value: f[0] > 0 ? (f[0] / 100 + 40).toFixed(1) : (40 + Math.random() * 5).toFixed(1), unit: 'kW' };
    metrics.metricB = { label: 'Vibration', value: f[1] > 0 ? (f[1] / 1000 + 0.1).toFixed(2) : (0.1 + Math.random() * 0.05).toFixed(2), unit: 'g' };
    metrics.metricC = { label: 'Pressure', value: f[2] > 0 ? (f[2] / 10 + 100).toFixed(1) : (100 + Math.random() * 10).toFixed(1), unit: 'PSI' };
    chartValue = f[1] > 0 ? (f[1] / 10 + 50) : (100 + Math.random() * 50);
  } else if (type === 'Robot Arm') {
    metrics.metricA = { label: 'Joint Stress', value: f[3] > 0 ? (f[3] / 10).toFixed(1) : (20 + Math.random() * 5).toFixed(1), unit: 'MPa' };
    metrics.metricB = { label: 'Movement Speed', value: f[4] > 0 ? (f[4] / 100 + 1.2).toFixed(2) : (1.2 + Math.random() * 0.2).toFixed(2), unit: 'm/s' };
    metrics.metricC = { label: 'Actuator Load', value: f[5] > 0 ? (f[5] % 80 + 20).toFixed(1) : (50 + Math.random() * 15).toFixed(1), unit: '%' };
    chartValue = f[3] > 0 ? (f[3] / 5 + 40) : (80 + Math.random() * 30);
  } else if (type === 'Sealing Machine') {
    metrics.metricA = { label: 'Sealing Pressure', value: f[1] > 0 ? (f[1] / 10 + 150).toFixed(1) : (150 + Math.random() * 10).toFixed(1), unit: 'kPa' };
    metrics.metricB = { label: 'Sealing Temp', value: f[6] > 0 ? (f[6] / 10 + 120).toFixed(1) : (120 + Math.random() * 5).toFixed(1), unit: '°C' };
    metrics.metricC = { label: 'Operating Speed', value: f[7] > 0 ? (f[7] % 60 + 40).toFixed(0) : Math.floor(60 + Math.random() * 20), unit: 'U/M' };
    chartValue = f[6] > 0 ? (f[6] / 2 + 100) : (150 + Math.random() * 20);
  } else if (type === 'Filling Machine') {
    metrics.metricA = { label: 'Flow Pressure', value: f[2] > 0 ? (f[2] / 10 + 45).toFixed(1) : (45 + Math.random() * 5).toFixed(1), unit: 'PSI' };
    metrics.metricB = { label: 'Cavitation', value: f[7] > 0 ? (f[7] / 1000).toFixed(3) : (Math.random() * 0.05).toFixed(3), unit: 'sig' };
    metrics.metricC = { label: 'Instability', value: f[8] > 0 ? (f[8] % 100).toFixed(0) : Math.floor(Math.random() * 15), unit: '%' };
    chartValue = f[2] > 0 ? (f[2] / 10 + 30) : (60 + Math.random() * 40);
  }

  historyArray.push(chartValue);
  if (historyArray.length > 20) {
    historyArray.shift();
  }

  // Format failure probability to a percentage for the UI gauge
  const riskPercentage = (prediction.failure_probability * 100).toFixed(1);

  // Keep old format properties for backwards compatibility on global snapshot, but UI will use dynamic metrics
  return {
    id: id,
    type: type,
    metrics: metrics,
    coreTemp: metrics.metricB?.value || '0', // fallback
    vibration: metrics.metricA?.value || '0', // fallback
    sysLoad: metrics.metricC?.value || 0, // fallback
    powerDraw: '0',
    vibrationHistory: historyArray,
    riskPercentage: riskPercentage,
    anomaly_detected: prediction.anomaly_detected,
    risk_level: prediction.risk_level
  };
};

const generateFleetMetrics = () => {
  return {
    uptime: (99.5 + Math.random() * 0.4).toFixed(2), 
    throughput: (14.0 + Math.random() * 0.5).toFixed(1),
    activeNodes: csvLoader.getUniqueDevices().length || 42,
    criticalAnomalies: Math.random() > 0.9 ? 3 : 2
  };
};

const generateMachineTelemetry = (id) => {
  const map = csvLoader.getDeviceMap();
  const rows = map[id];
  
  if (!rows || rows.length === 0) {
    return null;
  }

  if (simulationState[id] === undefined) {
    simulationState[id] = rows.length > 20 ? 20 : 0; 
    const type = getMachineType(id);
    
    // Pre-fill history
    activeHistories[id] = rows.slice(0, 20).map(r => {
      const f = csvLoader.extractFeatures(r);
      if (type === 'Conveyor Belt') return f[1] > 0 ? (f[1] / 10 + 50) : (100 + Math.random() * 50);
      if (type === 'Robot Arm') return f[3] > 0 ? (f[3] / 5 + 40) : (80 + Math.random() * 30);
      if (type === 'Sealing Machine') return f[6] > 0 ? (f[6] / 2 + 100) : (150 + Math.random() * 20);
      if (type === 'Filling Machine') return f[2] > 0 ? (f[2] / 10 + 30) : (60 + Math.random() * 40);
      return 100;
    });
  }

  const index = simulationState[id];
  const row = rows[index];
  
  // Loop back if we reach the end of the data
  simulationState[id] = (index + 1) % rows.length;

  return mapRowToTelemetry(row, activeHistories[id], id);
};

module.exports = {
  getMachines,
  getMachineHistory,
  generateFleetMetrics,
  generateMachineTelemetry
};
