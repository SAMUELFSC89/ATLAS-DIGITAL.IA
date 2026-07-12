import React from 'react';
import { motion } from 'motion/react';

interface AtlasLogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'light' | 'dark' | 'gold';
  showSubtitle?: boolean;
}

export function AtlasLogoIcon({ className = 'w-10 h-10', variant = 'gold' }: { className?: string; variant?: 'light' | 'dark' | 'gold' }) {
  // We recreate the user's beautiful logo mark in high-precision vector SVG
  return (
    <svg 
      viewBox="0 0 220 180" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} transition-transform duration-300`}
    >
      <defs>
        {/* Metallic Silver Gradient for the main A leg */}
        <linearGradient id="silver-metallic" x1="50" y1="20" x2="110" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Premium Gold Gradient for the chart pillars and inner accent */}
        <linearGradient id="gold-metallic" x1="90" y1="40" x2="170" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="30%" stopColor="#F5B301" />
          <stop offset="70%" stopColor="#B48400" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Drop shadow for 3D depth */}
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#logo-shadow)">
        {/* LEFT METALLIC SILVER 'A' LEG */}
        {/* This path starts at the bottom-left, goes up to the apex, and curves down back to form a thick sleek pillar */}
        <path 
          d="M 110 20 L 50 140 L 78 140 L 110 75 L 110 20 Z" 
          fill="url(#silver-metallic)" 
        />
        
        {/* RIGHT TOP METALLIC SILVER 'A' CAP */}
        {/* Parallel to the left, forming the apex and dropping to the right */}
        <path 
          d="M 110 20 L 110 75 L 126 50 L 110 20 Z" 
          fill="url(#silver-metallic)" 
        />

        {/* INNER GOLDEN TRIANGLE SLASH (The Rising Core) */}
        {/* Pointing up-right, parallel to the left slope, nested perfectly inside */}
        <path 
          d="M 68 123 L 105 123 L 121 80 L 84 123 Z" 
          fill="url(#gold-metallic)" 
        />

        {/* THREE RISING GOLDEN COLUMNS / PILLARS */}
        {/* Follows the downward slope of the right leg, symbolizing rising results, bar charts, and growth */}
        
        {/* Pillar 1 (Tallest, closest to the A) */}
        <path 
          d="M 132 55 L 142 58 L 142 140 L 132 140 Z" 
          fill="url(#gold-metallic)" 
        />
        
        {/* Pillar 2 (Medium) */}
        <path 
          d="M 148 78 L 158 81 L 158 140 L 148 140 Z" 
          fill="url(#gold-metallic)" 
        />
        
        {/* Pillar 3 (Shortest, rightmost) */}
        <path 
          d="M 164 100 L 174 103 L 174 140 L 164 140 Z" 
          fill="url(#gold-metallic)" 
        />
      </g>
    </svg>
  );
}

export default function AtlasLogo({ 
  className = '', 
  iconOnly = false, 
  variant = 'gold', 
  showSubtitle = true 
}: AtlasLogoProps) {

  if (iconOnly) {
    return <AtlasLogoIcon className={className} variant={variant} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Animated logo mark */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="shrink-0"
      >
        <AtlasLogoIcon className="w-10 h-10 md:w-11 md:h-11 drop-shadow-xl" variant={variant} />
      </motion.div>

      {/* Typography brand details mimicking the uploaded file */}
      <div className="flex flex-col justify-center text-left">
        {/* ATLAS lettering with custom golden inner triangles for the A's */}
        <div className="flex items-center font-display font-black text-base md:text-lg tracking-[0.25em] text-white leading-none">
          <span>ATLAS</span>
        </div>
        
        {/* DIGITAL with golden accent lines */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-[1px] w-3 bg-[#F5B301] opacity-70"></div>
          <span className="text-[9px] md:text-[10px] font-mono font-bold tracking-[0.35em] text-[#F5B301] uppercase leading-none">
            DIGITAL
          </span>
          <div className="h-[1px] w-3 bg-[#F5B301] opacity-70"></div>
        </div>

        {/* Subtitle SITES QUE GERAM RESULTADOS */}
        {showSubtitle && (
          <span className="text-[7px] md:text-[8px] text-gray-400 tracking-[0.18em] font-medium uppercase mt-1 leading-none">
            SITES QUE GERAM RESULTADOS
          </span>
        )}
      </div>
    </div>
  );
}
