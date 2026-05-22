const { RandomForestClassifier } = require('ml-random-forest');
const csvLoader = require('./csvLoader');

let classifier = null;
let isTrained = false;

const trainModel = () => {
  return new Promise((resolve) => {
    console.log('Initiating AI Random Forest training sequence...');
    
    const { features, labels } = csvLoader.getTrainingData();
    
    if (features.length === 0) {
      console.warn('No training data available. AI Service will return mock predictions.');
      resolve();
      return;
    }

    // Configure the Random Forest Classifier
    const options = {
      seed: 42,
      maxFeatures: 3,
      replacement: true,
      nEstimators: 25 // Keep estimators low for fast Node.js boot time
    };

    classifier = new RandomForestClassifier(options);
    classifier.train(features, labels);
    isTrained = true;
    
    console.log('AI Random Forest model training complete.');
    resolve();
  });
};

const predict = (featuresArray) => {
  if (!isTrained || !classifier) {
    // Fallback if not trained
    const prob = Math.random() * 0.1;
    return {
      failure_probability: prob,
      anomaly_detected: prob > 0.8,
      risk_level: prob > 0.8 ? 'CRITICAL' : (prob > 0.4 ? 'WARNING' : 'STABLE')
    };
  }

  // predictProbability returns array of probabilities for each class
  // featuresArray must be a 2D array [ [m1, m2, ..., m9] ]
  const result = classifier.predictProbability([featuresArray]);
  
  // result[0] is the probabilities for the first instance
  // index 0 is nominal (class 0), index 1 is failure (class 1)
  // If the dataset only had class 0, result[0][1] might be undefined
  const failureProb = result[0][1] !== undefined ? result[0][1] : 0.0;
  
  let riskLevel = 'STABLE';
  if (failureProb > 0.7) riskLevel = 'CRITICAL';
  else if (failureProb > 0.3) riskLevel = 'WARNING';

  return {
    failure_probability: failureProb,
    anomaly_detected: failureProb > 0.7,
    risk_level: riskLevel
  };
};

module.exports = {
  trainModel,
  predict
};
