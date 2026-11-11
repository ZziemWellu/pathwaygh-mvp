import React from 'react';
import { ReceiptText } from 'lucide-react';
import { BUSINESS } from '../../constants/business';
import LegalPage, { P, Section } from './LegalPage';

// The 14-day window is a proposal for the owner to confirm. Other numbers here
// must stay in step with backend/modules/licence/service.py.
const RefundPolicy = ({ onBack }) => (
  <LegalPage icon={ReceiptText} title="Refund Policy" subtitle="Last updated November 2026" onBack={onBack}>
    <Section title="Students">
      <P>Students use {BUSINESS.tradingName} free of charge, so there is nothing to refund.</P>
    </Section>

    <Section title="School licences">
      <P>
        A school can ask for a full refund within 14 days of paying for a licence. After 14 days, payments aren&apos;t
        refundable, and the licence carries on until the end of the term or year it was bought for.
      </P>
      <P>
        Every new school gets its first term free, so you can try the licence features before paying anything.
      </P>
    </Section>

    <Section title="Mistakes in payment">
      <P>
        If you were charged twice, or charged more than the price shown, we refund the extra in full. If you paid but your
        licence wasn&apos;t switched on, we either switch it on or refund you in full, whichever you prefer.
      </P>
    </Section>

    <Section title="How to ask for a refund">
      <P>
        Email{' '}
        <a href={`mailto:${BUSINESS.email}`} style={{ color: 'var(--primary)' }}>{BUSINESS.email}</a>
        {' '}from your school admin email address, with your school&apos;s name and the payment reference shown after
        payment. We reply within 5 working days.
      </P>
      <P>
        Refunds go back through Paystack to the card, bank account or mobile money wallet you paid with. How long they take
        to arrive depends on your bank or mobile money provider.
      </P>
    </Section>
  </LegalPage>
);

export default RefundPolicy;
