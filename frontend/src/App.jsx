import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { getUser, isAuthenticated, login as authLogin, logout as authLogout } from './constants/auth';
import DashboardModule from './modules/dashboard/DashboardModule';
import LearnModule from './modules/learn/LearnModule';
// OLD Explore (keep for now)
import ExploreModule from './modules/explore/ExploreModule';
// NEW Explore pages
import { ExploreLanding, CareersPage, UniversitiesPage, ScholarshipsPage, CareerMatchPage } from './modules/explore-new';
import PracticeModule from './modules/practice/PracticeModule';
import PlanModule from './modules/plan/PlanModule';
import ProfileModule from './modules/profile/ProfileModule';
import CommunityModule from './modules/community/CommunityModule';
import EcosystemNavigation from './components/common/EcosystemNavigation';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AIChat from './components/ai/AIChat';

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [activeModule, setActiveModule] = useState('home');

  useEffect(() => {
    const userData = getUser();
    if (userData && isAuthenticated()) {
      setUser(userData);
      setIsAuth(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    authLogin(userData, token);
    setUser(userData);
    setIsAuth(true);
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setIsAuth(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (!isAuth) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1a5f2b' }}>🇬🇭 Pathway AI</h1>
          <p style={{ color: '#888' }}>AI-Powered Education & Career Ecosystem • Ghana</p>
        </header>
        {showLogin ? <Login onSuccess={handleLogin} /> : <Register onSuccess={() => setShowLogin(true)} />}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => setShowLogin(!showLogin)} style={{ background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer', textDecoration: 'underline' }}>
            {showLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </p>
        <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
          <p>© 2026 Pathway AI | Built for Ghana</p>
        </footer>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '100%', 
        padding: '0 16px',
        margin: '0 auto',
        width: '100%'
      }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 0', 
          borderBottom: '1px solid #e0e0e0', 
          flexWrap: 'wrap', 
          gap: '8px' 
        }}>
          <div>
            <h1 style={{ color: '#1a5f2b', fontSize: '22px', margin: 0 }}>🇬🇭 Pathway AI</h1>
            <span style={{ fontSize: '11px', color: '#888' }}>AI-Powered Education & Career Ecosystem • Ghana</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#555', fontSize: '13px' }}>👤 {user?.full_name || user?.name || 'Student'}</span>
            <button onClick={handleLogout} style={{ 
              padding: '5px 14px', 
              background: '#f0f0f0', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '13px' 
            }}>Logout 👋</button>
          </div>
        </header>

        <EcosystemNavigation activeModule={activeModule} setActiveModule={setActiveModule} user={user} />

        <main style={{ padding: '16px 0', width: '100%' }}>
          <Routes>
            <Route path="/" element={<DashboardModule setActiveModule={setActiveModule} />} />
            <Route path="/home" element={<DashboardModule setActiveModule={setActiveModule} />} />
            <Route path="/learn" element={<LearnModule />} />
            
            {/* NEW Explore Routes */}
            <Route path="/explore" element={<ExploreLanding />} />
            <Route path="/explore/careers" element={<CareersPage />} />
            <Route path="/explore/universities" element={<UniversitiesPage />} />
            <Route path="/explore/scholarships" element={<ScholarshipsPage />} />
            <Route path="/explore/career-match" element={<CareerMatchPage />} />
            
            {/* OLD Explore (keep as fallback) */}
            <Route path="/explore-old" element={<ExploreModule />} />
            
            <Route path="/practice" element={<PracticeModule />} />
            <Route path="/plan" element={<PlanModule />} />
            <Route path="/profile" element={<ProfileModule />} />
            <Route path="/community" element={<CommunityModule />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer style={{ 
          textAlign: 'center', 
          padding: '16px 0', 
          color: '#888', 
          borderTop: '1px solid #e0e0e0', 
          fontSize: '13px' 
        }}>
          <p>© 2026 Pathway AI | Built for Ghana</p>
        </footer>

        <AIChat user={user} />
      </div>
    </BrowserRouter>
  );
};

export default App;
