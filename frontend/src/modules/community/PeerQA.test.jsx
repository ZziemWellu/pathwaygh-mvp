import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PeerQA from './PeerQA';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn() } };
});

vi.mock('../../constants/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getUser: vi.fn(() => ({ id: 1, is_admin: false })) };
});

const questionsResponse = {
  questions: [
    { id: 1, subject_id: 'mathematics', body: 'How do I factorize x^2-5x+6?', author_name: 'Kwame', created_at: '2026-09-30T00:00:00Z', answer_count: 2 },
  ],
};

describe('PeerQA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists visible questions', async () => {
    api.get.mockResolvedValueOnce({ data: questionsResponse });
    render(<PeerQA />);

    expect(await screen.findByText('How do I factorize x^2-5x+6?')).toBeInTheDocument();
    expect(screen.getByText(/Kwame · 2 answers/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no questions', async () => {
    api.get.mockResolvedValueOnce({ data: { questions: [] } });
    render(<PeerQA />);

    expect(await screen.findByText(/be the first to ask/i)).toBeInTheDocument();
  });

  it('posts a new question and refreshes the list when it is immediately visible', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: { questions: [] } });
    api.post.mockResolvedValueOnce({ data: { success: true, question: { id: 2 }, pending_review: false } });
    api.get.mockResolvedValueOnce({ data: questionsResponse });

    render(<PeerQA />);
    await screen.findByText(/be the first to ask/i);

    await user.type(screen.getByPlaceholderText(/ask a question/i), 'A new question');
    await user.click(screen.getByRole('button', { name: /^ask$/i }));

    expect(await screen.findByText('Posted!')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/api/qa/questions', { body: 'A new question' });
  });

  it('shows a pending-review notice instead of posting straight to the list', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: { questions: [] } });
    api.post.mockResolvedValueOnce({ data: { success: true, question: { id: 2 }, pending_review: true } });

    render(<PeerQA />);
    await screen.findByText(/be the first to ask/i);

    await user.type(screen.getByPlaceholderText(/ask a question/i), 'Call me at 0241234567');
    await user.click(screen.getByRole('button', { name: /^ask$/i }));

    expect(await screen.findByText(/awaiting a quick review/i)).toBeInTheDocument();
  });

  it('does not show the moderation queue toggle for a non-admin', async () => {
    api.get.mockResolvedValueOnce({ data: { questions: [] } });
    render(<PeerQA />);
    await screen.findByText(/be the first to ask/i);

    expect(screen.queryByText(/review queue/i)).not.toBeInTheDocument();
  });

  it('opens a question and shows its answers', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: questionsResponse });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        question: { id: 1, body: 'How do I factorize x^2-5x+6?', author_name: 'Kwame' },
        answers: [{ id: 10, question_id: 1, body: '(x-2)(x-3)', author_name: 'Ama', user_id: 2 }],
      },
    });

    render(<PeerQA />);
    await user.click(await screen.findByText('How do I factorize x^2-5x+6?'));

    expect(await screen.findByText('(x-2)(x-3)')).toBeInTheDocument();
    expect(screen.getByText(/1 Answer/)).toBeInTheDocument();
  });

  it('reports a question (with an optional reason) without navigating into it', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Spam');
    api.get.mockResolvedValueOnce({ data: questionsResponse });
    api.post.mockResolvedValueOnce({ data: { success: true } });
    api.get.mockResolvedValueOnce({ data: questionsResponse });

    render(<PeerQA />);
    await screen.findByText('How do I factorize x^2-5x+6?');

    await user.click(screen.getByRole('button', { name: /report/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/qa/questions/1/report', { reason: 'Spam' }));
    // Reporting must not open the question detail view.
    expect(screen.queryByText(/back to questions/i)).not.toBeInTheDocument();
    promptSpy.mockRestore();
  });
});
