import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import GamificationSummary from './GamificationSummary';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn() } };
});

describe('GamificationSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing before the profile loads', () => {
    api.get.mockReturnValueOnce(new Promise(() => {}));
    const { container } = render(<GamificationSummary />, { wrapper: MemoryRouter });
    expect(container.firstChild).toBeNull();
  });

  it('shows XP and streak once loaded', async () => {
    api.get.mockResolvedValueOnce({ data: { xp_points: 42, current_streak_days: 5 } });
    render(<GamificationSummary />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/42 XP/)).toBeInTheDocument();
    expect(screen.getByText(/5 day streak/)).toBeInTheDocument();
  });
});
