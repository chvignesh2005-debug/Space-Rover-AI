import React, { useState } from 'react';

type TabKey = 'dashboard' | 'prediction' | 'assistant' | 'reports' | 'about';

interface StatusInfo {
  color: string;
  bg: string;
  label: string;
}

interface PredictionResult {
  healthScore: number;
  navigationSafe: boolean;
  summary: string;
  faultType: string;
  severity: string;
  recommendedAction: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

interface NavItem {
  key: TabKey;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '🛰️' },
  { key: 'prediction', label: 'Prediction', icon: '🧠' },
  { key: 'assistant', label: 'AI Assistant', icon: '🤖' },
  { key: 'reports', label: 'Reports', icon: '📄' },
  { key: 'about', label: 'About', icon: 'ℹ️' },
];

const STATUS = {
  green: { color: '#35e5a6', bg: 'rgba(53,229,166,0.16)' },
  amber: { color: '#ffb020', bg: 'rgba(255,176,32,0.16)' },
  red: { color: '#ff5470', bg: 'rgba(255,84,112,0.16)' },
};

function getBatteryStatus(value: number): StatusInfo {
  if (value <= 20) return { ...STATUS.red, label: 'Critical' };
  if (value <= 45) return { ...STATUS.amber, label: 'Low' };
  return { ...STATUS.green, label: 'Nominal' };
}

function getTemperatureStatus(value: number): StatusInfo {
  if (value >= 60) return { ...STATUS.red, label: 'Overheating' };
  if (value >= 45) return { ...STATUS.amber, label: 'Elevated' };
  return { ...STATUS.green, label: 'Nominal' };
}

function getSpeedStatus(value: number): StatusInfo {
  if (value >= 10) return { ...STATUS.amber, label: 'High' };
  return { ...STATUS.green, label: 'Nominal' };
}

function getHealthStatus(value: number): StatusInfo {
  if (value < 50) return { ...STATUS.red, label: 'Critical' };
  if (value < 80) return { ...STATUS.amber, label: 'Warning' };
  return { ...STATUS.green, label: 'Nominal' };
}

function getSeverityStyle(severity: string): { bg: string; color: string; border: string } {
  const s = (severity || '').toLowerCase();
  if (s.includes('critical') || s.includes('high')) {
    return { bg: 'rgba(255,84,112,0.14)', color: '#ff8a9c', border: 'rgba(255,84,112,0.4)' };
  }
  if (s.includes('medium') || s.includes('moderate') || s.includes('warning')) {
    return { bg: 'rgba(255,176,32,0.14)', color: '#ffd48a', border: 'rgba(255,176,32,0.4)' };
  }
  if (s.includes('low') || s.includes('nominal') || s.includes('none')) {
    return { bg: 'rgba(53,229,166,0.14)', color: '#8ff0cf', border: 'rgba(53,229,166,0.4)' };
  }
  return { bg: 'rgba(147,165,196,0.14)', color: '#c4d0e6', border: 'rgba(147,165,196,0.4)' };
}

