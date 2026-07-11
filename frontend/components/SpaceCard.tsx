import React from 'react';

interface SpaceCardProps {
  title?: string;
  subtitle?: string;
  glowColor?: 'orange' | 'cyan' | 'red' | 'none';
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export default function SpaceCard({
  title,
  subtitle,
  glowColor = 'none',
  children,
  headerActions,
  className = ''
}: SpaceCardProps) {
  
  const glowClasses = {
    orange: 'glow-border-orange border-space-orange/20 hover:border-space-orange/45',
    cyan: 'glow-border-cyan border-space-cyan/20 hover:border-space-cyan/45',
    red: 'border-rose-950 shadow-glow-red hover:border-rose-500/40',
    none: 'border-space-600/20 bg-space-900/30'
  };

  return (
    <div className={`relative border rounded bg-space-900/40 backdrop-blur-sm p-5 ${glowClasses[glowColor]} ${className}`}>
      
      {/* Corner Bracket Decorators for Sci-Fi HUD look */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-500/40" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-500/40" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-500/40" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-500/40" />

      {/* Header section of the Card */}
      {title && (
        <div className="border-b border-space-600/20 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-slate-200 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                glowColor === 'orange' 
                  ? 'bg-space-orange' 
                  : glowColor === 'cyan' 
                    ? 'bg-space-cyan' 
                    : glowColor === 'red' 
                      ? 'bg-rose-500' 
                      : 'bg-slate-400'
              }`} />
              {title}
            </h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-sans mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      {/* Content */}
      <div className="text-xs text-slate-300">
        {children}
      </div>
    </div>
  );
}
