import React from 'react';
import { FileText } from 'lucide-react';
import { BUSINESS } from '../../constants/business';
import LegalPage, { P, Section } from './LegalPage';

const TermsOfService = ({ onBack }) => (
  <LegalPage icon={FileText} title="Terms of Service" subtitle="Last updated November 2026" onBack={onBack}>
    <Section title="Who we are">
      <P>
        {BUSINESS.tradingName} ({BUSINESS.website}) is operated by {BUSINESS.operator}, {BUSINESS.location}. By using
        {' '}{BUSINESS.tradingName} you agree to these terms. If you are under 18, your parent or guardian must agree to them too.
      </P>
    </Section>

    <Section title="What we provide">
      <P>
        Online lessons, practice questions, an AI tutor, career and university guidance, and study planning for primary,
        JHS and SHS students. Students use {BUSINESS.tradingName} free of charge. Schools can buy a licence for extra
        features, such as reports on their students&apos; progress.
      </P>
      <P>
        Our practice questions are written in the style of the BECE and WASSCE. They are not official past papers, and
        using them doesn&apos;t guarantee any exam result. The AI tutor can make mistakes, so check important answers with
        a teacher.
      </P>
    </Section>

    <Section title="Accounts">
      <P>
        Each person may have one account, for one country and one school level. Give accurate details, keep your password
        private, and tell us if you think someone else has used your account. A parent or guardian confirms consent for
        each student&apos;s account.
      </P>
    </Section>

    <Section title="Using the platform properly">
      <P>
        Don&apos;t share anyone else&apos;s personal details, post anything harmful or offensive in the community, try to
        get into other people&apos;s accounts, or copy our content for sale. We may remove content or close an account
        that breaks these rules.
      </P>
    </Section>

    <Section title="School licences">
      <P>
        A school licence is priced per student, for a term or a full academic year. The price is shown in the school
        dashboard before payment. Each new school gets its first term free. When a paid licence ends, the school keeps its
        licence features for 14 more days, then moves to the free plan. Students never lose access to learning. Payments
        are processed by Paystack. See our Refund Policy for refunds.
      </P>
    </Section>

    <Section title="Availability and changes">
      <P>
        We work to keep {BUSINESS.tradingName} available and accurate, but we can&apos;t promise it will always be
        uninterrupted or error-free. We may change features, and we may update these terms. When we do, we&apos;ll change
        the date above, and important changes will be shown in the app.
      </P>
    </Section>

    <Section title="Liability">
      <P>
        As far as the law allows, we aren&apos;t responsible for indirect losses from using {BUSINESS.tradingName}. For a
        school, our total liability is limited to what it paid us in the 12 months before the claim. Nothing in these
        terms limits rights you have under Ghanaian law that can&apos;t be limited.
      </P>
    </Section>

    <Section title="Law">
      <P>These terms are governed by the laws of Ghana.</P>
    </Section>

    <Section title="Contact">
      <P>
        Email{' '}
        <a href={`mailto:${BUSINESS.email}`} style={{ color: 'var(--primary)' }}>{BUSINESS.email}</a>
        {' '}or call {BUSINESS.phone}.
      </P>
    </Section>
  </LegalPage>
);

export default TermsOfService;
