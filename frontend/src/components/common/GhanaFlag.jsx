import React from 'react';

// Rendered as a real SVG instead of the 🇬🇭 emoji, which many Windows
// font configurations render as literal "GH" text instead of a flag.
const GhanaFlag = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size * 0.67}
    viewBox="0 0 30 20"
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px', ...style }}
    aria-label="Ghana flag"
    role="img"
  >
    <rect width="30" height="20" fill="#006B3F" />
    <rect width="30" height="13.34" fill="#FCD116" />
    <rect width="30" height="6.67" fill="#CE1126" />
    <polygon
      points="15,6.2 16.3,10.2 20.5,10.2 17.1,12.6 18.4,16.6 15,14.2 11.6,16.6 12.9,12.6 9.5,10.2 13.7,10.2"
      fill="#000000"
    />
  </svg>
);

export default GhanaFlag;
