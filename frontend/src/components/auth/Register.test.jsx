import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Register from './Register';
import api from '../../services/api';
import { LanguageProvider } from '../../contexts/LanguageContext';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn(), get: vi.fn() } };
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
  await user.selectOptions(screen.getByLabelText(/school level/i), 'jhs');
  await user.type(screen.getByLabelText(/guardian email/i), 'guardian@test.com');
  await user.click(screen.getByRole('checkbox'));
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('pathwaygh_country', 'GH');
    api.get.mockResolvedValue({ data: { sms: true } });
  });

  it('blocks submission client-side when passwords do not match, without calling the API', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'Test Student');
    await user.type(screen.getByLabelText(/^email$/i), 'student@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different456');
    await user.selectOptions(screen.getByLabelText(/school level/i), 'jhs');
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
    await user.selectOptions(screen.getByLabelText(/school level/i), 'jhs');
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

  it('asks for a level before submitting', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/full name/i), 'Test Student');
    await user.type(screen.getByLabelText(/^email$/i), 'student@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/guardian phone/i), '0241234567');
    await user.click(screen.getByRole('checkbox'));
    // Past the browser's own "required" check, to the form's validation.
    screen.getByRole('button', { name: /register/i }).closest('form').noValidate = true;
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/choose your school level/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('lets a parent consent by phone alone, and sends the level', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true } });
    renderRegister();
    await user.type(screen.getByLabelText(/full name/i), 'Test Student');
    await user.type(screen.getByLabelText(/^email$/i), 'student@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.selectOptions(screen.getByLabelText(/school level/i), 'primary');
    await user.type(screen.getByLabelText(/guardian phone/i), '024 123 4567');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0][1]).toMatchObject({
      level: 'primary',
      guardian_phone: '024 123 4567',
      guardian_email: null,
    });
  });

  it('requires a phone or an email from the parent', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/full name/i), 'Test Student');
    await user.type(screen.getByLabelText(/^email$/i), 'student@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.selectOptions(screen.getByLabelText(/school level/i), 'jhs');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/phone number or email/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('hides the phone field and requires email where SMS is unavailable', async () => {
    api.get.mockResolvedValue({ data: { sms: false } });
    renderRegister();
    expect(await screen.findByText(/can't send text messages/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/guardian phone/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/guardian email/i)).toBeRequired();
  });

  it('never logs the password', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: { success: true } });
    renderRegister();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('does not ask a primary pupil to confirm they are 13', async () => {
    const user = userEvent.setup();
    renderRegister();
    expect(screen.getByText(/at least 13/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/school level/i), 'primary');
    expect(screen.queryByText(/at least 13/i)).not.toBeInTheDocument();
    expect(screen.getByText(/parent or guardian is helping me/i)).toBeInTheDocument();
  });
});
