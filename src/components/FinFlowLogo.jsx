import React from 'react';

/**
 * FinFlowLogo - The 6-Spectrum Smart Jar Logo
 * Concept 3: Biểu tượng Chiếc Hũ Thông Minh cấu thành từ 6 dải quang phổ tài chính
 * 1. Đỏ Cam (NEC - 55% Nhu cầu thiết yếu)
 * 2. Vàng Hổ Phách (LTSS - 10% Tiết kiệm dài hạn)
 * 3. Xanh Lá Sáng (PLAY - 10% Hưởng thụ cuộc sống)
 * 4. Xanh Ngọc Lục / Cyan (EDU - 10% Học tập phát triển)
 * 5. Xanh Lam / Indigo (FFA - 10% Tự do tài chính)
 * 6. Xanh Tím / Sapphire (GIVE - 5% Cho đi & Bác ái)
 */
export default function FinFlowLogo({ 
  size = 40, 
  className = '', 
  showGlow = true,
  animated = false 
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`finflow-smart-jar-logo ${animated ? 'finflow-logo-animated' : ''} ${className}`}
      role="img"
      aria-label="FinFlow 6Jars Logo"
    >
      <defs>
        {/* Layer 1: Red-Orange / Coral (NEC) */}
        <linearGradient id="jar-band-1" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>

        {/* Layer 2: Amber-Gold (LTSS) */}
        <linearGradient id="jar-band-2" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>

        {/* Layer 3: Lime / Emerald Green (PLAY) */}
        <linearGradient id="jar-band-3" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="50%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Layer 4: Cyan / Aqua Teal (EDU) */}
        <linearGradient id="jar-band-4" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Layer 5: Ocean Blue / Electric Indigo (FFA) */}
        <linearGradient id="jar-band-5" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="60%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        {/* Layer 6: Deep Royal Indigo / Violet (GIVE) */}
        <linearGradient id="jar-band-6" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Soft Background Radial Ambient Glow */}
        <radialGradient id="jar-ambient-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#ec4899" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>

        {/* Highlight Gradient for glossy 3D effect */}
        <linearGradient id="jar-specular" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ambient background glow if enabled */}
      {showGlow && (
        <circle cx="50" cy="50" r="46" fill="url(#jar-ambient-glow)" />
      )}

      {/* Group representing the 6 stacked curved spectrum ribbons forming the Smart Jar */}
      <g className="jar-bands-group" strokeLinecap="round" strokeLinejoin="round">
        
        {/* Band 1: Jar Top Rim / Lid (Red-Orange) */}
        <path
          d="M 33 16 C 30 16 28 18 30 21 C 32 24 37 25 43 25 L 67 25 C 73 25 78 21 78 18.5 C 78 16 73 16 67 16 Z"
          fill="url(#jar-band-1)"
        />

        {/* Band 2: Upper Neck Curve (Orange-Gold) */}
        <path
          d="M 27 31 C 23 31 22 34 25 37 C 28 40 37 41 45 40 L 73 38 C 78 37 80 34 78 31 C 76 28 71 28 65 29 Z"
          fill="url(#jar-band-2)"
        />

        {/* Band 3: Upper Belly Wave (Lime-Green) */}
        <path
          d="M 20 45 C 16 46 16 50 19 53 C 23 56 32 56 42 55 L 78 52 C 84 51 86 47 84 44 C 82 41 77 41 71 42 Z"
          fill="url(#jar-band-3)"
        />

        {/* Band 4: Mid Belly Wave (Teal-Cyan) */}
        <path
          d="M 18 59 C 14 60 14 64 18 67 C 22 70 32 70 42 69 L 79 66 C 85 65 87 61 85 58 C 83 55 78 55 71 56 Z"
          fill="url(#jar-band-4)"
        />

        {/* Band 5: Lower Taper Wave (Blue-Indigo) */}
        <path
          d="M 21 73 C 18 74 18 78 22 81 C 26 84 35 84 45 83 L 75 79 C 81 78 82 74 80 71 C 78 68 74 68 68 70 Z"
          fill="url(#jar-band-5)"
        />

        {/* Band 6: Jar Base Loop (Royal Blue-Violet) */}
        <path
          d="M 28 86 C 25 87 25 91 30 93 C 36 95 48 95 56 94 L 67 92 C 73 91 75 87 72 84 C 69 82 64 83 58 84 Z"
          fill="url(#jar-band-6)"
        />

        {/* Subtle Specular Arc Highlight along the left side to give 3D glass sheen */}
        <path
          d="M 30 20 C 22 35 18 55 23 75"
          stroke="url(#jar-specular)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />

        {/* Top-right sparkle dot for wealth/prosperity */}
        <circle cx="77" cy="13" r="2.2" fill="#fef08a" opacity="0.9" />
        <path
          d="M 83 18 L 84 14 L 88 15 L 85 18 L 87 22 L 83 19 L 80 21 L 82 17 Z"
          fill="#fef08a"
          opacity="0.85"
          transform="scale(0.55) translate(40, -2)"
        />
      </g>
    </svg>
  );
}
