import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../services/api';
import SchoolRegister from './SchoolRegister';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn() } };
});

const fill = async (user, overrides = {}) => {
  const values = { password: 'password123', confirm: 'password123', ...overrides };
  await user.type(screen.getByLabelText('School name'), 'Accra Academy');
  await user.type(screen.getByLabelText('Your full name'), 'Ama Mensah');
  await user.selectOptions(screen.getByLabelText('Your role at the school'), 'headteacher');
  await user.type(screen.getByLabelText('Work email'), 'head@school.test');
  await user.type(screen.getByLabelText('Phone number'), '024 123 4567');
  await user.type(screen.getByLabelText('Password'), values.password);
  await user.type(screen.getByLabelText('Confirm password'), values.confirm);
};

describe('SchoolRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('pathwaygh_country', 'GH');
  });

  it('asks for school details, not a class, level or parent', () => {
    render(<SchoolRegister onSuccess={vi.fn()} onShowPrivacy={vi.fn()} />);
    expect(screen.getByLabelText('School name')).toBeInTheDocument();
    expect(screen.getByLabelText('Your role at the school')).toBeInTheDocument();
    expect(screen.queryByLabelText(/class/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/level/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/guardian|parent/i)).not.toBeInTheDocument();
  });

  it('creates the school and signs the admin in', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    api.post.mockResolvedValue({ data: { user: { id: 1, is_school_admin: true }, token: 'tok' } });
    render(<SchoolRegister onSuccess={onSuccess} onShowPrivacy={vi.fn()} />);

    await fill(user);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create school account' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 1, is_school_admin: true }, 'tok'));
    expect(api.post).toHaveBeenCalledWith('/api/school/register', {
      school_name: 'Accra Academy',
      full_name: 'Ama Mensah',
      role: 'headteacher',
      email: 'head@school.test',
      phone: '024 123 4567',
      password: 'password123',
      country: 'GH',
      authorised: true,
    });
  });

  it('needs the authorisation box ticked', async () => {
    const user = userEvent.setup();
    render(<SchoolRegister onSuccess={vi.fn()} onShowPrivacy={vi.fn()} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create school account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/authorised/i);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('stops two different passwords', async () => {
    const user = userEvent.setup();
    render(<SchoolRegister onSuccess={vi.fn()} onShowPrivacy={vi.fn()} />);
    await fill(user, { confirm: 'different1' });
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create school account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/different/i);
    expect(api.post).not.toHaveBeenCalled();
  });
});
