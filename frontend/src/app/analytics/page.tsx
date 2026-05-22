'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { socket } from '@/lib/socket';
import { useFleet } from '@/lib/fleetStore';

type MachineTelemetry = {
  id: string;
  riskPercentage: string;
  risk_level: string;
};

type Machine = {
  id: string;
  name: string;
  location: string;
  type: string;
};

export default function Analytics() {
  const { fleet } = useFleet();
  const [timeframe, setTimeframe] = useState('LAST 30 DAYS');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    oee: 82.4,
    yield: 4.2,
    downtime: 14.2,
    quality: 99.1
  });

  const [machines, setMachines] = useState<Machine[]>([]);
  const [telemetry, setTelemetry] = useState<Record<string, MachineTelemetry>>({});
  
  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Fake chart paths for different timeframes
  const [chartPaths, setChartPaths] = useState({
    primary: "M0,100 L100,120 L200,80 L300,110 L400,60 L500,70 L600,40 L700,90 L800,50 L900,30 L1000,45",
    secondary: "M0,180 L100,190 L200,150 L300,210 L400,140 L500,180 L600,160 L700,190 L800,140 L900,160 L1000,120"
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`)
      .then(res => res.json())
      .then(data => {
        setMachines(data);
        socket.connect();
        data.forEach((m: Machine) => socket.emit('subscribe_machine', m.id));
      })
      .catch(err => console.error(err));

    socket.on('machine_telemetry', (data: MachineTelemetry) => {
      setTelemetry(prev => ({ ...prev, [data.id]: data }));
      
      setChartHistory(prev => {
        // Use last value or the current fleet's metricsRef baseline
        const lastOee = prev.oee.length > 0 ? prev.oee[prev.oee.length - 1] : metricsRef.current.oee;
        const lastYield = prev.yield.length > 0 ? prev.yield[prev.yield.length - 1] : metricsRef.current.yield;

        let nextOee = +(lastOee + (Math.random() * 1.6 - 0.8)).toFixed(1);
        let nextYield = +(lastYield + (Math.random() * 0.4 - 0.2)).toFixed(1);

        // Clamping to avoid running off to infinity
        if (nextOee > 99) nextOee = 99;
        if (nextOee < 30) nextOee = 30;
        if (nextYield > 8) nextYield = 8;
        if (nextYield < 1) nextYield = 1;

        const newOee = [...prev.oee, nextOee];
        const newYield = [...prev.yield, nextYield];
        
        if (newOee.length > 50) newOee.shift();
        if (newYield.length > 50) newYield.shift();
        
        return { oee: newOee, yield: newYield };
      });
    });

    return () => {
      machines.forEach(m => socket.emit('unsubscribe_machine', m.id));
      socket.off('machine_telemetry');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [chartHistory, setChartHistory] = useState<{oee: number[], yield: number[]}>({ oee: [], yield: [] });

  useEffect(() => {
    // Generate some fake metrics variation based on fleet changes
    let baseOee = 85;
    if (fleet === 'Conveyor Belt Fleet') baseOee = 78;
    if (fleet === 'Robot Arm Fleet') baseOee = 92;
    if (fleet === 'High Risk Machines') baseOee = 45;

    setMetrics({
      oee: +(baseOee + Math.random() * 5).toFixed(1),
      yield: +(3 + Math.random() * 3).toFixed(1),
      downtime: +(10 + Math.random() * 8).toFixed(1),
      quality: +(90 + Math.random() * 9).toFixed(1)
    });
    
    // Clear history on filter change to immediately reflect new baseline
    setChartHistory({ oee: [], yield: [] });
  }, [fleet, timeframe]);

  // Dynamically build paths from chartHistory
  useEffect(() => {
    const oeeArr = chartHistory.oee.length > 0 ? chartHistory.oee : [metrics.oee];
    const yieldArr = chartHistory.yield.length > 0 ? chartHistory.yield : [metrics.yield];
    
    const buildPath = (arr: number[], baseScale: number, isYield = false) => {
      const validArr = arr.filter(Number.isFinite);
      const maxVal = isYield ? Math.max(...validArr, 10) : 100;
      return arr.map((val, i) => {
        const safeVal = Number.isFinite(val) ? val : 0;
        const x = (i / Math.max(arr.length - 1, 1)) * 1000;
        const y = isYield ? 250 - (safeVal / maxVal) * 100 : 250 - (safeVal / maxVal) * 200;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(' ');
    };

    setChartPaths({
      primary: buildPath(oeeArr, 100),
      secondary: buildPath(yieldArr, 100, true)
    });
  }, [chartHistory, metrics.oee, metrics.yield]);

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    setIsTimeframeOpen(false);
    setIsLoading(true);
    
    setTimeout(() => {
      setMetrics(prev => ({
        oee: +(prev.oee - 2 + Math.random() * 4).toFixed(1),
        yield: +(3 + Math.random() * 3).toFixed(1),
        downtime: +(10 + Math.random() * 8).toFixed(1),
        quality: +(95 + Math.random() * 4.9).toFixed(1)
      }));
      setIsLoading(false);
    }, 1200);
  };



  // Filter and sort machines
  const displayMachines = machines
    .filter(m => {
      if (fleet === 'Conveyor Belt Fleet' && m.type !== 'Conveyor Belt') return false;
      if (fleet === 'Robot Arm Fleet' && m.type !== 'Robot Arm') return false;
      if (fleet === 'Sealing Machines' && m.type !== 'Sealing Machine') return false;
      if (fleet === 'Filling Machines' && m.type !== 'Filling Machine') return false;
      
      const tel = telemetry[m.id];
      if (fleet === 'High Risk Machines' && tel?.risk_level !== 'CRITICAL' && tel?.risk_level !== 'WARNING') return false;

      if (riskFilter === 'ALL') return true;
      return tel?.risk_level === 'CRITICAL' || tel?.risk_level === 'WARNING';
    })
    .sort((a, b) => {
      const riskA = parseFloat(telemetry[a.id]?.riskPercentage || '0');
      const riskB = parseFloat(telemetry[b.id]?.riskPercentage || '0');
      return riskB - riskA;
    });

  return (
    <main className="flex-1 p-6 lg:p-8 xl:p-10 space-y-8 relative">
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none animate-pulse-slow"></div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-fade-in mb-4 relative z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Global Fleet Analytics</h2>
          <p className="text-sm font-mono text-on-surface-variant mt-2 tracking-wider">Aggregated performance and historical predictive trends.</p>
        </div>
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-colors text-[10px] font-mono font-bold text-on-surface uppercase tracking-wider h-full"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {timeframe}
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            
            <AnimatePresence>
              {isTimeframeOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-12 w-48 bg-[#0a101c]/95 backdrop-blur-md rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_20px_rgba(0,218,243,0.15)] overflow-hidden z-50 flex flex-col border border-primary/30"
                >
                  {['LAST 7 DAYS', 'LAST 30 DAYS', 'LAST 90 DAYS', 'YEAR TO DATE'].map(tf => (
                    <button 
                      key={tf}
                      onClick={() => handleTimeframeChange(tf)}
                      className={`px-4 py-3 text-left text-xs font-mono font-bold tracking-wider hover:bg-white/10 transition-colors ${timeframe === tf ? 'text-primary' : 'text-on-surface'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in stagger-1 relative z-10">
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          {isLoading && <div className="absolute inset-0 bg-[#06080c]/50 backdrop-blur-sm z-20 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>}
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-primary text-[40px] group-hover:scale-110 transition-transform">analytics</span>
          </div>
          <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Fleet OEE</span>
          <div className="flex items-end gap-2 mt-auto">
            <span className="text-4xl font-mono font-bold text-on-surface glow-text">{metrics.oee.toFixed(1)}</span>
            <span className="text-lg font-mono text-on-surface-variant">%</span>
          </div>
          <div className="mt-4 text-[10px] font-mono font-bold text-primary tracking-wider uppercase flex items-center gap-1 z-10">
            <span className="material-symbols-outlined text-[14px]">trending_up</span> +2.4% vs prev
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          {isLoading && <div className="absolute inset-0 bg-[#06080c]/50 backdrop-blur-sm z-20 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>}
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-[#ffaa00] text-[40px] group-hover:scale-110 transition-transform">precision_manufacturing</span>
          </div>
          <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Yield Variance</span>
          <div className="flex items-end gap-2 mt-auto">
            <span className="text-4xl font-mono font-bold text-on-surface">{metrics.yield.toFixed(1)}</span>
            <span className="text-lg font-mono text-on-surface-variant">%</span>
          </div>
          <div className="mt-4 text-[10px] font-mono font-bold text-[#ffaa00] tracking-wider uppercase flex items-center gap-1 z-10">
            <span className="material-symbols-outlined text-[14px]">trending_down</span> -0.8% vs prev
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group border-error/20">
          {isLoading && <div className="absolute inset-0 bg-[#06080c]/50 backdrop-blur-sm z-20 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>}
          <div className="absolute inset-0 bg-gradient-to-b from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-error text-[40px] group-hover:scale-110 transition-transform">schedule</span>
          </div>
          <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Unplanned Downtime</span>
          <div className="flex items-end gap-2 mt-auto relative z-10">
            <span className="text-4xl font-mono font-bold text-error drop-shadow-[0_0_10px_rgba(255,69,58,0.5)]">{metrics.downtime.toFixed(1)}</span>
            <span className="text-lg font-mono text-on-surface-variant">hrs</span>
          </div>
          <div className="mt-4 text-[10px] font-mono font-bold text-error tracking-wider uppercase flex items-center gap-1 z-10 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">warning</span> Action Required
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          {isLoading && <div className="absolute inset-0 bg-[#06080c]/50 backdrop-blur-sm z-20 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>}
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-secondary text-[40px] group-hover:scale-110 transition-transform">verified</span>
          </div>
          <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Quality Score</span>
          <div className="flex items-end gap-2 mt-auto">
            <span className="text-4xl font-mono font-bold text-on-surface">{metrics.quality.toFixed(1)}</span>
            <span className="text-lg font-mono text-on-surface-variant">%</span>
          </div>
          <div className="mt-4 text-[10px] font-mono font-bold text-on-surface-variant tracking-wider uppercase flex items-center gap-1 z-10">
            <span className="material-symbols-outlined text-[14px]">horizontal_rule</span> Steady trend
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl flex flex-col h-96 animate-fade-in stagger-2 relative z-10">
        {isLoading && <div className="absolute inset-0 bg-[#06080c]/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-lg border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[20px] drop-shadow-[0_0_8px_rgba(0,218,243,0.5)]">monitoring</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Overall Equipment Effectiveness (OEE) Trend</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,218,243,0.8)]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">Line A</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">Line B</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative mt-2">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-white/5 w-full flex-1"></div>
            <div className="border-t border-white/5 w-full flex-1"></div>
            <div className="border-t border-white/5 w-full flex-1"></div>
            <div className="border-t border-white/5 w-full"></div>
          </div>
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-mono text-on-surface-variant -ml-8 py-2">
            <span>100</span><span>80</span><span>60</span><span>40</span>
          </div>
          
          <svg className="w-full h-full absolute inset-0 z-10 preserveAspectRatio='none'" viewBox="0 0 1000 300">
            <defs>
              <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-secondary" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d={chartPaths.primary} fill="none" stroke="#00daf3" strokeLinejoin="round" strokeWidth="3" filter="url(#glow-primary)"></path>
            <path d={chartPaths.secondary} fill="none" stroke="#8b5cf6" strokeLinejoin="round" strokeWidth="3" filter="url(#glow-secondary)"></path>
            <circle cx="1000" cy="45" r="5" fill="#030407" stroke="#00daf3" strokeWidth="2" filter="url(#glow-primary)"></circle>
            <circle cx="1000" cy="120" r="5" fill="#030407" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow-secondary)"></circle>
          </svg>

          <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-mono text-on-surface-variant transform translate-y-full pt-4 px-2">
            <span>May 01</span><span>May 08</span><span>May 15</span><span className="text-primary font-bold">May 22</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden mt-10 animate-fade-in stagger-3 relative z-10 border border-white/10">
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center relative">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error drop-shadow-[0_0_8px_rgba(255,69,58,0.5)]">warning</span>
            Underperforming Assets
          </h3>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-primary hover:text-white text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span> FILTER: {riskFilter}
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-8 w-40 bg-[#0a101c]/95 backdrop-blur-md rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_20px_rgba(0,218,243,0.15)] overflow-hidden z-50 flex flex-col border border-primary/30"
                >
                  <button onClick={() => { setRiskFilter('HIGH'); setIsFilterOpen(false); }} className={`px-4 py-2 text-left text-xs font-mono font-bold hover:bg-white/10 ${riskFilter === 'HIGH' ? 'text-primary' : 'text-on-surface'}`}>Risk: HIGH</button>
                  <button onClick={() => { setRiskFilter('ALL'); setIsFilterOpen(false); }} className={`px-4 py-2 text-left text-xs font-mono font-bold hover:bg-white/10 ${riskFilter === 'ALL' ? 'text-primary' : 'text-on-surface'}`}>Risk: ALL</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-bold">Asset ID</th>
                <th className="p-4 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-bold">Location</th>
                <th className="p-4 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-bold">Current OEE</th>
                <th className="p-4 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-bold">AI Predicted Risk</th>
                <th className="p-4 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayMachines.map(machine => {
                const tel = telemetry[machine.id];
                if (!tel) return null;
                
                const riskVal = parseFloat(tel.riskPercentage || '0');
                const oeeVal = Math.max(0, 100 - riskVal).toFixed(1);
                const isCritical = tel.risk_level === 'CRITICAL';
                const isWarning = tel.risk_level === 'WARNING';
                
                const textColor = isCritical ? 'text-error' : isWarning ? 'text-[#ffaa00]' : 'text-primary';
                const bgColor = isCritical ? 'bg-error' : isWarning ? 'bg-[#ffaa00]' : 'bg-primary';
                const shadowColor = isCritical ? '#ff453a' : isWarning ? '#ffaa00' : '#00daf3';

                return (
                  <tr key={machine.id} className="table-row-glass group">
                    <td className="p-4 font-mono text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{machine.id}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{machine.type}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${bgColor} shadow-[0_0_8px_${shadowColor}]`} style={{ width: `${oeeVal}%` }}></div>
                        </div>
                        <span className={`font-mono text-sm font-bold ${textColor}`}>{oeeVal}%</span>
                      </div>
                    </td>
                    <td className={`p-4 font-mono text-sm font-bold ${textColor}`}>
                      {tel.risk_level} ({tel.riskPercentage}%)
                    </td>
                    <td className="p-4">
                      <Link href={`/machine-detail?id=${machine.id}`} className="premium-btn text-[10px] font-mono font-bold tracking-wider px-3 py-1.5 rounded-lg text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        INSPECT <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {displayMachines.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-mono text-sm">
                    No machines match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
