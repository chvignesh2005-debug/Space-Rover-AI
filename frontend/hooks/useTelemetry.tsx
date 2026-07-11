import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TelemetryData {
  battery: number;
  solarOutput: number;
  speed: number;
  temperature: number;
  latency: number;
  signalStrength: 'STRONG' | 'DEGRADED' | 'WEAK' | 'LOST';
  coordinates: { x: number; y: number; z: number };
  heading: number;
  activeFaults: number;
  powerDraw: number;
}

export interface TelemetryLog {
  timestamp: string;
  source: 'SYS' | 'NAV' | 'PWR' | 'COM' | 'AI' | 'ML' | 'PROP' | 'THM' | 'PLD';
  message: string;
  severity: 'INFO' | 'WARN' | 'CRIT';
}

const MOCK_MESSAGES: Omit<TelemetryLog, 'timestamp'>[] = [
  { source: 'SYS', message: 'Main battery cell temperature stabilized at -12°C.', severity: 'INFO' },
  { source: 'PWR', message: 'Solar array alignment complete; angle set to 42.5°.', severity: 'INFO' },
  { source: 'NAV', message: 'Navigation path verified: crater hazard avoided.', severity: 'INFO' },
  { source: 'COM', message: 'Uplink transmission packet size: 4.8 KB. Latency: 122ms.', severity: 'INFO' },
  { source: 'AI', message: 'Terrain analysis complete: soil composition rich in silicon.', severity: 'INFO' },
  { source: 'ML', message: 'Wheel slip detection model running at 60Hz. Slip coefficient: 0.04.', severity: 'INFO' },
  { source: 'PWR', message: 'Slight fluctuation detected in Battery Unit 2 power rail.', severity: 'WARN' },
  { source: 'NAV', message: 'Rover speed reduced due to high-slope terrain ahead.', severity: 'WARN' },
  { source: 'COM', message: 'Deep Space Network signal attenuation detected.', severity: 'WARN' },
  { source: 'SYS', message: 'Subsystem diagnostics: all units reporting functional.', severity: 'INFO' },
  { source: 'AI', message: 'Autonomous mapping algorithm updated target path coordinates.', severity: 'INFO' }
];

interface TelemetryContextType {
  telemetry: TelemetryData;
  logs: TelemetryLog[];
  addLog: (source: TelemetryLog['source'], message: string, severity: TelemetryLog['severity']) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    battery: 87.5,
    solarOutput: 420,
    speed: 0.18,
    temperature: -14,
    latency: 122,
    signalStrength: 'STRONG',
    coordinates: { x: 124.52, y: -45.18, z: 8.24 },
    heading: 182.4,
    activeFaults: 0,
    powerDraw: 145
  });

  const [logs, setLogs] = useState<TelemetryLog[]>([
    { timestamp: new Date(Date.now() - 30000).toISOString(), source: 'SYS', message: 'Mission Control system online.', severity: 'INFO' },
    { timestamp: new Date(Date.now() - 25000).toISOString(), source: 'COM', message: 'Connection established with Rover DSN-1.', severity: 'INFO' },
    { timestamp: new Date(Date.now() - 20000).toISOString(), source: 'NAV', message: 'Inertial Navigation System calibrated.', severity: 'INFO' },
    { timestamp: new Date(Date.now() - 15000).toISOString(), source: 'PWR', message: 'Solar array output optimized (420W).', severity: 'INFO' }
  ]);

  const addLog = (source: TelemetryLog['source'], message: string, severity: TelemetryLog['severity']) => {
    const newLog: TelemetryLog = {
      timestamp: new Date().toISOString(),
      source,
      message,
      severity
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const nextBattery = Math.max(0, Math.min(100, prev.battery - (Math.random() * 0.1 - 0.05))); // slow drain
        const nextSolar = Math.max(200, Math.min(600, prev.solarOutput + Math.round(Math.random() * 10 - 5)));
        const nextSpeed = Math.max(0, Math.min(0.5, prev.speed + (Math.random() * 0.04 - 0.02)));
        const nextTemp = Math.max(-80, Math.min(20, prev.temperature + (Math.random() * 0.6 - 0.3)));
        const nextLatency = Math.max(115, Math.min(145, prev.latency + Math.round(Math.random() * 6 - 3)));
        const nextPower = Math.max(100, Math.min(300, prev.powerDraw + Math.round(Math.random() * 8 - 4)));
        
        let signal: TelemetryData['signalStrength'] = 'STRONG';
        if (nextLatency > 138) signal = 'DEGRADED';
        else if (nextLatency > 143) signal = 'WEAK';

        return {
          ...prev,
          battery: parseFloat(nextBattery.toFixed(2)),
          solarOutput: nextSolar,
          speed: parseFloat(nextSpeed.toFixed(3)),
          temperature: parseFloat(nextTemp.toFixed(1)),
          latency: nextLatency,
          signalStrength: signal,
          coordinates: {
            x: parseFloat((prev.coordinates.x + prev.speed * 0.05).toFixed(2)),
            y: parseFloat((prev.coordinates.y - prev.speed * 0.02).toFixed(2)),
            z: parseFloat((prev.coordinates.z + (Math.random() * 0.02 - 0.01)).toFixed(2))
          },
          heading: parseFloat(((prev.heading + (Math.random() * 0.4 - 0.2) + 360) % 360).toFixed(1)),
          powerDraw: nextPower
        };
      });

      if (Math.random() > 0.4) {
        const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
        addLog(randomMsg.source, randomMsg.message, randomMsg.severity);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TelemetryContext.Provider value={{ telemetry, logs, addLog }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetryContext() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetryContext must be used within a TelemetryProvider');
  }
  return context;
}
