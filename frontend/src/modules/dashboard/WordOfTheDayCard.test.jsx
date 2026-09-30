import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import WordOfTheDayCard from './WordOfTheDayCard';
import { GamificationNotifyProvider } from '../../contexts/GamificationNotifyContext';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn() } };
});

const wordResponse = {
  word: {
    id: 'ubiquitous',
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    part_of_speech: 'adjective',
    definition: 'Present, appearing, or found everywhere.',
    context_sentence: 'Mobile phones have become ubiquitous in Ghana.',
  },
  learned: false,
};

const renderWithProvider = () => render(<GamificationNotifyProvider><WordOfTheDayCard /></GamificationNotifyProvider>);

describe('WordOfTheDayCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing before the word loads', () => {
    api.get.mockReturnValueOnce(new Promise(() => {}));
    const { container } = renderWithProvider();
    expect(container.firstChild).toBeNull();
  });

  it('shows the word, definition, and context sentence', async () => {
    api.get.mockResolvedValueOnce({ data: wordResponse });
    renderWithProvider();

    expect(await screen.findByText('ubiquitous')).toBeInTheDocument();
    expect(screen.getByText('Present, appearing, or found everywhere.')).toBeInTheDocument();
  });

  it('marks the word learned and disables the button', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: wordResponse });
    api.post.mockResolvedValueOnce({ data: { success: true, already_learned: false, gamification: { xp_awarded: 3, new_achievements: [] } } });

    renderWithProvider();
    await user.click(await screen.findByRole('button', { name: /mark as learned/i }));

    expect(api.post).toHaveBeenCalledWith('/api/vocabulary/ubiquitous/learned');
    expect(await screen.findByRole('button', { name: /learned/i })).toBeDisabled();
  });

  it('shows the already-learned state on load when the backend reports it', async () => {
    api.get.mockResolvedValueOnce({ data: { ...wordResponse, learned: true } });
    renderWithProvider();

    expect(await screen.findByRole('button', { name: /✓ learned/i })).toBeDisabled();
  });
});
