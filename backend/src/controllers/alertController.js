const alertService = require('../services/alertService');

const getAlerts = async (req, res) => {
  try {
    const alerts = await alertService.getAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

module.exports = {
  getAlerts
};
