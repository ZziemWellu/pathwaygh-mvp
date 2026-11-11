import React from 'react';
import { Compass, GraduationCap, HeartHandshake, Lightbulb, MapPin, Puzzle, ShieldCheck, Sprout, Users } from 'lucide-react';
import { BUSINESS } from '../../constants/business';
import { TEAM } from '../../constants/team';
import LegalPage, { P, Section } from '../legal/LegalPage';

// Every statement here describes something the platform really does. Keep it
// that way when editing: parents and schools decide on the strength of it.
const VALUES = [
  {
    icon: HeartHandshake,
    title: 'Every student, whatever they can pay',
    body: 'Learning is free for students, always. Schools pay for the extra tools they use, so no child is shut out by cost.',
  },
  {
    icon: ShieldCheck,
    title: 'Children are safe here',
    body: 'A parent or guardian confirms each student account. We never sell personal data, we don\'t keep signed-in data on shared phones, and young pupils don\'t post in the community.',
  },
  {
    icon: Lightbulb,
    title: 'Honest about what we offer',
    body: 'Our questions are practice in the style of the BECE and WASSCE, not official past papers, and we say so. Calculated answers are checked automatically, and written questions are reviewed by teachers before students see them.',
  },
  {
    icon: MapPin,
    title: 'Made for here',
    body: 'Built around the syllabuses of Ghana, Nigeria, Sierra Leone, Liberia and The Gambia, with Twi and Nigerian Pidgin, and practice by text message for families without smartphones.',
  },
  {
    icon: Sprout,
    title: 'Learning that lasts',
    body: 'We help students understand, not just memorise: hints before answers, and practice that keeps coming back to what each student finds hard.',
  },
];

const APPROACH = [
  {
    icon: Compass,
    title: 'Follow the syllabus',
    body: 'Lessons and practice match each country\'s curriculum and each student\'s level, from primary through JHS to SHS.',
  },
  {
    icon: Puzzle,
    title: 'Practise little and often',
    body: 'Short quizzes adapt to each student, giving more practice on the topics they find hardest, with a worked answer for every question.',
  },
  {
    icon: Lightbulb,
    title: 'A tutor that teaches',
    body: 'The AI tutor gives hints before answers and checks its own maths with a calculator, so students learn to solve problems themselves.',
  },
  {
    icon: GraduationCap,
    title: 'From classroom to career',
    body: 'Students explore careers, universities and scholarships, match careers to their interests, and in Ghana plan their SHS choices against the CSSPS rules.',
  },
  {
    icon: Users,
    title: 'Schools and parents in the loop',
    body: 'Teachers see each class\'s progress, schools can create logins for pupils without email, and parents can get regular progress updates.',
  },
];

const cardGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' };
const card = { padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface, #fff)' };
const cardTitle = { display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px', fontSize: '1rem', color: 'var(--text)' };
const cardBody = { margin: 0, fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--text-muted)' };

const Cards = ({ items, headingLevel: Heading = 'h3' }) => (
  <div style={cardGrid}>
    {items.map(({ icon: Icon, title, body }) => (
      <article key={title} style={card}>
        <Heading style={cardTitle}>
          <Icon size={20} aria-hidden="true" color="var(--primary)" /> {title}
        </Heading>
        <p style={cardBody}>{body}</p>
      </article>
    ))}
  </div>
);

const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const AboutPage = ({ onBack }) => (
  <LegalPage icon={Users} title="About Us" subtitle={`${BUSINESS.tradingName} · ${BUSINESS.location}`} onBack={onBack}>
    <Section title="Who we are">
      <P>
        {BUSINESS.tradingName} is an online learning and career guidance platform for primary, JHS and SHS students in
        West Africa. We help students learn their syllabus, practise for their exams and plan what comes next, and we help
        schools and parents support them.
      </P>
    </Section>

    <Section title="Our Core Values">
      <Cards items={VALUES} />
    </Section>

    <Section title="Our Team">
      <div style={cardGrid}>
        {TEAM.map((person) => (
          <article key={person.name} style={{ ...card, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {person.photo ? (
              <img src={person.photo} alt="" width="56" height="56" style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <span aria-hidden="true" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {initials(person.name)}
              </span>
            )}
            <div>
              <h3 style={{ ...cardTitle, margin: 0 }}>{person.name}</h3>
              <p style={{ ...cardBody, fontWeight: 'bold', color: 'var(--primary)', margin: '2px 0 6px' }}>{person.role}</p>
              <p style={cardBody}>{person.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>

    <Section title="Our Approach">
      <Cards items={APPROACH} />
    </Section>

    <Section title="Get in touch">
      <P>
        Email{' '}
        <a href={`mailto:${BUSINESS.email}`} style={{ color: 'var(--primary)' }}>{BUSINESS.email}</a>
        {' '}or call {BUSINESS.phone}. Schools can create an account from the home page.
      </P>
    </Section>
  </LegalPage>
);

export default AboutPage;
