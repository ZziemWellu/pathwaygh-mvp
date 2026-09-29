import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AIBonusQuestion from './AIBonusQuestion';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn() } };
});

const question = {
  question: 'What is 6 + 7?',
  options: ['11', '12', '13', '14'],
  correct: '13',
  explanation: '6 + 7 = 13',
};

describe('AIBonusQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a question and posts the chosen difficulty/topic', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true, question, tracked: false } });

    render(<AIBonusQuestion />);
    await user.type(screen.getByPlaceholderText(/topic \(optional\)/i), 'algebra');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    expect(await screen.findByText('What is 6 + 7?')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/api/ai-questions/generate', { topic: 'algebra', difficulty: 'medium' });
  });

  it('reveals correctness and the explanation once an option is picked', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true, question, tracked: false } });

    render(<AIBonusQuestion />);
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await screen.findByText('What is 6 + 7?');

    await user.click(screen.getByRole('button', { name: /C\. 13/ }));

    expect(await screen.findByText(/correct!/i)).toBeInTheDocument();
    expect(screen.getByText('6 + 7 = 13')).toBeInTheDocument();
  });

  it('shows the correct answer when the wrong option is picked', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true, question, tracked: false } });

    render(<AIBonusQuestion />);
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await screen.findByText('What is 6 + 7?');

    await user.click(screen.getByRole('button', { name: /A\. 11/ }));

    expect(await screen.findByText(/the answer is 13/i)).toBeInTheDocument();
  });

  it('shows an inline error message when generation fails', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ response: { status: 502, data: { detail: 'Could not generate a verified question right now - please try again' } } });

    render(<AIBonusQuestion />);
    await user.click(screen.getByRole('button', { name: /generate/i }));

    expect(await screen.findByText(/could not generate a verified question/i)).toBeInTheDocument();
  });

  it('lets the student request a new question after answering one', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true, question, tracked: false } });

    render(<AIBonusQuestion />);
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await screen.findByText('What is 6 + 7?');
    await user.click(screen.getByRole('button', { name: /C\. 13/ }));

    expect(screen.getByRole('button', { name: /new question/i })).toBeInTheDocument();
  });
});
