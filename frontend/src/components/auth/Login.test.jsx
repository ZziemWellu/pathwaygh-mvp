import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Login from './Login';
import api from '../../services/api';
import { LanguageProvider } from '../../contexts/LanguageContext';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn() } };
});

const renderLogin = (onSuccess = vi.fn()) =>
  render(
    <LanguageProvider>
      <Login onSuccess={onSuccess} />
    </LanguageProvider>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls onSuccess with the user and token on a successful login', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    api.post.mockResolvedValueOnce({
      data: { success: true, user: { id: 1, email: 'a@test.com' }, token: 'tok_123' },
    });

    renderLogin(onSuccess);
    await user.type(screen.getByLabelText(/email/i), 'a@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 1, email: 'a@test.com' }, 'tok_123');
    });
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@test.com', password: 'secret123' });
  });

  it('shows the wrong-credentials error inline instead of crashing', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ response: { status: 401, data: { detail: 'Invalid credentials' } } });

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('does not crash when the backend returns a FastAPI-style validation error array', async () => {
    // Regression test for the exact bug fixed alongside extractErrorMessage:
    // a 422's `detail` is an array, not a string. Uses a syntactically
    // valid email so the native HTML5 type="email" check doesn't block
    // the submit before it ever reaches handleSubmit.
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: { status: 422, data: { detail: [{ loc: ['body', 'password'], msg: 'field required' }] } },
    });

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/field required/i)).toBeInTheDocument();
  });

  it('shows a distinct message on a timeout/no-response error (cold-start case)', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ code: 'ECONNABORTED', message: 'timeout' }); // no `response` property

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/server is starting up/i)).toBeInTheDocument();
  });
});
