'use client';

import { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Alert = {
  id: number;
  type: string;
  time: string;
  message: string;
  tag: string;
};

export default function TopNav() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Fetch initial alerts
    fetch('http://localhost:3001/api/alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setUnreadCount(data.length > 0 ? 3 : 0); // Simulate some unread
      })
      .catch(err => console.error("Failed to load alerts", err));

    socket.connect();
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
    
    socket.on('new_alert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
      socket.off('new_alert');
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="h-20 w-full sticky top-0 z-40 bg-[#06080c]/60 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all duration-300 ${isConnected ? 'border-primary/30 bg-primary/10 shadow-[0_0_15px_rgba(0,218,243,0.15)]' : 'border-error/30 bg-error/10 shadow-[0_0_15px_rgba(255,69,58,0.15)]'}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse transition-colors duration-300 ${isConnected ? 'bg-primary shadow-[0_0_8px_rgba(0,218,243,0.8)]' : 'bg-error shadow-[0_0_8px_rgba(255,69,58,0.8)]'}`}></span>
          <span className={`text-xs font-mono font-semibold tracking-wider transition-colors duration-300 ${isConnected ? 'text-primary' : 'text-error'}`}>
            {isConnected ? 'SYSTEM NOMINAL' : 'RECONNECTING...'}
          </span>
        </div>
      </div>
        <div className="flex items-center gap-6 relative">
        <div className="relative hidden lg:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-72 focus-within:border-primary/50 focus-within:bg-white/10 focus-within:shadow-[0_0_20px_rgba(0,218,243,0.1)] transition-all duration-300">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input 
            className="bg-transparent border-none text-sm text-on-surface focus:ring-0 focus:outline-none w-full placeholder:text-on-surface-variant/50 ml-2" 
            placeholder="Search Machine ID (e.g. LA-02)..." 
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                window.location.href = `/machine-detail?id=${e.currentTarget.value.trim()}`;
              }
            }}
          />
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`text-on-surface-variant hover:text-primary transition-colors relative hover:scale-110 duration-300 ${isNotificationsOpen ? 'text-primary' : ''}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full shadow-[0_0_8px_rgba(255,69,58,0.8)] animate-pulse border border-[#06080c]"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute right-0 top-12 w-96 bg-[#0a101c]/95 backdrop-blur-md rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_20px_rgba(0,218,243,0.15)] overflow-hidden flex flex-col z-50 border border-primary/30"
              >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                  <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-mono text-primary hover:text-white transition-colors uppercase tracking-wider">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar flex flex-col">
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-on-surface-variant font-mono">No notifications</div>
                  ) : (
                    alerts.slice(0, 10).map((alert, idx) => (
                      <div key={idx} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${idx < unreadCount ? 'bg-primary/5' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-mono font-bold tracking-wider ${
                            alert.type === 'CRITICAL' ? 'text-error' : alert.type === 'WARNING' ? 'text-[#ffaa00]' : 'text-primary'
                          }`}>{alert.type}</span>
                          <span className="text-[10px] font-mono text-on-surface-variant">{alert.time}</span>
                        </div>
                        <p className="text-xs text-on-surface mt-1">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-white/10 bg-white/[0.02] text-center">
                  <Link href="/alerts" className="text-[10px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
                    View All Alerts
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
