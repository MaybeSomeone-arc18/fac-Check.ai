'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import { useFleet } from '@/lib/fleetStore';

type FleetMetrics = {
  uptime: string;
  throughput: string;
  activeNodes: number;
  criticalAnomalies: number;
};

type Alert = {
  id: number;
  type: string;
  time: string;
  message: string;
  tag: string;
};

type Machine = {
  id: string;
  name: string;
  location: string;
  status: string;
};

type MachineTelemetry = {
  id: string;
  coreTemp: string;
  vibration: string;
  sysLoad: number;
  powerDraw: string;
  riskPercentage: string;
  risk_level: string;
};

import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { fleet } = useFleet();
  const [metrics, setMetrics] = useState<FleetMetrics>({
    uptime: '99.8',
    throughput: '14.2',
    activeNodes: 42,
    criticalAnomalies: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allMachines, setAllMachines] = useState<Machine[]>([]);
  const [machineTelemetry, setMachineTelemetry] = useState<Record<string, MachineTelemetry>>({});
  const [machineBuffers, setMachineBuffers] = useState<Record<string, number[]>>({});

  useEffect(() => {
    socket.connect();

    // Fetch initial alerts
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts`)
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error("Failed to load initial alerts", err));

    // Fetch all machines
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`)
      .then(res => res.json())
      .then((data: Machine[]) => {
        setAllMachines(data);
      })
      .catch(err => console.error("Failed to load machines", err));

    socket.on('fleet_metrics', (data: FleetMetrics) => {
      setMetrics(data);
    });

    socket.on('new_alert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20)); // Keep last 20
    });

    socket.on('machine_telemetry', (data: MachineTelemetry) => {
      setMachineTelemetry(prev => ({
        ...prev,
        [data.id]: data
      }));

      // Bind sparkline buffer exactly to the primary numeric value (metricA)
      setMachineBuffers(prev => {
        const prevBuf = prev[data.id] || (data.vibrationHistory ? [...data.vibrationHistory] : Array.from({length: 20}, () => 50));
        const numericVal = parseFloat(data.metrics?.metricA?.value || '50');
        const newBuf = [...prevBuf, numericVal];
        if (newBuf.length > 20) newBuf.shift();
        return { ...prev, [data.id]: newBuf };
      });
    });

    return () => {
      socket.off('fleet_metrics');
      socket.off('new_alert');
      socket.off('machine_telemetry');
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Filter and slice based on fleet
    let filtered = allMachines;
    if (fleet === 'Conveyor Belt Fleet') filtered = allMachines.filter(m => m.type === 'Conveyor Belt');
    else if (fleet === 'Robot Arm Fleet') filtered = allMachines.filter(m => m.type === 'Robot Arm');
    else if (fleet === 'Sealing Machines') filtered = allMachines.filter(m => m.type === 'Sealing Machine');
    else if (fleet === 'Filling Machines') filtered = allMachines.filter(m => m.type === 'Filling Machine');
    else if (fleet === 'High Risk Machines') {
      filtered = allMachines.filter(m => {
        const tel = machineTelemetry[m.id];
        return tel?.risk_level === 'CRITICAL' || tel?.risk_level === 'WARNING';
      });
    }

    const top6 = filtered.slice(0, 6);
    
    // Unsubscribe from old machines not in top6
    machines.forEach(m => {
      if (!top6.find(t => t.id === m.id)) {
        socket.emit('unsubscribe_machine', m.id);
      }
    });

    // Subscribe to new machines
    top6.forEach(m => {
      if (!machines.find(oldM => oldM.id === m.id)) {
        socket.emit('subscribe_machine', m.id);
      }
    });

    setMachines(top6);
  }, [allMachines, fleet, machineTelemetry]); // Only re-run when fleet or allMachines change

  return (
    <main className="flex-1 p-6 lg:p-8 xl:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8 z-10">
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-premium rounded-2xl p-8 relative overflow-hidden scan-line"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">Fleet Intelligence Overview</h2>
              <p className="text-sm text-on-surface-variant mt-1">Real-time aggregated predictive models</p>
            </div>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-primary flex items-center gap-2 shadow-[0_0_15px_rgba(0,218,243,0.15)]">
              <span className="material-symbols-outlined text-[14px] animate-spin-slow">sync</span> LIVE STREAMING
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all duration-300 group shadow-lg">
              <h3 className="text-xs font-mono text-on-surface-variant tracking-wider uppercase mb-2">Fleet Uptime</h3>
              <div className="text-3xl font-mono font-semibold text-on-surface group-hover:text-primary group-hover:glow-text transition-all duration-300">
                <motion.span key={metrics.uptime} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }}>{metrics.uptime}</motion.span><span className="text-lg text-on-surface-variant">%</span>
              </div>
              <div className="text-xs font-medium text-primary mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> Live telemetry
              </div>
            </div>
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all duration-300 group shadow-lg">
              <h3 className="text-xs font-mono text-on-surface-variant tracking-wider uppercase mb-2">Throughput</h3>
              <div className="text-3xl font-mono font-semibold text-on-surface group-hover:text-primary group-hover:glow-text transition-all duration-300">
                <motion.span key={metrics.throughput} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }}>{metrics.throughput}</motion.span><span className="text-lg text-on-surface-variant">k</span>
              </div>
              <div className="text-xs text-on-surface-variant mt-3 font-mono">units/hr avg</div>
            </div>
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all duration-300 group shadow-lg">
              <h3 className="text-xs font-mono text-on-surface-variant tracking-wider uppercase mb-2">Active AI Nodes</h3>
              <div className="text-3xl font-mono font-semibold text-on-surface group-hover:text-primary group-hover:glow-text transition-all duration-300">
                {metrics.activeNodes}<span className="text-lg text-on-surface-variant"></span>
              </div>
              <div className="text-xs text-on-surface-variant mt-3 font-mono">Monitoring</div>
            </div>
            <div className="p-5 rounded-xl bg-error/10 border border-error/30 hover:shadow-[0_0_20px_rgba(255,69,58,0.3)] hover:border-error/60 hover:bg-error/20 transition-all duration-300 group">
              <h3 className="text-xs font-mono text-error tracking-wider uppercase mb-2">Critical Anomalies</h3>
              <div className="text-3xl font-mono font-semibold text-error group-hover:scale-110 origin-left transition-transform duration-300">
                <motion.span key={metrics.criticalAnomalies} initial={{ scale: 1.5, color: '#fff' }} animate={{ scale: 1, color: '#ff453a' }}>{metrics.criticalAnomalies}</motion.span>
              </div>
              <div className="text-xs font-bold text-error mt-3 flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[14px]">warning</span> ACTION REQ.
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {machines.map((machine) => {
            const tel = machineTelemetry[machine.id];
            const isCritical = tel?.risk_level === 'CRITICAL';
            const isWarning = tel?.risk_level === 'WARNING';

            const cardClasses = isCritical 
              ? "glass-premium rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer relative overflow-hidden border-error/40 shadow-[0_0_20px_rgba(255,69,58,0.15)] glass-alert"
              : isWarning
              ? "glass-premium rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer relative overflow-hidden border-[#ffaa00]/40 shadow-[0_0_20px_rgba(255,170,0,0.1)]"
              : "glass-premium rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer relative overflow-hidden";

            const gradientClasses = isCritical
              ? "absolute inset-0 bg-gradient-to-b from-error/15 to-transparent opacity-100 pointer-events-none"
              : isWarning
              ? "absolute inset-0 bg-gradient-to-b from-[#ffaa00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              : "absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none";

            const nameClasses = isCritical ? "font-bold text-error text-lg" : isWarning ? "font-bold text-on-surface text-lg group-hover:text-[#ffaa00] transition-colors" : "font-bold text-on-surface text-lg group-hover:text-primary transition-colors";
            
            const badgeClasses = isCritical
              ? "text-[10px] font-bold px-2 py-1 rounded bg-error/30 text-white border border-error tracking-wider shadow-[0_0_15px_rgba(255,69,58,0.5)] animate-pulse"
              : isWarning
              ? "text-[10px] font-bold px-2 py-1 rounded bg-[#ffaa00]/20 text-[#ffaa00] border border-[#ffaa00]/40 tracking-wider shadow-[0_0_10px_rgba(255,170,0,0.2)]"
              : "text-[10px] font-bold px-2 py-1 rounded bg-primary/20 text-primary border border-primary/40 tracking-wider shadow-[0_0_10px_rgba(0,218,243,0.2)]";

            const borderClasses = isCritical ? "border-error/40" : "border-white/10 group-hover:border-primary/40";
            const svgGradientClasses = isCritical ? "bg-gradient-to-t from-error/30 to-transparent opacity-90" : isWarning ? "bg-gradient-to-t from-[#ffaa00]/20 to-transparent opacity-60" : "bg-gradient-to-t from-primary/20 to-transparent opacity-60";
            const glowClass = isCritical ? "glow-chart-line-err" : isWarning ? "glow-chart-line-warn" : "glow-chart-line";
            const strokeColor = isCritical ? "#ff453a" : isWarning ? "#ffaa00" : "#00daf3";

            return (
              <motion.div variants={itemVariants} key={machine.id} whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Link href={`/machine-detail?id=${machine.id}`} className="block h-full">
                  <div className={cardClasses}>
                    <div className={gradientClasses}></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <h3 className={nameClasses}>{machine.name}</h3>
                        <p className={`font-mono ${isCritical ? 'text-error/80' : 'text-on-surface-variant'} text-[11px] mt-1 tracking-wider uppercase`}>{machine.type} | {machine.id}</p>
                      </div>
                      <span className={badgeClasses}>{tel?.risk_level || 'STABLE'}</span>
                    </div>
                    <div className={`h-16 relative border-b border-l flex items-end mt-2 z-10 transition-colors ${borderClasses}`}>
                      <div className={`absolute inset-0 ${svgGradientClasses}`}></div>
                      <svg className={`w-full h-full overflow-visible preserve-aspect-ratio-none ${glowClass}`} viewBox="0 0 100 40">
                        <path 
                          d={(() => {
                            const history = machineBuffers[machine.id] || tel?.vibrationHistory || Array.from({length: 20}, () => 50);
                            const validHistory = history.filter(Number.isFinite);
                            const maxVal = Math.max(...validHistory, 100);
                            const minVal = Math.min(...validHistory, 0);
                            const range = maxVal - minVal || 1; // Prevent division by zero
                            return history.map((val: number, i: number) => {
                              const safeVal = Number.isFinite(val) ? val : 0;
                              const x = (i / Math.max(history.length - 1, 1)) * 100;
                              // Scale y between 5 and 35 to give it some padding so it doesn't clip
                              const y = 35 - ((safeVal - minVal) / range) * 30;
                              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                            }).join(' ');
                          })()} 
                          fill="none" stroke={strokeColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke"
                          style={{ transition: 'd 0.5s linear' }}
                        ></path>
                      </svg>
                    </div>
                    <div className="flex justify-between items-end mt-2 z-10">
                      <div>
                        <span className={`text-[10px] font-mono ${isCritical ? 'text-error/90' : 'text-on-surface-variant'} block mb-1 uppercase tracking-wider`}>{tel?.metrics?.metricA?.label || 'Metric A'}</span>
                        <motion.span key={tel?.metrics?.metricA?.value} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`font-mono font-semibold text-xl inline-block ${isCritical ? 'text-error font-bold glow-text' : isWarning ? 'text-[#ffaa00]' : 'text-on-surface'}`}>{tel?.metrics?.metricA?.value || '--'}</motion.span> <span className="text-sm font-normal opacity-70 font-mono">{tel?.metrics?.metricA?.unit || ''}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono ${isCritical ? 'text-error/90' : 'text-on-surface-variant'} block mb-1 uppercase tracking-wider`}>{tel?.metrics?.metricB?.label || 'Metric B'}</span>
                        <motion.span key={tel?.metrics?.metricB?.value} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`font-mono font-semibold text-xl inline-block ${isCritical ? 'text-error font-bold' : isWarning ? 'text-on-surface' : 'text-on-surface'}`}>{tel?.metrics?.metricB?.value || '--'}</motion.span> <span className="text-sm font-normal opacity-70 font-mono">{tel?.metrics?.metricB?.unit || ''}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.section>
      </div>

      <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 z-10 h-full">
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-premium rounded-2xl p-6 flex-1 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">history</span>
              Event Log
            </h2>
            <Link href="/alerts" className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:text-white transition-colors bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 relative">
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`p-4 rounded-xl transition-colors group cursor-pointer relative overflow-hidden shadow-lg ${
                    alert.type === 'CRITICAL' ? 'bg-error/10 border border-error/30 hover:bg-error/20' :
                    alert.type === 'WARNING' ? 'bg-[#ffaa00]/10 border border-[#ffaa00]/30 hover:bg-[#ffaa00]/20' :
                    'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    alert.type === 'CRITICAL' ? 'bg-error shadow-[0_0_15px_#ff453a]' :
                    alert.type === 'WARNING' ? 'bg-[#ffaa00] shadow-[0_0_10px_#ffaa00]' : 'bg-white/30'
                  }`}></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className={`text-[10px] font-mono font-bold tracking-wider ${
                      alert.type === 'CRITICAL' ? 'text-error' :
                      alert.type === 'WARNING' ? 'text-[#ffaa00]' : 'text-on-surface-variant'
                    }`}>{alert.type}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">{alert.time}</span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed pl-2">{alert.message}</p>
                  <div className={`mt-3 pt-3 border-t pl-2 ${
                    alert.type === 'CRITICAL' ? 'border-error/30' :
                    alert.type === 'WARNING' ? 'border-[#ffaa00]/30' : 'border-white/10'
                  }`}>
                    <span className={`text-[10px] font-mono px-2 py-1 rounded ${
                      alert.type === 'CRITICAL' ? 'text-error bg-error/20 font-bold' :
                      alert.type === 'WARNING' ? 'text-[#ffaa00] bg-[#ffaa00]/20 font-bold' : 'text-on-surface-variant bg-white/5'
                    }`}>TAG: {alert.tag}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
