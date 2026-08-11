'use client';

import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { socketService } from '@/services/socketService';

export function GlobalBootstrapper({ children }: { children: React.ReactNode }) {
  const setMachines = useTelemetryStore((state) => state.setMachines);
  const setAlerts = useTelemetryStore((state) => state.setAlerts);
  const setIsInitialized = useTelemetryStore((state) => state.setIsInitialized);
  const setApiError = useTelemetryStore((state) => state.setApiError);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeApp = async () => {
      // 1. Send lightweight request to backend /health endpoint to wake Render service
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const healthUrl = socketUrl 
        ? `${socketUrl}/health` 
        : (apiUrl ? `${apiUrl.replace(/\/api\/?$/, '')}/health` : '/health');

      try {
        await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
      } catch (e) {
        console.warn('[Bootstrap] Health check wake-up ping failed or timed out:', e);
      }

      // 2. Only after backend is reachable/pinged, connect socket
      socketService.connect();

      const fetchWithFallback = async (endpoint: string) => {
        const primaryUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
        const fallbackUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL}/api${endpoint}`;

        try {
          const res = await fetch(primaryUrl);
          if (!res.ok) throw new Error(`Primary API failed with ${res.status}`);
          return await res.json();
        } catch (e) {
          console.warn(`[Bootstrap] Primary API ${primaryUrl} failed, trying fallback: ${fallbackUrl}`);
          const fallbackRes = await fetch(fallbackUrl);
          if (!fallbackRes.ok) throw new Error(`Fallback API failed with ${fallbackRes.status}`);
          return await fallbackRes.json();
        }
      };

      // Fetch machines and alerts independently so one failure doesn't block the other
      const [machinesResult, alertsResult] = await Promise.allSettled([
        fetchWithFallback('/machines'),
        fetchWithFallback('/alerts')
      ]);

      if (machinesResult.status === 'fulfilled') {
        setMachines(machinesResult.value);
        setApiError(false);
      } else {
        console.error('[Bootstrap] Failed to load machines:', machinesResult.reason);
        setApiError(true);
      }

      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value);
      } else {
        console.error('[Bootstrap] Failed to load alerts:', alertsResult.reason);
      }

      // Always mark initialized so pages don't hang in skeleton forever
      setIsInitialized(true);
    };

    initializeApp();
  }, [setMachines, setAlerts, setIsInitialized, setApiError]);

  return <>{children}</>;
}
