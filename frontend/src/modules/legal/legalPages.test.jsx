import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BUSINESS } from '../../constants/business';
import ContactPage from './ContactPage';
import RefundPolicy from './RefundPolicy';
import TermsOfService from './TermsOfService';

describe('public policy pages', () => {
  it('have real contact details, not placeholders', () => {
    for (const [field, value] of Object.entries(BUSINESS)) {
      expect(value, field).not.toMatch(/TODO/);
    }
    expect(BUSINESS.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it.each([
    ['Terms of Service', TermsOfService],
    ['Refund Policy', RefundPolicy],
    ['Contact us', ContactPage],
  ])('%s shows the support email', (title, Page) => {
    render(<Page onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getAllByText(BUSINESS.email).length).toBeGreaterThan(0);
  });

  it('terms say the questions are not official past papers', () => {
    render(<TermsOfService onBack={() => {}} />);
    expect(screen.getByText(/not official past papers/i)).toBeInTheDocument();
  });

  it('refund policy states the window and how refunds are paid', () => {
    render(<RefundPolicy onBack={() => {}} />);
    expect(screen.getByText(/within 14 days of paying/i)).toBeInTheDocument();
    expect(screen.getByText(/back through Paystack/i)).toBeInTheDocument();
  });
});
