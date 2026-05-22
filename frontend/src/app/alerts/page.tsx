'use client';

import { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { useFleet } from '@/lib/fleetStore';

type Alert = {
  id: number;
  type: string;
  time: string;
  message: string;
  tag: string;
};

type Machine = {
  id: string;
  type: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function AlertsPage() {
  const { fleet } = useFleet();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`)
      .then(res => res.json())
      .then(data => setMachines(data))
      .catch(err => console.error("Failed to load machines", err));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load alerts", err);
        setIsLoading(false);
      });

    socket.connect();
    socket.on('new_alert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return () => {
      socket.off('new_alert');
    };
  }, []);

  const filteredAlerts = alerts.filter(a => {
    // Check local filter (CRITICAL, WARNING, ALL)
    if (filter !== 'ALL' && a.type !== filter) return false;
    
    // Check global fleet filter
    if (fleet === 'All Fleets') return true;
    if (fleet === 'High Risk Machines') return true; // High risk includes all alerts since alerts imply risk
    
    const machine = machines.find(m => m.id === a.tag);
    if (!machine) return false;
    
    if (fleet === 'Conveyor Belt Fleet' && machine.type !== 'Conveyor Belt') return false;
    if (fleet === 'Robot Arm Fleet' && machine.type !== 'Robot Arm') return false;
    if (fleet === 'Sealing Machines' && machine.type !== 'Sealing Machine') return false;
    if (fleet === 'Filling Machines' && machine.type !== 'Filling Machine') return false;
    
    return true;
  });

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return {
          bg: 'bg-error/10 border-error/40 hover:bg-error/20 glass-alert',
          line: 'bg-error shadow-[0_0_15px_#ff453a]',
          text: 'text-error',
          icon: 'warning'
        };
      case 'WARNING':
        return {
          bg: 'bg-[#ffaa00]/10 border-[#ffaa00]/40 hover:bg-[#ffaa00]/20',
          line: 'bg-[#ffaa00] shadow-[0_0_10px_#ffaa00]',
          text: 'text-[#ffaa00]',
          icon: 'notifications_active'
        };
      default:
        return {
          bg: 'bg-primary/10 border-primary/40 hover:bg-primary/20',
          line: 'bg-primary shadow-[0_0_10px_#00daf3]',
          text: 'text-primary',
          icon: 'info'
        };
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8 xl:p-10 flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-error/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient mb-1">Global Alert Center</h2>
          <p className="text-sm font-mono text-on-surface-variant tracking-wider">Real-time anomaly detection and operational incidents.</p>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${filter === 'ALL' ? 'bg-white/20 text-white shadow-md' : 'text-on-surface-variant hover:text-white'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('CRITICAL')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${filter === 'CRITICAL' ? 'bg-error text-white shadow-[0_0_15px_rgba(255,69,58,0.5)]' : 'text-on-surface-variant hover:text-error'}`}
          >
            Critical
          </button>
          <button 
            onClick={() => setFilter('WARNING')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${filter === 'WARNING' ? 'bg-[#ffaa00] text-[#06080c] shadow-[0_0_15px_rgba(255,170,0,0.5)]' : 'text-on-surface-variant hover:text-[#ffaa00]'}`}
          >
            Warning
          </button>
        </div>
      </div>

      <div className="glass-premium rounded-2xl flex-1 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] p-6 z-10 relative scan-line">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">history</span>
            Incident Log
          </h2>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-primary flex items-center gap-2 shadow-[0_0_15px_rgba(0,218,243,0.15)]">
            <span className="material-symbols-outlined text-[14px] animate-spin-slow">sync</span> LIVE STREAMING
          </span>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant font-mono">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Fetching AI Analytics...
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1"
          >
            <AnimatePresence>
              {filteredAlerts.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-10 font-mono text-on-surface-variant">
                  No alerts match the current filter.
                </motion.div>
              )}
              {filteredAlerts.map((alert) => {
                const styles = getAlertStyles(alert.type);
                return (
                  <motion.div 
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`p-5 rounded-xl border transition-colors group cursor-pointer relative overflow-hidden shadow-lg ${styles.bg}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.line}`}></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between pl-3 gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[24px] ${styles.text}`}>{styles.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono font-bold tracking-widest uppercase ${styles.text}`}>{alert.type}</span>
                            <span className="text-[10px] font-mono text-on-surface-variant bg-white/5 px-2 py-0.5 rounded border border-white/5">TAG: {alert.tag}</span>
                          </div>
                          <p className="text-sm text-on-surface mt-1 leading-relaxed font-medium">{alert.message}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end md:items-end">
                        <span className="text-xs font-mono text-on-surface-variant mb-1">{alert.time}</span>
                        <button className="premium-btn px-3 py-1 text-[10px] font-mono text-primary uppercase tracking-wider rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Inspect <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}
