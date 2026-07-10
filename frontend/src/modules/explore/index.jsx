import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ExploreHome from './ExploreHome';
import CareerDetail from './CareerDetail';
import UniversityDetail from './UniversityDetail';
import ScholarshipList from './ScholarshipList';

function ExploreModule() {
  return (
    <Routes>
      <Route index element={<ExploreHome />} />
      <Route path="careers/:slug" element={<CareerDetail />} />
      <Route path="universities/:id" element={<UniversityDetail />} />
      <Route path="scholarships" element={<ScholarshipList />} />
    </Routes>
  );
}

export default ExploreModule;
