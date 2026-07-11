import React, { useState } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';
import { Compass, Target, Navigation } from 'lucide-react';

export default function RoverMap() {
  const { telemetry, addLog } = useTelemetryContext();
  const [navTarget, setNavTarget] = useState<{ x: number; y: number } | null>(null);

  // Jezero crater landmarks on our SVG layout (width 500, height 300)
  const landmarks = [
    { name: "JEZERO DELTA", cx: 120, cy: 110, r: 24, label: "Delta Deposit" },
    { name: "NERETVA VALLES", cx: 60, cy: 70, r: 12, label: "Ancient Channel" },
    { name: "OCTAVIA BUTLER LANDING", cx: 250, cy: 150, r: 6, label: "Touchdown Point" },
    { name: "SEITAH RIDGE", cx: 380, cy: 210, r: 35, label: "Rough Dune Field" },
    { name: "BELVA CRATER", cx: 440, cy: 80, r: 18, label: "Impact Site" }
  ];

  // Map rover coords back to SVG coordinate space
  // Base rover start: X: 124.52, Y: -45.18
  // Let's create a mapping function
  const mapCoordinatesToSVG = (x: number, y: number) => {
    // Normalise coords around base area to SVG width 500, height 300
    const svgX = 250 + (x - 124.52) * 50;
    const svgY = 150 - (y + 45.18) * 50;
    return { x: svgX, y: svgY };
  };

  const currentPos = mapCoordinatesToSVG(telemetry.coordinates.x, telemetry.coordinates.y);

  // SVG dimensions
  const width = 500;
  const height = 300;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Scale SVG values from client mouse coords
    const svgX = (clickX / rect.width) * width;
    const svgY = (clickY / rect.height) * height;

    // Convert back to rover coordinate system for display
    const roverX = parseFloat((124.52 + (svgX - 250) / 50).toFixed(2));
    const roverY = parseFloat((-45.18 - (svgY - 150) / 50).toFixed(2));

    setNavTarget({ x: roverX, y: roverY });
    addLog('NAV', `New destination set: Target coordinates locked at X: ${roverX}, Y: ${roverY}.`, 'INFO');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 text-xs bg-space-900/50 p-2.5 rounded border border-space-600/10">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-space-orange animate-pulse" />
          <span className="font-bold">GRID MAP: JEZERO CRATER INTERACTION</span>
        </div>
        <div className="text-[10px] text-slate-400">
          CLICK GRID TO LOCK Target POSITION
        </div>
      </div>

      <div className="relative flex-1 bg-space-950 border border-space-600/30 rounded overflow-hidden">
        {/* Radar sweep overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-space-orange/5 to-transparent h-1/4 w-full animate-scanline pointer-events-none" />

        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full cursor-crosshair"
          onClick={handleMapClick}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 95, 31, 0.06)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Map Boundaries */}
          <rect width="100%" height="100%" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="2" />

          {/* Landmarks / Crates */}
          {landmarks.map((l) => (
            <g key={l.name} className="group/landmark">
              <circle 
                cx={l.cx} 
                cy={l.cy} 
                r={l.r} 
                fill="none" 
                stroke="rgba(6, 182, 212, 0.25)" 
                strokeWidth="1.2" 
                strokeDasharray="4 2"
              />
              <circle 
                cx={l.cx} 
                cy={l.cy} 
                r={2} 
                fill="rgba(6, 182, 212, 0.5)"
              />
              <text 
                x={l.cx} 
                y={l.cy + l.r + 12} 
                textAnchor="middle" 
                fill="rgba(148, 163, 184, 0.6)" 
                fontSize="8"
                className="font-mono tracking-wider group-hover/landmark:fill-space-cyan transition-colors"
              >
                {l.name}
              </text>
            </g>
          ))}

          {/* Rover Path Trajectory */}
          <path
            d={`M 180,240 Q 220,180 ${currentPos.x},${currentPos.y}`}
            fill="none"
            stroke="rgba(255, 95, 31, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />

          {/* Target Location Mark */}
          {navTarget && (
            <g>
              {/* Flashing target ring */}
              <circle 
                cx={mapCoordinatesToSVG(navTarget.x, navTarget.y).x} 
                cy={mapCoordinatesToSVG(navTarget.x, navTarget.y).y} 
                r="10" 
                fill="none" 
                stroke="rgba(239, 68, 68, 0.6)" 
                strokeWidth="1"
                className="animate-ping"
              />
              <line 
                x1={mapCoordinatesToSVG(navTarget.x, navTarget.y).x - 12}
                y1={mapCoordinatesToSVG(navTarget.x, navTarget.y).y}
                x2={mapCoordinatesToSVG(navTarget.x, navTarget.y).x + 12}
                y2={mapCoordinatesToSVG(navTarget.x, navTarget.y).y}
                stroke="#ef4444"
                strokeWidth="1.2"
              />
              <line 
                x1={mapCoordinatesToSVG(navTarget.x, navTarget.y).x}
                y1={mapCoordinatesToSVG(navTarget.x, navTarget.y).y - 12}
                x2={mapCoordinatesToSVG(navTarget.x, navTarget.y).x}
                y2={mapCoordinatesToSVG(navTarget.x, navTarget.y).y + 12}
                stroke="#ef4444"
                strokeWidth="1.2"
              />
              <circle 
                cx={mapCoordinatesToSVG(navTarget.x, navTarget.y).x} 
                cy={mapCoordinatesToSVG(navTarget.x, navTarget.y).y} 
                r="3" 
                fill="#ef4444"
              />
              <text
                x={mapCoordinatesToSVG(navTarget.x, navTarget.y).x + 14}
                y={mapCoordinatesToSVG(navTarget.x, navTarget.y).y + 4}
                fill="#ef4444"
                fontSize="8"
                fontWeight="bold"
              >
                TARGET LOCK [X:{navTarget.x}, Y:{navTarget.y}]
              </text>
            </g>
          )}

          {/* Current Rover Pin */}
          <g>
            <circle 
              cx={currentPos.x} 
              cy={currentPos.y} 
              r="8" 
              fill="none" 
              stroke="rgba(255, 95, 31, 0.7)" 
              strokeWidth="2"
            />
            <circle 
              cx={currentPos.x} 
              cy={currentPos.y} 
              r="3" 
              fill="var(--color-space-orange, #ff5f1f)"
              className="animate-pulse"
            />
            {/* Rover Heading pointer arrow */}
            <g transform={`translate(${currentPos.x}, ${currentPos.y}) rotate(${telemetry.heading})`}>
              <line 
                x1="0" 
                y1="0" 
                x2="0" 
                y2="-16" 
                stroke="#ff5f1f" 
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            </g>
          </g>
        </svg>

        {/* HUD overlay coordinates box */}
        <div className="absolute bottom-2 left-2 bg-space-900/80 backdrop-blur-md border border-space-600/30 p-2 rounded text-[9px] pointer-events-none space-y-0.5">
          <div className="text-slate-400">CURRENT TELEMETRY PIN:</div>
          <div className="text-space-cyan font-bold">X: {telemetry.coordinates.x}</div>
          <div className="text-space-cyan font-bold">Y: {telemetry.coordinates.y}</div>
          <div className="text-slate-400">HEADING: <span className="text-slate-200 font-semibold">{telemetry.heading}°</span></div>
        </div>
      </div>
    </div>
  );
}
