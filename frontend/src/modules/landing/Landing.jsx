import React from 'react';
import {
  ArrowRight, Bot, GraduationCap, Layers, ListChecks, PlayCircle, Users,
} from 'lucide-react';
import GhanaFlag from '../../components/common/GhanaFlag';
import NigeriaFlag from '../../components/common/NigeriaFlag';
import SierraLeoneFlag from '../../components/common/SierraLeoneFlag';
import LiberiaFlag from '../../components/common/LiberiaFlag';
import GambiaFlag from '../../components/common/GambiaFlag';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Landing.css';

const COUNTRIES = [
  { name: 'Ghana', Flag: GhanaFlag },
  { name: 'Nigeria', Flag: NigeriaFlag },
  { name: 'Sierra Leone', Flag: SierraLeoneFlag },
  { name: 'Liberia', Flag: LiberiaFlag },
  { name: 'The Gambia', Flag: GambiaFlag },
];

const STEPS = [
  {
    title: 'Choose your country and level',
    body: "Courses, practice questions and universities follow your country's syllabus - JHS or SHS.",
  },
  {
    title: 'Learn and practise every day',
    body: "Watch short lessons, take WASSCE-style quizzes and ask the AI tutor when you're stuck. Earn a certificate for each course.",
  },
  {
    title: 'Plan what comes next',
    body: 'Career Match suggests careers that fit your strengths, with the universities, programmes and scholarships to get there.',
  },
];

const FEATURES = [
  { icon: PlayCircle, tint: 'primary', title: 'Video courses', body: 'Short lessons for JHS and SHS subjects, with progress tracking and a verifiable certificate when you finish.' },
  { icon: Bot, tint: 'accent', title: 'Practice with an AI tutor', body: 'Exam-style quizzes, and a tutor that gives hints before answers and double-checks its maths with a calculator.' },
  { icon: GraduationCap, tint: 'violet', title: 'Career Match & universities', body: 'Careers matched to your interests, WASSCE subject requirements, university programmes and scholarships.' },
  { icon: Layers, tint: 'info', title: 'Flashcards & Word of the Day', body: "Spaced-repetition flashcards bring back what you're about to forget; a new word every day builds vocabulary." },
  { icon: ListChecks, tint: 'primary', title: 'Study planner', body: "Build a plan for WASSCE or university entrance and keep track of what's left to cover." },
  { icon: Users, tint: 'rose', title: 'Parents & schools in the loop', body: 'Weekly WhatsApp progress summaries for guardians, and class rosters and completion reports for schools.' },
];

// What a signed-out visitor (or a hackathon judge) sees first: what
// PathwayGH is and who it's for, before being asked for anything.
const Landing = ({ onGetStarted, onSignIn, onShowPrivacy }) => (
  <div className="landing">
    <header className="landing__bar">
      <span className="landing__brand">
        <GhanaFlag size={22} /> PathwayGH
      </span>
      <nav className="landing__nav" aria-label="Landing">
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#schools">For schools</a>
        <LanguageSwitcher />
        <button type="button" className="btn btn-secondary btn-sm" onClick={onSignIn}>Sign in</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onGetStarted}>Get started</button>
      </nav>
    </header>

    <main>
      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="landing__eyebrow">For JHS &amp; SHS students across West Africa</p>
          <h1 className="landing__title">
            Find your path.<br />Pass your exams.<br /><span>Plan your future.</span>
          </h1>
          <p className="landing__lede">
            Video courses, WASSCE-style practice with an AI tutor that checks its own maths, and career guidance
            matched to your subjects - in English, Twi and Nigerian Pidgin.
          </p>
          <div className="landing__ctas">
            <button type="button" className="btn btn-primary btn-lg" onClick={onGetStarted}>
              Start learning <ArrowRight size={18} aria-hidden="true" />
            </button>
            <a className="btn btn-secondary btn-lg" href="#schools">I&apos;m a school</a>
          </div>
          <p className="landing__label">Built for five curricula</p>
          <ul className="landing__countries">
            {COUNTRIES.map(({ name, Flag }) => (
              <li key={name}><Flag size={20} /> {name}</li>
            ))}
          </ul>
        </div>

        <div className="landing__phone" role="img" aria-label="Preview of the PathwayGH student home screen">
          <div className="landing__phone-screen" aria-hidden="true">
            <div className="landing__phone-band" />
            <div className="landing__phone-head">PathwayGH</div>
            <div className="landing__phone-greet">Good afternoon, Ama<small>SHS · Ghana</small></div>
            <div className="landing__phone-next">
              <small>Your next step</small>
              <strong>Introduction to Advanced Algebra</strong>
              <span>SHS Core Mathematics · 35 min</span>
              <em>Start lesson</em>
            </div>
            <div className="landing__phone-row">Mathematics quiz · 5 questions</div>
            <div className="landing__phone-row">Word of the day · articulate</div>
            <div className="landing__phone-tabs">
              <b>Home</b><span>Learn</span><span>Practice</span><span>Explore</span><span>More</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="landing__band">
        <div className="landing__inner">
          <h2 className="landing__h2">How it works</h2>
          <ol className="landing__steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="landing__step-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="landing__inner landing__section">
        <h2 className="landing__h2">Everything a student needs, in one place</h2>
        <div className="landing__features">
          {FEATURES.map(({ icon: Icon, tint, title, body }) => (
            <article key={title} className="card">
              <span className={`landing__tile landing__tile--${tint}`}><Icon size={24} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__languages">
        <div className="landing__inner landing__languages-inner">
          <div>
            <h2>Learn in the language you think in</h2>
            <p>
              Switch the app and the AI tutor between English, Twi and Nigerian Pidgin. Read-aloud, larger text and a
              dyslexia-friendly font are one tap away.
            </p>
          </div>
          <ul>
            <li>English</li>
            <li className="is-accent">Twi</li>
            <li>Pidgin</li>
          </ul>
        </div>
      </section>

      <section id="schools" className="landing__inner landing__section">
        <div className="card landing__schools">
          <div>
            <p className="landing__eyebrow landing__eyebrow--plain">For schools</p>
            <h2>Bring PathwayGH to your classrooms</h2>
            <p>
              Students join with your school&apos;s code. You see every class&apos;s course completion and quiz
              results, and parents get progress updates.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-lg" onClick={onGetStarted}>
            Create a school account
          </button>
        </div>
      </section>
    </main>

    <footer className="landing__footer">
      <span>© 2026 PathwayGH · Powered by Zziem Technologies</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onShowPrivacy}>Privacy Policy</button>
    </footer>
  </div>
);

export default Landing;
