const { Server } = require('socket.io');
const machineService = require('../services/machineService');
const alertService = require('../services/alertService');
const csvLoader = require('../services/csvLoader');
const TelemetrySnapshot = require('../models/TelemetrySnapshot');
const Alert = require('../models/AlertSchema');

let io;
let activeConnections = 0;
let broadcastInterval;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    activeConnections++;
    console.log(`Client connected: ${socket.id}. Total active: ${activeConnections}`);

    socket.on('subscribe_machine', (machineId) => {
      // Provide an alias resolution so 'CNC-042' targets our first loaded CSV device
      const devices = csvLoader.getUniqueDevices();
      const targetId = (machineId === 'CNC-042' && devices.length > 0) ? devices[0].id : machineId;
      
      socket.join(targetId);
      console.log(`Socket ${socket.id} subscribed to room: ${targetId}`);
    });

    socket.on('unsubscribe_machine', (machineId) => {
      const devices = csvLoader.getUniqueDevices();
      const targetId = (machineId === 'CNC-042' && devices.length > 0) ? devices[0].id : machineId;
      
      socket.leave(targetId);
      console.log(`Socket ${socket.id} unsubscribed from room: ${targetId}`);
    });

    socket.on('disconnect', () => {
      activeConnections--;
      console.log(`Client disconnected: ${socket.id}. Total active: ${activeConnections}`);
    });
  });

  // Start background emission loop, wait a tiny bit for CSV and AI to load
  setTimeout(startBroadcasting, 2000);

  return io;
};

// Extract rooms that are actually machine IDs, not just internal socket IDs
const getActiveMachineRooms = () => {
  if (!io) return [];
  const rooms = [];
  for (const [roomName, sockets] of io.sockets.adapter.rooms) {
    if (!sockets.has(roomName)) { // This means it's a custom room, not a socket ID auto-room
      rooms.push(roomName);
    }
  }
  return rooms;
};

const startBroadcasting = () => {
  if (broadcastInterval) clearInterval(broadcastInterval);

  broadcastInterval = setInterval(async () => {
    if (!io) return;

    // 1. Broadcast high-level fleet metrics globally
    io.emit('fleet_metrics', machineService.generateFleetMetrics());
    
    // 2. Broadcast specific telemetry ONLY to rooms that have active subscribers
    const activeRooms = getActiveMachineRooms();
    
    for (const machineId of activeRooms) {
      const telemetryData = machineService.generateMachineTelemetry(machineId);
      if (telemetryData) {
        // Emit exclusively to the machine's room
        io.to(machineId).emit('machine_telemetry', telemetryData);

        // If the AI model detected an anomaly on this specific machine, dynamically trigger an alert!
        if (telemetryData.anomaly_detected) {
          const alertObj = {
            id: Date.now().toString() + Math.floor(Math.random() * 100),
            type: telemetryData.risk_level,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            message: `AI Model detected ${telemetryData.risk_level} failure signature on ${machineId}.`,
            tag: machineId === csvLoader.getUniqueDevices()[0]?.id ? 'CNC-042' : machineId
          };
          
          // Alerts are globally important, broadcast to EVERYONE
          io.emit('new_alert', alertObj);

          // --- MongoDB Persistence ---
          try {
            const snapshot = new TelemetrySnapshot({
              machineId: machineId,
              coreTemp: parseFloat(telemetryData.coreTemp),
              vibration: parseFloat(telemetryData.vibration),
              sysLoad: parseInt(telemetryData.sysLoad),
              powerDraw: parseFloat(telemetryData.powerDraw),
              failureProbability: parseFloat(telemetryData.riskPercentage) / 100,
              riskLevel: telemetryData.risk_level
            });
            await snapshot.save();

            const alertDoc = new Alert({
              alertId: alertObj.id,
              machineId: machineId,
              type: alertObj.type,
              message: alertObj.message
            });
            await alertDoc.save();
            
            console.log(`[MongoDB] Persisted anomaly snapshot & alert for ${machineId}`);
          } catch (error) {
            console.error('[MongoDB Error] Failed to persist anomaly data:', error);
          }
        }
      }
    }
    
    // 3. Randomly generate a background info alert 2% of the time just for visual activity on global stream
    if (Math.random() < 0.02) {
      io.emit('new_alert', alertService.generateRandomAlert());
    }
  }, 2000);
};

module.exports = {
  initializeSocket
};
