import React from 'react';
import { Mail } from 'lucide-react';
import { BUSINESS } from '../../constants/business';
import LegalPage, { P, Section } from './LegalPage';

const ContactPage = ({ onBack }) => (
  <LegalPage icon={Mail} title="Contact us" subtitle={`${BUSINESS.tradingName} · ${BUSINESS.location}`} onBack={onBack}>
    <Section title="Email">
      <P>
        <a href={`mailto:${BUSINESS.email}`} style={{ color: 'var(--primary)' }}>{BUSINESS.email}</a>
      </P>
    </Section>
    <Section title="Phone">
      <P>
        <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} style={{ color: 'var(--primary)' }}>{BUSINESS.phone}</a>
      </P>
    </Section>
    <Section title="Schools">
      <P>
        For a school licence, payments or refunds, email us from your school admin address with your school&apos;s name.
        We reply within 5 working days.
      </P>
    </Section>
    <Section title="Operated by">
      <P>{BUSINESS.operator}, {BUSINESS.location}</P>
    </Section>
  </LegalPage>
);

export default ContactPage;
