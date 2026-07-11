import React, { useState } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import { AlertTriangle, Info, ShieldAlert, CheckCircle, Search, SlidersHorizontal } from 'lucide-react';

interface Fault {
  id: string;
  timestamp: string;
  subsystem: 'PROP' | 'NAV' | 'PWR' | 'COM' | 'THM' | 'PLD';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  resolved: boolean;
  resolutionTime?: string;
  troubleshoot: string;
}

export default function FaultHistory() {
  const { addLog } = useTelemetryContext();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterSubsystem, setFilterSubsystem] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [faults, setFaults] = useState<Fault[]>([
    {
      id: 'F-102',
      timestamp: '2026-07-10T22:30:15Z',
      subsystem: 'COM',
      severity: 'WARNING',
      code: 'COM_DSN_ATTENUATION_04',
      message: 'Deep Space Network signal attenuation detected. Link margins degraded to 8.2dB.',
      resolved: false,
      troubleshoot: 'Execute antenna alignment sweep targeting Mars Reconnaissance Orbiter relay vector.'
    },
    {
      id: 'F-101',
      timestamp: '2026-07-10T21:15:40Z',
      subsystem: 'PWR',
      severity: 'CRITICAL',
      code: 'PWR_CELL_TEMP_LOW_02',
      message: 'Battery Cell #4 temperature dropped below safety envelope threshold (-42°C). Critical freeze risk.',
      resolved: false,
      troubleshoot: 'Activate battery cell heater array block B. Switch power bus input to redundant cells.'
    },
    {
      id: 'F-100',
      timestamp: '2026-07-10T18:45:00Z',
      subsystem: 'NAV',
      severity: 'INFO',
      code: 'NAV_OBSTACLE_AVOIDANCE',
      message: 'Auto-pilot obstacle evasion algorithm active. Corrected route heading left by 12.4°.',
      resolved: true,
      resolutionTime: '2026-07-10T18:45:30Z',
      troubleshoot: 'Pathfinding logs successfully integrated. No intervention required.'
    },
    {
      id: 'F-099',
      timestamp: '2026-07-10T14:10:22Z',
      subsystem: 'PROP',
      severity: 'WARNING',
      code: 'PROP_WHEEL_SLIP_DETECTION',
      message: 'Slight wheel slip detected in front-right motor controller. Slip coefficient: 0.18.',
      resolved: true,
      resolutionTime: '2026-07-10T14:15:00Z',
      troubleshoot: 'Speed reduced by 0.05m/s. Torque balance reallocated. Slip corrected.'
    },
    {
      id: 'F-098',
      timestamp: '2026-07-10T08:05:11Z',
      subsystem: 'THM',
      severity: 'INFO',
      code: 'THM_COOLANT_STABLE',
      message: 'Coolant loop pump valve flow stabilized to target 1.2 L/min.',
      resolved: true,
      resolutionTime: '2026-07-10T08:06:00Z',
      troubleshoot: 'Pump cycle execution complete. Pressure verified.'
    }
  ]);

  const handleResolveFault = (id: string) => {
    setFaults((prev) => 
      prev.map((f) => {
        if (f.id === id) {
          addLog(f.subsystem, `Anomaly ${f.id} [${f.code}] manual resolution override executed. Status clear.`, 'INFO');
          return {
            ...f,
            resolved: true,
            resolutionTime: new Date().toISOString()
          };
        }
        return f;
      })
    );
  };

  const getSeverityStyle = (severity: Fault['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/40 border-rose-800';
      case 'WARNING':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'INFO':
        return 'text-space-cyan bg-space-950/40 border-space-600/30';
    }
  };

  const filteredFaults = faults.filter((f) => {
    const matchesSeverity = filterSeverity === 'ALL' || f.severity === filterSeverity;
    const matchesSubsystem = filterSubsystem === 'ALL' || f.subsystem === filterSubsystem;
    const matchesSearch = f.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSubsystem && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-space-600/20 pb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
          Mission Anomaly Audit // Fault History
        </h2>
        <p className="text-[10px] text-slate-400 font-sans">
          INVENTORY ARCHIVE OF MISSION ANOMALIES, SYSTEM INTERRUPTS, AND RECTIFICATION LOOPS
        </p>
      </div>

      {/* FILTER CONTROL BAR */}
      <SpaceCard title="AUDIT FILTERS" glowColor="none">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search anomalies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-48 pl-8 pr-3 py-1.5 bg-space-950 border border-space-600/20 rounded text-[11px] font-mono text-slate-200 focus:outline-none focus:border-space-cyan"
              />
            </div>

            {/* Severity filter */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">SEVERITY:</span>
              <select 
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-space-950 border border-space-600/20 rounded px-2.5 py-1 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-space-cyan"
              >
                <option value="ALL">ALL LEVELS</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="WARNING">WARNINGS</option>
                <option value="INFO">INFORMATIONAL</option>
              </select>
            </div>

            {/* Subsystem filter */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">MODULE:</span>
              <select 
                value={filterSubsystem}
                onChange={(e) => setFilterSubsystem(e.target.value)}
                className="bg-space-950 border border-space-600/20 rounded px-2.5 py-1 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-space-cyan"
              >
                <option value="ALL">ALL SUBSYSTEMS</option>
                <option value="PROP">PROPULSION</option>
                <option value="NAV">NAVIGATION</option>
                <option value="PWR">POWER</option>
                <option value="COM">COMMUNICATIONS</option>
                <option value="THM">THERMAL</option>
                <option value="PLD">PAYLOAD</option>
              </select>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-sans uppercase">
            Records Matching Filters: <span className="text-space-cyan font-mono font-bold">{filteredFaults.length}</span>
          </div>
        </div>
      </SpaceCard>

      {/* FAULT LISTINGS */}
      <div className="space-y-4">
        {filteredFaults.length > 0 ? (
          filteredFaults.map((fault) => (
            <div 
              key={fault.id}
              className={`border border-l-4 rounded p-4 bg-space-900/30 backdrop-blur-sm flex flex-col md:flex-row justify-between gap-4 ${
                fault.resolved 
                  ? 'border-slate-700/30 border-l-slate-500' 
                  : fault.severity === 'CRITICAL' 
                    ? 'border-rose-900/60 border-l-rose-500 shadow-glow-red' 
                    : fault.severity === 'WARNING' 
                      ? 'border-amber-900/60 border-l-amber-500 shadow-glow-orange' 
                      : 'border-space-cyan/30 border-l-space-cyan shadow-glow-cyan'
              }`}
            >
              {/* Left description */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 text-[10px] font-bold">ANOMALY {fault.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${getSeverityStyle(fault.severity)}`}>
                    {fault.severity}
                  </span>
                  <span className="text-slate-500 text-[10px]">{fault.timestamp}</span>
                  <span className="text-slate-400 font-mono text-[9px] bg-space-950 px-1.5 py-0.5 rounded border border-space-600/10">
                    CODE: {fault.code}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {fault.message}
                </p>

                {/* Troubleshooting advice */}
                <div className="text-[10px] bg-space-950/40 p-2.5 rounded border border-space-600/10 text-slate-300 font-sans">
                  <span className="font-bold text-space-orange font-mono uppercase block mb-1">JPL Troubleshooting Vector:</span>
                  {fault.troubleshoot}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                <div>
                  {fault.resolved ? (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>RESOLVED SYSTEM</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold">
                      <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span>ANOMALY UNRESOLVED</span>
                    </div>
                  )}
                </div>

                {!fault.resolved && (
                  <button
                    onClick={() => handleResolveFault(fault.id)}
                    className="px-3.5 py-1.5 rounded text-[10px] uppercase font-bold border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-space-950 transition-all duration-200"
                  >
                    Clear Anomaly
                  </button>
                )}
                {fault.resolved && fault.resolutionTime && (
                  <span className="text-[8px] text-slate-500 font-mono">
                    CLEARED AT: <br />
                    {new Date(fault.resolutionTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="border border-dashed border-space-600/20 py-16 text-center text-slate-500 font-sans rounded">
            <Info className="w-12 h-12 text-space-600/30 mx-auto mb-3" />
            <span>No logged anomalies matching requested audit filters found.</span>
          </div>
        )}
      </div>

    </div>
  );
}
