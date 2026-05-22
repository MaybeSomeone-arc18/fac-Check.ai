'use client';

import { useEffect, useState, Suspense } from 'react';
import { socket } from '@/lib/socket';
import { useSearchParams, useRouter } from 'next/navigation';
import MachineModel from '@/components/MachineModel';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useFleet } from '@/lib/fleetStore';

type MachineTelemetry = {
  id?: string;
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


type Alert = {
  id: number;
  type: string;
  time: string;
  message: string;
  tag: string;
  machineId?: string;
};



const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

type Machine = {
  id: string;
  name: string;
  location: string;
  status: string;
  type: string;
};

function MachineDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineId = searchParams.get('id') || 'S1F01085'; // Default to a valid ID if possible

  const [telemetry, setTelemetry] = useState<MachineTelemetry>({
    coreTemp: '--',
    vibration: '--',
    sysLoad: 0,
    powerDraw: '--',
    vibrationHistory: Array.from({length: 20}, () => 100),
    riskPercentage: '0.0',
    risk_level: 'STABLE'
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [shellLines, setShellLines] = useState<string[]>([]);
  const { fleet } = useFleet();

  // Fetch available machines
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`)
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (fleet === 'Conveyor Belt Fleet') filtered = data.filter((m: Machine) => m.type === 'Conveyor Belt');
        else if (fleet === 'Robot Arm Fleet') filtered = data.filter((m: Machine) => m.type === 'Robot Arm');
        else if (fleet === 'Sealing Machines') filtered = data.filter((m: Machine) => m.type === 'Sealing Machine');
        else if (fleet === 'Filling Machines') filtered = data.filter((m: Machine) => m.type === 'Filling Machine');
        // Note: For High Risk, we don't have telemetry for all machines instantly here, so we just fall back to all or fetch it.
        // To keep it simple, High Risk will just show all machines if telemetry isn't fetched globally.
        setMachines(filtered);
        
        // Auto-redirect if current machine is not in the filtered list
        if (filtered.length > 0 && !filtered.find((m: Machine) => m.id === machineId)) {
          router.push(`/machine-detail?id=${filtered[0].id}`);
        }
      })
      .catch(err => console.error("Failed to load machines", err));
  }, [fleet, machineId, router]);

  const [historyBuffers, setHistoryBuffers] = useState<{metricA: number[], metricB: number[], metricC: number[], vibration: number[]}>({ metricA: [], metricB: [], metricC: [], vibration: [] });

  useEffect(() => {
    // Reset buffers when machine changes
    setHistoryBuffers({ metricA: [], metricB: [], metricC: [], vibration: [] });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines/${machineId}/history`)
      .then(res => res.json())
      .then(history => {
        setTelemetry(prev => ({
          ...prev,
          vibrationHistory: history || []
        }));
        setHistoryBuffers(prev => ({
          ...prev,
          vibration: history || []
        }));
      })
      .catch(err => console.error("Failed to fetch history", err));

    socket.connect();
    socket.emit('subscribe_machine', machineId);

    socket.on('machine_telemetry', (data: MachineTelemetry) => {
      setTelemetry(data);
      setHistoryBuffers(prev => {
        const newA = [...prev.metricA, parseFloat((data as any).metrics?.metricA?.value || '0')];
        const newB = [...prev.metricB, parseFloat((data as any).metrics?.metricB?.value || '0')];
        const newC = [...prev.metricC, parseFloat((data as any).metrics?.metricC?.value || '0')];
        
        // Push the latest value from the backend's history array into our frontend rolling buffer
        const latestVib = data.vibrationHistory ? data.vibrationHistory[data.vibrationHistory.length - 1] : 100;
        const newVib = [...prev.vibration, latestVib];

        if (newA.length > 30) newA.shift();
        if (newB.length > 30) newB.shift();
        if (newC.length > 30) newC.shift();
        if (newVib.length > 40) newVib.shift();
        
        return { metricA: newA, metricB: newB, metricC: newC, vibration: newVib };
      });
    });

    socket.on('new_alert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10));
    });

    return () => {
      socket.emit('unsubscribe_machine', machineId);
      socket.off('machine_telemetry');
      socket.off('new_alert');
      socket.disconnect();
    };
  }, [machineId]);

  // Simulate Shell boot sequence
  useEffect(() => {
    if (isShellOpen) {
      setShellLines([]);
      const seq = [
        "Connecting to secure SSH gateway...",
        "Authenticating RSA key...",
        `Connected to ${machineId} (Ubuntu 22.04.1 LTS)`,
        "root@faccheck-core:~# tail -f /var/log/telemetry.log",
        "[INIT] Sensor matrix calibrated.",
        "[INFO] Data stream nominal.",
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < seq.length) {
          setShellLines(prev => [...prev, seq[i]]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isShellOpen, machineId]);

  const handleMachineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/machine-detail?id=${e.target.value}`);
  };

  const buildSvgPath = () => {
    const arr = historyBuffers.vibration.length > 0 ? historyBuffers.vibration : (telemetry.vibrationHistory || []);
    const validArr = arr.filter(Number.isFinite);
    if (validArr.length === 0) return '';
    const maxVal = Math.max(...validArr, 100);
    const range = maxVal || 1;
    const points = arr.map((val, index) => {
      const safeVal = Number.isFinite(val) ? val : 0;
      const x = (index / (Math.max(arr.length - 1, 1))) * 800;
      const scaledY = 200 - (safeVal / range) * 180; // keep it within 200px height with some padding
      const clampedVal = Math.min(Math.max(scaledY, 0), 200);
      return `${x},${clampedVal}`;
    });
    return `M${points.join(' L')}`;
  };

  const chartPath = buildSvgPath();
  const lastArr = historyBuffers.vibration.length > 0 ? historyBuffers.vibration : (telemetry.vibrationHistory || []);
  const validLastArr = lastArr.filter(Number.isFinite);
  const maxValRef = Math.max(...validLastArr, 100);
  const rangeRef = maxValRef || 1;
  const rawLastVal = lastArr.length > 0 ? lastArr[lastArr.length - 1] : 0;
  const safeLastVal = Number.isFinite(rawLastVal) ? rawLastVal : 0;
  const lastPoint = lastArr.length > 0 
    ? Math.min(Math.max(200 - (safeLastVal / rangeRef) * 180, 0), 200)
    : 100;

  const isCritical = telemetry.risk_level === 'CRITICAL';
  const isWarning = telemetry.risk_level === 'WARNING';

  const badgeClasses = isCritical
    ? "px-4 py-2 bg-error/10 border border-error/30 rounded-lg shadow-[0_0_15px_rgba(255,69,58,0.15)] flex items-center gap-2"
    : isWarning
    ? "px-4 py-2 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-lg shadow-[0_0_15px_rgba(255,170,0,0.15)] flex items-center gap-2"
    : "px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg shadow-[0_0_15px_rgba(0,218,243,0.15)] flex items-center gap-2";
  
  const dotClasses = isCritical ? "w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(255,69,58,0.8)]" : isWarning ? "w-2 h-2 rounded-full bg-[#ffaa00] animate-pulse shadow-[0_0_8px_rgba(255,170,0,0.8)]" : "w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,218,243,0.8)]";
  const statusTextClasses = isCritical ? "text-xs font-mono text-error uppercase tracking-wider font-bold" : isWarning ? "text-xs font-mono text-[#ffaa00] uppercase tracking-wider font-bold" : "text-xs font-mono text-primary uppercase tracking-wider font-bold";
  const strokeColor = isCritical ? "#ff453a" : isWarning ? "#ffaa00" : "#00daf3";

  return (
    <main className="flex-1 p-6 lg:p-8 xl:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      
      {/* Remote Shell Modal */}
      <AnimatePresence>
        {isShellOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-[#0a101c]/95 backdrop-blur-md rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_20px_rgba(0,218,243,0.2)] overflow-hidden border border-primary/40"
            >
              <div className="bg-black/40 border-b border-white/10 px-4 py-3 flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-error"></span>
                  <span className="w-3 h-3 rounded-full bg-[#ffaa00]"></span>
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                </div>
                <span className="text-xs font-mono text-on-surface-variant">root@{machineId} - SSH</span>
                <button onClick={() => setIsShellOpen(false)} className="text-on-surface-variant hover:text-white">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-6 font-mono text-sm h-64 overflow-y-auto bg-black/60 text-primary/80 custom-scrollbar">
                {shellLines.map((line, idx) => (
                  <div key={idx} className="mb-1">{line}</div>
                ))}
                <div className="animate-pulse w-2 h-4 bg-primary inline-block ml-1 mt-1"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="col-span-full flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in mb-2 z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <select 
                value={machineId}
                onChange={handleMachineChange}
                className="appearance-none bg-white/5 border border-white/10 text-xs font-mono text-white tracking-widest uppercase px-3 py-1.5 pr-8 rounded focus:outline-none focus:border-primary/50 cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-colors hover:bg-white/10"
              >
                {machines.length === 0 && <option value={machineId}>{machineId}</option>}
                {machines.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#06080c]">{m.id} - {m.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-mono text-on-surface-variant uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">location_on</span> {telemetry.type || 'Loading...'}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient drop-shadow-md">Machine Detail</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className={badgeClasses}>
            <span className={dotClasses}></span>
            <span className={statusTextClasses}>{telemetry.risk_level || 'STABLE'}</span>
          </div>
          <button onClick={() => setIsShellOpen(true)} className="premium-btn px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-primary rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">terminal</span> Remote Shell
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-6 z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants} className="glass-premium p-5 rounded-2xl relative overflow-hidden group scan-line">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="material-symbols-outlined text-error text-[36px] group-hover:scale-110 transition-transform">speed</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block mb-3 z-10 relative">{telemetry.metrics?.metricA?.label || 'Metric A'}</span>
            <div className="flex items-baseline gap-1 z-10 relative">
              <motion.span key={telemetry.metrics?.metricA?.value} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-on-surface group-hover:text-error transition-colors">{telemetry.metrics?.metricA?.value || '--'}</motion.span>
              <span className="text-sm font-mono text-on-surface-variant">{telemetry.metrics?.metricA?.unit || ''}</span>
            </div>
            <div className="h-6 mt-4 border-t border-white/10 relative z-10 flex items-end">
              <svg className="w-full h-full glow-chart-line-err opacity-80" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={(() => {
                  const arr = historyBuffers.metricA.length > 0 ? historyBuffers.metricA : [50, 50];
                  const max = Math.max(...arr.filter(Number.isFinite), 10);
                  const range = max || 1;
                  return arr.map((v, i) => {
                    const safeV = Number.isFinite(v) ? v : 0;
                    return `${i===0?'M':'L'}${(i/Math.max(arr.length-1, 1))*100},${20 - (safeV/range)*20}`;
                  }).join(' ');
                })()} fill="none" stroke="#ff453a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{ transition: 'd 0.5s linear' }}></path>
              </svg>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-premium p-5 rounded-2xl relative overflow-hidden group scan-line">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="material-symbols-outlined text-[#ffaa00] text-[36px] group-hover:scale-110 transition-transform animate-pulse">sensors</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block mb-3 z-10 relative">{(telemetry as any).metrics?.metricB?.label || 'Metric B'}</span>
            <div className="flex items-baseline gap-1 z-10 relative">
              <motion.span key={(telemetry as any).metrics?.metricB?.value} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-on-surface group-hover:text-[#ffaa00] transition-colors">{(telemetry as any).metrics?.metricB?.value || '--'}</motion.span>
              <span className="text-sm font-mono text-on-surface-variant">{(telemetry as any).metrics?.metricB?.unit || ''}</span>
            </div>
            <div className="h-6 mt-4 border-t border-white/10 relative z-10 flex items-end">
              <svg className="w-full h-full glow-chart-line-warn opacity-80" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={(() => {
                  const arr = historyBuffers.metricB.length > 0 ? historyBuffers.metricB : [50, 50];
                  const max = Math.max(...arr.filter(Number.isFinite), 10);
                  const range = max || 1;
                  return arr.map((v, i) => {
                    const safeV = Number.isFinite(v) ? v : 0;
                    return `${i===0?'M':'L'}${(i/Math.max(arr.length-1, 1))*100},${20 - (safeV/range)*20}`;
                  }).join(' ');
                })()} fill="none" stroke="#ffaa00" strokeLinejoin="round" strokeWidth="2" style={{ transition: 'd 0.5s linear' }}></path>
              </svg>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-premium p-5 rounded-2xl relative overflow-hidden group scan-line">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="material-symbols-outlined text-secondary text-[36px] group-hover:scale-110 transition-transform">memory</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block mb-3 z-10 relative">{(telemetry as any).metrics?.metricC?.label || 'Metric C'}</span>
            <div className="flex items-baseline gap-1 z-10 relative">
              <motion.span key={(telemetry as any).metrics?.metricC?.value} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-on-surface group-hover:text-secondary transition-colors">{(telemetry as any).metrics?.metricC?.value || '--'}</motion.span>
              <span className="text-sm font-mono text-on-surface-variant">{(telemetry as any).metrics?.metricC?.unit || ''}</span>
            </div>
            <div className="h-6 mt-4 border-t border-white/10 relative z-10 flex items-end">
              <svg className="w-full h-full filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] opacity-80" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={(() => {
                  const arr = historyBuffers.metricC.length > 0 ? historyBuffers.metricC : [50, 50];
                  const max = Math.max(...arr.filter(Number.isFinite), 10);
                  const range = max || 1;
                  return arr.map((v, i) => {
                    const safeV = Number.isFinite(v) ? v : 0;
                    return `${i===0?'M':'L'}${(i/Math.max(arr.length-1, 1))*100},${20 - (safeV/range)*20}`;
                  }).join(' ');
                })()} fill="none" stroke="#8b5cf6" strokeLinejoin="round" strokeWidth="2" style={{ transition: 'd 0.5s linear' }}></path>
              </svg>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-premium p-5 rounded-2xl relative overflow-hidden group scan-line">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="material-symbols-outlined text-primary text-[36px] group-hover:scale-110 transition-transform">bolt</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block mb-3 z-10 relative">Power Draw</span>
            <div className="flex items-baseline gap-1 z-10 relative">
              <motion.span key={telemetry.metrics?.metricA?.value} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-on-surface group-hover:text-primary transition-colors">{telemetry.metrics?.metricA?.value ? (parseFloat(telemetry.metrics.metricA.value) * 0.4).toFixed(1) : '--'}</motion.span>
              <span className="text-sm font-mono text-on-surface-variant">kW</span>
            </div>
            <div className="h-6 mt-4 border-t border-white/10 relative z-10 flex items-end">
              <svg className="w-full h-full glow-chart-line opacity-80" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={(() => {
                  const arr = historyBuffers.metricA.length > 0 ? historyBuffers.metricA : [50, 50];
                  const max = Math.max(...arr.filter(Number.isFinite), 10);
                  const range = max || 1;
                  return arr.map((v, i) => {
                    const safeV = Number.isFinite(v) ? v : 0;
                    return `${i===0?'M':'L'}${(i/Math.max(arr.length-1, 1))*100},${20 - (safeV/range)*20}`;
                  }).join(' ');
                })()} fill="none" stroke="#00daf3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{ transition: 'd 0.5s linear' }}></path>
              </svg>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-premium rounded-2xl p-6 flex flex-col h-80"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${isCritical ? 'bg-error/10 border-error/30 shadow-[0_0_10px_rgba(255,69,58,0.2)]' : isWarning ? 'bg-[#ffaa00]/10 border-[#ffaa00]/30 shadow-[0_0_10px_rgba(255,170,0,0.2)]' : 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(0,218,243,0.2)]'}`}>
                <span className={`material-symbols-outlined text-[20px] ${isCritical ? 'text-error animate-pulse' : isWarning ? 'text-[#ffaa00]' : 'text-primary'}`}>monitoring</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Vibration Frequency AI Analysis</h3>
            </div>
            <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
              <button className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider bg-primary/20 text-primary rounded shadow-[0_0_10px_rgba(0,218,243,0.2)]">LIVE</button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-white/5 w-full flex-1"></div>
              <div className="border-t border-white/5 w-full flex-1"></div>
              <div className="border-t border-white/5 w-full flex-1"></div>
              <div className="border-t border-white/5 w-full"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-mono text-on-surface-variant transform translate-y-full pt-3">
              <span>-40s</span><span>-30s</span><span>-20s</span><span>-10s</span><span className={`${isCritical ? 'text-error' : isWarning ? 'text-[#ffaa00]' : 'text-primary'} font-bold glow-text`}>Now</span>
            </div>
            
            <svg className="w-full h-full absolute inset-0 z-10 preserveAspectRatio='none'" viewBox="0 0 800 200">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0"></stop>
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path d={`${chartPath} L800,200 L0,200 Z`} fill="url(#chartFill)"></path>
              <path d={chartPath} fill="none" stroke={strokeColor} strokeLinejoin="round" strokeWidth="3" filter="url(#glow)"></path>
              
              <circle cx="800" cy={lastPoint} fill="#030407" r="5" stroke={strokeColor} strokeWidth="3" filter="url(#glow)"></circle>
              <circle cx="800" cy={lastPoint} fill="none" r="15" stroke={strokeColor} strokeWidth="1.5">
                <animate attributeName="r" dur="2s" repeatCount="indefinite" values="5; 25"></animate>
                <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.8; 0"></animate>
              </circle>
            </svg>
          </div>
        </motion.div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6 z-10 h-full">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`glass-premium rounded-2xl flex flex-col items-center justify-center relative min-h-[250px] p-0 overflow-hidden group ${isCritical ? 'glass-alert' : ''}`}
        >
          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            <span className="material-symbols-outlined text-secondary text-[16px]">view_in_ar</span>
            <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">Digital Twin</span>
          </div>
          
          <div className="absolute top-4 right-4 z-20 text-right">
            <motion.span key={telemetry.riskPercentage} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-on-surface leading-none glow-text block">{telemetry.riskPercentage}</motion.span>
            <span className={`text-[10px] font-mono font-bold ${isCritical ? 'text-error animate-pulse' : isWarning ? 'text-[#ffaa00]' : 'text-primary'} uppercase mt-1 tracking-wider`}>Risk %</span>
          </div>

          <MachineModel machineType={telemetry.type || 'Conveyor Belt'} riskLevel={telemetry.risk_level || 'STABLE'} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-premium rounded-2xl flex flex-col flex-1 min-h-[250px] overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">list_alt</span> Local Event Log
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            <AnimatePresence>
              {alerts.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-on-surface-variant text-center mt-4">
                  No critical events logged.
                </motion.div>
              )}
              {alerts.map((alert) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`p-3 rounded-xl transition-colors group cursor-pointer relative overflow-hidden shadow-lg ${
                    alert.type === 'CRITICAL' ? 'bg-error/10 border border-error/30 hover:bg-error/20' :
                    alert.type === 'WARNING' ? 'bg-[#ffaa00]/10 border border-[#ffaa00]/30 hover:bg-[#ffaa00]/20' :
                    'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    alert.type === 'CRITICAL' ? 'bg-error shadow-[0_0_15px_#ff453a]' :
                    alert.type === 'WARNING' ? 'bg-[#ffaa00] shadow-[0_0_10px_#ffaa00]' : 'bg-white/30'
                  }`}></div>
                  <div className="flex justify-between items-baseline mb-1 pl-2">
                    <span className={`text-[10px] font-mono font-bold tracking-wider ${
                      alert.type === 'CRITICAL' ? 'text-error' :
                      alert.type === 'WARNING' ? 'text-[#ffaa00]' : 'text-on-surface-variant'
                    }`}>{alert.type}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">{alert.time}</span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed pl-2">{alert.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function MachineDetail() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-primary">Loading Machine Data...</div>}>
      <MachineDetailContent />
    </Suspense>
  );
}
