import { io, Socket } from 'socket.io-client';
import { useTelemetryStore, Alert, MachineTelemetry, FleetMetrics } from '../store/telemetryStore';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private activeSubscriptions: Set<string> = new Set();

  public connect() {
    if (this.socket?.connected || this.isConnecting) return;

    const URL = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!URL) {
      console.error('[SocketService] NEXT_PUBLIC_SOCKET_URL is not set. Socket connection aborted.');
      return;
    }

    this.isConnecting = true;

    this.socket = io(URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket']
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      useTelemetryStore.getState().setIsConnected(true);
      console.log('[SocketService] Connected:', this.socket?.id);

      // Resubscribe to all active machines on reconnect
      this.activeSubscriptions.forEach(machineId => {
        this.socket?.emit('subscribe_machine', machineId);
      });
    });

    this.socket.on('connect_error', (err) => {
      // Reset isConnecting so reconnection attempts can proceed
      this.isConnecting = false;
      useTelemetryStore.getState().setIsConnected(false);
      console.warn('[SocketService] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      useTelemetryStore.getState().setIsConnected(false);
      console.log('[SocketService] Disconnected. Reason:', reason);
    });

    // Real-time events
    this.socket.on('machine_telemetry', (data: MachineTelemetry) => {
      useTelemetryStore.getState().updateTelemetry(data);
    });

    this.socket.on('fleet_metrics', (data: FleetMetrics) => {
      useTelemetryStore.getState().setFleetMetrics(data);
    });

    this.socket.on('new_alert', (alert: Alert) => {
      useTelemetryStore.getState().addAlert(alert);
    });
  }

  public subscribeMachine(machineId: string) {
    this.activeSubscriptions.add(machineId);
    if (this.socket?.connected) {
      this.socket.emit('subscribe_machine', machineId);
    }
  }

  public unsubscribeMachine(machineId: string) {
    this.activeSubscriptions.delete(machineId);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_machine', machineId);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }
}

export const socketService = new SocketService();
