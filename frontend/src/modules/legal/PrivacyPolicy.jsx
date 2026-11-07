import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

const sectionStyle = { marginBottom: '24px' };
const headingStyle = { color: 'var(--primary)', fontSize: '17px', marginBottom: '8px' };
const bodyStyle = { color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' };

const PrivacyPolicy = ({ onBack }) => {
  const handleBack = onBack ?? (() => window.history.back());

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={handleBack} style={{ marginBottom: '16px' }}>
        Back
      </Button>

      <PageHeader as="h1" icon={ShieldCheck} title="Privacy Policy" subtitle="Version 2026-11-v2 · Last updated November 2026" />

      <section style={sectionStyle}>
        <h2 style={headingStyle}>What we collect</h2>
        <p style={bodyStyle}>
          When you create a Learning Hotspot account we collect your name, email address or username, password
          (stored securely, never in plain text), country, and school level (primary, JHS or SHS). As you use the platform, we also
          store optional profile details you choose to add (school, grade, bio, phone, location,
          interests, goals, subjects), your course enrollments, lesson completion, and quiz
          results, and your chosen language. We also store your parent or guardian's phone number or email address, whichever you
          give us, along with the date your parent or guardian confirmed consent.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Age and consent</h2>
        <p style={bodyStyle}>
          Learning Hotspot is built for primary and secondary-school students, many of whom are
          minors. There are two ways an account gets created:
        </p>
        <p style={bodyStyle}>
          <strong>Signing up yourself:</strong> JHS and SHS students confirm they are at least 13
          years old, and that if they are under 18 they have their parent or guardian's permission
          to create an account and use Learning Hotspot. Primary pupils confirm that a parent or
          guardian is helping them and agrees. We then send your parent or guardian a code, by text
          message or email, to confirm their consent.
        </p>
        <p style={bodyStyle}>
          <strong>Signing up through your school:</strong> your school administrator can confirm
          that parental or guardian consent was already collected as part of your school's own
          enrollment process, so you don't need to repeat that step yourself. Your school can also
          create your login for you, with a username and a first password you then change.
        </p>
        <p style={bodyStyle}>
          To be clear about what this does and doesn't mean: we do not independently verify age
          or identity, and neither consent path is verified by a third party. This is an honest
          first step toward responsible handling of student data, not a compliance guarantee —
          if you have concerns about a specific account, please contact us using the details
          below.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Who can see your data</h2>
        <p style={bodyStyle}>
          <strong>Your school's administrator</strong> (if you joined a school) can see your
          name, email, grade, and your own course/quiz activity — but only for students at their
          own school. They cannot see students at any other school.
        </p>
        <p style={bodyStyle}>
          <strong>Platform administrators</strong> normally only see aggregate, anonymized statistics
          across all schools — counts and averages like "how many students completed a course"
          or "average quiz score for this school" — never individual names, emails, or personal
          details. The one exception is correcting a student&apos;s school level: an administrator
          can open one account by its exact email or username to do this, and each change is
          recorded with the reason.
        </p>
        <p style={bodyStyle}>
          <strong>Services that help us run the platform:</strong> Africa's Talking delivers our
          text messages, so it receives the phone number and the message. It includes your first
          name and a code when it goes to your parent or guardian. Google's Gemini powers the AI
          tutor, so it receives the questions you ask the tutor.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>What we don't do</h2>
        <p style={bodyStyle}>
          We do not sell your data or share it with third parties for advertising or marketing.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>How long we keep your data</h2>
        <p style={bodyStyle}>
          We keep your account data for as long as your account is active. If you want your
          account or data deleted, contact us using the details below and we'll act on that
          request.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Questions or requests</h2>
        <p style={bodyStyle}>
          If you'd like to access, correct, or delete your data, or if you have any questions
          about this policy, contact us at{' '}
          <a href="mailto:privacy@pathwaygh.com" style={{ color: 'var(--primary)' }}>privacy@pathwaygh.com</a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
