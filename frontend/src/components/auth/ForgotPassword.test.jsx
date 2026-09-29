import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ForgotPassword from './ForgotPassword';
import api from '../../services/api';
import { LanguageProvider } from '../../contexts/LanguageContext';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn() } };
});

const renderForgotPassword = (onBackToLogin = vi.fn()) =>
  render(
    <LanguageProvider>
      <ForgotPassword onBackToLogin={onBackToLogin} />
    </LanguageProvider>
  );

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests a code then moves to the reset step on success', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true } });

    renderForgotPassword();
    await user.type(screen.getByLabelText(/email/i), 'student@test.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'student@test.com' });
    expect(await screen.findByLabelText(/reset code/i)).toBeInTheDocument();
  });

  it('submits the token and new password, then shows the success screen', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true } }); // forgot-password
    api.post.mockResolvedValueOnce({ data: { success: true } }); // reset-password

    renderForgotPassword();
    await user.type(screen.getByLabelText(/email/i), 'student@test.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    await screen.findByLabelText(/reset code/i);
    await user.type(screen.getByLabelText(/reset code/i), 'abc123token');
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(api.post).toHaveBeenLastCalledWith('/api/auth/reset-password', {
      email: 'student@test.com',
      token: 'abc123token',
      new_password: 'newpassword123',
    });
    expect(await screen.findByText(/password reset/i)).toBeInTheDocument();
  });

  it('shows an inline error when the reset code is wrong, without leaving the reset step', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true } }); // forgot-password
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'Incorrect or invalid reset code' } } });

    renderForgotPassword();
    await user.type(screen.getByLabelText(/email/i), 'student@test.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    await screen.findByLabelText(/reset code/i);
    await user.type(screen.getByLabelText(/reset code/i), 'wrong-token');
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('Incorrect or invalid reset code')).toBeInTheDocument();
    expect(screen.getByLabelText(/reset code/i)).toBeInTheDocument();
  });

  it('calls onBackToLogin when the back link is clicked', async () => {
    const user = userEvent.setup();
    const onBackToLogin = vi.fn();
    renderForgotPassword(onBackToLogin);

    await user.click(screen.getByRole('button', { name: /back to login/i }));
    expect(onBackToLogin).toHaveBeenCalled();
  });
});
