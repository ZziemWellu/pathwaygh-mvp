import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ParentDashboard from './ParentDashboard';
import ChildProgress from './ChildProgress';
import ParentSettings from './ParentSettings';

function ParentModule() {
  return (
    <Routes>
      <Route index element={<ParentDashboard />} />
      <Route path="child/:childId" element={<ChildProgress />} />
      <Route path="settings" element={<ParentSettings />} />
    </Routes>
  );
}

export default ParentModule;
