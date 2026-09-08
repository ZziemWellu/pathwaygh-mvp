import React from 'react';

// Rendered as a real SVG instead of the 🇳🇬 emoji, matching GhanaFlag's
// approach - many Windows font configurations render flag emoji as literal
// text instead of a flag.
const NigeriaFlag = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size * 0.67}
    viewBox="0 0 30 20"
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px', ...style }}
    aria-label="Nigeria flag"
    role="img"
  >
    <rect width="30" height="20" fill="#FFFFFF" />
    <rect width="10" height="20" fill="#008751" />
    <rect x="20" width="10" height="20" fill="#008751" />
  </svg>
);

export default NigeriaFlag;
