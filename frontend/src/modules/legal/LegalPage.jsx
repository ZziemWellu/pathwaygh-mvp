import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

export const sectionStyle = { marginBottom: '24px' };
export const headingStyle = { color: 'var(--primary)', fontSize: '1.0625rem', marginBottom: '8px' };
export const bodyStyle = { color: 'var(--text)', fontSize: '0.9375rem', lineHeight: '1.6' };

// Shared frame for the public policy pages, which open both signed in and
// signed out (Paystack's reviewers and parents won't have accounts).
const LegalPage = ({ icon, title, subtitle, onBack, children }) => {
  const handleBack = onBack ?? (() => window.history.back());
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={handleBack} style={{ marginBottom: '16px' }}>
        Back
      </Button>
      <PageHeader as="h1" icon={icon} title={title} subtitle={subtitle} />
      {children}
    </div>
  );
};

export const Section = ({ title, children }) => (
  <section style={sectionStyle}>
    <h2 style={headingStyle}>{title}</h2>
    {children}
  </section>
);

export const P = ({ children }) => <p style={bodyStyle}>{children}</p>;

export default LegalPage;
