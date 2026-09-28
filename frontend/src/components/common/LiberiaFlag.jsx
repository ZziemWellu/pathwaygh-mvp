import React from 'react';

// Rendered as a real SVG instead of the 🇱🇷 emoji, matching GhanaFlag's
// approach - many Windows font configurations render flag emoji as literal
// text instead of a flag. Simplified to 6 stripes (real flag has 11) and a
// 4-point star (real flag has 5) to stay legible at the small sizes this
// renders at (nav bar, country picker).
const LiberiaFlag = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size * 0.67}
    viewBox="0 0 30 20"
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px', ...style }}
    aria-label="Liberia flag"
    role="img"
  >
    <rect width="30" height="20" fill="#FFFFFF" />
    <rect width="30" height="3.33" fill="#BF0A30" />
    <rect y="6.67" width="30" height="3.33" fill="#BF0A30" />
    <rect y="13.34" width="30" height="3.33" fill="#BF0A30" />
    <rect width="12" height="11" fill="#002868" />
    <polygon points="6,3 7,6 10,6 7.5,8 8.5,11 6,9 3.5,11 4.5,8 2,6 5,6" fill="#FFFFFF" />
  </svg>
);

export default LiberiaFlag;
