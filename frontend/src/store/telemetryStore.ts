import { create } from 'zustand';

export type Alert = {
  id: number;
  type: string;
  time: string;
  message: string;
  tag: string;
};

export type MachineTelemetry = {
  id: string;
  type?: string;
  coreTemp?: string;
  vibration?: string;
  sysLoad?: number;
  powerDraw?: string;
  vibrationHistory?: number[];
  riskPercentage?: string;
  risk_level?: string;
  metrics?: {
    metricA?: { label: string; value: string; unit: string; };
    metricB?: { label: string; value: string; unit: string; };
    metricC?: { label: string; value: string; unit: string; };
  };
};

export type Machine = {
  id: string;
  name: string;
  location: string;
  type: string;
};

export type FleetMetrics = {
  uptime: string;
  throughput: string;
  activeNodes: number;
  criticalAnomalies: number;
};

interface TelemetryState {
  // Fleet Context
  fleet: string;
  setFleet: (fleet: string) => void;

  // Connection
  isConnected: boolean;
  setIsConnected: (status: boolean) => void;

  // Data
  machines: Machine[];
  setMachines: (machines: Machine[]) => void;
  
  telemetry: Record<string, MachineTelemetry>;
  updateTelemetry: (data: MachineTelemetry) => void;
  
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  
  fleetMetrics: FleetMetrics;
  setFleetMetrics: (metrics: FleetMetrics) => void;
  
  isInitialized: boolean;
  setIsInitialized: (status: boolean) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  fleet: 'All Fleets',
  setFleet: (fleet) => set({ fleet }),

  isConnected: false,
  setIsConnected: (status) => set({ isConnected: status }),

  machines: [],
  setMachines: (machines) => set({ machines }),

  telemetry: {},
  updateTelemetry: (data) => set((state) => {
    const prev = state.telemetry[data.id];
    const prevHistory = prev?.vibrationHistory || Array.from({length: 20}, () => 50);
    const numericVal = parseFloat(data.metrics?.metricA?.value || '50');
    const newHistory = [...prevHistory, numericVal];
    if (newHistory.length > 20) newHistory.shift();

    return {
      telemetry: {
        ...state.telemetry,
        [data.id]: {
          ...data,
          vibrationHistory: newHistory
        }
      }
    };
  }),

  alerts: [],
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  setAlerts: (alerts) => set({ alerts }),

  fleetMetrics: {
    uptime: '99.50',
    throughput: '14.2',
    activeNodes: 0,
    criticalAnomalies: 0
  },
  setFleetMetrics: (metrics) => set({ fleetMetrics: metrics }),
  
  isInitialized: false,
  setIsInitialized: (status) => set({ isInitialized: status }),
}));
