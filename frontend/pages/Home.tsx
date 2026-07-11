import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ShieldAlert, Cpu, Terminal as TerminalIcon } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [initPercent, setInitPercent] = useState(0);
  const [status, setStatus] = useState('STANDBY');
  const [lines, setLines] = useState<string[]>([
    'Initializing Space-Rover-AI Bootloader...',
    'System: Linux kernel 5.15.0-rt space-hardened',
    'Decrypting connection keys (DSN)...',
  ]);

  useEffect(() => {
    let interval: any;
    if (status === 'INITIALIZING') {
      interval = setInterval(() => {
        setInitPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus('READY');
            return 100;
          }
          const jump = Math.floor(Math.random() * 8) + 2;
          return Math.min(100, prev + jump);
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    let logInterval: any;
    if (status === 'INITIALIZING') {
      logInterval = setInterval(() => {
        const logLines = [
          `Allocating node buffers... OK`,
          `Establishing DSN connection... LINK STABLE`,
          `Synchronizing navigation matrix... X:124.52, Y:-45.18`,
          `Calibrating autonomous LiDAR arrays... OK`,
          `Checking main fuel/battery cells... 87.5%`,
          `Loading ML navigation safety models... LOADED`,
          `Active subsystem check... 0 Faults detected`,
          `Bypassing secondary relays... SECURE`
        ];
        
        setLines((prev) => {
          const nextIndex = Math.floor((initPercent / 100) * logLines.length);
          const activeLogs = logLines.slice(0, nextIndex + 1);
          return [
            'Initializing Space-Rover-AI Bootloader...',
            'System: Linux kernel 5.15.0-rt space-hardened',
            'Decrypting connection keys (DSN)...',
            ...activeLogs
          ];
        });
      }, 200);
    }
    return () => {
      if (logInterval) clearInterval(logInterval);
    };
  }, [status, initPercent]);

  const handleStart = () => {
    setStatus('INITIALIZING');
  };

  const handleEnterControl = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center p-6 relative font-mono text-slate-100 selection:bg-space-orange selection:text-space-950 overflow-hidden">
      
      {/* Sci-Fi Tech Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161b26_1px,transparent_1px),linear-gradient(to_bottom,#161b26_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.06] pointer-events-none" />

      {/* Main Terminal Frame */}
      <div className="w-full max-w-2xl border border-space-600/30 rounded-lg p-8 bg-space-900/40 backdrop-blur-md relative shadow-glow-cyan">
        
        {/* Tech Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-space-cyan" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-space-cyan" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-space-cyan" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-space-cyan" />

        {/* Head Branding */}
        <div className="flex flex-col items-center mb-8 border-b border-space-600/20 pb-6">
          <div className="w-16 h-16 rounded-full border-2 border-space-orange flex items-center justify-center mb-4 animate-pulse-subtle shadow-glow-orange">
            <Compass className="w-9 h-9 text-space-orange" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-slate-100">
            JPL MISSION CONTROLLER // UNIT SR-09
          </h1>
          <p className="text-xs text-space-cyan mt-1 tracking-widest uppercase">
            Space Rover AI Exploration Portal
          </p>
        </div>

        {/* Console logs */}
        <div className="bg-space-950 border border-space-600/20 rounded p-4 h-48 overflow-y-auto mb-6 text-[11px] text-slate-400 space-y-1 scrollbar-thin">
          {lines.map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-space-cyan">&gt;</span>
              <span>{line}</span>
            </div>
          ))}
          {status === 'INITIALIZING' && (
            <div className="flex items-center gap-2 text-space-orange">
              <span className="text-space-orange animate-ping">●</span>
              <span>SYSTEM COMPILES: {initPercent}%</span>
            </div>
          )}
          {status === 'READY' && (
            <div className="text-emerald-400 font-bold">
              &gt;&gt;&gt; UPLINK INTERACTION READY. ACCESS AUTHORIZED.
            </div>
          )}
        </div>

        {/* Subsystem Summary Panel */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
          <div className="border border-space-600/20 rounded p-2.5 bg-space-950/40">
            <div className="text-space-cyan mb-1">NETWORK</div>
            <div className="text-emerald-400">ONLINE // DSN-1</div>
          </div>
          <div className="border border-space-600/20 rounded p-2.5 bg-space-950/40">
            <div className="text-space-cyan mb-1">AI CORE</div>
            <div className="text-emerald-400">STANDBY // v2.4</div>
          </div>
          <div className="border border-space-600/20 rounded p-2.5 bg-space-950/40">
            <div className="text-space-cyan mb-1">Rover Status</div>
            <div className="text-space-orange animate-pulse">ACTIVE // JEZERO</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-center">
          {status === 'STANDBY' && (
            <button
              onClick={handleStart}
              className="px-8 py-3 rounded border border-space-orange bg-space-orange/10 text-space-orange hover:bg-space-orange hover:text-space-950 font-bold uppercase tracking-widest text-xs transition-all duration-300 shadow-glow-orange hover:-translate-y-0.5"
            >
              Initiate System Link
            </button>
          )}

          {status === 'INITIALIZING' && (
            <div className="w-full bg-space-950 border border-space-600/20 h-8 rounded overflow-hidden relative">
              <div 
                className="bg-space-cyan h-full transition-all duration-150 shadow-glow-cyan" 
                style={{ width: `${initPercent}%` }} 
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-200">
                LOADING MISSION INTERFACES...
              </span>
            </div>
          )}

          {status === 'READY' && (
            <button
              onClick={handleEnterControl}
              className="px-8 py-3 rounded border border-space-cyan bg-space-cyan/10 text-space-cyan hover:bg-space-cyan hover:text-space-950 font-bold uppercase tracking-widest text-xs transition-all duration-300 shadow-glow-cyan hover:-translate-y-0.5 animate-bounce"
            >
              Access Command Center
            </button>
          )}
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest flex items-center gap-4">
        <span>SECURITY LINK: SECURE SSL</span>
        <span>|</span>
        <span>NASA JET PROPULSION LAB MOCK CONTROL</span>
      </div>
    </div>
  );
}
