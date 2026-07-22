'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetryStore } from '@/store/telemetryStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AlertsPage() {
  const fleet = useTelemetryStore((state) => state.fleet);
  const alerts = useTelemetryStore((state) => state.alerts);
  const machines = useTelemetryStore((state) => state.machines);
  const isInitialized = useTelemetryStore((state) => state.isInitialized);
  const [filter, setFilter] = useState('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filter !== 'ALL' && a.type !== filter) return false;
    
    if (fleet === 'All Fleets') return true;
    if (fleet === 'High Risk Machines') return true;
    
    const machine = machines.find(m => m.id === a.tag);
    if (!machine) return false;
    
    if (fleet === 'Conveyor Belt Fleet' && machine.type !== 'Conveyor Belt') return false;
    if (fleet === 'Robot Arm Fleet' && machine.type !== 'Robot Arm') return false;
    if (fleet === 'Sealing Machines' && machine.type !== 'Sealing Machine') return false;
    if (fleet === 'Filling Machines' && machine.type !== 'Filling Machine') return false;
    
    return true;
  });

  if (!isInitialized) {
    return (
      <main className="flex-1 w-full flex flex-col gap-6 xl:gap-8 relative overflow-hidden pb-8 animate-pulse">
        <div className="w-64 h-8 bg-surface-solid rounded-lg mb-8 mt-4"></div>
        <div className="w-full h-12 bg-surface-solid rounded-xl mb-4"></div>
        <div className="flex-1 min-h-[400px] bg-surface-solid rounded-3xl"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full flex flex-col gap-6 xl:gap-8 relative overflow-hidden pb-8">
      <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-critical/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10 px-2 md:px-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface mb-1">Global Alert Center</h2>
          <p className="text-xs md:text-sm font-mono text-on-surface-variant tracking-wider">Real-time anomaly detection and operational incidents.</p>
        </div>

        <div className="flex gap-2 bg-surface-solid p-1 rounded-lg border border-border-strong w-full sm:w-auto overflow-x-auto custom-scrollbar justify-start sm:justify-end">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${filter === 'ALL' ? 'bg-primary/20 text-primary border border-primary/30 shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('CRITICAL')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${filter === 'CRITICAL' ? 'bg-critical text-white shadow-[0_0_15px_rgba(248,113,113,0.5)]' : 'text-on-surface-variant hover:text-critical'}`}
          >
            Critical
          </button>
          <button 
            onClick={() => setFilter('WARNING')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${filter === 'WARNING' ? 'bg-warning text-background shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-on-surface-variant hover:text-warning'}`}
          >
            Warning
          </button>
        </div>
      </div>

      <Card variant="glass" padding="none" className="flex-1 flex flex-col z-10 relative mt-4 mx-2 md:mx-0">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-subtle bg-surface-solid">
          <h2 className="text-base md:text-lg font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-insight">history</span>
            Incident Log
          </h2>
          <Badge variant="nominal" text="LIVE STREAMING" />
        </div>

        <div className="flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar flex-1 bg-background/20">
          <AnimatePresence>
            {filteredAlerts.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-10 font-mono text-on-surface-variant">
                No alerts match the current filter.
              </motion.div>
            )}
            {filteredAlerts.map((alert) => {
              const isCritical = alert.type === 'CRITICAL';
              const isWarning = alert.type === 'WARNING';
              
              const borderClass = isCritical ? 'border-critical/30 hover:border-critical/60' : isWarning ? 'border-warning/30 hover:border-warning/60' : 'border-border-strong hover:border-primary/50';
              const bgClass = isCritical ? 'bg-critical/5' : isWarning ? 'bg-warning/5' : 'bg-surface-solid';
              const iconColor = isCritical ? 'text-critical' : isWarning ? 'text-warning' : 'text-primary';
              const iconName = isCritical ? 'warning' : isWarning ? 'notifications_active' : 'info';
              
              return (
                <motion.div 
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md ${bgClass} ${borderClass}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 md:w-1.5 ${isCritical ? 'bg-critical shadow-[0_0_15px_rgba(248,113,113,0.8)]' : isWarning ? 'bg-warning shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-primary'}`}></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between pl-3 gap-4">
                    <div className="flex items-start gap-3 md:gap-4 w-full md:w-auto">
                      <span className={`material-symbols-outlined text-[24px] md:text-[28px] shrink-0 ${iconColor}`}>{iconName}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={isCritical ? 'critical' : isWarning ? 'warning' : 'neutral'} text={alert.type} />
                          <span className="text-[10px] font-mono text-on-surface-variant bg-surface-solid px-2 py-0.5 rounded border border-border-strong">
                            TAG: {alert.tag}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface mt-2 leading-relaxed font-medium">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between h-full gap-3 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-border-subtle md:border-none w-full md:w-auto">
                      <span className="text-xs font-mono text-on-surface-variant">{alert.time}</span>
                      <Link href={`/machine-detail?id=${alert.tag}`}>
                        <Button variant="ghost" size="sm" className="font-mono uppercase tracking-wider text-[10px] font-bold text-primary gap-1 px-3 bg-primary/10 hover:bg-primary/20 md:bg-transparent md:px-3 md:hover:bg-on-surface/5 md:opacity-80 md:group-hover:opacity-100">
                          Inspect <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
    </main>
  );
}
