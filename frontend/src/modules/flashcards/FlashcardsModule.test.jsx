import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import FlashcardsModule from './FlashcardsModule';
import { GamificationNotifyProvider } from '../../contexts/GamificationNotifyContext';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } };
});

const renderWithProvider = () => render(<GamificationNotifyProvider><FlashcardsModule /></GamificationNotifyProvider>);

const dueCard = { id: 1, front: 'Capital of Ghana?', back: 'Accra', due_date: '2026-09-30', repetitions: 0, interval_days: 0 };

const mockAll = (due = [], all = []) => {
  api.get.mockImplementation((url) => {
    if (url === '/api/flashcards/due') return Promise.resolve({ data: { cards: due, total_due: due.length } });
    if (url === '/api/flashcards') return Promise.resolve({ data: { cards: all } });
    return Promise.reject(new Error('unexpected url'));
  });
};

describe('FlashcardsModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state and offers to add a card when nothing is due', async () => {
    mockAll([]);
    renderWithProvider();

    expect(await screen.findByText(/no cards due for review/i)).toBeInTheDocument();
  });

  it('shows the front of the first due card without the answer', async () => {
    mockAll([dueCard]);
    renderWithProvider();

    expect(await screen.findByText('Capital of Ghana?')).toBeInTheDocument();
    expect(screen.queryByText('Accra')).not.toBeInTheDocument();
  });

  it('reveals the back and rating buttons when the card is tapped', async () => {
    const user = userEvent.setup();
    mockAll([dueCard]);
    renderWithProvider();

    await user.click(await screen.findByText('Capital of Ghana?'));

    expect(screen.getByText('Accra')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
  });

  it('submits a rating and advances past the reviewed card', async () => {
    const user = userEvent.setup();
    mockAll([dueCard]);
    api.post.mockResolvedValueOnce({ data: { success: true, card: { ...dueCard, repetitions: 1 }, gamification: { xp_awarded: 2, new_achievements: [] } } });

    renderWithProvider();
    await user.click(await screen.findByText('Capital of Ghana?'));
    await user.click(screen.getByRole('button', { name: 'Good' }));

    expect(api.post).toHaveBeenCalledWith('/api/flashcards/1/review', { rating: 'good' });
    expect(await screen.findByText(/all done for now/i)).toBeInTheDocument();
  });

  it('creates a new flashcard from the manage view', async () => {
    const user = userEvent.setup();
    mockAll([], []);
    api.post.mockResolvedValueOnce({ data: { success: true, card: { id: 2, front: 'Q', back: 'A' } } });

    renderWithProvider();
    await user.click(await screen.findByRole('button', { name: /manage/i }));
    await user.type(screen.getByPlaceholderText(/front/i), 'What is 2+2?');
    await user.type(screen.getByPlaceholderText(/back/i), '4');
    await user.click(screen.getByRole('button', { name: /add card/i }));

    expect(api.post).toHaveBeenCalledWith('/api/flashcards', { front: 'What is 2+2?', back: '4' });
  });

  it('deletes a flashcard from the manage view', async () => {
    const user = userEvent.setup();
    mockAll([], [{ id: 5, front: 'Q', back: 'A' }]);
    api.delete.mockResolvedValueOnce({ data: { success: true } });

    renderWithProvider();
    await user.click(await screen.findByRole('button', { name: /manage/i }));
    await screen.findByText('Q');
    await user.click(screen.getByRole('button', { name: /delete flashcard/i }));

    expect(api.delete).toHaveBeenCalledWith('/api/flashcards/5');
  });
});
