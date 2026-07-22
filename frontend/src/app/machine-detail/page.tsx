'use client';

import { useEffect, useState, Suspense, useRef, useMemo, startTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MachineModel from '@/components/MachineModel';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetryStore, Machine } from '@/store/telemetryStore';
import { socketService } from '@/services/socketService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { TelemetrySparkline } from '@/components/charts/TelemetrySparkline';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

// Extracted Skeletons
function PageSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden pb-8 max-w-[1600px] mx-auto px-4 md:px-0 animate-pulse">
      <div className="flex flex-col gap-6 w-full z-10 mb-8 pt-4">
        <div className="w-64 h-6 bg-surface-solid rounded-full border border-border-subtle"></div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-surface-solid border-2 border-border-strong"></div>
            <div className="flex flex-col gap-3">
              <div className="w-48 h-10 bg-surface-solid rounded-lg"></div>
              <div className="w-72 h-6 bg-surface-solid rounded-md"></div>
            </div>
          </div>
          <div className="w-32 h-10 bg-surface-solid rounded-xl border border-border-strong"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface-solid rounded-3xl border border-border-subtle"></div>)}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 w-full mb-8">
        <div className="lg:col-span-8 h-[400px] bg-surface-solid rounded-3xl border border-border-subtle"></div>
        <div className="lg:col-span-4 h-[400px] bg-surface-solid rounded-3xl border border-border-subtle"></div>
      </div>
    </div>
  );
}

function MachineDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');

  const [activeMachineId, setActiveMachineId] = useState<string>('');
  const fleet = useTelemetryStore((state) => state.fleet);
  const machines = useTelemetryStore((state) => state.machines);
  const alerts = useTelemetryStore((state) => state.alerts);
  const isInitialized = useTelemetryStore((state) => state.isInitialized);
  const activeTelemetry = useTelemetryStore((state) => state.telemetry[activeMachineId]);
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [shellLines, setShellLines] = useState<string[]>([]);
  const shellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isError, setIsError] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ref to track the latest URL ID seen — used to cancel stale async resolutions
  const latestUrlId = useRef<string | null>(urlId);

  // Local history buffers — keyed to the active machine
  const [historyBuffers, setHistoryBuffers] = useState<{
    metricA: number[];
    metricB: number[];
    metricC: number[];
  }>({ metricA: [], metricB: [], metricC: [] });

  // 1. Initial Data Load & URL validation — with stale-resolution guard
  useEffect(() => {
    latestUrlId.current = urlId;

    const initialize = () => {
      if (!isInitialized) return;

      let targetId = urlId;
      if (!targetId) {
        if (machines.length > 0) {
          targetId = machines[0].id;
          // Only redirect if this is still the latest URL context
          if (latestUrlId.current === urlId) {
            router.replace(`/machine-detail?id=${targetId}`);
          }
        } else {
          setIsError(true);
          setIsLoadingInitial(false);
          return;
        }
      } else if (!machines.find(m => m.id === targetId)) {
        setIsError(true);
        setIsLoadingInitial(false);
        return;
      }

      // Guard: only apply state if this URL is still the latest one
      if (latestUrlId.current === urlId) {
        setActiveMachineId(targetId);
        setIsError(false);
        setIsLoadingInitial(false);
      }
    };

    initialize();
  }, [urlId, machines, isInitialized, router]);

  // 2. Socket Lifecycle
  useEffect(() => {
    if (!activeMachineId) return;

    socketService.subscribeMachine(activeMachineId);

    return () => {
      socketService.unsubscribeMachine(activeMachineId);
      // Reset buffers on machine change for clean slate
      setHistoryBuffers({ metricA: [], metricB: [], metricC: [] });
    };
  }, [activeMachineId]);

  // 3. Dropdown Outside Click & Escape Key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // 4. Telemetry Buffering — only runs for the active machine's data key
  useEffect(() => {
    if (!activeMachineId || !activeTelemetry) return;

    const mA = parseFloat(activeTelemetry.metrics?.metricA?.value || '0');
    const mB = parseFloat(activeTelemetry.metrics?.metricB?.value || '0');
    const mC = parseFloat(activeTelemetry.metrics?.metricC?.value || '0');

    setHistoryBuffers(prev => ({
      metricA: [...prev.metricA, mA].slice(-30),
      metricB: [...prev.metricB, mB].slice(-30),
      metricC: [...prev.metricC, mC].slice(-30),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTelemetry, activeMachineId]); // activeTelemetry is a stable selector per machine

  // 5. Shell Simulation — uses a local ref instead of window to prevent double-fire
  useEffect(() => {
    if (!isShellOpen) return;

    let i = 0;
    const seq = [
      "Connecting to secure SSH gateway...",
      "Authenticating RSA key...",
      `Connected to ${activeMachineId} (Ubuntu 22.04.1 LTS)`,
      "root@faccheck-core:~# tail -f /var/log/telemetry.log",
      "[INIT] Sensor matrix calibrated.",
      "[INFO] Data stream nominal.",
    ];

    setShellLines([]);

    // Clear any previous interval before starting a new one
    if (shellIntervalRef.current) clearInterval(shellIntervalRef.current);

    shellIntervalRef.current = setInterval(() => {
      if (i < seq.length) {
        setShellLines(prev => [...prev, seq[i]]);
        i++;
      } else {
        if (shellIntervalRef.current) clearInterval(shellIntervalRef.current);
      }
    }, 500);

    return () => {
      if (shellIntervalRef.current) clearInterval(shellIntervalRef.current);
    };
  }, [isShellOpen, activeMachineId]);

  const filteredMachines = useMemo(() => {
    return machines.filter(m =>
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [machines, searchQuery]);

  const handleMachineSelect = (id: string) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    startTransition(() => {
      router.push(`/machine-detail?id=${id}`);
    });
  };

  // Derive the operational log from global alerts filtered to this machine
  const machineAlerts = useMemo(() =>
    alerts.filter(a => a.tag === activeMachineId).slice(0, 8),
    [alerts, activeMachineId]
  );

  if (isLoadingInitial) {
    return <PageSkeleton />;
  }

  if (isError || !activeMachineId) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden pb-8 h-[80vh]">
        <div className="w-20 h-20 bg-critical/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-critical">link_off</span>
        </div>
        <h2 className="text-3xl font-sans font-bold text-on-surface mb-3 tracking-tight">Machine Not Found</h2>
        <p className="text-on-surface-variant font-mono text-sm mb-8 text-center max-w-md">The requested machine ID does not exist in the active fleet registry, or it has been decommissioned.</p>
        <Link href="/dashboard">
          <Button variant="primary" className="font-bold tracking-wider px-8 py-3 rounded-xl">Return to Operations</Button>
        </Link>
      </div>
    );
  }

  const currentTelemetry = activeTelemetry || {
    id: activeMachineId,
    type: machines.find(m => m.id === activeMachineId)?.type || 'Loading...',
    riskPercentage: '0.0',
    risk_level: 'STABLE',
    vibrationHistory: Array.from({length: 20}, () => 50),
    metrics: null
  };

  const isCritical = currentTelemetry.risk_level === 'CRITICAL';
  const isWarning = currentTelemetry.risk_level === 'WARNING';
  const statusVariant = isCritical ? 'critical' : isWarning ? 'warning' : 'nominal';
  
  // Empty state handling for telemetry
  const isAwaitingTelemetry = !currentTelemetry.metrics || Object.keys(currentTelemetry.metrics).length === 0;

  return (
    <main className="flex-1 w-full flex flex-col relative overflow-hidden pb-8 max-w-[1600px] mx-auto px-4 md:px-0">
      
      {/* Remote Shell Modal */}
      <AnimatePresence>
        {isShellOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-surface-solid rounded-3xl overflow-hidden border border-border-strong shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
            >
              <div className="bg-background border-b border-border-subtle px-6 py-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-critical"></span>
                  <span className="w-3 h-3 rounded-full bg-warning"></span>
                  <span className="w-3 h-3 rounded-full bg-success"></span>
                </div>
                <span className="text-xs font-mono font-bold tracking-wider text-on-surface-variant uppercase">root@{activeMachineId}</span>
                <button onClick={() => setIsShellOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-6 font-mono text-sm h-80 overflow-y-auto bg-background text-primary custom-scrollbar leading-relaxed">
                {shellLines.map((line, idx) => (
                  <div key={idx} className="mb-1 opacity-90">{line}</div>
                ))}
                <div className="animate-pulse w-2 h-4 bg-primary inline-block ml-1 mt-1"></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="flex flex-col gap-6 w-full z-10 mb-8 pt-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant uppercase tracking-widest bg-background/40 w-fit px-3 py-1.5 rounded-full border border-border-subtle">
          <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Global Fleet</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="font-bold">{fleet}</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-primary font-bold">{activeMachineId}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
          <div className="flex items-start md:items-center gap-6">
            <div className={`relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full border-2 bg-surface-solid shadow-lg ${isCritical ? 'border-critical text-critical' : isWarning ? 'border-warning text-warning' : 'border-success text-success'}`}>
              <div className={`absolute inset-0 rounded-full blur-md opacity-20 ${isCritical ? 'bg-critical' : isWarning ? 'bg-warning' : 'bg-success'}`}></div>
              <span className="material-symbols-outlined text-2xl md:text-3xl relative z-10">
                {isCritical ? 'warning' : isWarning ? 'error' : 'check_circle'}
              </span>
            </div>
            
            <div className="flex flex-col w-full md:w-auto">
              <h1 className="text-3xl md:text-5xl font-sans font-semibold tracking-tight text-on-surface mb-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 break-all">
                {activeMachineId}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                
                {/* Searchable Machine Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 bg-surface-solid hover:bg-surface-elevated border border-border-strong text-[10px] font-mono font-bold text-on-surface tracking-widest uppercase px-3 py-1.5 rounded-lg transition-colors shadow-sm focus:outline-none"
                  >
                    <span>Switch Machine</span>
                    <span className={`material-symbols-outlined text-[14px] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-72 popover-surface z-50 overflow-hidden flex flex-col"
                      >
                        <div className="p-3 border-b border-border-subtle bg-background/50">
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                            <input 
                              type="text" 
                              placeholder="Search ID or Type..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-surface-elevated border border-border-strong rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col py-1">
                          {filteredMachines.length === 0 ? (
                            <div className="p-4 text-center text-xs font-mono text-on-surface-variant">No machines found</div>
                          ) : (
                            filteredMachines.map(m => {
                              // Derive pseudo status for dropdown to mimic real app (usually you'd have fleet telemetry map)
                              const t = useTelemetryStore.getState().telemetry[m.id];
                              const isMCrit = t?.risk_level === 'CRITICAL';
                              const isMWarn = t?.risk_level === 'WARNING';
                              const mVar = isMCrit ? 'critical' : isMWarn ? 'warning' : 'nominal';
                              return (
                                <button 
                                  key={m.id}
                                  onClick={() => handleMachineSelect(m.id)}
                                  data-active={m.id === activeMachineId}
                                  className={`popover-item flex items-center justify-between !py-2 ${m.id === activeMachineId ? 'bg-primary/5 text-primary' : 'hover:bg-on-surface/5'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <StatusDot variant={mVar} />
                                    <div className="flex flex-col">
                                      <span className={`text-xs font-mono font-bold ${m.id === activeMachineId ? 'text-primary' : 'text-on-surface'}`}>{m.id}</span>
                                      <span className="text-[10px] text-on-surface-variant font-mono uppercase">{m.type}</span>
                                    </div>
                                  </div>
                                  {m.id === activeMachineId && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Badge variant={statusVariant} text={currentTelemetry.risk_level || 'STABLE'} />
                <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-[12px] mr-1 align-text-bottom">category</span> {currentTelemetry.type || 'Loading...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6 md:mt-0 w-full md:w-auto">
            <Button variant="secondary" onClick={() => setIsShellOpen(true)} className="gap-2 font-mono uppercase tracking-wider text-[10px] font-bold rounded-xl bg-surface-solid border-border-strong hover:bg-surface-elevated px-5 w-full md:w-auto justify-center">
              <span className="material-symbols-outlined text-[16px]">terminal</span> Remote Shell
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full z-10 mb-8">
            {[
              { label: currentTelemetry.metrics?.metricA?.label || 'Metric A', value: currentTelemetry.metrics?.metricA?.value, unit: currentTelemetry.metrics?.metricA?.unit, color: 'var(--color-critical)', hist: historyBuffers.metricA },
              { label: currentTelemetry.metrics?.metricB?.label || 'Metric B', value: currentTelemetry.metrics?.metricB?.value, unit: currentTelemetry.metrics?.metricB?.unit, color: 'var(--color-warning)', hist: historyBuffers.metricB },
              { label: currentTelemetry.metrics?.metricC?.label || 'Metric C', value: currentTelemetry.metrics?.metricC?.value, unit: currentTelemetry.metrics?.metricC?.unit, color: 'var(--color-insight)', hist: historyBuffers.metricC },
              { label: 'Est. Power Draw', value: currentTelemetry.metrics?.metricA?.value ? (parseFloat(currentTelemetry.metrics.metricA.value) * 0.4).toFixed(1) : null, unit: 'kW', color: 'var(--color-primary)', hist: historyBuffers.metricA }
            ].map((metric, idx) => (
              <div key={idx} className="flex flex-col relative group px-6 py-6 bg-background/40 hover:bg-surface-elevated rounded-3xl border border-border-subtle transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider font-bold">{metric.label}</span>
                </div>
                {isAwaitingTelemetry ? (
                  <div className="flex items-baseline gap-1 relative z-10 mt-auto animate-pulse">
                    <div className="w-16 h-8 bg-surface-solid rounded"></div>
                    <div className="w-6 h-4 bg-surface-solid rounded"></div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 relative z-10 mt-auto transition-opacity duration-300">
                    <span className="text-3xl font-sans font-medium text-on-surface tracking-tight">{metric.value || '--'}</span>
                    <span className="text-xs font-sans font-medium text-on-surface-variant ml-1">{metric.unit || ''}</span>
                  </div>
                )}
                {!isAwaitingTelemetry && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 w-full opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <TelemetrySparkline data={metric.hist.length ? metric.hist : [50]} color={metric.color} height={64} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Telemetry & Twin */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 w-full z-10 mb-8">
            
            {/* Main Analytics Chart */}
            <div className="lg:col-span-8 flex flex-col bg-background/40 rounded-3xl border border-border-subtle shadow-sm p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 relative z-10">
                <div>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">monitoring</span> Live Telemetry Analysis
                  </h3>
                  <p className="text-[10px] font-mono text-on-surface-variant tracking-wider uppercase ml-6">High-frequency vibration stream</p>
                </div>
                <Badge variant="nominal" text="STREAMING ACTIVE" className="w-fit" />
              </div>

              <div className="flex-1 w-full min-h-[350px] relative z-10 -ml-4">
                {isAwaitingTelemetry ? (
                  <div className="w-full h-full absolute inset-0 pl-4 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-20 rounded-xl transition-all duration-500">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-3">progress_activity</span>
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-on-surface-variant">Buffering Stream...</span>
                  </div>
                ) : null}
                <ResponsiveContainer width="100%" height="100%" className={`transition-opacity duration-700 ${isAwaitingTelemetry ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                  <AreaChart data={(currentTelemetry.vibrationHistory || Array.from({length: 20}, () => 50)).map((v, i) => ({ time: i, value: v }))}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-warning)' : 'var(--color-primary)'} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-warning)' : 'var(--color-primary)'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                      itemStyle={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 'bold' }}
                      cursor={{ stroke: 'var(--color-on-surface-variant)', strokeWidth: 1, strokeDasharray: '4 4' }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} Hz`, 'Vibration']}
                      labelFormatter={() => ''}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-warning)' : 'var(--color-primary)'}
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Digital Twin */}
            <div className="lg:col-span-4 flex flex-col bg-background/40 rounded-3xl border border-border-subtle shadow-sm overflow-hidden relative min-h-[400px] lg:min-h-auto">
              <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
                <span className="material-symbols-outlined text-insight text-[18px]">view_in_ar</span>
                <span className="text-[10px] font-mono font-bold text-on-surface uppercase tracking-wider">Digital Twin</span>
              </div>
              
              <div className="absolute top-6 right-6 z-20 text-right">
                <span className="text-4xl font-sans font-medium text-on-surface leading-none block tracking-tight">{currentTelemetry.riskPercentage}</span>
                <span className={`text-[10px] font-mono font-bold uppercase mt-1 tracking-wider ${isCritical ? 'text-critical' : isWarning ? 'text-warning' : 'text-on-surface-variant'}`}>Risk Assessment</span>
              </div>

              <div className="w-full h-full absolute inset-0 z-10 pt-10 pb-20">
                <MachineModel machineType={currentTelemetry.type || 'Conveyor Belt'} riskLevel={currentTelemetry.risk_level || 'STABLE'} />
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-surface/70 backdrop-blur-xl border border-border-subtle rounded-2xl p-5 shadow-lg group hover:bg-surface/90 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">AI Inference</span>
                  <Badge variant={statusVariant} text={currentTelemetry.risk_level || 'STABLE'} />
                </div>
                <div className="text-sm text-on-surface font-medium leading-relaxed">
                  {isCritical ? 'Immediate shutdown recommended. Telemetry variance exceeded nominal threshold.' : isWarning ? 'Maintenance required within 48h. Sub-system instability detected.' : 'All mechanical systems operating within established safety parameters.'}
                </div>
              </div>
            </div>
          </div>

      {/* Event Timeline */}
      <div className="w-full z-10 mb-8 bg-background/40 rounded-3xl border border-border-subtle shadow-sm p-6 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">timeline</span> Operational Log
          </h3>
          <Link href={`/alerts`} className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors">
            View All
          </Link>
        </div>
        
        <div className="flex flex-col relative before:absolute before:inset-y-0 before:left-3 before:w-[1px] before:bg-border-strong before:z-0 ml-1">
          {machineAlerts.length === 0 ? (
            <div className="text-xs font-mono text-on-surface-variant py-4 pl-10">No critical events logged in the current session.</div>
          ) : (
            machineAlerts.map((alert) => {
              const alertIsCrit = alert.type === 'CRITICAL';
              const alertIsWarn = alert.type === 'WARNING';
              const color = alertIsCrit ? 'text-critical' : alertIsWarn ? 'text-warning' : 'text-primary';
              const bgColor = alertIsCrit ? 'bg-critical' : alertIsWarn ? 'bg-warning' : 'bg-primary';
              
              return (
                <div key={alert.id} className="relative flex items-start gap-6 py-4 group">
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-background border-2 shadow-sm ${alertIsCrit ? 'border-critical' : alertIsWarn ? 'border-warning' : 'border-primary'}`}>
                    <div className={`w-2 h-2 rounded-full ${bgColor}`}></div>
                  </div>
                  
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 p-5 rounded-2xl border border-transparent hover:border-border-subtle hover:bg-surface-elevated transition-colors cursor-default shadow-none hover:shadow-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={alertIsCrit ? 'critical' : alertIsWarn ? 'warning' : 'neutral'} text={alert.type} />
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">{alert.time}</span>
                      </div>
                      <p className="text-sm text-on-surface font-medium leading-relaxed">{alert.message}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="hidden md:flex text-[10px] font-mono uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 font-bold gap-1 px-3">
                      View Trace <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </main>
  );
}

export default function MachineDetail() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MachineDetailContent />
    </Suspense>
  );
}
