import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTelemetryContext } from '../hooks/useTelemetry';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Activity, 
  AlertTriangle, 
  Terminal, 
  FileText, 
  Sliders, 
  Wifi, 
  Battery, 
  Clock,
  Compass
} from 'lucide-react';

export default function DashboardLayout() {
  const { telemetry, logs } = useTelemetryContext();
  const location = useLocation();
  const [time, setTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload CSV', path: '/upload', icon: UploadCloud },
    { name: 'Health Status', path: '/health', icon: Activity },
    { name: 'Fault History', path: '/faults', icon: AlertTriangle },
    { name: 'AI Assistant', path: '/assistant', icon: Terminal },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-space-950 flex flex-col font-mono selection:bg-space-orange selection:text-space-950">
      
      {/* HEADER SECTION */}
      <header className="border-b border-space-600/30 bg-space-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-space-orange/60 flex items-center justify-center animate-pulse-subtle shadow-glow-orange">
            <Compass className="w-5 h-5 text-space-orange" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-widest text-slate-100 flex items-center gap-2">
              SPACE ROVER AI <span className="text-xs text-space-orange animate-pulse">// JPL ACTIVE SYSTEM</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-sans">MISSION DEEP SPACE CONTROLLER // UNIT ID: SR-09</p>
          </div>
        </div>

        {/* Live Metrics Header Bar */}
        <div className="hidden md:flex items-center gap-6 text-[11px] text-slate-300">
          <div className="flex items-center gap-2 border-r border-space-600/30 pr-6">
            <Clock className="w-4 h-4 text-space-cyan" />
            <span>{time}</span>
          </div>

          <div className="flex items-center gap-2 border-r border-space-600/30 pr-6">
            <Wifi className={`w-4 h-4 ${telemetry.signalStrength === 'STRONG' ? 'text-space-cyan' : 'text-yellow-500'}`} />
            <span>DSN LINK: <strong className={telemetry.signalStrength === 'STRONG' ? 'text-space-cyan' : 'text-yellow-500'}>{telemetry.signalStrength}</strong></span>
          </div>

          <div className="flex items-center gap-2 border-r border-space-600/30 pr-6">
            <span>LATENCY: <strong className="text-space-cyan">{telemetry.latency} ms</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span>PWR: <strong className="text-emerald-400">{telemetry.battery}%</strong></span>
          </div>
        </div>
      </header>

      {/* BODY SECTION (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 border-r border-space-600/30 bg-space-900/50 flex flex-col justify-between shrink-0">
          <nav className="p-4 space-y-1">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest px-3 mb-3">SYSTEM DIRECTORY</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-all duration-200 border ${
                    isActive 
                      ? 'bg-space-orange/10 border-space-orange text-space-orange shadow-glow-orange font-semibold' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-space-800/40 hover:border-space-600/20'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-space-orange' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-space-600/20 text-[10px] text-slate-500 font-sans space-y-1 bg-space-950/40">
            <div>COORDINATES:</div>
            <div className="text-space-cyan font-mono text-[9px]">
              X: {telemetry.coordinates.x} | Y: {telemetry.coordinates.y}
            </div>
            <div>HEADING: <span className="text-slate-300 font-mono">{telemetry.heading}°</span></div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 bg-space-950 relative overflow-y-auto p-6 flex flex-col">
          {/* Tech Grid mesh background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#161b26_1px,transparent_1px),linear-gradient(to_bottom,#161b26_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.07] pointer-events-none" />
          
          <div className="relative z-10 flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* BOTTOM LOGS TICKER */}
      <footer className="h-10 border-t border-space-600/30 bg-space-900 px-4 flex items-center shrink-0 text-xs">
        <div className="flex items-center gap-2 border-r border-space-600/30 pr-4 shrink-0 text-space-orange font-semibold">
          <span className="w-2 h-2 rounded-full bg-space-orange animate-ping" />
          <span>TELEMETRY UPDATE LOGS:</span>
        </div>
        
        {/* Dynamic ticker log scroll */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center pl-4">
          <div className="flex gap-8 whitespace-nowrap animate-pulse-subtle">
            {logs.length > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-sans">
                  [{new Date(logs[0].timestamp).toLocaleTimeString()}]
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  logs[0].severity === 'CRIT' 
                    ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                    : logs[0].severity === 'WARN' 
                      ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                      : 'bg-space-800 text-space-cyan border border-space-700'
                }`}>
                  {logs[0].source}
                </span>
                <span className="text-slate-300">{logs[0].message}</span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Awaiting telemetry stream packets...</span>
            )}
          </div>
        </div>
        
        <div className="shrink-0 text-[10px] text-slate-500 pl-4 border-l border-space-600/30">
          SYS VER: 1.0.0 // UTC-0
        </div>
      </footer>
    </div>
  );
}
