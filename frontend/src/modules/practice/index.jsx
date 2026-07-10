import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PracticeHome from './PracticeHome';
import QuizPlayer from './QuizPlayer';
import MockExam from './MockExam';
import PracticeHistory from './PracticeHistory';

function PracticeModule() {
  return (
    <Routes>
      <Route index element={<PracticeHome />} />
      <Route path="quiz" element={<QuizPlayer />} />
      <Route path="mock-exam" element={<MockExam />} />
      <Route path="history" element={<PracticeHistory />} />
    </Routes>
  );
}

export default PracticeModule;
