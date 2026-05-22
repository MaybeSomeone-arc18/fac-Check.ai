const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');

router.get('/', machineController.getMachines);
router.get('/:id/history', machineController.getMachineHistory);

module.exports = router;
