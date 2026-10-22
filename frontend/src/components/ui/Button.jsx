import React from 'react';

// The app's one button. Visual styling lives in globals.css (.btn-*), so
// every button shares the same shape, hover, focus ring and disabled look
// instead of each one carrying its own inline colours.
//   variant: primary | secondary | ghost | danger | outline
//   size:    md | sm | lg
const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  block = false,
  className = '',
  type = 'button',
  children,
  ...props
}) => {
  const classes = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
