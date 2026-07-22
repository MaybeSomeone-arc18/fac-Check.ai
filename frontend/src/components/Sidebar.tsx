'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useUiStore } from '@/store/uiStore';

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
  const fleet = useTelemetryStore((state) => state.fleet);
  const setFleet = useTelemetryStore((state) => state.setFleet);
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useUiStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  const renderSidebarContent = (expanded: boolean, isMobileDrawer: boolean = false) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`px-4 py-6 md:py-8 border-b border-border-subtle relative z-20 flex flex-col ${expanded ? 'items-start lg:px-6' : 'items-center'}`}>
        <h1 className={`text-xl font-semibold tracking-tight flex items-center justify-center gap-3 text-on-surface w-full ${expanded ? 'lg:justify-start' : ''}`}>
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0">memory</span>
          {expanded && <span className="whitespace-nowrap">FacCheck AI</span>}
        </h1>
        {expanded && <p className="text-[10px] text-on-surface-variant font-mono mt-2 tracking-widest uppercase ml-0 lg:ml-[36px] text-center lg:text-left whitespace-nowrap">Global Operations</p>}
        
        <div className="relative mt-8 w-full" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center px-3 py-3 rounded-[12px] bg-background/50 hover:bg-background border border-border-subtle transition-all duration-300 group ${expanded ? 'justify-between' : 'justify-center'}`}
          >
            <div className={`flex items-center gap-3 overflow-hidden ${expanded ? 'justify-start w-full' : 'justify-center'}`}>
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-primary text-background group-hover:scale-105 transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">space_dashboard</span>
              </div>
              {expanded && <span className="text-[11px] font-mono font-medium tracking-wider text-on-surface group-hover:text-primary transition-colors truncate uppercase">{fleet}</span>}
            </div>
            {expanded && <span className={`material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-all duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}>unfold_more</span>}
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scaleY: 0.98 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -5, scaleY: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ originY: 0 }}
                className="absolute left-0 right-0 top-[110%] mt-2 popover-surface overflow-hidden z-50 py-1 min-w-[200px]"
              >
                {FLEETS.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setFleet(option);
                      setIsDropdownOpen(false);
                    }}
                    data-active={fleet === option}
                    className={`popover-item w-full uppercase tracking-wider text-[10px] text-left ${fleet === option ? 'text-primary bg-primary/5 pl-[14px] border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
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
      <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto px-2 custom-scrollbar">
        {[
          { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/machine-detail', icon: 'precision_manufacturing', label: 'Machine Detail' },
          { path: '/alerts', icon: 'notifications', label: 'Alerts' },
          { path: '/analytics', icon: 'analytics', label: 'Analytics' }
        ].map(item => {
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');
          return (
            <Link 
              key={item.path}
              href={item.path} 
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`px-3 py-3 rounded-[12px] flex items-center gap-4 text-sm font-medium tracking-wide transition-all ${expanded ? 'justify-start lg:px-4' : 'justify-center'} ${
                isActive 
                  ? 'bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 shrink-0 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </div>
      
      {/* Toggle Button (Hidden on Mobile Drawer) */}
      {!isMobileDrawer && (
        <div className="p-4 border-t border-border-subtle flex justify-center shrink-0">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface transition-colors"
            title={expanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {expanded ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
            </span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <nav className={`hidden md:flex flex-col z-40 glass-panel shrink-0 sticky top-4 md:top-6 lg:top-8 h-[calc(100vh-32px)] md:h-[calc(100vh-48px)] lg:h-[calc(100vh-64px)] overflow-hidden transition-all duration-300 ${isExpanded ? 'w-[260px]' : 'w-[80px]'}`}>
        {renderSidebarContent(isExpanded)}
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] flex flex-col z-[100] glass-panel border-r border-border-subtle bg-surface-solid shadow-2xl md:hidden"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-6 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-background/50 text-on-surface hover:bg-on-surface/10 transition-colors z-50"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            {renderSidebarContent(true, true)}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
