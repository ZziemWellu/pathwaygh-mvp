import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CourseGrid from './CourseGrid';
import { LanguageProvider } from '../../contexts/LanguageContext';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn() } };
});

const COURSES = [
  { id: 'shs-mathematics', title: 'SHS Core Mathematics', description: 'Algebra', level: 'shs', lesson_count: 6, enrolled: true, duration_minutes: 230, lessons_completed: 2, progress: 33, next_lesson: { id: 'shs_math_3', title: 'Functions', is_free_preview: false } },
  { id: 'jhs-english', title: 'JHS English Language', description: 'Grammar', level: 'jhs', lesson_count: 6, enrolled: false, duration_minutes: null, lessons_completed: 0, progress: 0, next_lesson: { id: 'e1', title: 'Nouns', is_free_preview: true } },
];

const LocationProbe = () => <div data-testid="path">{useLocation().pathname}</div>;

const renderLearn = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route path="/learn" element={<CourseGrid user={{ country: 'GH' }} />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );

describe('Learn (CourseGrid)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/api/learn/enrolled' ? [COURSES[0]] : COURSES }));
  });

  it('shows course length, free first lesson and progress', async () => {
    renderLearn();
    expect(await screen.findByText('6 lessons · 3 h 50 min')).toBeInTheDocument();
    expect(screen.getByText('6 lessons · first lesson free')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'SHS Core Mathematics progress' })).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByText('2/6')).toBeInTheDocument();
  });

  it('filters by level without refetching', async () => {
    renderLearn();
    await screen.findByText('SHS Core Mathematics');
    await userEvent.click(screen.getByRole('button', { name: 'JHS' }));
    expect(screen.queryByText('SHS Core Mathematics')).not.toBeInTheDocument();
    expect(screen.getByText('JHS English Language')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JHS' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('My courses loads enrolled courses', async () => {
    renderLearn();
    await screen.findByText('JHS English Language');
    await userEvent.click(screen.getByRole('button', { name: /my courses/i }));
    expect(await screen.findByText('SHS Core Mathematics')).toBeInTheDocument();
    expect(screen.queryByText('JHS English Language')).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/learn/enrolled', { params: {} });
  });

  it('Continue goes straight to the next lesson of an enrolled course', async () => {
    renderLearn();
    const card = (await screen.findByText('SHS Core Mathematics')).closest('li');
    await userEvent.click(within(card).getByRole('button', { name: 'Continue' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/learn/shs-mathematics/lessons/shs_math_3');
  });
});
