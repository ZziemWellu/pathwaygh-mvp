import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContentTools from './ContentTools';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } };
});

const COVERAGE = {
  note: 'Provisional map',
  levels: [
    {
      id: 'jhs3', name: 'JHS 3', exam: 'BECE',
      subjects: [{
        id: 'jhs3.maths', name: 'Mathematics', provisional: true, untagged_questions: 0,
        sources: [{ publisher: 'NaCCA', document: 'CCP', url: 'https://nacca.gov.gh/' }],
        totals: { topics: 1, topics_with_gaps: 1, questions: { live: 0, draft: 2 }, lessons: { live: 0, draft: 0 } },
        strands: [{ id: 's', name: 'Number', topics: [{ id: 't', name: 'Ratio', priority: 1, questions: { live: 0, draft: 2 }, lessons: { live: 0, draft: 0 }, gaps: ['no lesson'] }] }],
      }],
    },
  ],
  untagged_lessons: 0,
};

describe('Content tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/api/content/coverage' ? COVERAGE : { questions: [], lessons: [], courses: [], reports: [], contributors: [], activity: [], total: 0 } }));
  });

  it('opens on the coverage report, with gaps per topic', async () => {
    render(<ContentTools user={{ is_contributor: true }} />);
    expect(await screen.findByText('no lesson')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Import' })).not.toBeInTheDocument();
  });

  it('lists every problem in a rejected import with its line number', async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { detail: { message: 'Nothing was imported: fix 2 problem(s)', errors: [{ line: 3, message: 'difficulty must be easy, medium or hard' }, { line: 7, message: 'subject_id "x" isn\'t a practice subject' }] } } } });
    render(<ContentTools user={{ is_admin: true }} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Import' }));
    const input = document.getElementById('import-questions');
    await userEvent.upload(input, new File(['a,b'], 'q.csv', { type: 'text/csv' }));
    await userEvent.click(screen.getAllByRole('button', { name: /import as drafts/i })[0]);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Nothing was imported');
    expect(alert).toHaveTextContent('Line 3: difficulty must be easy, medium or hard');
    expect(alert).toHaveTextContent('Line 7:');
  });
});
