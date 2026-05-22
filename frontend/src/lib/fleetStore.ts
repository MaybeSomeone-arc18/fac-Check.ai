import { useState, useEffect } from 'react';

type Listener = (fleet: string) => void;

let currentFleet = 'All Fleets';
const listeners = new Set<Listener>();

export const fleetStore = {
  getFleet: () => currentFleet,
  setFleet: (fleet: string) => {
    currentFleet = fleet;
    listeners.forEach(l => l(fleet));
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

export function useFleet() {
  const [fleet, setFleetState] = useState(fleetStore.getFleet());

  useEffect(() => {
    return fleetStore.subscribe(setFleetState);
  }, []);

  return { fleet, setFleet: fleetStore.setFleet };
}
