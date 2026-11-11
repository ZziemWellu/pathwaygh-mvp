import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Landing from './Landing';
import { LanguageProvider } from '../../contexts/LanguageContext';

const renderLanding = (props = {}) => {
  const handlers = { onGetStarted: vi.fn(), onRegisterSchool: vi.fn(), onSignIn: vi.fn(), onShowPrivacy: vi.fn(), ...props };
  render(<LanguageProvider><Landing {...handlers} /></LanguageProvider>);
  return handlers;
};

describe('Landing', () => {
  it('explains the product and lists the five supported countries', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find your path.');
    for (const country of ['Ghana', 'Nigeria', 'Sierra Leone', 'Liberia', 'The Gambia']) {
      expect(screen.getByText(country)).toBeInTheDocument();
    }
  });

  it('starts student sign-up from every "get started" button', async () => {
    const { onGetStarted, onRegisterSchool } = renderLanding();
    for (const button of screen.getAllByRole('button', { name: /get started|start learning/i })) {
      await userEvent.click(button);
    }
    expect(onGetStarted).toHaveBeenCalled();
    expect(onRegisterSchool).not.toHaveBeenCalled();
  });

  it('starts school sign-up from both school buttons', async () => {
    const { onGetStarted, onRegisterSchool } = renderLanding();
    await userEvent.click(screen.getByRole('button', { name: /i'm a school/i }));
    await userEvent.click(screen.getByRole('button', { name: /create a school account/i }));
    expect(onRegisterSchool).toHaveBeenCalledTimes(2);
    expect(onGetStarted).not.toHaveBeenCalled();
  });

  it('goes to sign-in and privacy', async () => {
    const { onSignIn, onShowPrivacy } = renderLanding();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Privacy Policy' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onShowPrivacy).toHaveBeenCalledTimes(1);
  });
});
