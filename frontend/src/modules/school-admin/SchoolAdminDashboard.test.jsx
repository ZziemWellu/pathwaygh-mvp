import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import SchoolAdminDashboard from './SchoolAdminDashboard';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});

const dashboardData = {
  school: { name: 'Test School', join_code: 'ABC123', parent_consent_attested: false, parent_consent_attested_at: null },
  roster: [],
  summary: { student_count: 3, average_completion_rate: 50, average_quiz_score: 70 },
};

describe('SchoolAdminDashboard - billing', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/school-admin');
  });

  afterEach(() => {
    window.location = originalLocation;
    window.history.replaceState({}, '', '/school-admin');
  });

  it('redirects to the Paystack checkout URL on subscribe', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: dashboardData });
    api.post.mockResolvedValueOnce({
      data: { success: true, reference: 'pay_abc', checkout_url: 'https://checkout.paystack.com/xyz', amount_minor_units: 24000, currency: 'GHS' },
    });

    // jsdom doesn't implement real navigation, and this test only needs
    // to observe the assignment - not affect the other tests' use of the
    // real location/history APIs, which is why this is scoped to just
    // this test and restored in afterEach rather than replaced globally.
    delete window.location;
    window.location = { ...originalLocation, href: '' };

    render(<SchoolAdminDashboard />);
    await screen.findByText(/pay \/ renew school license/i);
    await user.click(screen.getByRole('button', { name: /pay \/ renew school license/i }));

    await waitFor(() => expect(window.location.href).toBe('https://checkout.paystack.com/xyz'));
    expect(api.post).toHaveBeenCalledWith('/api/payment/initialize', { provider: 'paystack' });
  });

  it('shows an inline error when initialize fails instead of navigating anywhere', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: dashboardData });
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'No institutional license price is set for country \'SL\' yet.' } } });

    render(<SchoolAdminDashboard />);
    await screen.findByText(/pay \/ renew school license/i);
    await user.click(screen.getByRole('button', { name: /pay \/ renew school license/i }));

    expect(await screen.findByText(/no institutional license price is set/i)).toBeInTheDocument();
  });

  it('verifies a pending payment reference found in the URL on load and shows the result', async () => {
    window.history.replaceState({}, '', '/school-admin?payment_reference=pay_xyz');
    api.get.mockImplementation((url) => {
      if (url.startsWith('/api/payment/verify/')) {
        return Promise.resolve({ data: { success: true, reference: 'pay_xyz', status: 'success', amount_minor_units: 24000, currency: 'GHS' } });
      }
      return Promise.resolve({ data: dashboardData });
    });

    render(<SchoolAdminDashboard />);

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/payment/verify/pay_xyz');
    // The reference must be stripped from the URL so a refresh doesn't
    // re-verify an already-settled transaction.
    expect(window.location.search).toBe('');
  });
});
