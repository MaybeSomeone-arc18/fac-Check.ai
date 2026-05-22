// Dummy data mimicking a database collection

const machines = [
  { id: 'CNC-042', name: 'Line A Assembler', location: 'North Wing - Bay 4', status: 'NOMINAL' },
  { id: 'LB-02', name: 'Line B Stamping', location: 'South Wing - Bay 1', status: 'WARNING' },
  { id: 'LC-03', name: 'Line C Welding', location: 'East Wing - Bay 2', status: 'CRITICAL' },
];

const getMachines = async () => {
  return machines;
};

const getMachineById = async (id) => {
  return machines.find(m => m.id === id);
};

module.exports = {
  getMachines,
  getMachineById
};
