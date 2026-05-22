const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const deviceMap = {};
const trainingData = {
  features: [], // array of [m1, m2, ..., m9]
  labels: []    // array of 0 or 1
};

let failureCount = 0;
let nominalCount = 0;

const loadCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const deviceId = row.device;
        if (!deviceMap[deviceId]) {
          deviceMap[deviceId] = [];
        }
        deviceMap[deviceId].push(row);

        // Extract a balanced subset for AI training
        // We will try to grab all failures, and up to 1000 nominal rows
        const isFailure = parseInt(row.failure) === 1;
        
        if (isFailure && failureCount < 1000) {
          trainingData.features.push(extractFeatures(row));
          trainingData.labels.push(1);
          failureCount++;
        } else if (!isFailure && nominalCount < 1000) {
          trainingData.features.push(extractFeatures(row));
          trainingData.labels.push(0);
          nominalCount++;
        }
      })
      .on('end', () => {
        console.log('CSV file successfully processed.');
        console.log(`Loaded ${Object.keys(deviceMap).length} unique devices.`);
        console.log(`Extracted training dataset: ${failureCount} failures, ${nominalCount} nominals.`);
        resolve(deviceMap);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const extractFeatures = (row) => {
  return [
    parseInt(row.metric1) || 0,
    parseInt(row.metric2) || 0,
    parseInt(row.metric3) || 0,
    parseInt(row.metric4) || 0,
    parseInt(row.metric5) || 0,
    parseInt(row.metric6) || 0,
    parseInt(row.metric7) || 0,
    parseInt(row.metric8) || 0,
    parseInt(row.metric9) || 0
  ];
};

const getDeviceMap = () => deviceMap;

const getTrainingData = () => trainingData;

const getUniqueDevices = () => {
  return Object.keys(deviceMap).map((id, index) => {
    return {
      id: id,
      name: `Automated Node ${id.slice(-4)}`,
      location: `Sector ${Math.floor(index / 10) + 1} - Bay ${index % 10 + 1}`,
      status: 'NOMINAL'
    };
  });
};

module.exports = {
  loadCSV,
  getDeviceMap,
  getUniqueDevices,
  getTrainingData,
  extractFeatures
};
