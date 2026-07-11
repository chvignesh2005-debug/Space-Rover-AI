import React, { useState, useEffect } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import RoverMap from '../components/RoverMap';
import TelemetryChart from '../components/TelemetryChart';
import { 
  Battery, 
  Sun, 
  Gauge, 
  Thermometer, 
  Terminal as TermIcon, 
  Zap, 
  Wifi, 
  Play, 
  Square,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
  const { telemetry, logs, addLog } = useTelemetryContext();
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  
  // Power History state for chart visualization
  const [powerHistory, setPowerHistory] = useState([
    { time: '12:00', value: 140 },
    { time: '12:05', value: 155 },
    { time: '12:10', value: 138 },
    { time: '12:15', value: 145 },
    { time: '12:20', value: 160 },
    { time: '12:25', value: 148 },
    { time: '12:30', value: telemetry.powerDraw }
  ]);

  // Sync latest power value from context to history chart
  useEffect(() => {
    setPowerHistory((prev) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const nextList = [...prev.slice(1), { time: timeStr, value: telemetry.powerDraw }];
      return nextList;
    });
  }, [telemetry.powerDraw]);

  const handleStopRover = () => {
    addLog('NAV', 'EMERGENCY INTRUDER FAULT: Stopping all locomotion. Speed locked at 0.00m/s.', 'CRIT');
  };

  const handleResumeRover = () => {
    addLog('NAV', 'Resuming standard navigation matrix cruise parameters.', 'INFO');
  };

  const handleDiagnostics = () => {
    setDiagnosticsRunning(true);
    addLog('SYS', 'Initiating full subsystem diagnostic procedures...', 'INFO');
    
    setTimeout(() => {
      addLog('SYS', 'Diagnostics: Power distribution system: 100% capacity.', 'INFO');
    }, 1000);
    setTimeout(() => {
      addLog('SYS', 'Diagnostics: Deep Space Communications array: link margin 14dB (OK).', 'INFO');
    }, 2000);
    setTimeout(() => {
      addLog('SYS', 'Diagnostics: Thermal control active fluid valves: fully calibrated.', 'INFO');
      setDiagnosticsRunning(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      
      {/* HEADER CONTROLS SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-space-600/20 pb-4">
        <div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
            TELEMETRY CONTROLLER OVERVIEW
          </h2>
          <p className="text-[10px] text-slate-400 font-sans">
            REAL-TIME DATA STREAM AND INTERACTIVE TELEMETRY OF MARS ROVER SR-09
          </p>
        </div>

        {/* Quick Action Triggers */}
        <div className="flex gap-2">
          <button
            onClick={handleDiagnostics}
            disabled={diagnosticsRunning}
            className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold border transition-all duration-200 ${
              diagnosticsRunning 
                ? 'border-space-cyan/20 text-space-cyan/50 bg-space-cyan/5 cursor-not-allowed' 
                : 'border-space-cyan text-space-cyan hover:bg-space-cyan hover:text-space-950 shadow-glow-cyan'
            }`}
          >
            {diagnosticsRunning ? 'Running Diagnos...' : 'Run Diagnostics'}
          </button>
          
          <button
            onClick={handleResumeRover}
            className="px-3 py-1.5 rounded text-[10px] uppercase font-bold border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-space-950 transition-all duration-200"
          >
            <Play className="w-3.5 h-3.5 inline mr-1" /> Resume Cruise
          </button>

          <button
            onClick={handleStopRover}
            className="px-3 py-1.5 rounded text-[10px] uppercase font-bold border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-space-950 transition-all duration-200"
          >
            <Square className="w-3.5 h-3.5 inline mr-1" /> Emergency Stop
          </button>
        </div>
      </div>

      {/* METRIC COUNTER GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SpaceCard title="MAIN BATTERY" glowColor="cyan">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">{telemetry.battery}%</span>
              <p className="text-[9px] text-slate-400 mt-1 uppercase">Draining @ {telemetry.powerDraw}W</p>
            </div>
            <Battery className="w-8 h-8 text-space-cyan animate-pulse" />
          </div>
        </SpaceCard>

        <SpaceCard title="SOLAR HARVEST" glowColor="orange">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">{telemetry.solarOutput} W</span>
              <p className="text-[9px] text-slate-400 mt-1 uppercase">Irradiance normal</p>
            </div>
            <Sun className="w-8 h-8 text-space-orange" />
          </div>
        </SpaceCard>

        <SpaceCard title="VELOCITY FEED">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">{telemetry.speed} m/s</span>
              <p className="text-[9px] text-slate-400 mt-1 uppercase">Cruise Mode</p>
            </div>
            <Gauge className="w-8 h-8 text-slate-400" />
          </div>
        </SpaceCard>

        <SpaceCard title="THERMAL STAT">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">{telemetry.temperature} °C</span>
              <p className="text-[9px] text-slate-400 mt-1 uppercase">Heaters Operational</p>
            </div>
            <Thermometer className="w-8 h-8 text-slate-400" />
          </div>
        </SpaceCard>
      </div>

      {/* INTERACTIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Rover map - left span */}
        <div className="lg:col-span-2">
          <SpaceCard className="h-full" glowColor="none">
            <RoverMap />
          </SpaceCard>
        </div>

        {/* Charts & Actions - right span */}
        <div className="space-y-6 flex flex-col justify-between">
          <SpaceCard title="SYS Power Draw History" subtitle="Live wattage fluctuations" glowColor="cyan" className="flex-1">
            <div className="mt-4">
              <TelemetryChart data={powerHistory} metricName="Power" unit="W" color="cyan" height={160} />
            </div>
          </SpaceCard>

          <SpaceCard title="REAL-TIME TELEMETRY LOGS" subtitle="Event feed audit stream" className="flex-1 max-h-56 overflow-y-auto">
            <div className="space-y-2 mt-2 h-40 overflow-y-auto scrollbar-thin text-[10px]">
              {logs.slice(0, 8).map((log, index) => (
                <div key={index} className="border-b border-space-600/10 pb-1.5 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`px-1 rounded text-[8px] font-bold ${
                      log.severity === 'CRIT' 
                        ? 'bg-rose-950/80 text-rose-400' 
                        : log.severity === 'WARN' 
                          ? 'bg-amber-950/80 text-amber-400' 
                          : 'bg-space-800 text-space-cyan'
                    }`}>{log.source}</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </SpaceCard>
        </div>
      </div>
    </div>
  );
}
