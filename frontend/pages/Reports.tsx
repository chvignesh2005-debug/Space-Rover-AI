import React, { useState } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import { FileText, Download, Play, RefreshCw, BarChart2 } from 'lucide-react';

interface ReportFile {
  id: string;
  name: string;
  date: string;
  size: string;
  subsystem: string;
  status: 'READY' | 'COMPILING';
  downloadContent: string;
}

export default function Reports() {
  const { telemetry, addLog } = useTelemetryContext();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const [reports, setReports] = useState<ReportFile[]>([
    {
      id: 'REP-001',
      name: 'APXS Soil Chemical Composition Analysis',
      date: '2026-07-10 18:30 UTC',
      size: '24.2 KB',
      subsystem: 'Scientific Payload (PLD)',
      status: 'READY',
      downloadContent: `SPACE-ROVER-AI MISSION REPORT: GEOLOGICAL COMPOSITION SCAN
Unit ID: SR-09 // Mission Crater: Jezero
Timestamp: 2026-07-10 18:30 UTC
======================================
Silicon Oxide (SiO2): 48.24%
Iron Oxide (Fe2O3): 18.52%
Aluminum Oxide (Al2O3): 9.15%
Calcium Oxide (CaO): 6.84%
Trace Moisture: 0.04%
Findings: Soil contains high iron oxide traces confirming ancient alluvial fans sediment deposits.`
    },
    {
      id: 'REP-002',
      name: 'Battery Health & Solar Panel Efficiency Audit',
      date: '2026-07-10 14:00 UTC',
      size: '14.8 KB',
      subsystem: 'Power Systems (PWR)',
      status: 'READY',
      downloadContent: `SPACE-ROVER-AI MISSION REPORT: POWER STABILIZATION AUDIT
Unit ID: SR-09 // Battery State: ${telemetry.battery}%
Timestamp: 2026-07-10 14:00 UTC
======================================
Peak Solar Panel Harvest: 450 Watts
Active Power Draw: ${telemetry.powerDraw} Watts
Thermal balance loop state: OPERATIONAL
Insulation heater grids activation cycle: 12% duty cycle
Degradation forecast: Battery cell decay less than 0.02% per 100 Sol cycles.`
    },
    {
      id: 'REP-003',
      name: 'Autonomous Route Pathfinding Efficiency Data',
      date: '2026-07-10 09:12 UTC',
      size: '32.1 KB',
      subsystem: 'Navigation Core (NAV)',
      status: 'READY',
      downloadContent: `SPACE-ROVER-AI MISSION REPORT: PATHFINDING METRICS
Unit ID: SR-09 // Cruise Speed: ${telemetry.speed}m/s
Timestamp: 2026-07-10 09:12 UTC
======================================
Coordinates logged: X: ${telemetry.coordinates.x}, Y: ${telemetry.coordinates.y}
Inertial Navigation System error rate: <0.02%
LiDAR obstacles bypassed: 24 hazards detected
Average slope grade: 8.24°`
    }
  ]);

  const handleDownload = (rep: ReportFile) => {
    setDownloadingId(rep.id);
    addLog('SYS', `Requesting download packet for report ${rep.id} [${rep.name}]...`, 'INFO');

    setTimeout(() => {
      const blob = new Blob([rep.downloadContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${rep.name.replace(/\s+/g, '_').toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadingId(null);
      addLog('SYS', `Report download package ${rep.id} successfully transmitted.`, 'INFO');
    }, 1500);
  };

  const handleCompileNewReport = () => {
    const newId = `REP-00${reports.length + 1}`;
    const newReport: ReportFile = {
      id: newId,
      name: `Real-time Telemetry Snapshot ${reports.length + 1}`,
      date: new Date().toUTCString(),
      size: '8.4 KB',
      subsystem: 'Telemetry Core (SYS)',
      status: 'COMPILING',
      downloadContent: `SPACE-ROVER-AI REAL-TIME TELEMETRY SNAPSHOT
Timestamp: ${new Date().toISOString()}
======================================
Rover Position: X:${telemetry.coordinates.x}, Y:${telemetry.coordinates.y}, Z:${telemetry.coordinates.z}
Heading Angle: ${telemetry.heading}°
Cruising Speed: ${telemetry.speed} m/s
Subsystem Health Percentages:
- Propulsion Drive Matrix: 98.4%
- Navigation Core: 96.0%
- Power Distribution Matrix: 92.5%
- Communications DSN Link: 84.0%
- Thermal Fluid Control: 99.8%
- Scientific Instruments: 95.2%`
    };

    setReports((prev) => [newReport, ...prev]);
    addLog('SYS', `Compiling telemetry report ${newId} from active sensors...`, 'INFO');

    setTimeout(() => {
      setReports((prev) => 
        prev.map((r) => r.id === newId ? { ...r, status: 'READY' } : r)
      );
      addLog('SYS', `Report compilation complete. ${newId} is now archived in telemetry nodes.`, 'INFO');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-space-600/20 pb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
          SCIENTIFIC DATA ARCHIVE // REPORTS MANAGER
        </h2>
        <p className="text-[10px] text-slate-400 font-sans">
          EXPORT COMPASS READINGS, SOIL SURVEY ANALYSIS AND SOLAR CONVERTOR DATA LOGS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Compiling options */}
        <div className="lg:col-span-1 space-y-6">
          <SpaceCard title="Active Snapshots" subtitle="Compile real-time statistics" glowColor="cyan">
            <div className="mt-4 space-y-3">
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Trigger a manual capture of all current active sensor feeds to compile a telemetry snapshot report file.
              </p>
              
              <button
                onClick={handleCompileNewReport}
                className="w-full py-2.5 rounded text-[10px] uppercase font-bold border border-space-cyan text-space-cyan hover:bg-space-cyan hover:text-space-950 shadow-glow-cyan transition-all duration-200"
              >
                Compile Telemetry Snapshot
              </button>
            </div>
          </SpaceCard>

          <SpaceCard title="METRICS OVERVIEW" glowColor="none">
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 border-b border-space-600/10 pb-3">
                <BarChart2 className="w-8 h-8 text-space-orange" />
                <div>
                  <span className="text-sm font-bold text-slate-200 block font-mono">3 REPORTS</span>
                  <span className="text-[9px] text-slate-500 font-sans uppercase">Currently indexed in system storage</span>
                </div>
              </div>

              <div className="text-[10px] space-y-1.5 text-slate-400 font-sans">
                <div className="flex justify-between">
                  <span>DSN Bandwidth Usage:</span>
                  <span className="font-mono text-slate-300">42.2 KB/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Downlink Efficiency:</span>
                  <span className="font-mono text-emerald-400">99.8%</span>
                </div>
              </div>
            </div>
          </SpaceCard>
        </div>

        {/* Right Side: Reports Table */}
        <div className="lg:col-span-2">
          <SpaceCard title="STORED EXPORT DATA FILES" subtitle="Download flight summaries directly to local storage" glowColor="none" className="h-full">
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-space-600/20 text-slate-400 uppercase tracking-widest font-bold">
                    <th className="py-2.5">REPORT ID</th>
                    <th className="py-2.5">FILE NAME</th>
                    <th className="py-2.5">SUB-MODULE</th>
                    <th className="py-2.5">FILE SIZE</th>
                    <th className="py-2.5">STATUS</th>
                    <th className="py-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep.id} className="border-b border-space-600/10 hover:bg-space-800/20 transition-colors">
                      <td className="py-2.5 font-mono text-slate-400">{rep.id}</td>
                      <td className="py-2.5 font-mono text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-space-orange shrink-0" />
                          <span>{rep.name}</span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-sans block mt-0.5">{rep.date}</span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">{rep.subsystem}</td>
                      <td className="py-2.5 font-mono text-slate-300">{rep.size}</td>
                      <td className="py-2.5 font-mono">
                        {rep.status === 'READY' ? (
                          <span className="text-emerald-400 font-bold">READY</span>
                        ) : (
                          <span className="text-space-orange font-bold animate-pulse flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            COMPILING
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {rep.status === 'READY' ? (
                          <button
                            onClick={() => handleDownload(rep)}
                            disabled={downloadingId !== null}
                            className="px-2 py-1 rounded text-[9px] uppercase font-bold border border-space-cyan text-space-cyan hover:bg-space-cyan hover:text-space-950 transition-all duration-200 shadow-glow-cyan inline-flex items-center gap-1"
                          >
                            {downloadingId === rep.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>{downloadingId === rep.id ? 'DOWNLOADING...' : 'Download'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 italic">Compiling...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpaceCard>
        </div>
      </div>
    </div>
  );
}
