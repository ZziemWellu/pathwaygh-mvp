import React from 'react';

// Rendered as a real SVG instead of the 🇬🇲 emoji, matching GhanaFlag's
// approach - many Windows font configurations render flag emoji as literal
// text instead of a flag.
const GambiaFlag = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size * 0.67}
    viewBox="0 0 30 20"
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px', ...style }}
    aria-label="Gambia flag"
    role="img"
  >
    <rect width="30" height="20" fill="#3A7728" />
    <rect y="7" width="30" height="6" fill="#0C1C8C" />
    <rect y="6" width="30" height="1" fill="#FFFFFF" />
    <rect y="13" width="30" height="1" fill="#FFFFFF" />
    <rect width="30" height="6" fill="#CE1126" />
  </svg>
);

export default GambiaFlag;
