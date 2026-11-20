import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LessonView from './LessonView';
import { GamificationNotifyProvider } from '../../contexts/GamificationNotifyContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import api from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { get: vi.fn(), post: vi.fn() } };
});

const LESSON = { id: 'ratio-1', title: 'Ratio', lesson_type: 'text', content: '# Ratio', watched: false, has_exercises: false };

const renderLesson = () =>
  render(
    <LanguageProvider>
    <GamificationNotifyProvider>
      <MemoryRouter initialEntries={['/learn/maths/lessons/ratio-1']}>
        <Routes>
          <Route path="/learn/:courseId/lessons/:lessonId" element={<LessonView />} />
        </Routes>
      </MemoryRouter>
    </GamificationNotifyProvider>
    </LanguageProvider>,
  );

describe('Lesson page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('says when a teacher has not checked the lesson yet', async () => {
    api.get.mockResolvedValue({ data: { ...LESSON, is_draft: true } });
    renderLesson();
    expect(await screen.findByText(/a teacher hasn't checked this yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report a problem/i })).toBeInTheDocument();
  });

  it('shows no draft note on a checked lesson, and credits reused material', async () => {
    api.get.mockResolvedValue({ data: { ...LESSON, is_draft: false, attribution: 'Open Maths by A. Teacher (CC BY 4.0)' } });
    renderLesson();
    expect(await screen.findByText(/adapted from: open maths/i)).toBeInTheDocument();
    expect(screen.queryByText(/a teacher hasn't checked/i)).not.toBeInTheDocument();
  });
});
