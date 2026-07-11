import React, { useState } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import { Activity, ShieldCheck, AlertOctagon, RefreshCw, Thermometer, Check } from 'lucide-react';

interface Subsystem {
  id: string;
  name: string;
  health: number;
  status: 'OPERATIONAL' | 'DEGRADED' | 'FAULTY';
  temp: number;
  description: string;
  testsPassed: string[];
}

export default function HealthStatus() {
  const { addLog } = useTelemetryContext();
  const [testingSubsystem, setTestingSubsystem] = useState<string | null>(null);
  
  const [subsystems, setSubsystems] = useState<Subsystem[]>([
    {
      id: 'PROP',
      name: 'PROPULSION DRIVE MATRIX',
      health: 98.4,
      status: 'OPERATIONAL',
      temp: -22,
      description: 'Wheel motors, gearboxes, and suspension chassis telemetry.',
      testsPassed: ['Torque calibration: OK', 'Suspension pivot load: NORMAL', 'Wheel slip monitor: ACTIVE']
    },
    {
      id: 'NAV',
      name: 'NAVIGATION & HAZARD DETECTION',
      health: 96.0,
      status: 'OPERATIONAL',
      temp: -18,
      description: 'Autonomous LiDAR arrays, IMU orientation meters, and stereo hazard cameras.',
      testsPassed: ['Stereo cam parallax: OK', 'LiDAR frequency scan: 60Hz', 'INS gyroscope alignment: OK']
    },
    {
      id: 'PWR',
      name: 'POWER DISTRIBUTION MATRIX',
      health: 92.5,
      status: 'OPERATIONAL',
      temp: -12,
      description: 'Solar array alignment drives, power rails, and lithium thermal cell grids.',
      testsPassed: ['Solar actuator tilt: 42.5°', 'Bus voltage regulation: 28.2V', 'Cell balancing: PASS']
    },
    {
      id: 'COM',
      name: 'COMMUNICATIONS LINK (DSN)',
      health: 84.0,
      status: 'DEGRADED',
      temp: -31,
      description: 'High-gain tracking antenna gimbal, low-gain backup transceivers, and encryption encoders.',
      testsPassed: ['Uplink signal sweep: ACTIVE', 'X-band transceiver: FREQ LOCK', 'S-band low-gain link: ATTENUATED']
    },
    {
      id: 'THM',
      name: 'THERMAL FLUID CONTROL LOOP',
      health: 99.8,
      status: 'OPERATIONAL',
      temp: -8,
      description: 'Radiator louvers, heat pipes, and electric warming cell insulation.',
      testsPassed: ['Heater loop shunt: OPEN', 'Coolant pump flowrate: 1.2 L/m', 'Thermostats: ACTIVE']
    },
    {
      id: 'PLD',
      name: 'SCIENTIFIC PAYLOAD INSTRUMENTS',
      health: 95.2,
      status: 'OPERATIONAL',
      temp: -19,
      description: 'Alpha particle spectrometer, drilling sampling gear, and mast panoramic camera system.',
      testsPassed: ['Drill pressure torque: STANDBY', 'APXS spectrometer: IDLE', 'MastCam lens focus: CALIBRATED']
    }
  ]);

  const runSubsystemTest = (subsystemId: string) => {
    setTestingSubsystem(subsystemId);
    addLog('SYS', `Running calibration loop on Subsystem ${subsystemId}...`, 'INFO');

    setTimeout(() => {
      setSubsystems((prev) => 
        prev.map((s) => {
          if (s.id === subsystemId) {
            // Repair degraded systems slightly or keep healthy
            const newHealth = Math.min(100, Math.max(90, s.health + (100 - s.health) * 0.4));
            const newStatus = newHealth >= 95 ? 'OPERATIONAL' : 'DEGRADED';
            return {
              ...s,
              health: parseFloat(newHealth.toFixed(1)),
              status: newStatus as Subsystem['status']
            };
          }
          return s;
        })
      );
      setTestingSubsystem(null);
      addLog('SYS', `Calibration test for Subsystem ${subsystemId} completed successfully. Metrics stabilized.`, 'INFO');
    }, 2000);
  };

  const getStatusBadge = (status: Subsystem['status']) => {
    switch (status) {
      case 'OPERATIONAL':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-800 bg-emerald-950/40 text-emerald-400">OPERATIONAL</span>;
      case 'DEGRADED':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-amber-800 bg-amber-950/40 text-amber-400">DEGRADED</span>;
      case 'FAULTY':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-rose-800 bg-rose-950/40 text-rose-400">FAULTY</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-space-600/20 pb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
          DIAGNOSTIC HEALTH CONTROLLER // SYSTEMS ANALYSIS
        </h2>
        <p className="text-[10px] text-slate-400 font-sans">
          STATUS CHECKS AND REAL-TIME SUB-MODULE HEAT LOGS FOR ROVER MISSION PARAMETERS
        </p>
      </div>

      {/* CORE STAT OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpaceCard title="GENERAL MISSION INTEGRITY" glowColor="cyan">
          <div className="flex items-center gap-4 py-2">
            <ShieldCheck className="w-12 h-12 text-space-cyan" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">94.3 %</span>
              <p className="text-[9px] text-slate-400 font-sans uppercase mt-0.5">Overall Flight Deck Status</p>
            </div>
          </div>
        </SpaceCard>

        <SpaceCard title="THERMAL STABILIZER" glowColor="none">
          <div className="flex items-center gap-4 py-2">
            <Thermometer className="w-12 h-12 text-slate-400" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">-18.6 °C</span>
              <p className="text-[9px] text-slate-400 font-sans uppercase mt-0.5">Avg System Temperature</p>
            </div>
          </div>
        </SpaceCard>

        <SpaceCard title="FAULT FLAG MATRIX" glowColor="none">
          <div className="flex items-center gap-4 py-2">
            <AlertOctagon className="w-12 h-12 text-space-orange animate-pulse" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-100">1 FLAG</span>
              <p className="text-[9px] text-slate-400 font-sans uppercase mt-0.5">Active anomalies requiring attention</p>
            </div>
          </div>
        </SpaceCard>
      </div>

      {/* DETAILED SUBSYSTEM CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subsystems.map((sub) => (
          <SpaceCard 
            key={sub.id} 
            title={`${sub.id} // ${sub.name}`} 
            glowColor={sub.status === 'DEGRADED' ? 'orange' : sub.status === 'FAULTY' ? 'red' : 'none'}
            headerActions={getStatusBadge(sub.status)}
          >
            <div className="space-y-4">
              <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                {sub.description}
              </p>

              {/* Progress/Health Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-slate-400 uppercase">Module Health:</span>
                  <span className={sub.health > 90 ? 'text-space-cyan' : 'text-space-orange'}>
                    {sub.health}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-space-950 rounded overflow-hidden border border-space-600/20">
                  <div 
                    className={`h-full rounded transition-all duration-500 ${
                      sub.health >= 95 
                        ? 'bg-space-cyan shadow-glow-cyan' 
                        : 'bg-space-orange shadow-glow-orange'
                    }`} 
                    style={{ width: `${sub.health}%` }} 
                  />
                </div>
              </div>

              {/* Grid detail */}
              <div className="grid grid-cols-2 gap-4 border-t border-space-600/10 pt-3">
                
                {/* Temperature */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Sensor Temperature:</span>
                  <span className="font-mono text-slate-200 text-xs font-bold flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                    {sub.temp} °C
                  </span>
                </div>

                {/* Self test triggers */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => runSubsystemTest(sub.id)}
                    disabled={testingSubsystem !== null}
                    className={`px-3 py-1.5 rounded text-[9px] uppercase font-bold border transition-all duration-200 ${
                      testingSubsystem === sub.id
                        ? 'border-space-cyan/20 text-space-cyan/50 bg-space-cyan/5 cursor-not-allowed'
                        : 'border-space-cyan text-space-cyan hover:bg-space-cyan hover:text-space-950 shadow-glow-cyan'
                    }`}
                  >
                    {testingSubsystem === sub.id ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        TESTING...
                      </span>
                    ) : 'Run Self-Test'}
                  </button>
                </div>
              </div>

              {/* Checks checklist */}
              <div className="border-t border-space-600/10 pt-3 space-y-1 bg-space-950/20 p-2.5 rounded">
                <span className="text-[9px] text-slate-500 uppercase block mb-1 font-sans">Self-Calibration Checklists:</span>
                {sub.testsPassed.map((test, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-[9px] text-slate-300">
                    <Check className="w-3.5 h-3.5 text-space-cyan shrink-0" />
                    <span className="font-mono">{test}</span>
                  </div>
                ))}
              </div>

            </div>
          </SpaceCard>
        ))}
      </div>
    </div>
  );
}
