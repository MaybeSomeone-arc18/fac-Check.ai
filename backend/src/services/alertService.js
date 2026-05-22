const alertModel = require('../models/alertModel');

const getAlerts = async () => {
  return await alertModel.getAlerts();
};

const generateRandomAlert = () => {
  return {
    id: Date.now(),
    type: Math.random() > 0.5 ? 'WARNING' : 'INFO',
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    message: 'Dynamic live event detected by FacCheckAI edge node.',
    tag: 'CNC-042'
  };
};

module.exports = {
  getAlerts,
  generateRandomAlert
};
