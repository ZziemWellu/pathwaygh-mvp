import React from 'react';

// Standard page opening: icon tile, title (with the kente accent beneath),
// optional subtitle, and an actions slot on the right.
const PageHeader = ({ icon: Icon, title, subtitle, actions, as: Heading = 'h2' }) => (
  <header className="page-header">
    <div className="page-header__lead">
      {Icon && (
        <span className="page-header__icon">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <Heading className="page-header__title">{title}</Heading>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </header>
);

export default PageHeader;
