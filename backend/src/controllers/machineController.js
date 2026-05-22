const machineService = require('../services/machineService');

const getMachines = async (req, res) => {
  try {
    const machines = await machineService.getMachines();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
};

const getMachineHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await machineService.getMachineHistory(id);
    if (!history) {
      return res.status(404).json({ error: 'Machine history not found' });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machine history' });
  }
};

module.exports = {
  getMachines,
  getMachineHistory
};
