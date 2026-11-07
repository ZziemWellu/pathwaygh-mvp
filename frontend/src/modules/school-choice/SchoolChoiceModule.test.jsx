import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../services/api';
import SchoolChoiceModule from './SchoolChoiceModule';

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return { ...actual, default: { get: vi.fn(), put: vi.fn() } };
});

const RULES = {
  year: 2026,
  total_choices: 8,
  max_category_a: 2,
  max_category_b: 3,
  max_boarding: 5,
  max_day: 3,
  categories: ['A', 'B', 'C'],
  category_a_note: 'Category A is competitive.',
  source_name: 'Graphic',
  source_url: 'https://example.test/guide',
  disclaimer: 'Your official guide comes first.',
  tips: ['Placement is free.'],
};

const emptyCheck = {
  valid: true,
  complete: false,
  errors: [],
  reminders: ['Add 8 more schools to reach 8.'],
  counts: {},
};

const mockLoad = (choices = []) => {
  api.get.mockImplementation((url) =>
    Promise.resolve({
      data: url.endsWith('/rules') ? { rules: RULES } : { choices, check: emptyCheck },
    }),
  );
};

describe('SchoolChoiceModule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows eight empty choices and the rules for the year', async () => {
    mockLoad();
    render(<SchoolChoiceModule />);
    expect(await screen.findByText('The 2026 rules')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/name as it appears/i)).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'Graphic' })).toHaveAttribute('href', RULES.source_url);
  });

  it('flags a live count that goes over a limit', async () => {
    const user = userEvent.setup();
    mockLoad([
      { school: 'One', category: 'A', mode: 'day', programme: 'Arts' },
      { school: 'Two', category: 'A', mode: 'day', programme: 'Arts' },
    ]);
    render(<SchoolChoiceModule />);
    await screen.findByText('The 2026 rules');
    expect(screen.getByText('2/2')).toBeInTheDocument();

    const schools = screen.getAllByPlaceholderText(/name as it appears/i);
    await user.type(schools[2], 'Three');
    await user.selectOptions(screen.getAllByLabelText('Category')[2], 'A');

    expect(screen.getByText('3/2').closest('div')).toHaveClass('is-over');
  });

  it('sends blank selects as null and shows the server check', async () => {
    const user = userEvent.setup();
    mockLoad();
    api.put.mockResolvedValue({
      data: { check: { valid: false, complete: false, errors: ['Too many Category A schools.'], reminders: [], counts: {} } },
    });
    render(<SchoolChoiceModule />);
    await screen.findByText('The 2026 rules');

    await user.type(screen.getAllByPlaceholderText(/name as it appears/i)[0], 'Opoku Ware');
    await user.click(screen.getByRole('button', { name: /save and check/i }));

    const [, body] = api.put.mock.calls[0];
    expect(body.choices).toHaveLength(8);
    expect(body.choices[0]).toEqual({ school: 'Opoku Ware', category: null, mode: null, programme: '' });
    expect(await screen.findByText('Too many Category A schools.')).toBeInTheDocument();
  });

  it('reorders choices', async () => {
    const user = userEvent.setup();
    mockLoad([{ school: 'First', category: 'C', mode: 'day', programme: 'Arts' }, { school: 'Second', category: 'C', mode: 'day', programme: 'Arts' }]);
    render(<SchoolChoiceModule />);
    await screen.findByText('The 2026 rules');

    await user.click(screen.getByRole('button', { name: 'Move choice 2 up' }));

    const schools = screen.getAllByPlaceholderText(/name as it appears/i);
    expect(schools[0]).toHaveValue('Second');
    expect(schools[1]).toHaveValue('First');
  });

  it('explains when a student is not eligible', async () => {
    api.get.mockRejectedValue({ response: { data: { detail: 'School Selection is for JHS students in Ghana' } } });
    render(<SchoolChoiceModule />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/JHS students in Ghana/);
  });
});