function normalizePrediction(data: any) {
  return {
    healthScore: data.overall_health_score,
    navigationSafe: data.navigation_safe,
    summary: data.summary,

    faultType:
      data.fault_predictions?.[0]?.fault_type ?? "None Detected",

    severity:
      data.fault_predictions?.[0]?.severity ?? "UNKNOWN",

    recommendedAction:
      data.fault_predictions?.[0]?.recommended_action ??
      "No action required."
  };
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdfContentStream(lines: string[]): string {
  let ops = 'BT /F1 12 Tf 50 760 Td\n';
  lines.forEach((line, idx) => {
    if (idx === 0) {
      ops += `(${escapePdfText(line)}) Tj\n`;
    } else {
      ops += `0 -20 Td (${escapePdfText(line)}) Tj\n`;
    }
  });
  ops += 'ET';
  return ops;
}

function generateReportPdf(lines: string[]): Blob {
  const contentStream = buildPdfContentStream(lines);
  const objects: string[] = [];
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  objects[3] =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  objects[4] = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  objects[5] = `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0, 0, 0, 0, 0, 0];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }
  const xrefStart = pdf.length;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += xref;
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

interface GaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
}

function Gauge({ value, size = 176, strokeWidth = 14, color, label }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.6s ease', filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: size * 0.24,
            color: '#eaf2ff',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {Math.round(clamped)}
        </span>
        {label && (
          <span style={{ fontSize: 12, color: '#93a5c4', marginTop: 6, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  unit: string;
  status: StatusInfo;
  barPercent: number;
}

function StatCard({ icon, label, value, unit, status, barPercent }: StatCardProps) {
  return (
    <div className="glass-card stat-card">
      <div className="stat-icon-wrap" style={{ background: status.bg }}>
        <span className="stat-icon">{icon}</span>
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {value}
        <span className="stat-unit">{unit}</span>
      </p>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{ width: `${Math.max(0, Math.min(100, barPercent))}%`, background: status.color }}
        />
      </div>
      <div className="stat-footer">
        <span className="status-dot" style={{ color: status.color, background: status.color }} />
        <span>{status.label}</span>
      </div>
    </div>
  );
}

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

:root {
  --bg-panel: rgba(18, 27, 48, 0.55);
  --border-glass: rgba(120, 180, 255, 0.16);
  --accent-cyan: #4fd8ff;
  --accent-blue: #3b82f6;
  --accent-amber: #ffb020;
  --accent-green: #35e5a6;
  --accent-red: #ff5470;
  --text-primary: #eaf2ff;
  --text-secondary: #93a5c4;
  --text-muted: #5b6b8c;
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Rajdhani', sans-serif;
  --font-mono: 'Share Tech Mono', monospace;
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; margin: 0; padding: 0; }

body {
  background: #050810;
  color: var(--text-primary);
  font-family: var(--font-body);
}

.sra-root { min-height: 100vh; position: relative; overflow-x: hidden; }

.sra-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 900px 600px at 20% -10%, rgba(59,130,246,0.16), transparent 60%),
    radial-gradient(ellipse 900px 700px at 100% 10%, rgba(79,216,255,0.10), transparent 60%),
    radial-gradient(ellipse at top, #0d1830 0%, #050810 55%, #020409 100%);
}

.sra-starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1.5px 1.5px at 50% 40%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1px 1px at 70% 15%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1.5px 1.5px at 85% 65%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 95% 85%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1px 1px at 15% 90%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.5px 1.5px at 60% 90%, rgba(255,255,255,0.45), transparent);
  background-repeat: repeat;
  background-size: 600px 600px;
  opacity: 0.55;
  animation: sra-twinkle 6s ease-in-out infinite alternate;
}

@keyframes sra-twinkle {
  0% { opacity: 0.3; }
  100% { opacity: 0.7; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

button:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
}

.sra-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 40px;
  background: rgba(8, 13, 26, 0.72);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid var(--border-glass);
  flex-wrap: wrap;
}

.sra-brand { display: flex; align-items: center; gap: 14px; }
.sra-logo-icon { font-size: 32px; filter: drop-shadow(0 0 10px rgba(79,216,255,0.8)); }
.sra-brand-text h1 {
  font-family: var(--font-display);
  font-size: 21px;
  margin: 0;
  letter-spacing: 1.5px;
  background: linear-gradient(90deg, #ffffff, var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.sra-brand-text p { margin: 3px 0 0; font-size: 12.5px; color: var(--text-secondary); letter-spacing: 0.5px; }

.sra-nav { display: flex; gap: 6px; flex-wrap: wrap; }
.sra-nav-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.sra-nav-btn:hover {
  color: var(--text-primary);
  background: rgba(79,216,255,0.08);
  border-color: rgba(79,216,255,0.25);
  transform: translateY(-1px);
}
.sra-nav-btn.active {
  color: #04121c;
  background: linear-gradient(120deg, var(--accent-cyan), var(--accent-blue));
  box-shadow: 0 4px 18px rgba(79,216,255,0.35);
}

.sra-main { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; padding: 44px 32px 90px; }
.sra-section-title {
  font-family: var(--font-display);
  font-size: 13.5px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--accent-cyan);
  margin: 0 0 8px;
}
.sra-section-sub { color: var(--text-secondary); font-size: 15px; margin: 0 0 30px; max-width: 640px; line-height: 1.6; }

.glass-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-glass);
  border-radius: 20px;
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 44px rgba(0,0,0,0.45);
  border-color: rgba(120,180,255,0.32);
}

.status-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; margin-bottom: 26px; }
@media (max-width: 980px) { .status-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .status-grid { grid-template-columns: 1fr; } }

.stat-card { padding: 26px; position: relative; overflow: hidden; }
.stat-card::after {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(79,216,255,0.3) 0%, transparent 70%);
  opacity: 0.35;
  pointer-events: none;
}
.stat-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 18px;
  position: relative;
}
.stat-label {
  font-size: 12.5px;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: var(--text-secondary);
  margin: 0 0 8px;
  position: relative;
}
.stat-value {
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  position: relative;
}
.stat-unit { font-size: 15px; color: var(--text-secondary); margin-left: 4px; }
.stat-bar-track {
  height: 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  margin-top: 16px;
  overflow: hidden;
  position: relative;
}
.stat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
.stat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--text-secondary);
  position: relative;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  animation: sra-pulse 1.8s ease-in-out infinite;
  display: inline-block;
}
@keyframes sra-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.btn {
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: 0.6px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary {
  background: linear-gradient(120deg, var(--accent-cyan), var(--accent-blue));
  color: #04111c;
  padding: 15px 30px;
  font-size: 15.5px;
  box-shadow: 0 8px 26px rgba(79,216,255,0.28);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 34px rgba(79,216,255,0.42); }
.btn-primary:active:not(:disabled) { transform: translateY(0); }
.btn-ghost {
  background: rgba(255,255,255,0.04);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
  padding: 13px 24px;
  font-size: 14px;
}
.btn-ghost:hover { background: rgba(79,216,255,0.08); border-color: rgba(79,216,255,0.4); }

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid rgba(4,17,28,0.35);
  border-top-color: #04111c;
  animation: sra-spin 0.7s linear infinite;
}
@keyframes sra-spin { to { transform: rotate(360deg); } }

.prediction-grid { display: grid; grid-template-columns: 380px 1fr; gap: 26px; align-items: start; }
@media (max-width: 960px) { .prediction-grid { grid-template-columns: 1fr; } }

.field-group { margin-bottom: 24px; }
.field-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.field-label .value { font-family: var(--font-mono); color: var(--accent-cyan); font-size: 14px; }

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  outline: none;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(120deg, var(--accent-cyan), var(--accent-blue));
  box-shadow: 0 0 10px rgba(79,216,255,0.6);
  cursor: pointer;
  border: 2px solid #04121c;
}
input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(120deg, var(--accent-cyan), var(--accent-blue));
  box-shadow: 0 0 10px rgba(79,216,255,0.6);
  cursor: pointer;
  border: 2px solid #04121c;
}

.empty-state { text-align: center; padding: 70px 20px; color: var(--text-secondary); }
.empty-state .icon { font-size: 42px; margin-bottom: 16px; opacity: 0.75; }

.result-fade { animation: sra-fade-up 0.5s ease; }
@keyframes sra-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.error-card {
  border: 1px solid rgba(255,84,112,0.4);
  background: rgba(255,84,112,0.08);
  padding: 18px 22px;
  border-radius: 16px;
  color: #ffb3c0;
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.chat-shell { display: flex; flex-direction: column; height: 540px; }
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 26px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chat-messages::-webkit-scrollbar { width: 6px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(79,216,255,0.3); border-radius: 4px; }

.bubble {
  max-width: 74%;
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 14.5px;
  line-height: 1.55;
  animation: sra-fade-up 0.35s ease;
  white-space: pre-wrap;
}
.bubble.user {
  align-self: flex-end;
  background: linear-gradient(120deg, var(--accent-blue), var(--accent-cyan));
  color: #04111c;
  border-bottom-right-radius: 4px;
  font-weight: 600;
}
.bubble.ai {
  align-self: flex-start;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-glass);
  border-bottom-left-radius: 4px;
  color: var(--text-primary);
}
.bubble.ai.error {
  border-color: rgba(255,84,112,0.45);
  background: rgba(255,84,112,0.08);
  color: #ffb3c0;
}

.chat-input-row { display: flex; gap: 12px; padding: 20px 22px; border-top: 1px solid var(--border-glass); }
.chat-textarea {
  flex: 1;
  resize: none;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-glass);
  border-radius: 14px;
  padding: 13px 16px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14.5px;
  outline: none;
  transition: border-color 0.25s ease;
  min-height: 48px;
}
.chat-textarea:focus { border-color: rgba(79,216,255,0.5); }

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  display: inline-block;
  margin: 0 2px;
  animation: sra-typing 1.2s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes sra-typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.reports-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-bottom: 26px; }
@media (max-width: 860px) { .reports-grid { grid-template-columns: 1fr; } }

.chip {
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(79,216,255,0.08);
  border: 1px solid rgba(79,216,255,0.25);
  color: var(--accent-cyan);
  font-size: 13px;
  font-weight: 600;
  margin: 4px 8px 4px 0;
}

.sra-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 28px 20px 36px;
  color: var(--text-muted);
  font-size: 13px;
  border-top: 1px solid var(--border-glass);
  letter-spacing: 0.5px;
}

@media (max-width: 700px) {
  .sra-header { padding: 16px 20px; }
  .sra-main { padding: 32px 18px 70px; }
  .sra-brand-text h1 { font-size: 17px; }
}
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const [battery, setBattery] = useState<number>(80);
  const [temperature, setTemperature] = useState<number>(35);
  const [speed, setSpeed] = useState<number>(2);

  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const batteryStatus = getBatteryStatus(battery);
  const temperatureStatus = getTemperatureStatus(temperature);
  const speedStatus = getSpeedStatus(speed);
  const dashboardHealthScore = predictionResult ? predictionResult.healthScore : 92;
  const healthStatus = getHealthStatus(dashboardHealthScore);

  const handlePredict = async () => {
    setPredictionError(null);
    setPredictionLoading(true);
    setPredictionResult(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battery: Number(battery),
          temperature: Number(temperature),
          speed: Number(speed),
        }),
      });
      if (!response.ok) {
        throw new Error(`prediction service responded with status ${response.status}`);
      }
      const data = await response.json();
      setPredictionResult(normalizePrediction(data));
    } catch (err) {
      setPredictionError(
        err instanceof Error
          ? `Unable to reach the prediction service. ${err.message}`
          : 'Unable to reach the prediction service.'
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleAskAI = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: trimmed };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }
      const data = await response.json();
      const reply =
        (data && (data.reply ?? data.response ?? data.message ?? data.answer)) ??
        'The AI assistant did not return a response.';
      setChatMessages((prev) => [...prev, { role: 'ai', text: String(reply) }]);
    } catch (err) {
      const message =
        err instanceof Error
          ? `Unable to reach the AI assistant. ${err.message}`
          : 'Unable to reach the AI assistant.';
      setChatMessages((prev) => [...prev, { role: 'ai', text: message, isError: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadReport = () => {
    const health = predictionResult ? Math.round(predictionResult.healthScore) : Math.round(dashboardHealthScore);
    const lines = [
      'SPACE ROVER AI - MISSION DIAGNOSTIC REPORT',
      '',
      'Space Rover AI Platform',
      '',
      'TELEMETRY SNAPSHOT',
      `Battery Level: ${battery} percent`,
      `Temperature: ${temperature} C`,
      `Speed: ${speed} m/s`,
      `Health Score: ${health} / 100`,
      '',
      'PREDICTION SUMMARY',
    ];
    if (predictionResult) {
      lines.push(`Navigation Status: ${predictionResult.navigationSafe ? 'SAFE' : 'UNSAFE'}`);
      lines.push(`Fault Type: ${predictionResult.faultType}`);
      lines.push(`Severity: ${predictionResult.severity}`);
      lines.push(`Recommended Action: ${predictionResult.recommendedAction}`);
      lines.push('');
      lines.push(`Summary: ${predictionResult.summary}`);
    } else {
      lines.push('No prediction has been run yet.');
    }
    lines.push('');
    lines.push('End of report.');

    const blob = generateReportPdf(lines);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sra-root">
      <style>{GLOBAL_STYLES}</style>
      <div className="sra-bg" />
      <div className="sra-starfield" />

      <header className="sra-header">
        <div className="sra-brand">
          <span className="sra-logo-icon">🚀</span>
          <div className="sra-brand-text">
            <h1>SPACE ROVER AI</h1>
            <p>AI Powered Rover Health Monitoring Platform</p>
          </div>
        </div>
        <nav className="sra-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sra-nav-btn ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="sra-main">
        {activeTab === 'dashboard' && (
          <section>
            <p className="sra-section-title">Mission Overview</p>
            <p className="sra-section-sub">
              Real-time telemetry summary for the active rover unit, covering power, thermal, and mobility health
              indicators.
            </p>

            <div className="status-grid">
              <StatCard
                icon="🔋"
                label="Battery"
                value={String(battery)}
                unit="%"
                status={batteryStatus}
                barPercent={battery}
              />
              <StatCard
                icon="🌡️"
                label="Temperature"
                value={String(temperature)}
                unit="°C"
                status={temperatureStatus}
                barPercent={(temperature / 80) * 100}
              />
              <StatCard
                icon="💨"
                label="Speed"
                value={speed.toFixed(1)}
                unit=" m/s"
                status={speedStatus}
                barPercent={(speed / 15) * 100}
              />
              <StatCard
                icon="🩺"
                label="Health Score"
                value={String(Math.round(dashboardHealthScore))}
                unit=" /100"
                status={healthStatus}
                barPercent={dashboardHealthScore}
              />
            </div>

            <div
              className="glass-card"
              style={{
                padding: '26px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  className="status-dot"
                  style={{ color: healthStatus.color, background: healthStatus.color, width: 12, height: 12 }}
                />
                <div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '13.5px', letterSpacing: '1.2px' }}>
                    MISSION STATUS: {healthStatus.label.toUpperCase()}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Telemetry link active &middot; all systems reporting
                  </p>
                </div>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('prediction')}>
                Run Diagnostics →
              </button>
            </div>
          </section>
        )}

        {activeTab === 'prediction' && (
          <section>
            <p className="sra-section-title">Diagnostics</p>
            <p className="sra-section-sub">
              Run an AI-powered structural and thermal analysis using the rover's current telemetry readings.
            </p>

            <div className="prediction-grid">
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 22px', fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '1.5px' }}>
                  TELEMETRY INPUT
                </h3>

                <div className="field-group">
                  <div className="field-label">
                    <span>Battery Level</span>
                    <span className="value">{battery}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={battery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBattery(Number(e.target.value))}
                  />
                </div>

                <div className="field-group">
                  <div className="field-label">
                    <span>Temperature</span>
                    <span className="value">{temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={100}
                    value={temperature}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(Number(e.target.value))}
                  />
                </div>

                <div className="field-group">
                  <div className="field-label">
                    <span>Speed</span>
                    <span className="value">{speed.toFixed(1)} m/s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.1}
                    value={speed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpeed(Number(e.target.value))}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={handlePredict}
                  disabled={predictionLoading}
                >
                  {predictionLoading ? (
                    <>
                      <span className="spinner" /> Analyzing
                    </>
                  ) : (
                    <>🔮 Run Prediction</>
                  )}
                </button>
              </div>

              <div className="glass-card" style={{ padding: '30px', minHeight: '440px' }}>
                {predictionError && (
                  <div className="error-card">
                    <span>⚠️</span>
                    <div>{predictionError}</div>
                  </div>
                )}

                {!predictionError && !predictionResult && !predictionLoading && (
                  <div className="empty-state">
                    <div className="icon">🛰️</div>
                    <p>Run a prediction to view the rover's AI-generated health diagnostics.</p>
                  </div>
                )}

                {predictionLoading && (
                  <div className="empty-state">
                    <div className="spinner" style={{ margin: '0 auto 18px', width: 34, height: 34, borderWidth: 4 }} />
                    <p>Running structural and thermal analysis...</p>
                  </div>
                )}

                {predictionResult && !predictionLoading && (
                  <div className="result-fade">
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '28px' }}>
                      <Gauge
                        value={predictionResult.healthScore}
                        color={getHealthStatus(predictionResult.healthScore).color}
                        label="Health Score"
                      />
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <span
                          className="badge"
                          style={{
                            background: predictionResult.navigationSafe ? 'rgba(53,229,166,0.14)' : 'rgba(255,84,112,0.14)',
                            color: predictionResult.navigationSafe ? '#8ff0cf' : '#ff8a9c',
                            border: `1px solid ${
                              predictionResult.navigationSafe ? 'rgba(53,229,166,0.4)' : 'rgba(255,84,112,0.4)'
                            }`,
                          }}
                        >
                          {predictionResult.navigationSafe ? '✅ Navigation Safe' : '⛔ Navigation Unsafe'}
                        </span>
                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14.5px' }}>
                          {predictionResult.summary}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '18px',
                        marginBottom: '20px',
                      }}
                    >
                      <div>
                        <p className="stat-label">Fault Type</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', margin: 0 }}>
                          {predictionResult.faultType}
                        </p>
                      </div>
                      <div>
                        <p className="stat-label">Severity</p>
                        <span
                          className="badge"
                          style={{
                            background: getSeverityStyle(predictionResult.severity).bg,
                            color: getSeverityStyle(predictionResult.severity).color,
                            border: `1px solid ${getSeverityStyle(predictionResult.severity).border}`,
                          }}
                        >
                          {predictionResult.severity}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '20px 24px',
                        borderRadius: '16px',
                        background: 'rgba(79,216,255,0.06)',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      <p className="stat-label" style={{ marginBottom: '8px' }}>
                        Recommended Action
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14.5px', lineHeight: 1.6 }}>
                        {predictionResult.recommendedAction}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'assistant' && (
          <section>
            <p className="sra-section-title">Mission Support</p>
            <p className="sra-section-sub">
              Chat with the onboard AI assistant for real-time guidance on rover operations, anomalies, and mission
              planning.
            </p>

            <div className="glass-card chat-shell">
              <div className="chat-messages">
                {chatMessages.length === 0 && !chatLoading && (
                  <div className="empty-state" style={{ margin: 'auto' }}>
                    <div className="icon">🤖</div>
                    <p>Ask the AI assistant anything about your rover's status or mission.</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`bubble ${msg.role}${msg.isError ? ' error' : ''}`}>
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bubble ai">
                    <span className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                )}
              </div>
              <div className="chat-input-row">
                <textarea
                  className="chat-textarea"
                  rows={1}
                  placeholder="Ask about rover diagnostics, mission status, or anomalies..."
                  value={chatInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChatInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAskAI}
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? <span className="spinner" /> : <>Ask AI 📡</>}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'reports' && (
          <section>
            <p className="sra-section-title">Mission Documentation</p>
            <p className="sra-section-sub">
              Generate a professional diagnostic report summarizing current telemetry and the latest AI prediction
              results.
            </p>

            <div className="reports-grid">
              <div className="glass-card" style={{ padding: '26px' }}>
                <span style={{ fontSize: '28px' }}>📊</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '1px', margin: '16px 0 8px' }}>
                  Diagnostic Report
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  Full telemetry snapshot with AI prediction summary.
                </p>
              </div>
              <div className="glass-card" style={{ padding: '26px' }}>
                <span style={{ fontSize: '28px' }}>🛠️</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '1px', margin: '16px 0 8px' }}>
                  Maintenance Log
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  Recommended actions and fault history overview.
                </p>
              </div>
              <div className="glass-card" style={{ padding: '26px' }}>
                <span style={{ fontSize: '28px' }}>📡</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '1px', margin: '16px 0 8px' }}>
                  Mission Summary
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  Consolidated health scoring across recent runs.
                </p>
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '1px', margin: '0 0 8px' }}>
                  Export Full Report
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, maxWidth: '460px', lineHeight: 1.5 }}>
                  Download a complete PDF report including current telemetry and diagnostic results.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleDownloadReport}>
                ⬇ Download Report
              </button>
            </div>
          </section>
        )}

        {activeTab === 'about' && (
          <section>
            <p className="sra-section-title">About the Platform</p>
            <p className="sra-section-sub">A closer look at the mission behind Space Rover AI.</p>

            <div className="glass-card" style={{ padding: '36px' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 16px' }}>
                Space Rover AI is an AI-powered mission control platform built to monitor the structural and
                operational health of planetary rovers in real time. It combines live telemetry tracking with a
                predictive machine learning engine to flag faults before they escalate, and pairs that with a
                conversational AI assistant for on-demand mission support.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.7, margin: '0 0 24px' }}>
                Designed as a final-year engineering showcase, the platform demonstrates how modern web engineering
                and applied AI can come together to deliver a genuinely production-grade mission control experience.
              </p>
              <div>
                <span className="chip">React</span>
                <span className="chip">TypeScript</span>
                <span className="chip">FastAPI</span>
                <span className="chip">Machine Learning</span>
                <span className="chip">Predictive Diagnostics</span>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="sra-footer">Space Rover AI © 2026</footer>
    </div>
  );
}