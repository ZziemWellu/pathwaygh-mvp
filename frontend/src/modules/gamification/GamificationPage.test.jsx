import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import GamificationPage from './GamificationPage';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), patch: vi.fn() } };
});

const profile = {
  xp_points: 120,
  current_streak_days: 3,
  longest_streak_days: 7,
  leaderboard_opt_in: false,
  leaderboard_display_name: null,
  achievements_earned: 2,
  achievements_total: 9,
};

const achievements = {
  achievements: [
    { id: 'first_quiz', name: 'Quick Start', description: 'Complete your first quiz', icon: '🚀', earned: true, earned_at: '2026-09-01T00:00:00Z' },
    { id: 'streak_7', name: 'Weekly Warrior', description: 'Practice 7 days in a row', icon: '📅', earned: false, earned_at: null },
  ],
};

const mockAll = (leaderboard = { success: true, leaderboard: [] }) => {
  api.get.mockImplementation((url) => {
    if (url === '/api/gamification/profile') return Promise.resolve({ data: profile });
    if (url === '/api/gamification/achievements') return Promise.resolve({ data: achievements });
    if (url === '/api/gamification/leaderboard') return Promise.resolve({ data: leaderboard });
    return Promise.reject(new Error('unexpected url'));
  });
};

describe('GamificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows XP, streaks, and achievement counts', async () => {
    mockAll();
    render(<GamificationPage />);

    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('2/9')).toBeInTheDocument();
  });

  it('lists both earned and locked achievements', async () => {
    mockAll();
    render(<GamificationPage />);

    expect(await screen.findByText('Quick Start')).toBeInTheDocument();
    expect(screen.getByText('Weekly Warrior')).toBeInTheDocument();
  });

  it('shows a message instead of a leaderboard when not linked to a school', async () => {
    mockAll({ success: true, leaderboard: [], reason: "You're not linked to a school yet" });
    render(<GamificationPage />);

    expect(await screen.findByText(/not linked to a school/i)).toBeInTheDocument();
  });

  it('prompts for a nickname to join the leaderboard when not opted in', async () => {
    mockAll();
    render(<GamificationPage />);

    expect(await screen.findByPlaceholderText(/choose a nickname/i)).toBeInTheDocument();
  });

  it('joins the leaderboard with the chosen display name', async () => {
    const user = userEvent.setup();
    mockAll();
    api.patch.mockResolvedValueOnce({ data: { success: true } });

    render(<GamificationPage />);
    await user.type(await screen.findByPlaceholderText(/choose a nickname/i), 'MathWizard');
    await user.click(screen.getByRole('button', { name: /^join$/i }));

    expect(api.patch).toHaveBeenCalledWith('/api/gamification/leaderboard-opt-in', { opt_in: true, display_name: 'MathWizard' });
  });

  it('shows the leaderboard rows and highlights the current student when opted in', async () => {
    const optedInProfile = { ...profile, leaderboard_opt_in: true, leaderboard_display_name: 'Me' };
    api.get.mockImplementation((url) => {
      if (url === '/api/gamification/profile') return Promise.resolve({ data: optedInProfile });
      if (url === '/api/gamification/achievements') return Promise.resolve({ data: achievements });
      if (url === '/api/gamification/leaderboard') {
        return Promise.resolve({
          data: {
            success: true,
            leaderboard: [
              { rank: 1, display_name: 'TopScorer', xp_points: 500, is_you: false },
              { rank: 2, display_name: 'Me', xp_points: 120, is_you: true },
            ],
          },
        });
      }
      return Promise.reject(new Error('unexpected url'));
    });

    render(<GamificationPage />);

    expect(await screen.findByText(/#2 Me \(you\)/)).toBeInTheDocument();
    expect(screen.getByText(/#1 TopScorer/)).toBeInTheDocument();
  });
});
