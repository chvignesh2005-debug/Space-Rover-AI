import React, { useState, useRef, useEffect } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import SpaceCard from '../components/SpaceCard';
import { Terminal, Send, HelpCircle, RefreshCw } from 'lucide-react';

interface TerminalLine {
  type: 'cmd' | 'resp' | 'sys';
  text: string;
}

export default function AIAssistant() {
  const { telemetry, addLog } = useTelemetryContext();
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'sys', text: 'Space-Rover-AI Autonomous Cognitive Terminal [v2.4]' },
    { type: 'sys', text: 'Deep Space network linking: ACTIVE. Neural weights locked.' },
    { type: 'resp', text: 'Greetings, Commander. I am ready to process navigation calculations, diagnostic telemetry, and science payloads. Use preset shortcuts or type queries below.' }
  ]);

  const presetQueries = [
    { label: 'Diagnose Power', cmd: '/diagnose power' },
    { label: 'Calculate Path', cmd: '/pathfind crater' },
    { label: 'Analyze Soil', cmd: '/analyze terrain' }
  ];

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const processAIResponse = (command: string) => {
    setIsTyping(true);
    addLog('AI', `AI Assistant processing command: ${command}`, 'INFO');
    
    setTimeout(() => {
      let reply = '';
      const cleanCmd = command.trim().toLowerCase();

      if (cleanCmd.includes('/diagnose power') || cleanCmd.includes('power') || cleanCmd.includes('battery')) {
        reply = `[POWER SUBSYSTEM ANALYSIS]
* Main Bus Voltage: 28.24 V (Stable)
* Battery Capacity: ${telemetry.battery}%
* Active Power Draw: ${telemetry.powerDraw} Watts
* Solar Harvester Output: ${telemetry.solarOutput} Watts (Normal Irradiance)
* Auxiliary heater cells: ACTIVE (Temp: ${telemetry.temperature}°C)
* Health Status: 92.5% (OPERATIONAL)
Recommendation: No current critical thermal warnings. Maintain path coordinates to maximize solar incidence.`;
      } 
      else if (cleanCmd.includes('/pathfind crater') || cleanCmd.includes('path') || cleanCmd.includes('crater') || cleanCmd.includes('navigation')) {
        reply = `[AUTONOMOUS NAVIGATIONAL PATHFINDING VECTOR]
* Current Position Coordinates: X: ${telemetry.coordinates.x}, Y: ${telemetry.coordinates.y}, Z: ${telemetry.coordinates.z}
* Cruising Heading: ${telemetry.heading}°
* Calculated Destination Target: Jezero Center Crater
* Slope Grade Check: 8.2° grade (Safe range < 20.0°)
* Path Hazard Evaluation: Low sand trap hazard predicted.
* Travel Vector Matrix: T = [${(telemetry.coordinates.x + 12).toFixed(2)}, ${(telemetry.coordinates.y - 8).toFixed(2)}]
Navigation parameters computed. Autonomous cruise model active.`;
      } 
      else if (cleanCmd.includes('/analyze terrain') || cleanCmd.includes('terrain') || cleanCmd.includes('soil') || cleanCmd.includes('science')) {
        reply = `[SCIENTIFIC PAYLOAD APXS SPECTRUM SCAN]
* Target soil scan area: Sector 14-Delta
* Silicon Density: 48.2% (High)
* Iron Oxide Concentration: 18.5% (High rust density)
* Core Moisture trace: 0.04% (Typical dry sand)
* Sample status: Drill bit calibration optimized. Ready for collection.`;
      } 
      else {
        reply = `Cognitive engine query processed: "${command}"
Analysis: General query accepted.
DSN Telemetry Link Status: STRONG (latency: ${telemetry.latency}ms).
All diagnostics stable. If querying detailed subsystem analytics, please use:
- "/diagnose power" to audit power grids
- "/pathfind crater" to verify trajectory maps
- "/analyze terrain" to view payload spectroscopic scans`;
      }

      setHistory((prev) => [
        ...prev, 
        { type: 'resp', text: reply }
      ]);
      setIsTyping(false);
      addLog('AI', `AI response generated for: ${command}`, 'INFO');
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const cmd = inputVal;
    setInputVal('');
    
    setHistory((prev) => [...prev, { type: 'cmd', text: cmd }]);
    processAIResponse(cmd);
  };

  const handleShortcutClick = (cmd: string) => {
    if (isTyping) return;
    setHistory((prev) => [...prev, { type: 'cmd', text: cmd }]);
    processAIResponse(cmd);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      
      {/* HEADER */}
      <div className="border-b border-space-600/20 pb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-space-orange">
          AI AUTONOMOUS COGNITIVE AGENT // COMMAND TERMINAL
        </h2>
        <p className="text-[10px] text-slate-400 font-sans">
          DIRECT QUERY PORTAL LINKED TO ROVER NAVIGATION MATRIX MACHINE LEARNING AGENTS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Helper shortcuts panel - left span */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <SpaceCard title="PRESET AI COMMANDS" subtitle="Execute quick sub-module scans" glowColor="cyan">
            <div className="mt-4 space-y-2">
              {presetQueries.map((q) => (
                <button
                  key={q.cmd}
                  onClick={() => handleShortcutClick(q.cmd)}
                  disabled={isTyping}
                  className="w-full text-left px-3 py-2 rounded text-[10px] uppercase font-mono border border-space-600/30 text-slate-300 hover:text-space-cyan hover:border-space-cyan bg-space-950/20 transition-all duration-200"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </SpaceCard>

          <SpaceCard title="COGNITIVE STATUS" glowColor="none" className="flex-1">
            <div className="text-[10px] space-y-3 font-sans mt-2">
              <div>
                <span className="text-slate-500 uppercase block font-mono text-[9px]">Neural Model:</span>
                <span className="text-slate-200 font-mono">Rover-Nav-GPT v4.0-RT</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block font-mono text-[9px]">Inference Latency:</span>
                <span className="text-space-cyan font-mono">0.082s (Local Core)</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block font-mono text-[9px]">Decision Certainty:</span>
                <span className="text-emerald-400 font-mono">98.8% accuracy check</span>
              </div>
            </div>
          </SpaceCard>
        </div>

        {/* Console Workspace - right span */}
        <div className="lg:col-span-3 flex flex-col min-h-[400px]">
          <div className="relative border border-space-600/30 rounded bg-space-900/30 backdrop-blur-sm p-4 flex-1 flex flex-col overflow-hidden">
            
            {/* HUD Corner Decorators */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-500/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-500/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-500/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-500/40" />

            <div className="flex items-center gap-2 border-b border-space-600/20 pb-2.5 mb-4 text-[10px] text-slate-400">
              <Terminal className="w-4 h-4 text-space-orange" />
              <span className="font-bold">SYSTEM TERMINAL STREAM // CONSOLE</span>
            </div>

            {/* Terminal Lines feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin text-xs font-mono">
              {history.map((line, idx) => (
                <div key={idx} className="space-y-1">
                  {line.type === 'cmd' && (
                    <div className="text-space-orange">
                      <span>SR-09-AI&gt; </span>
                      <span>{line.text}</span>
                    </div>
                  )}
                  {line.type === 'resp' && (
                    <div className="text-slate-300 bg-space-950/40 p-3 rounded border border-space-600/10 whitespace-pre-wrap leading-relaxed">
                      {line.text}
                    </div>
                  )}
                  {line.type === 'sys' && (
                    <div className="text-slate-500 italic text-[10px]">
                      *** {line.text} ***
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-space-cyan py-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[10px] animate-pulse">COGNITIVE ENGINE SOLVING VECTOR MATRIX...</span>
                </div>
              )}
              
              <div ref={consoleEndRef} />
            </div>

            {/* Input Bar form */}
            <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-space-600/20 flex gap-2">
              <span className="text-space-orange font-bold flex items-center justify-center pl-2 shrink-0">SR-09-AI&gt;</span>
              <input
                type="text"
                placeholder="Ask about terrain chemical composition, speed trajectory, power grids..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isTyping}
                className="flex-1 bg-space-950/80 border border-space-600/30 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-space-cyan focus:shadow-glow-cyan"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="px-4 py-2 bg-space-cyan text-space-950 hover:bg-cyan-500 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>

          </div>
        </div>
      </div>

    </div>
  );
}
