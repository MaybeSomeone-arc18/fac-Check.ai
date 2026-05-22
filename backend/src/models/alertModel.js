// Dummy data mimicking an alerts collection

const alerts = [
  { id: 1, type: 'CRITICAL', time: '10:42:01', message: 'Voltage drop detected on Welding Arm 3. AI Auto-shutdown initiated.', tag: 'LC-03' },
  { id: 2, type: 'WARNING', time: '10:15:33', message: 'Hydraulic pressure fluctuation above nominal AI variance threshold.', tag: 'LB-02' },
  { id: 3, type: 'INFO', time: '09:00:00', message: 'Routine predictive maintenance scan completed successfully.', tag: 'LA-01' }
];

const getAlerts = async () => {
  return alerts;
};

module.exports = {
  getAlerts
};
