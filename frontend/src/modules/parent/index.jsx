import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ParentDashboard from './ParentDashboard';
import ChildProgress from './ChildProgress';
import ParentNotifications from './ParentNotifications';

function ParentModule() {
  return (
    <Routes>
      <Route index element={<ParentDashboard />} />
      <Route path="child/:childId" element={<ChildProgress />} />
      <Route path="notifications" element={<ParentNotifications />} />
    </Routes>
  );
}

export default ParentModule;
