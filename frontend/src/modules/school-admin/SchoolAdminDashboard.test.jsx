import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import SchoolAdminDashboard from './SchoolAdminDashboard';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});

const student = {
  id: 2,
  full_name: 'Ama Mensah',
  email: 'ama@test.com',
  grade: 'JHS 2',
  is_school_admin: false,
  courses_enrolled: 1,
  lessons_completed: 3,
  lessons_total: 4,
  quizzes_taken: 2,
  average_quiz_score: 75,
};

const licenceFor = (plan) => ({
  plan,
  premium: plan !== 'free',
  students: 3,
  seat_limit: plan === 'free' ? 40 : plan === 'trial' ? null : 22,
  valid_until: plan === 'free' ? null : '2026-12-31',
  grace_until: plan === 'grace' ? '2027-01-14' : null,
  paid_through: null,
  renewal_queued: false,
  can_buy: true,
});

const dashboardFor = (plan, roster = [student]) => ({
  school: { name: 'Test School', join_code: 'ABC123', parent_consent_attested: false, parent_consent_attested_at: null },
  licence: licenceFor(plan),
  roster,
  summary: { student_count: 3, average_completion_rate: 50, average_quiz_score: 70 },
});

const quoteFor = (plan) => ({
  success: true,
  licence: licenceFor(plan),
  options: [
    { kind: 'term', currency: 'GHS', students: 3, billed_students: 20, price_per_student_minor: 3000, amount_minor_units: 60000, seats: 22, starts_on: '2027-01-01', valid_until: '2027-04-30' },
    { kind: 'year', currency: 'GHS', students: 3, billed_students: 20, price_per_student_minor: 8000, amount_minor_units: 160000, seats: 22, starts_on: '2027-01-01', valid_until: '2027-08-31' },
  ],
});

const mockApi = (plan, { verify } = {}) => {
  api.get.mockImplementation((url) => {
    if (url === '/api/payment/quote') return Promise.resolve({ data: quoteFor(plan) });
    if (url.startsWith('/api/payment/verify/')) return Promise.resolve({ data: verify });
    return Promise.resolve({ data: dashboardFor(plan) });
  });
};

describe('SchoolAdminDashboard - licence', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/school-admin');
  });

  afterEach(() => {
    window.location = originalLocation;
    window.history.replaceState({}, '', '/school-admin');
  });

  it('shows the free first term and both prices', async () => {
    mockApi('trial');
    render(<SchoolAdminDashboard />);

    expect(await screen.findByText('Free first term')).toBeInTheDocument();
    expect(screen.getByText(/31 December 2026/)).toBeInTheDocument();
    expect(screen.getByText('GHS 600.00')).toBeInTheDocument();
    expect(screen.getByText('GHS 1,600.00')).toBeInTheDocument();
  });

  it('redirects to Paystack checkout for the chosen period', async () => {
    const user = userEvent.setup();
    mockApi('trial');
    api.post.mockResolvedValueOnce({
      data: { success: true, reference: 'pay_abc', checkout_url: 'https://checkout.paystack.com/xyz', amount_minor_units: 160000, currency: 'GHS' },
    });

    // jsdom doesn't implement real navigation; this test only needs to
    // observe the assignment, so the stub is scoped to it and restored in
    // afterEach.
    delete window.location;
    window.location = { ...originalLocation, href: '' };

    render(<SchoolAdminDashboard />);
    await user.click(await screen.findByRole('button', { name: /pay for the year/i }));

    await waitFor(() => expect(window.location.href).toBe('https://checkout.paystack.com/xyz'));
    expect(api.post).toHaveBeenCalledWith('/api/payment/initialize', { provider: 'paystack', plan: 'year' });
  });

  it('shows an inline error when initialize fails instead of navigating anywhere', async () => {
    const user = userEvent.setup();
    mockApi('trial');
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: "No institutional licence price is set for country 'SL' yet." } } });

    render(<SchoolAdminDashboard />);
    await user.click(await screen.findByRole('button', { name: /pay for one term/i }));

    expect(await screen.findByText(/no institutional licence price is set/i)).toBeInTheDocument();
  });

  it('verifies a payment reference found in the URL on load and shows the result', async () => {
    window.history.replaceState({}, '', '/school-admin?payment_reference=pay_xyz');
    mockApi('paid', {
      verify: { success: true, reference: 'pay_xyz', status: 'success', amount_minor_units: 160000, currency: 'GHS', licence: licenceFor('paid') },
    });

    render(<SchoolAdminDashboard />);

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/payment/verify/pay_xyz');
    // Stripped from the URL so a refresh doesn't re-verify a settled payment.
    expect(window.location.search).toBe('');
  });

  it('explains when a payment amount did not match the quote', async () => {
    window.history.replaceState({}, '', '/school-admin?payment_reference=pay_bad');
    mockApi('free', { verify: { success: true, reference: 'pay_bad', status: 'amount_mismatch', amount_minor_units: 160000, currency: 'GHS' } });

    render(<SchoolAdminDashboard />);
    expect(await screen.findByText(/didn't match the quote/i)).toBeInTheDocument();
  });

  it('shows per-student progress and the download on a licence', async () => {
    mockApi('paid');
    render(<SchoolAdminDashboard />);

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Avg. Score')).toBeInTheDocument();
    expect(within(table).getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download spreadsheet/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/need more seats/i)).toBeInTheDocument();
  });

  it('keeps the roster but hides per-student columns on the free plan', async () => {
    mockApi('free');
    render(<SchoolAdminDashboard />);

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Ama Mensah')).toBeInTheDocument();
    expect(within(table).queryByText('Avg. Score')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download spreadsheet/i })).not.toBeInTheDocument();
    expect(screen.getByText(/comes with the school licence/i)).toBeInTheDocument();
  });
});
