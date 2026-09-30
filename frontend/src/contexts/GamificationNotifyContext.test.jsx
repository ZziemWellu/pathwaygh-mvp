import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GamificationNotifyProvider, useGamificationNotify } from './GamificationNotifyContext';

const Probe = () => {
  const { notify } = useGamificationNotify();
  return (
    <div>
      <button onClick={() => notify({ xp_awarded: 5, new_achievements: [] })}>Award XP only</button>
      <button onClick={() => notify({ xp_awarded: 10, new_achievements: [{ id: 'first_quiz', name: 'Quick Start', description: 'Complete your first quiz', icon: '🚀' }] })}>
        Award achievement
      </button>
      <button onClick={() => notify(null)}>Notify nothing</button>
      <button onClick={() => notify({ xp_awarded: 0, new_achievements: [] })}>Notify zero</button>
    </div>
  );
};

describe('GamificationNotifyContext', () => {
  it('shows a toast with the XP amount when XP alone is awarded', async () => {
    const user = userEvent.setup();
    render(<GamificationNotifyProvider><Probe /></GamificationNotifyProvider>);

    await user.click(screen.getByText('Award XP only'));

    expect(await screen.findByText('+5 XP')).toBeInTheDocument();
  });

  it('shows the achievement name and description when one is unlocked', async () => {
    const user = userEvent.setup();
    render(<GamificationNotifyProvider><Probe /></GamificationNotifyProvider>);

    await user.click(screen.getByText('Award achievement'));

    expect(await screen.findByText(/Achievement unlocked: Quick Start/)).toBeInTheDocument();
    expect(screen.getByText('Complete your first quiz')).toBeInTheDocument();
    expect(screen.getByText('+10 XP')).toBeInTheDocument();
  });

  it('shows nothing when gamification data is null', () => {
    render(<GamificationNotifyProvider><Probe /></GamificationNotifyProvider>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows nothing when zero XP and no achievements are awarded', async () => {
    const user = userEvent.setup();
    render(<GamificationNotifyProvider><Probe /></GamificationNotifyProvider>);

    await user.click(screen.getByText('Notify zero'));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('dismisses the toast on click', async () => {
    const user = userEvent.setup();
    render(<GamificationNotifyProvider><Probe /></GamificationNotifyProvider>);

    await user.click(screen.getByText('Award XP only'));
    const toast = await screen.findByRole('status');
    await user.click(toast);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('throws when used outside the provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow();
    console.error = consoleError;
  });
});
