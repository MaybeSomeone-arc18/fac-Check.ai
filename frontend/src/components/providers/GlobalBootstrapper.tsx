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
      // Connect socket immediately — non-blocking
      socketService.connect();

      // Fetch machines and alerts independently so one failure doesn't block the other
      const [machinesResult, alertsResult] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`).then(r => {
          if (!r.ok) throw new Error(`/machines responded with ${r.status}`);
          return r.json();
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts`).then(r => {
          if (!r.ok) throw new Error(`/alerts responded with ${r.status}`);
          return r.json();
        })
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
