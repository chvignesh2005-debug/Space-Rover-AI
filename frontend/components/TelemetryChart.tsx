import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface DataPoint {
  time: string;
  value: number;
}

interface TelemetryChartProps {
  data: DataPoint[];
  metricName: string;
  unit?: string;
  color?: 'orange' | 'cyan';
  height?: number;
}

export default function TelemetryChart({
  data,
  metricName,
  unit = '',
  color = 'orange',
  height = 200
}: TelemetryChartProps) {
  
  const strokeColor = color === 'orange' ? '#ff5f1f' : '#06b6d4';
  const fillColor = color === 'orange' ? 'rgba(255, 95, 31, 0.1)' : 'rgba(6, 182, 212, 0.1)';

  // Custom tooltips matching NASA console designs
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-space-900 border border-space-600/30 p-2.5 rounded text-[10px] font-mono shadow-glow-cyan">
          <p className="text-slate-400 border-b border-space-600/20 pb-1 mb-1">TIME: {label}</p>
          <p className="text-slate-200">
            {metricName.toUpperCase()}: <span className={color === 'orange' ? 'text-space-orange' : 'text-space-cyan'}>
              {payload[0].value} {unit}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#64748b', fontSize: 9 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
            tickLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 9 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
            tickLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
