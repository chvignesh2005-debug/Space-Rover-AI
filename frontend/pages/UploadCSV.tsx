import React, { useState } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

interface TelemetryRow {
  timestamp: string;
  battery: number;
  solarOutput: number;
  speed: number;
  temperature: number;
  latency: number;
}

export default function UploadCSV() {
  const { addLog } = useTelemetryContext();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleCSV = `timestamp,battery,solarOutput,speed,temperature,latency
2026-07-10T23:00:00Z,85.4,410,0.18,-12,120
2026-07-10T23:05:00Z,84.9,430,0.22,-14,124
2026-07-10T23:10:00Z,83.1,390,0.14,-15,121
2026-07-10T23:15:00Z,82.3,425,0.19,-11,118
2026-07-10T23:20:00Z,81.0,450,0.25,-10,123`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rover_telemetry_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('SYS', 'Sample telemetry template downloaded.', 'INFO');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Invalid file format. Please upload a structured CSV file.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    try {
      const rows = csvText.split('\n').map(row => row.trim()).filter(row => row.length > 0);
      if (rows.length < 2) {
        throw new Error('CSV has no data rows.');
      }
      
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const expected = ['timestamp', 'battery', 'solaroutput', 'speed', 'temperature', 'latency'];
      const missing = expected.filter(e => !headers.includes(e));
      
      if (missing.length > 0) {
        throw new Error(`Missing expected headers: ${missing.join(', ')}`);
      }

      const list: TelemetryRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',').map(c => c.trim());
        if (columns.length < headers.length) continue;
        
        const rowData: any = {};
        headers.forEach((header, index) => {
          const val = columns[index];
          if (header === 'timestamp') {
            rowData[header] = val;
          } else {
            rowData[header] = parseFloat(val);
          }
        });
        
        list.push({
          timestamp: rowData.timestamp,
          battery: rowData.battery,
          solarOutput: rowData.solaroutput,
          speed: rowData.speed,
          temperature: rowData.temperature,
          latency: rowData.latency
        });
      }

      setParsedData(list);
      setLoading(false);
      addLog('SYS', `Successfully parsed telemetry CSV file. Total entries: ${list.length}`, 'INFO');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while parsing CSV file.');
      setLoading(false);
    }
  };

  const handleTransmitData = () => {
    setLoading(true);
    setTimeout(() => {
      addLog('SYS', `Uplinking telemetry packets to central storage node...`, 'INFO');
      parsedData.forEach((row, i) => {
        setTimeout(() => {
          addLog('COM', `Uplink Packet [${i + 1}/${parsedData.length}]: Battery: ${row.battery}%, Temp: ${row.temperature}°C`, 'INFO');
        }, i * 400);
      });
      setTimeout(() => {
        setLoading(false);
        addLog('SYS', `Packet transmission complete. All logs integrated.`, 'INFO');
        setParsedData([]);
        setFileContent(null);
      }, parsedData.length * 400 + 500);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="border-b border-space-600/20 pb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
          UPLINK DATABUFFER INTERFACE // CSV INGESTION
        </h2>
        <p className="text-[10px] text-slate-400 font-sans">
          UPLOAD FLIGHT AND NAVIGATION TELEMETRY DATA LOGS DIRECTLY TO MISSION BACKBONE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload portal controls - left span */}
        <div className="space-y-6 lg:col-span-1">
          <SpaceCard title="Uplink Port" subtitle="Choose CSV document to process" glowColor="cyan">
            <div className="mt-4 space-y-4">
              
              {/* Drag n drop box */}
              <label className="border border-dashed border-space-cyan/30 bg-space-950/40 hover:bg-space-cyan/5 hover:border-space-cyan/60 rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300">
                <UploadCloud className="w-10 h-10 text-space-cyan animate-pulse mb-3" />
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Select CSV File</span>
                <span className="text-[9px] text-slate-500 font-sans mt-1">Telemetry tables up to 10MB</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={loading}
                />
              </label>

              {/* Status information */}
              {loading && (
                <div className="flex items-center justify-center gap-2 py-4 text-space-orange">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-bold">UPLINKING PACKETS...</span>
                </div>
              )}

              {errorMsg && (
                <div className="border border-rose-900 bg-rose-950/20 text-rose-400 p-3 rounded text-[10px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">TRANSMISSION CORRUPT:</span>
                    <p className="mt-1 font-sans text-slate-300">{errorMsg}</p>
                  </div>
                </div>
              )}

              {parsedData.length > 0 && !loading && (
                <div className="border border-emerald-900 bg-emerald-950/20 text-emerald-400 p-3 rounded text-[10px] flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">PARSING COMPLETE</span>
                    <p className="mt-1 font-sans text-slate-300">Found {parsedData.length} records ready for downlink validation check.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleDownloadSample}
                  className="w-full py-2 rounded text-[10px] uppercase font-bold border border-space-600/30 text-slate-300 hover:text-slate-100 hover:bg-space-800/40 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template CSV
                </button>

                {parsedData.length > 0 && (
                  <button
                    onClick={handleTransmitData}
                    disabled={loading}
                    className="w-full py-2.5 rounded text-[10px] uppercase font-bold bg-space-orange text-space-950 hover:bg-orange-600 transition-all duration-200 font-bold"
                  >
                    TRANSMIT TELEMETRY STREAM
                  </button>
                )}
              </div>
            </div>
          </SpaceCard>
        </div>

        {/* Parsed grid layout - right span */}
        <div className="lg:col-span-2">
          <SpaceCard title="PRE-TRANSMISSION TELEMETRY AUDIT" subtitle="Integrity validation checks prior to storage upload" glowColor="none" className="h-full">
            <div className="overflow-x-auto mt-2">
              {parsedData.length > 0 ? (
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-space-600/20 text-slate-400 uppercase tracking-widest font-bold">
                      <th className="py-2.5">TIMESTAMP</th>
                      <th className="py-2.5">BATTERY</th>
                      <th className="py-2.5">SOLAR HARVEST</th>
                      <th className="py-2.5">VELOCITY</th>
                      <th className="py-2.5">THERMAL</th>
                      <th className="py-2.5">LATENCY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="border-b border-space-600/10 hover:bg-space-800/20 transition-colors">
                        <td className="py-2.5 font-mono text-slate-400">{row.timestamp}</td>
                        <td className="py-2.5 font-mono text-slate-200">{row.battery}%</td>
                        <td className="py-2.5 font-mono text-slate-200">{row.solarOutput} W</td>
                        <td className="py-2.5 font-mono text-slate-200">{row.speed} m/s</td>
                        <td className={`py-2.5 font-mono ${row.temperature < -40 ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                          {row.temperature} °C
                        </td>
                        <td className="py-2.5 font-mono text-slate-200">{row.latency} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-sans">
                  <FileSpreadsheet className="w-12 h-12 text-space-600/30 mb-3" />
                  <span>No data parsed. Uplink a flight telemetry log to execute verification checks.</span>
                </div>
              )}
            </div>
          </SpaceCard>
        </div>
      </div>
    </div>
  );
}
