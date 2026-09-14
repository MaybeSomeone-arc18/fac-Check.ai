'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useUiStore } from '@/store/uiStore';

export default function TopNav() {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const isConnected = useTelemetryStore((state) => state.isConnected);
  const alerts = useTelemetryStore((state) => state.alerts);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);

  // Track previous alert count to detect genuinely NEW alerts after initial load
  const prevAlertCountRef = useRef<number | null>(null);

  useEffect(() => {
    // On first render, establish the baseline silently — don't show badge for existing alerts
    if (prevAlertCountRef.current === null) {
      prevAlertCountRef.current = alerts.length;
      return;
    }
    // Only increment for truly new alerts received after initial load
    if (alerts.length > prevAlertCountRef.current) {
      setUnreadCount(prev => prev + (alerts.length - prevAlertCountRef.current!));
    }
    prevAlertCountRef.current = alerts.length;
  }, [alerts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleMarkAllRead = () => setUnreadCount(0);

  return (
    <header className="h-[64px] md:h-[72px] w-full sticky top-0 md:top-6 lg:top-8 z-40 header-glass flex justify-between items-center px-4 md:px-6 lg:px-8 mb-4 md:mb-6 lg:mb-8 shrink-0 transition-all duration-300 rounded-none md:rounded-2xl">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Hamburger Menu (Mobile only) */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/5 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full border flex items-center gap-2 md:gap-3 transition-all duration-300 ${isConnected ? 'border-success/20 bg-success/10' : 'border-critical/20 bg-critical/10'}`}>
          <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors duration-300 shadow-[0_0_8px_currentColor] shrink-0 ${isConnected ? 'bg-success text-success' : 'bg-critical text-critical'}`}></span>
          <span className={`text-[9px] md:text-[10px] font-mono font-bold tracking-widest uppercase transition-colors duration-300 whitespace-nowrap ${isConnected ? 'text-success' : 'text-critical'}`}>
            {isConnected ? 'SYS NOMINAL' : 'RECONNECT...'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 lg:gap-6 relative">
        {/* Search Bar - hidden on mobile, visible lg */}
        <div className="relative hidden lg:flex items-center bg-background/50 hover:bg-background border border-border-strong rounded-[16px] px-4 py-2.5 w-[320px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-background transition-all duration-300 shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input 
            className="bg-transparent border-none text-sm text-on-surface focus:ring-0 focus:outline-none w-full placeholder:text-on-surface-variant/50 ml-3 font-medium" 
            placeholder="Search Machine ID..." 
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                // Use SPA navigation to preserve store state — not a hard reload
                router.push(`/machine-detail?id=${e.currentTarget.value.trim()}`);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="absolute right-3 px-2 py-0.5 rounded border border-border-strong bg-surface-solid flex items-center justify-center text-[10px] font-mono text-on-surface-variant font-bold shadow-sm">
            ⌘ K
          </div>
        </div>

        {/* GitHub Link */}
        <a 
          href="https://github.com/MaybeSomeone-arc18/fac-Check.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full hover:bg-on-surface/5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors duration-300"
          title="View on GitHub"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        </a>

        {/* Theme Switcher */}
        <div className="relative" ref={themeRef}>
          <button 
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="w-10 h-10 rounded-full hover:bg-on-surface/5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">
              {resolvedTheme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          
          <AnimatePresence>
            {isThemeOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute right-0 top-14 w-44 p-1.5 popover-surface flex flex-col gap-0.5 z-50"
              >
                {(['light', 'dark', 'system'] as const).map((t) => {
                  const isActive = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); setIsThemeOpen(false); }}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-sans font-medium capitalize transition-all duration-150 ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px]">
                          {t === 'light' ? 'light_mode' : t === 'dark' ? 'dark_mode' : 'settings_system_daydream'}
                        </span>
                        <span>{t}</span>
                      </div>
                      {isActive && (
                        <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`w-10 h-10 rounded-full hover:bg-on-surface/5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors duration-300 relative ${isNotificationsOpen ? 'text-on-surface bg-on-surface/5' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-critical rounded-full border-2 border-surface-solid shadow-[0_0_8px_rgba(220,38,38,0.6)]"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute right-0 top-14 w-[300px] sm:w-[360px] md:w-[400px] popover-surface flex flex-col z-50 overflow-hidden shadow-2xl"
              >
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-border-subtle flex justify-between items-center bg-background/50">
                  <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-mono font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider bg-on-surface/5 px-2 py-1 rounded-md">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar flex flex-col bg-background/30">
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-on-surface-variant font-mono">You're all caught up.</div>
                  ) : (
                    alerts.slice(0, 10).map((alert, idx) => (
                      <div key={alert.id} className={`px-6 py-4 border-b border-border-subtle hover:bg-surface-solid transition-colors cursor-pointer group ${idx < unreadCount ? 'bg-primary/5' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider ${
                            alert.type === 'CRITICAL' ? 'bg-critical/10 text-critical' : alert.type === 'WARNING' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                          }`}>{alert.type}</span>
                          <span className="text-[10px] font-mono text-on-surface-variant">{alert.time}</span>
                        </div>
                        <p className="text-sm text-on-surface font-medium leading-relaxed group-hover:text-primary transition-colors">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-border-subtle bg-background/50 text-center">
                  <Link href="/alerts" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors block py-1">
                    View Alert History →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
