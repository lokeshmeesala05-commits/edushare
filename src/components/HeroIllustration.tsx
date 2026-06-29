import React from 'react';

export const HeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%" className={className}>
      {/* Decorative background blob - adapts to light/dark mode */}
      <path 
        className="fill-blue-100 dark:fill-blue-900/30 transition-colors duration-300"
        d="M420,250 C460,300 400,380 250,380 C100,380 40,300 80,250 C120,200 150,150 250,150 C350,150 380,200 420,250 Z" 
      />
      
      {/* Book 1 (Bottom, Blue) */}
      <rect x="120" y="290" width="260" height="40" rx="5" className="fill-blue-500 dark:fill-blue-600" />
      <rect x="120" y="295" width="250" height="30" className="fill-blue-600 dark:fill-blue-700" />
      <path d="M125,295 L375,295 L375,325 L125,325 Z" fill="white" opacity="0.15" />
      <rect x="130" y="305" width="220" height="4" rx="2" fill="white" opacity="0.4" />
      <rect x="130" y="315" width="180" height="4" rx="2" fill="white" opacity="0.4" />
      
      {/* Book 2 (Middle, Green) */}
      <rect x="140" y="255" width="230" height="35" rx="5" className="fill-emerald-500 dark:fill-emerald-600" />
      <rect x="140" y="260" width="220" height="25" className="fill-emerald-600 dark:fill-emerald-700" />
      <path d="M145,260 L365,260 L365,285 L145,285 Z" fill="white" opacity="0.15" />
      <rect x="150" y="270" width="190" height="4" rx="2" fill="white" opacity="0.4" />
      
      {/* Book 3 (Top, Orange) */}
      <rect x="160" y="225" width="190" height="30" rx="4" className="fill-orange-400 dark:fill-orange-500" />
      <rect x="160" y="230" width="180" height="20" className="fill-orange-500 dark:fill-orange-600" />
      <path d="M165,230 L345,230 L345,250 L165,250 Z" fill="white" opacity="0.15" />
      <rect x="170" y="238" width="150" height="4" rx="2" fill="white" opacity="0.4" />

      {/* Graduation Cap */}
      {/* Tassel */}
      <line x1="330" y1="130" x2="340" y2="200" stroke="#fbbf24" strokeWidth="4" />
      <circle cx="340" cy="200" r="8" fill="#f59e0b" />
      {/* Cap Base */}
      <path d="M180,180 L320,180 L300,225 L200,225 Z" className="fill-slate-800 dark:fill-slate-700" />
      {/* Cap Top (Diamond) */}
      <path d="M250,110 L370,150 L250,190 L130,150 Z" className="fill-slate-900 dark:fill-slate-800" />
      {/* Cap Button */}
      <circle cx="250" cy="150" r="6" className="fill-slate-700 dark:fill-slate-600" />
      
      {/* Sparkles/Stars */}
      <circle cx="90" cy="120" r="5" className="fill-amber-400 animate-pulse" style={{ animationDelay: '0s' }} />
      <circle cx="410" cy="100" r="7" className="fill-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
      <circle cx="430" cy="220" r="4" className="fill-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Floating Pencil */}
      <g transform="translate(80, 200) rotate(45)">
         <rect x="0" y="0" width="80" height="15" fill="#fbbf24" rx="2" />
         <polygon points="80,0 100,7.5 80,15" fill="#fca5a5" />
         <polygon points="95,5.5 100,7.5 95,9.5" fill="#334155" />
         <rect x="-15" y="0" width="15" height="15" fill="#f472b6" rx="2" />
         <rect x="0" y="0" width="5" height="15" fill="#94a3b8" />
      </g>
    </svg>
  );
};
