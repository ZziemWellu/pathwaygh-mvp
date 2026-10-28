import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardModule from './DashboardModule';
import { GamificationNotifyProvider } from '../../contexts/GamificationNotifyContext';
import { OPEN_TUTOR_EVENT } from '../../components/ai/AIChat';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } };
});

const week = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
  .map((date, i) => ({ date, active: i === 1, is_today: i === 2 }));

const summary = (nextStep, overrides = {}) => ({
  success: true,
  overview: { courses_enrolled: 0, lessons_completed: 0, lessons_total: 0, quizzes_taken: 0, average_quiz_score: 0 },
  current_courses: [],
  continue_learning: null,
  weak_subjects: [],
  weak_topics: [],
  recent_activity: [],
  next_step: nextStep,
  week,
  ...overrides,
});

// Summary for the dashboard; empty/benign answers for the child widgets.
const mockGets = (dashboard) => {
  api.get.mockImplementation((url) => {
    if (url === '/api/dashboard/summary') return Promise.resolve({ data: typeof dashboard === 'function' ? dashboard() : dashboard });
    if (url === '/api/gamification/profile') return Promise.resolve({ data: { xp_points: 0, current_streak_days: 0 } });
    return Promise.reject(new Error(`unmocked ${url}`));
  });
};

const LocationProbe = () => <div data-testid="path">{useLocation().pathname + useLocation().search}</div>;

const renderHome = () =>
  render(
    <GamificationNotifyProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardModule />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </GamificationNotifyProvider>
  );

describe('Home (DashboardModule)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('pathwaygh_user', JSON.stringify({ full_name: 'Ama Mensah', country: 'GH' }));
  });

  it('leads with the lesson to start when the next step is a course', async () => {
    mockGets(summary({
      kind: 'start', level: 'shs', course_id: 'shs-mathematics', course_title: 'SHS Core Mathematics',
      lesson_id: 'shs_math_alg_1', lesson_title: 'Introduction to Advanced Algebra',
      lesson_number: 1, lessons_total: 6, duration_minutes: 35,
    }));
    renderHome();
    expect(await screen.findByRole('heading', { name: 'Introduction to Advanced Algebra' })).toBeInTheDocument();
    expect(screen.getByText('SHS Core Mathematics · Lesson 1 of 6 · 35 min')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /start lesson/i }));
    expect(screen.getByTestId('path')).toHaveTextContent('/learn/shs-mathematics/lessons/shs_math_alg_1');
  });

  it('says Resume for a course already in progress', async () => {
    mockGets(summary({
      kind: 'continue', course_id: 'c', course_title: 'Course', lesson_id: 'l2', lesson_title: 'Lesson Two',
      lesson_number: 2, lessons_total: 4, duration_minutes: null,
    }));
    renderHome();
    expect(await screen.findByText('Continue where you left off')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume lesson/i })).toBeInTheDocument();
  });

  it('asks for the class when the level is unknown, saves it, and refreshes', async () => {
    let step = { kind: 'choose_level' };
    mockGets(() => summary(step));
    api.put.mockImplementation(() => {
      step = { kind: 'start', level: 'jhs', course_id: 'jhs-english', course_title: 'JHS English', lesson_id: 'e1', lesson_title: 'Nouns', lesson_number: 1, lessons_total: 6, duration_minutes: null };
      return Promise.resolve({ data: { success: true } });
    });
    renderHome();
    await userEvent.click(await screen.findByRole('button', { name: 'JHS 2' }));
    expect(api.put).toHaveBeenCalledWith('/api/profile/me', { grade: 'JHS 2' });
    expect(await screen.findByRole('heading', { name: 'Nouns' })).toBeInTheDocument();
  });

  it('shows an error if the class cannot be saved', async () => {
    mockGets(summary({ kind: 'choose_level' }));
    api.put.mockRejectedValue({ response: { data: { detail: 'Server unavailable' } } });
    renderHome();
    await userEvent.click(await screen.findByRole('button', { name: 'SHS 1' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
  });

  it('offers the quick quiz when there is no course to take', async () => {
    mockGets(summary({ kind: 'practice', level: 'university' }));
    renderHome();
    await userEvent.click(await screen.findByRole('button', { name: /start quick quiz/i }));
    expect(screen.getByTestId('path')).toHaveTextContent('/practice?quick=1');
  });

  it('opens the AI tutor from Today', async () => {
    mockGets(summary({ kind: 'practice', level: 'university' }));
    const listener = vi.fn();
    window.addEventListener(OPEN_TUTOR_EVENT, listener);
    renderHome();
    await userEvent.click(await screen.findByRole('button', { name: /ask the ai tutor/i }));
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_TUTOR_EVENT, listener);
  });

  it('counts the active days this week instead of showing zeros', async () => {
    mockGets(summary({ kind: 'practice', level: 'university' }));
    renderHome();
    expect(await screen.findByRole('heading', { name: '1 active day this week' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/0 XP/)).not.toBeInTheDocument());
  });
});
