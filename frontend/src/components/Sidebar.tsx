'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFleet } from '@/lib/fleetStore';

const FLEETS = [
  'All Fleets',
  'Conveyor Belt Fleet',
  'Robot Arm Fleet',
  'Sealing Machines',
  'Filling Machines',
  'High Risk Machines'
];

export default function Sidebar() {
  const pathname = usePathname();
  const { fleet, setFleet } = useFleet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="hidden md:flex w-[260px] h-screen fixed left-0 top-0 border-r border-white/10 bg-[#06080c]/80 backdrop-blur-2xl flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Brand */}
      <div className="px-6 py-8 border-b border-white/5 relative z-20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px] drop-shadow-[0_0_10px_rgba(0,218,243,0.8)]">memory</span>
          <span className="text-gradient">FacCheckAI</span>
        </h1>
        <p className="text-xs text-on-surface-variant font-mono mt-2 tracking-widest uppercase">Global Operations</p>
        
        <div className="relative mt-6">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 group shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full border border-primary/40 bg-primary/10 group-hover:bg-primary/20 group-hover:border-primary/60 transition-all duration-300 relative shadow-[0_0_10px_rgba(0,218,243,0.2)]">
                <span className="material-symbols-outlined text-[14px] text-primary group-hover:glow-text">space_dashboard</span>
              </div>
              <span className="text-xs font-semibold tracking-wider text-on-surface group-hover:text-primary transition-colors truncate uppercase">{fleet}</span>
            </div>
            <span className={`material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>unfold_more</span>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ originY: 0 }}
                className="absolute left-0 right-0 top-[110%] mt-2 bg-[#0a0d14] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
              >
                {FLEETS.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setFleet(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-mono font-bold tracking-wider hover:bg-white/10 transition-colors uppercase ${fleet === option ? 'text-primary bg-primary/5' : 'text-on-surface-variant'}`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
        <Link href="/dashboard" className={`glass-nav-item border-l-4 px-6 py-3.5 flex items-center gap-4 text-sm font-medium tracking-wide ${pathname === '/dashboard' || pathname === '/' ? 'active' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          Dashboard
        </Link>
        <Link href="/machine-detail" className={`glass-nav-item border-l-4 px-6 py-3.5 flex items-center gap-4 text-sm font-medium tracking-wide ${pathname === '/machine-detail' ? 'active' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
          Machine Detail
        </Link>
        <Link href="/alerts" className={`glass-nav-item border-l-4 px-6 py-3.5 flex items-center gap-4 text-sm font-medium tracking-wide ${pathname === '/alerts' ? 'active' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          Alerts
        </Link>
        <Link href="/analytics" className={`glass-nav-item border-l-4 px-6 py-3.5 flex items-center gap-4 text-sm font-medium tracking-wide ${pathname === '/analytics' ? 'active' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[20px]">analytics</span>
          Analytics
        </Link>
      </div>

    </nav>
  );
}
