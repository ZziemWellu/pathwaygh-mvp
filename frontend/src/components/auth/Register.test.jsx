import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Register from './Register';
import api from '../../services/api';
import { LanguageProvider } from '../../contexts/LanguageContext';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn() } };
});

const renderRegister = (props = {}) =>
  render(
    <LanguageProvider>
      <Register onSuccess={vi.fn()} onShowPrivacy={vi.fn()} {...props} />
    </LanguageProvider>
  );

const fillValidForm = async (user) => {
  await user.type(screen.getByLabelText(/full name/i), 'Test Student');
  await user.type(screen.getByLabelText(/^email$/i), 'student@test.com');
  await user.type(screen.getByLabelText(/^password$/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');
  await user.type(screen.getByLabelText(/guardian email/i), 'guardian@test.com');
  await user.click(screen.getByRole('checkbox'));
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('pathwaygh_country', 'GH');
  });

  it('blocks submission client-side when passwords do not match, without calling the API', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test Student');
    await user.type(screen.getByLabelText(/^email$/i), 'student@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different456');
    await user.type(screen.getByLabelText(/guardian email/i), 'guardian@test.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('blocks submission when guardian email matches the student email', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test Student');
    await user.type(screen.getByLabelText(/^email$/i), 'same@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/guardian email/i), 'same@test.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/guardian email must be different/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits with the persisted country and shows success on a valid registration', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true } });

    renderRegister();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ email: 'student@test.com', country: 'GH', consent_confirmed: true })
      );
    });
    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();
  });

  it('shows the server-side duplicate-email error inline', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'Email already registered' } } });

    renderRegister();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

  it('shows the server-waking-up message on a timeout instead of a generic failure', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ code: 'ECONNABORTED' });

    renderRegister();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/server is starting up/i)).toBeInTheDocument();
  });
});
