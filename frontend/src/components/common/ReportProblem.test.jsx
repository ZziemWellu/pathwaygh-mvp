import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportProblem from './ReportProblem';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn() } };
});

describe('Report a problem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the reason and details for this question, then thanks the student', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    render(<ReportProblem itemType="question" itemId="jm_alg_001" />);
    await userEvent.click(screen.getByRole('button', { name: /report a problem/i }));
    await userEvent.selectOptions(screen.getByLabelText(/what's wrong/i), 'unclear');
    await userEvent.type(screen.getByLabelText(/tell us more/i), 'I do not understand option C');
    await userEvent.click(screen.getByRole('button', { name: /send report/i }));
    expect(api.post).toHaveBeenCalledWith('/api/content/reports', { item_type: 'question', item_id: 'jm_alg_001', reason: 'unclear', details: 'I do not understand option C' });
    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i);
  });

  it('shows the error and keeps the form when sending fails', async () => {
    api.post.mockRejectedValue({ response: { data: { detail: 'Too many reports' } } });
    render(<ReportProblem itemType="lesson" itemId="ratio-1" />);
    await userEvent.click(screen.getByRole('button', { name: /report a problem/i }));
    await userEvent.click(screen.getByRole('button', { name: /send report/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many reports');
    expect(screen.getByRole('button', { name: /send report/i })).toBeInTheDocument();
  });
});
