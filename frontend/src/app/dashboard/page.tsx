'use client';

import { useEffect, useState, useRef } from 'react';
import { useTelemetryStore, Machine } from '@/store/telemetryStore';
import { socketService } from '@/services/socketService';
import { MetricCard } from '@/components/features/MetricCard';
import { MachineCard } from '@/components/features/MachineCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Dashboard() {
  const fleet = useTelemetryStore((state) => state.fleet);
  const fleetMetrics = useTelemetryStore((state) => state.fleetMetrics);
  const alerts = useTelemetryStore((state) => state.alerts);
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const machines = useTelemetryStore((state) => state.machines);
  const isInitialized = useTelemetryStore((state) => state.isInitialized);
  const [displayedMachines, setDisplayedMachines] = useState<Machine[]>([]);
  // Track active socket subscriptions to avoid double-unsubscription
  const subscribedMachinesRef = useRef<Set<string>>(new Set());

  // Wait for global bootstrapper
  const isLoading = !isInitialized;



  // Filter machines based on fleet selection and manage subscriptions
  useEffect(() => {
    if (!isInitialized || machines.length === 0) return;

    let filtered = machines;
    if (fleet === 'Conveyor Belt Fleet') filtered = machines.filter(m => m.type === 'Conveyor Belt');
    else if (fleet === 'Robot Arm Fleet') filtered = machines.filter(m => m.type === 'Robot Arm');
    else if (fleet === 'Sealing Machines') filtered = machines.filter(m => m.type === 'Sealing Machine');
    else if (fleet === 'Filling Machines') filtered = machines.filter(m => m.type === 'Filling Machine');
    else if (fleet === 'High Risk Machines') {
      filtered = machines.filter(m => {
        const tel = telemetry[m.id];
        return tel?.risk_level === 'CRITICAL' || tel?.risk_level === 'WARNING';
      });
    }

    const top6 = filtered.slice(0, 6);
    const top6Ids = new Set(top6.map(m => m.id));
    const currentIds = subscribedMachinesRef.current;

    // Unsubscribe from machines no longer in view
    currentIds.forEach(id => {
      if (!top6Ids.has(id)) {
        socketService.unsubscribeMachine(id);
        currentIds.delete(id);
      }
    });

    // Subscribe to newly visible machines
    top6.forEach(m => {
      if (!currentIds.has(m.id)) {
        socketService.subscribeMachine(m.id);
        currentIds.add(m.id);
      }
    });

    setDisplayedMachines(top6);

    return () => {
      // On unmount, unsubscribe from all currently tracked machines
      currentIds.forEach(id => socketService.unsubscribeMachine(id));
      currentIds.clear();
    };
  }, [machines, fleet, isInitialized]);

  return (
    <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 relative overflow-hidden pb-8">
      
      {/* The Dashboard is split into a 8/4 or 9/3 layout */}
      <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8 z-10">
        
        {/* KPIs Row */}
        <section>
          <div className="mb-6 px-2 md:px-0">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Fleet Intelligence</h1>
            <p className="text-sm text-on-surface-variant mt-1">Real-time aggregated predictive models</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-2 md:px-0">
            <MetricCard 
              label="Fleet Uptime" 
              value={fleetMetrics.uptime} 
              unit="%" 
              trend="up" 
              trendValue="Live telemetry"
              icon="trending_up"
            />
            <MetricCard 
              label="Throughput" 
              value={fleetMetrics.throughput} 
              unit="k" 
              trend="neutral" 
              trendValue="units/hr avg"
              icon="precision_manufacturing"
            />
            <MetricCard 
              label="Active AI Nodes" 
              value={machines.length > 0 ? machines.length : fleetMetrics.activeNodes} 
              trend="neutral" 
              trendValue="Monitoring"
              icon="memory"
            />
            <MetricCard 
              label="Critical Anomalies" 
              value={alerts.filter(a => a.type === 'CRITICAL').length} 
              trend="down" 
              trendValue="ACTION REQ."
              icon="warning"
              iconColor="text-critical"
            />
          </div>
        </section>

        {/* Machine Grid */}
        <section className="px-2 md:px-0">
          <h2 className="text-lg font-semibold text-on-surface mb-4 md:mb-6">Monitored Assets</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} variant="default" className="h-32 animate-pulse bg-on-surface/5" />
              ))
            ) : displayedMachines.length === 0 ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant font-mono text-sm bg-surface-solid rounded-xl border border-border-subtle">
                No machines match the current filter.
              </div>
            ) : (
              displayedMachines.map((machine) => {
                const tel = telemetry[machine.id];
                const riskLevel = tel?.risk_level || 'STABLE';
                const riskPercentage = tel?.riskPercentage || '0.0';
                const sparklineData = tel?.vibrationHistory || Array.from({length: 20}, () => 50);

                return (
                  <MachineCard 
                    key={machine.id}
                    id={machine.id}
                    type={machine.type}
                    riskLevel={riskLevel}
                    riskPercentage={riskPercentage}
                    sparklineData={sparklineData}
                  />
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Sidebar Area (Alerts) */}
      <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 z-10 h-full mt-6 lg:mt-0 px-2 md:px-0">
        <Card variant="glass" padding="none" className="flex flex-col h-full flex-1">
          <div className="p-4 md:p-6 border-b border-border-subtle flex justify-between items-center bg-surface-solid">
            <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-insight text-[18px]">history</span>
              Event Log
            </h2>
            <Link href="/alerts" className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors">
              View All
            </Link>
          </div>
          
          <div className="flex flex-col p-4 gap-2 overflow-y-auto custom-scrollbar flex-1 relative max-h-[800px]">
            <AnimatePresence>
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-sm text-on-surface-variant font-mono">No recent events</div>
              ) : (
                alerts.slice(0, 15).map((alert) => (
                  <motion.div 
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg bg-surface-solid border border-border-subtle hover:border-border-strong transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge 
                        variant={alert.type === 'CRITICAL' ? 'critical' : alert.type === 'WARNING' ? 'warning' : 'neutral'} 
                        text={alert.type} 
                      />
                      <span className="text-[10px] font-mono text-on-surface-variant">{alert.time}</span>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed mb-3">{alert.message}</p>
                    <div className="flex items-center text-[10px] font-mono text-on-surface-variant gap-2 bg-background p-1.5 rounded w-fit">
                      <span className="material-symbols-outlined text-[12px]">tag</span>
                      {alert.tag}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

    </main>
  );
}
