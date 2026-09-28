import React from 'react';

// Rendered as a real SVG instead of the 🇸🇱 emoji, matching GhanaFlag's
// approach - many Windows font configurations render flag emoji as literal
// text instead of a flag.
const SierraLeoneFlag = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size * 0.67}
    viewBox="0 0 30 20"
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px', ...style }}
    aria-label="Sierra Leone flag"
    role="img"
  >
    <rect width="30" height="20" fill="#1EB53A" />
    <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
    <rect y="13.34" width="30" height="6.67" fill="#0072C6" />
  </svg>
);

export default SierraLeoneFlag;
