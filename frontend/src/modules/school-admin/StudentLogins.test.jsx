import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../services/api';
import StudentLogins, { parseStudentLines } from './StudentLogins';

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return { ...actual, default: { post: vi.fn() } };
});

describe('parseStudentLines', () => {
  it('reads name, class and an optional phone, and skips blank lines', () => {
    expect(parseStudentLines('Ama Mensah, Primary 4, 024 123 4567\n\n  Kofi Boateng , Primary 5 ')).toEqual([
      { full_name: 'Ama Mensah', grade: 'Primary 4', guardian_phone: '024 123 4567' },
      { full_name: 'Kofi Boateng', grade: 'Primary 5', guardian_phone: null },
    ]);
  });
});

describe('StudentLogins', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the issued logins once and tells the admin to print them', async () => {
    const user = userEvent.setup();
    const onIssued = vi.fn();
    api.post.mockResolvedValue({
      data: { students: [{ full_name: 'Ama Mensah', grade: 'Primary 4', username: 'ama.m', temporary_password: 'abcd-efgh' }] },
    });
    render(<StudentLogins consentConfirmed onIssued={onIssued} />);

    await user.type(screen.getByLabelText('Pupils'), 'Ama Mensah, Primary 4');
    await user.click(screen.getByRole('button', { name: /create logins/i }));

    expect(await screen.findByText('abcd-efgh')).toBeInTheDocument();
    expect(screen.getByText(/won't be able to see these passwords again/i)).toBeInTheDocument();
    await waitFor(() => expect(onIssued).toHaveBeenCalled());
  });

  it('cannot issue logins until the school confirms parents have consented', async () => {
    const user = userEvent.setup();
    render(<StudentLogins consentConfirmed={false} />);
    await user.type(screen.getByLabelText('Pupils'), 'Ama Mensah, Primary 4');
    expect(screen.getByRole('button', { name: /create logins/i })).toBeDisabled();
    expect(screen.getByText(/collected parents' consent/i)).toBeInTheDocument();
  });

  it('shows the server message when a line is wrong', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue({ response: { data: { detail: "Line 1: 'Year 9' isn't a class" } } });
    render(<StudentLogins consentConfirmed />);
    await user.type(screen.getByLabelText('Pupils'), 'Ama, Year 9');
    await user.click(screen.getByRole('button', { name: /create logins/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Line 1');
  });
});
