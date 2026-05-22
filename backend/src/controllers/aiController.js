const aiService = require('../services/aiService');

const predict = (req, res) => {
  try {
    const metrics = req.body; // Expecting { metric1: 123, metric2: 45, ... metric9: 0 }
    
    if (!metrics) {
      return res.status(400).json({ error: 'Metrics payload is required.' });
    }

    const featuresArray = [
      parseInt(metrics.metric1) || 0,
      parseInt(metrics.metric2) || 0,
      parseInt(metrics.metric3) || 0,
      parseInt(metrics.metric4) || 0,
      parseInt(metrics.metric5) || 0,
      parseInt(metrics.metric6) || 0,
      parseInt(metrics.metric7) || 0,
      parseInt(metrics.metric8) || 0,
      parseInt(metrics.metric9) || 0
    ];

    const prediction = aiService.predict(featuresArray);
    res.json(prediction);
    
  } catch (error) {
    console.error('Prediction Error:', error);
    res.status(500).json({ error: 'Failed to process AI prediction' });
  }
};

module.exports = {
  predict
};
