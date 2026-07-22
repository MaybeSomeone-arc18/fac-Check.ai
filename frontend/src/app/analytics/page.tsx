'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTelemetryStore } from '@/store/telemetryStore';
import { socketService } from '@/services/socketService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/features/MetricCard';
import { OEEAreaChart } from '@/components/charts/OEEAreaChart';

export default function Analytics() {
  const fleet = useTelemetryStore((state) => state.fleet);
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const machines = useTelemetryStore((state) => state.machines);
  const isInitialized = useTelemetryStore((state) => state.isInitialized);
  
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

  const [chartHistory, setChartHistory] = useState<{ time: string; oee: number; yield: number }[]>([]);

  const timeframeRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(e.target as Node)) {
        setIsTimeframeOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTimeframeOpen(false);
        setIsFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    // Generate metrics variation based on fleet changes
    let baseOee = 85;
    if (fleet === 'Conveyor Belt Fleet') baseOee = 78;
    if (fleet === 'Robot Arm Fleet') baseOee = 92;
    if (fleet === 'High Risk Machines') baseOee = 45;

    const newMetrics = {
      oee: +(baseOee + Math.random() * 5).toFixed(1),
      yield: +(3 + Math.random() * 3).toFixed(1),
      downtime: +(10 + Math.random() * 8).toFixed(1),
      quality: +(90 + Math.random() * 9).toFixed(1)
    };

    // Generate distinct X-axis categories and dataset lengths per timeframe
    let initialHistory: { time: string; oee: number; yield: number }[] = [];
    if (timeframe === 'LAST 7 DAYS') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      initialHistory = days.map(d => ({
        time: d,
        oee: Math.max(30, Math.min(100, +(newMetrics.oee + (Math.random() * 10 - 5)).toFixed(1))),
        yield: Math.max(1, Math.min(10, +(newMetrics.yield + (Math.random() * 2 - 1)).toFixed(1)))
      }));
    } else if (timeframe === 'LAST 30 DAYS') {
      initialHistory = Array.from({ length: 30 }, (_, i) => ({
        time: `Day ${i + 1}`,
        oee: Math.max(30, Math.min(100, +(newMetrics.oee + (Math.random() * 10 - 5)).toFixed(1))),
        yield: Math.max(1, Math.min(10, +(newMetrics.yield + (Math.random() * 2 - 1)).toFixed(1)))
      }));
    } else if (timeframe === 'LAST 90 DAYS') {
      initialHistory = Array.from({ length: 12 }, (_, i) => ({
        time: `Wk ${i + 1}`,
        oee: Math.max(30, Math.min(100, +(newMetrics.oee + (Math.random() * 10 - 5)).toFixed(1))),
        yield: Math.max(1, Math.min(10, +(newMetrics.yield + (Math.random() * 2 - 1)).toFixed(1)))
      }));
    } else if (timeframe === 'YEAR TO DATE') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      initialHistory = months.map(m => ({
        time: m,
        oee: Math.max(30, Math.min(100, +(newMetrics.oee + (Math.random() * 10 - 5)).toFixed(1))),
        yield: Math.max(1, Math.min(10, +(newMetrics.yield + (Math.random() * 2 - 1)).toFixed(1)))
      }));
    } else {
      initialHistory = Array.from({ length: 30 }, (_, i) => ({
        time: `Day ${i + 1}`,
        oee: Math.max(30, Math.min(100, +(newMetrics.oee + (Math.random() * 10 - 5)).toFixed(1))),
        yield: Math.max(1, Math.min(10, +(newMetrics.yield + (Math.random() * 2 - 1)).toFixed(1)))
      }));
    }

    const timer = setTimeout(() => {
      setMetrics(newMetrics);
      setChartHistory(initialHistory);
    }, 0);
    return () => clearTimeout(timer);
  }, [fleet, timeframe]);

  // Handle live updates to chart history without corrupting X-axis category keys
  useEffect(() => {
    const interval = setInterval(() => {
      setChartHistory(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        const last = updated[lastIdx];
        
        let nextOee = last.oee + (Math.random() * 2 - 1);
        let nextYield = last.yield + (Math.random() * 0.4 - 0.2);

        nextOee = Math.max(30, Math.min(99, nextOee));
        nextYield = Math.max(1, Math.min(8, nextYield));

        updated[lastIdx] = {
          ...last,
          oee: parseFloat(nextOee.toFixed(1)),
          yield: parseFloat(nextYield.toFixed(1))
        };
        
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const timeframeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    setIsTimeframeOpen(false);
    setIsLoading(true);

    if (timeframeTimerRef.current) clearTimeout(timeframeTimerRef.current);
    timeframeTimerRef.current = setTimeout(() => {
      setMetrics(prev => ({
        // Clamp to realistic ranges: OEE 0-100, quality max 99.9%
        oee: Math.min(100, Math.max(0, +(prev.oee - 2 + Math.random() * 4).toFixed(1))),
        yield: +(3 + Math.random() * 3).toFixed(1),
        downtime: +(10 + Math.random() * 8).toFixed(1),
        quality: Math.min(99.9, +(95 + Math.random() * 4.9).toFixed(1))
      }));
      setIsLoading(false);
    }, 800);
  };

  // Filter and sort machines
  const displayMachines = useMemo(() => {
    return machines
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
  }, [machines, telemetry, fleet, riskFilter]);

  // Sync subscriptions — use a ref to track subscribed IDs, avoiding stale closures
  const subscribedAnalyticsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isInitialized) return;

    const nextIds = new Set(displayMachines.map(m => m.id));
    const current = subscribedAnalyticsRef.current;

    // Unsubscribe from machines no longer displayed
    current.forEach(id => {
      if (!nextIds.has(id)) {
        socketService.unsubscribeMachine(id);
        current.delete(id);
      }
    });

    // Subscribe to newly displayed machines
    displayMachines.forEach(m => {
      if (!current.has(m.id)) {
        socketService.subscribeMachine(m.id);
        current.add(m.id);
      }
    });

    return () => {
      current.forEach(id => socketService.unsubscribeMachine(id));
      current.clear();
    };
  }, [displayMachines, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex-1 w-full space-y-6 xl:space-y-8 relative overflow-hidden pb-8 animate-pulse">
        <div className="w-64 h-8 bg-surface-solid rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface-solid rounded-3xl"></div>)}
        </div>
        <div className="h-[400px] w-full bg-surface-solid rounded-3xl mt-8"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full space-y-6 xl:space-y-8 relative overflow-hidden pb-8">
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-insight/5 rounded-full blur-[150px] pointer-events-none animate-pulse-slow"></div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-fade-in mb-4 relative z-30">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Global Fleet Analytics</h2>
          <p className="text-sm font-mono text-on-surface-variant mt-2 tracking-wider">Aggregated performance and historical predictive trends.</p>
        </div>
        
        <div className="relative" ref={timeframeRef}>
          <Button 
            variant="secondary"
            onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
            className="gap-2 font-mono uppercase tracking-wider text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            {timeframe}
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </Button>
          
          <AnimatePresence>
            {isTimeframeOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-48 popover-surface overflow-hidden z-50 flex flex-col"
              >
                <div className="py-1">
                  {['LAST 7 DAYS', 'LAST 30 DAYS', 'LAST 90 DAYS', 'YEAR TO DATE'].map(tf => (
                    <button 
                      key={tf}
                      onClick={() => handleTimeframeChange(tf)}
                      data-active={timeframe === tf}
                      className={`popover-item w-full ${timeframe === tf ? 'text-primary bg-primary/5 pl-[14px] border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        <MetricCard 
          label="Fleet OEE"
          value={metrics.oee.toFixed(1)}
          unit="%"
          trend="up"
          trendValue="+2.4% vs prev"
          icon="analytics"
          isLoading={isLoading}
        />
        <MetricCard 
          label="Yield Variance"
          value={metrics.yield.toFixed(1)}
          unit="%"
          trend="down"
          trendValue="-0.8% vs prev"
          icon="precision_manufacturing"
          iconColor="text-warning"
          isLoading={isLoading}
        />
        <MetricCard 
          label="Unplanned Downtime"
          value={metrics.downtime.toFixed(1)}
          unit="hrs"
          trend="down"
          trendValue="Action Required"
          icon="schedule"
          iconColor="text-critical"
          isLoading={isLoading}
        />
        <MetricCard 
          label="Quality Score"
          value={metrics.quality.toFixed(1)}
          unit="%"
          trend="neutral"
          trendValue="Steady trend"
          icon="verified"
          iconColor="text-insight"
          isLoading={isLoading}
        />
      </div>

      <Card variant="glass" className="h-[400px] flex flex-col relative z-10 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-solid rounded-lg border border-border-strong hidden sm:block">
              <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">Overall Equipment Effectiveness (OEE) Trend</h3>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">OEE %</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-insight"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">Yield %</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg transition-opacity duration-300">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          )}
          <div className={`transition-opacity duration-500 w-full h-full ${isLoading ? 'opacity-30 grayscale' : 'opacity-100'}`}>
            <OEEAreaChart data={chartHistory} height={300} />
          </div>
        </div>
      </Card>

      <Card variant="glass" padding="none" className="overflow-hidden relative z-10 mt-6">
        <div className="p-6 border-b border-border-subtle bg-surface-solid flex justify-between items-center relative">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-warning">warning</span>
            Underperforming Assets
          </h3>
          <div className="relative" ref={filterRef}>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-primary hover:text-primary-hover font-mono font-bold tracking-wider text-[10px] uppercase flex gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span> FILTER: {riskFilter}
            </Button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-10 w-40 popover-surface overflow-hidden z-50 flex flex-col"
                >
                  <div className="py-1">
                    <button 
                      onClick={() => { setRiskFilter('HIGH'); setIsFilterOpen(false); }} 
                      data-active={riskFilter === 'HIGH'}
                      className={`popover-item w-full ${riskFilter === 'HIGH' ? 'text-primary bg-primary/5 pl-[14px] border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      Risk: HIGH
                    </button>
                    <button 
                      onClick={() => { setRiskFilter('ALL'); setIsFilterOpen(false); }} 
                      data-active={riskFilter === 'ALL'}
                      className={`popover-item w-full ${riskFilter === 'ALL' ? 'text-primary bg-primary/5 pl-[14px] border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      Risk: ALL
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="overflow-x-auto p-2 md:p-6 custom-scrollbar w-full">
          <table className="w-full text-left border-separate border-spacing-y-2 min-w-[800px]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-semibold">Asset ID</th>
                <th className="px-6 py-3 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-semibold">Location</th>
                <th className="px-6 py-3 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-semibold">Current OEE</th>
                <th className="px-6 py-3 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-semibold">AI Predicted Risk</th>
                <th className="px-6 py-3 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayMachines.map(machine => {
                const tel = telemetry[machine.id];
                const riskVal = parseFloat(tel?.riskPercentage || '0');
                const oeeVal = Math.max(0, 100 - riskVal).toFixed(1);
                const isCritical = tel?.risk_level === 'CRITICAL';
                const isWarning = tel?.risk_level === 'WARNING';
                
                const textColor = isCritical ? 'text-critical' : isWarning ? 'text-warning' : 'text-primary';
                const bgColor = isCritical ? 'bg-critical' : isWarning ? 'bg-warning' : 'bg-primary';

                return (
                  <tr key={machine.id} className="bg-background/40 hover:bg-surface-elevated transition-colors group cursor-pointer shadow-sm hover:shadow-md">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-on-surface group-hover:text-primary transition-colors rounded-l-2xl border-y border-l border-border-subtle">{machine.id}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant border-y border-border-subtle">{machine.type}</td>
                    <td className="px-6 py-4 border-y border-border-subtle">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className={`h-full ${bgColor}`} style={{ width: `${oeeVal}%` }}></div>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${textColor}`}>{oeeVal}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-y border-border-subtle">
                      {tel ? (
                        <Badge variant={isCritical ? 'critical' : isWarning ? 'warning' : 'nominal'} text={`${tel.risk_level} (${tel.riskPercentage}%)`} />
                      ) : (
                        <Badge variant="neutral" text="AWAITING TELEMETRY" />
                      )}
                    </td>
                    <td className="px-6 py-4 rounded-r-2xl border-y border-r border-border-subtle">
                      <Link href={`/machine-detail?id=${machine.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-[10px] font-mono uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 font-semibold gap-1">
                          Inspect <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {displayMachines.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-mono text-sm bg-background/40 rounded-2xl border border-border-subtle">
                    No machines match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
