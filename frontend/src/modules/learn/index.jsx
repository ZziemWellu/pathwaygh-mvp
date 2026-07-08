import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CourseCatalog from './CourseCatalog';
import CourseDetail from './CourseDetail';

function LearnModule() {
  return (
    <Routes>
      <Route index element={<CourseCatalog />} />
      <Route path="courses/:courseId" element={<CourseDetail />} />
    </Routes>
  );
}

export default LearnModule;
