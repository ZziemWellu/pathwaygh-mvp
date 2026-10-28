import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PracticeModule from './PracticeModule';
import { GamificationNotifyProvider } from '../../contexts/GamificationNotifyContext';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn() } };
});

const SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', topics: [{ id: 'algebra', name: 'Algebra' }], question_count: 32, mastery: null, topics_practised: 0 },
  { id: 'english', name: 'English Language', topics: [{ id: 'grammar', name: 'Grammar' }], question_count: 16, mastery: 64, topics_practised: 1 },
];
const QUIZ = { success: true, id: 'quiz_1', total: 1, questions: [{ id: 'q1', question: 'What is 2 + 2?', options: ['3', '4'], difficulty: 'easy' }] };

const renderPractice = (path = '/practice') =>
  render(
    <GamificationNotifyProvider>
      <MemoryRouter initialEntries={[path]}>
        <PracticeModule />
      </MemoryRouter>
    </GamificationNotifyProvider>
  );

describe('Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/api/practice/subjects') return Promise.resolve({ data: { subjects: SUBJECTS } });
      if (url === '/api/practice/history') return Promise.resolve({ data: { history: [] } });
      if (url === '/api/practice/statistics') return Promise.resolve({ data: { statistics: null } });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: QUIZ });
  });

  it('shows each subject with its mastery, or "Not started"', async () => {
    renderPractice();
    expect(await screen.findByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('64% mastery')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'English Language mastery' })).toHaveAttribute('aria-valuenow', '64');
  });

  it('starts a subject quiz from its row', async () => {
    renderPractice();
    await userEvent.click(await screen.findByRole('button', { name: 'Start Mathematics quiz' }));
    expect(api.post).toHaveBeenCalledWith('/api/practice/quiz/start', expect.objectContaining({ subject_id: 'mathematics' }));
    expect(await screen.findByRole('heading', { name: 'Mathematics' })).toBeInTheDocument();
  });

  it('the quick quiz starts without a subject (mixed)', async () => {
    renderPractice();
    await userEvent.click(await screen.findByRole('button', { name: 'Go' }));
    const body = api.post.mock.calls[0][1];
    expect(body.subject_id).toBeUndefined();
    expect(await screen.findByRole('heading', { name: 'Quick quiz' })).toBeInTheDocument();
  });

  it('?quick=1 (from Home) starts the quick quiz straight away', async () => {
    renderPractice('/practice?quick=1');
    expect(await screen.findByRole('heading', { name: 'Quick quiz' })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('switches between Subjects, History and Stats tabs', async () => {
    renderPractice();
    await screen.findByText('Not started');
    await userEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/No quiz attempts yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(screen.getByText(/No statistics yet/)).toBeInTheDocument();
  });
});
