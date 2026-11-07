import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../services/api';
import ChangePassword from './ChangePassword';

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return { ...actual, default: { post: vi.fn() } };
});

const fill = async (user, next, confirm) => {
  await user.type(screen.getByLabelText(/password from your school/i), 'abcd-efgh');
  await user.type(screen.getByLabelText(/^new password$/i), next);
  await user.type(screen.getByLabelText(/new password again/i), confirm);
  await user.click(screen.getByRole('button', { name: /save my password/i }));
};

describe('ChangePassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves the new password and hands back the new session', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    api.post.mockResolvedValue({ data: { user: { full_name: 'Ama' }, token: 'new-token' } });
    render(<ChangePassword user={{ full_name: 'Ama' }} onChanged={onChanged} onLogout={vi.fn()} />);

    await fill(user, 'mynewpass1', 'mynewpass1');

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({ full_name: 'Ama' }, 'new-token'));
    expect(api.post).toHaveBeenCalledWith('/api/auth/change-password', { current_password: 'abcd-efgh', new_password: 'mynewpass1' });
  });

  it('stops two different new passwords without calling the server', async () => {
    const user = userEvent.setup();
    render(<ChangePassword user={{ full_name: 'Ama' }} onChanged={vi.fn()} onLogout={vi.fn()} />);
    await fill(user, 'mynewpass1', 'different1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/different/i);
    expect(api.post).not.toHaveBeenCalled();
  });
});
