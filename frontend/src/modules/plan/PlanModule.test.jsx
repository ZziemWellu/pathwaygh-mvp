import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PlanModule from './PlanModule';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const samplePlan = {
  id: 'plan_abc123',
  name: 'My WASSCE Plan',
  description: 'Prep plan',
  duration_months: 3,
  progress: 40,
  subjects: ['Mathematics'],
  goal: 'exam preparation',
};

describe('PlanModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the plans returned by the API', async () => {
    api.get.mockResolvedValueOnce({ data: [samplePlan] });
    render(<PlanModule />);

    expect(await screen.findByText('My WASSCE Plan')).toBeInTheDocument();
  });

  it('shows the empty state when there are no plans', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    render(<PlanModule />);

    expect(await screen.findByText(/no study plans yet/i)).toBeInTheDocument();
  });

  it('shows an error with a working retry button when the fetch fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));
    render(<PlanModule />);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();

    api.get.mockResolvedValueOnce({ data: [samplePlan] });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('My WASSCE Plan')).toBeInTheDocument();
  });

  it('deletes a plan after confirmation and refreshes the list', async () => {
    // Regression test: the delete button used to be a no-op ({/* Delete plan */})
    // that never called the backend at all.
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.get.mockResolvedValueOnce({ data: [samplePlan] });
    api.delete.mockResolvedValueOnce({ data: { success: true } });
    api.get.mockResolvedValueOnce({ data: [] });

    render(<PlanModule />);
    await screen.findByText('My WASSCE Plan');

    await user.click(screen.getByRole('button', { name: /delete my wassce plan/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/plan/study-plans/plan_abc123'));
    expect(await screen.findByText(/no study plans yet/i)).toBeInTheDocument();
  });

  it('does not call delete when the confirmation is declined', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    api.get.mockResolvedValueOnce({ data: [samplePlan] });

    render(<PlanModule />);
    await screen.findByText('My WASSCE Plan');
    await user.click(screen.getByRole('button', { name: /delete my wassce plan/i }));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('shows a permission-denied alert distinctly when the backend returns 403', async () => {
    // Regression test for the ownership fix: deleting a plan you don't
    // own (or a shared system template) now returns 403.
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    api.get.mockResolvedValueOnce({ data: [samplePlan] });
    api.delete.mockRejectedValueOnce({ response: { status: 403 } });

    render(<PlanModule />);
    await screen.findByText('My WASSCE Plan');
    await user.click(screen.getByRole('button', { name: /delete my wassce plan/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("You can't delete this plan."));
  });

  it('opens the create-plan modal and submits a new plan', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [] });
    render(<PlanModule />);
    await screen.findByText(/no study plans yet/i);

    await user.click(screen.getByRole('button', { name: '+ Create Plan' }));
    await user.type(screen.getByPlaceholderText(/wassce preparation plan/i), 'My New Plan');
    await user.click(screen.getByRole('button', { name: /next/i }));

    api.post.mockResolvedValueOnce({ data: { success: true, plan: { ...samplePlan, name: 'My New Plan' } } });
    api.get.mockResolvedValueOnce({ data: [{ ...samplePlan, name: 'My New Plan' }] });
    await user.click(screen.getByRole('button', { name: /✨ Create Plan/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/plan/study-plans/create',
        expect.objectContaining({ name: 'My New Plan' })
      );
    });
  });
});
