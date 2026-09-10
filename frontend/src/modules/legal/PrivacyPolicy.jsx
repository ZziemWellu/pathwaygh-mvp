import React from 'react';

const sectionStyle = { marginBottom: '24px' };
const headingStyle = { color: '#1a5f2b', fontSize: '17px', marginBottom: '8px' };
const bodyStyle = { color: '#333', fontSize: '14px', lineHeight: '1.6' };

const PrivacyPolicy = ({ onBack }) => {
  const handleBack = onBack ?? (() => window.history.back());

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={handleBack}
        style={{ background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer', textDecoration: 'underline', marginBottom: '20px', padding: 0, fontSize: '14px' }}
      >
        ← Back
      </button>

      <h1 style={{ color: '#1a5f2b', marginBottom: '4px' }}>Privacy Policy</h1>
      <p style={{ color: '#666666', fontSize: '13px', marginBottom: '28px' }}>Version 2026-09-v1 · Last updated September 2026</p>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>What we collect</h2>
        <p style={bodyStyle}>
          When you create a PathwayGH account we collect your name, email address, password
          (stored securely, never in plain text), and country. As you use the platform, we also
          store optional profile details you choose to add (school, grade, bio, phone, location,
          interests, goals, subjects), your course enrollments, lesson completion, and quiz
          results, and your chosen language. If you provide a parent or guardian email address,
          we store that too, along with the date you confirmed our age/consent statement below.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Age and consent</h2>
        <p style={bodyStyle}>
          PathwayGH is built for secondary-school students, many of whom are minors. There are
          two ways an account gets created:
        </p>
        <p style={bodyStyle}>
          <strong>Signing up yourself:</strong> you confirm you are at least 13 years old, and
          that if you are under 18 you have your parent or guardian's permission to create an
          account and use PathwayGH.
        </p>
        <p style={bodyStyle}>
          <strong>Signing up through your school:</strong> your school administrator can confirm
          that parental or guardian consent was already collected as part of your school's own
          enrollment process, so you don't need to repeat that step yourself.
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
          <strong>Platform administrators</strong> can only see aggregate, anonymized statistics
          across all schools — counts and averages like "how many students completed a course"
          or "average quiz score for this school" — never individual names, emails, or personal
          details.
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
          <a href="mailto:privacy@pathwaygh.com" style={{ color: '#1a5f2b' }}>privacy@pathwaygh.com</a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
