import React, { useState } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import { Sliders, Save, ShieldAlert, Cpu, Radio, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { addLog } = useTelemetryContext();
  const [telemetryInterval, setTelemetryInterval] = useState('3s');
  const [dsnProtocol, setDsnProtocol] = useState('X-BAND');
  const [maxSlope, setMaxSlope] = useState(20);
  const [activeModel, setActiveModel] = useState('ROVER-NAV-4.0');
  const [safetyOverride, setSafetyOverride] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    addLog('SYS', 'Mission parameters updated. Flashing new limits to active ROM core nodes.', 'INFO');
    
    if (safetyOverride) {
      addLog('SYS', 'WARNING: Autonomous safety override has been disabled by operator command.', 'WARN');
    } else {
      addLog('SYS', 'Autonomous safety envelope control enabled (default checks active).', 'INFO');
    }

    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const handleSafetyToggle = () => {
    setSafetyOverride((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        addLog('SYS', 'CRITICAL WARNING: Operator safety overrides toggled ACTIVE. Automated obstacle braking disabled.', 'CRIT');
      } else {
        addLog('SYS', 'Safety override deactivated. Core auto-pilot protocols active.', 'INFO');
      }
      return nextVal;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-space-600/20 pb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
          Mission Settings // Configuration Control
        </h2>
        <p className="text-[10px] text-slate-400 font-sans">
          MANAGE TRANSMISSION INTERVALS, ML MODELS AND SAFETY PROFILES FOR SR-09
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Controls */}
        <div className="lg:col-span-2 space-y-6">
          <SpaceCard title="TELEMETRY & DSN CONFIGURATION" glowColor="cyan">
            <div className="mt-4 space-y-4">
              
              {/* Telemetry Interval */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 uppercase block font-mono">Telemetry Broadcast Interval:</span>
                  <span className="text-[9px] text-slate-500 font-sans mt-0.5">Frequency of active sensor streams</span>
                </div>
                <div>
                  <select 
                    value={telemetryInterval}
                    onChange={(e) => setTelemetryInterval(e.target.value)}
                    className="w-full bg-space-950 border border-space-600/30 rounded px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-space-cyan"
                  >
                    <option value="1s">1 SECOND (REAL-TIME BANDWIDTH)</option>
                    <option value="3s">3 SECONDS (STANDBY PROTOCOL)</option>
                    <option value="5s">5 SECONDS (POWER SAVE MODE)</option>
                    <option value="10s">10 SECONDS (DEEP SLEEP)</option>
                  </select>
                </div>
              </div>

              {/* DSN Protocol */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-t border-space-600/10 pt-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 uppercase block font-mono">Antenna Uplink Carrier:</span>
                  <span className="text-[9px] text-slate-500 font-sans mt-0.5">Transmission frequency band</span>
                </div>
                <div>
                  <select 
                    value={dsnProtocol}
                    onChange={(e) => setDsnProtocol(e.target.value)}
                    className="w-full bg-space-950 border border-space-600/30 rounded px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-space-cyan"
                  >
                    <option value="X-BAND">X-BAND TRANSMITTER (8.4 GHz)</option>
                    <option value="S-BAND">S-BAND OMNI (2.2 GHz - BACKUP)</option>
                    <option value="KA-BAND">KA-BAND PAYLOAD (32 GHz)</option>
                    <option value="LASER">LASER OPTICAL LINK (UHF-HIGH)</option>
                  </select>
                </div>
              </div>

            </div>
          </SpaceCard>

          <SpaceCard title="NAVIGATIONAL LIMITS & AI MODELS" glowColor="none">
            <div className="mt-4 space-y-4">
              
              {/* Max Slope Incline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 uppercase block font-mono">Max Navigation Incline:</span>
                  <span className="text-[9px] text-slate-500 font-sans mt-0.5">Maximum slope grade warning limit: {maxSlope}°</span>
                </div>
                <div>
                  <input 
                    type="range" 
                    min="5" 
                    max="35" 
                    value={maxSlope}
                    onChange={(e) => setMaxSlope(parseInt(e.target.value))}
                    className="w-full accent-space-orange bg-space-950 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Machine learning model selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-t border-space-600/10 pt-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 uppercase block font-mono">Neural Navigation Model:</span>
                  <span className="text-[9px] text-slate-500 font-sans mt-0.5">ML model weight selection</span>
                </div>
                <div>
                  <select 
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value)}
                    className="w-full bg-space-950 border border-space-600/30 rounded px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-space-cyan"
                  >
                    <option value="ROVER-NAV-4.0">ROVER-NAV-4.0-RT (DEFAULT Lidar Model)</option>
                    <option value="LUNAR-CRUISE-2.1">LUNAR-CRUISE-2.1 (Low Shadow Evasion)</option>
                    <option value="APXS-GEO-1.0">APXS-GEO-1.0 (Spectroscopic Priority)</option>
                  </select>
                </div>
              </div>

            </div>
          </SpaceCard>
        </div>

        {/* Right Side: Security overrides & Action save */}
        <div className="lg:col-span-1 space-y-6">
          <SpaceCard title="SAFETY OVERRIDE MATRIX" glowColor="none" className="h-full flex flex-col justify-between">
            <div className="space-y-4 mt-2">
              <div className="border border-rose-950 bg-rose-950/20 text-rose-400 p-3 rounded text-[10px] flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">CAUTION: DIRECT MANUAL OVERRIDES</span>
                  <p className="mt-1 font-sans text-slate-300">
                    Disabling safety limits allows manual steering vectors through obstacle grade limits. Autoland cruise sensors are deactivated.
                  </p>
                </div>
              </div>

              {/* Toggle switch custom styled */}
              <div className="flex items-center justify-between border-t border-space-600/10 pt-4">
                <span className="text-[11px] font-bold text-slate-200 uppercase font-mono">Manual Safety Override:</span>
                <button
                  type="button"
                  onClick={handleSafetyToggle}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    safetyOverride ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
                    safetyOverride ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="border-t border-space-600/10 pt-4 space-y-2">
              {saveSuccess && (
                <div className="text-[9px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PARAMETERS SAVED SUCCESSFULLY</span>
                </div>
              )}
              
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded text-[10px] uppercase font-bold bg-space-cyan text-space-950 hover:bg-cyan-500 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Configuration
              </button>
            </div>
          </SpaceCard>
        </div>
      </div>
    </div>
  );
}
