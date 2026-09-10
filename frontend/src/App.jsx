import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { getUser, isAuthenticated, login as authLogin, logout as authLogout, getCountry, setCountry as persistCountry, removeCountry } from './constants/auth';
import EcosystemNavigation from './components/common/EcosystemNavigation';
import GhanaFlag from './components/common/GhanaFlag';
import NigeriaFlag from './components/common/NigeriaFlag';
import { User, LogOut } from 'lucide-react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CountrySelector from './components/CountrySelector';
import LanguageSwitcher from './components/LanguageSwitcher';
import AIChat from './components/ai/AIChat';
import { useLanguage } from './contexts/LanguageContext';

const COUNTRY_FLAGS = { GH: GhanaFlag, NG: NigeriaFlag };
const COUNTRY_NAMES = { GH: 'Ghana', NG: 'Nigeria' };

// Route-level code splitting: each of these becomes its own chunk instead of
// bloating the single main bundle every visitor downloads up front.
const DashboardModule = lazy(() => import('./modules/dashboard/DashboardModule'));
const CourseGrid = lazy(() => import('./modules/learn/CourseGrid'));
const CourseDetail = lazy(() => import('./modules/learn/CourseDetail'));
const LessonView = lazy(() => import('./modules/learn/LessonView'));
// OLD Explore (keep for now)
const ExploreModule = lazy(() => import('./modules/explore/ExploreModule'));
// NEW Explore pages
const ExploreLanding = lazy(() => import('./modules/explore-new/landing/ExploreLanding'));
const CareersPage = lazy(() => import('./modules/explore-new/pages/CareersPage'));
const UniversitiesPage = lazy(() => import('./modules/explore-new/pages/UniversitiesPage'));
const ScholarshipsPage = lazy(() => import('./modules/explore-new/pages/ScholarshipsPage'));
const CareerMatchPage = lazy(() => import('./modules/explore-new/pages/CareerMatchPage'));
const PracticeModule = lazy(() => import('./modules/practice/PracticeModule'));
const PlanModule = lazy(() => import('./modules/plan/PlanModule'));
const ProfileModule = lazy(() => import('./modules/profile/ProfileModule'));
const CommunityModule = lazy(() => import('./modules/community/CommunityModule'));
const AdminCourseList = lazy(() => import('./modules/admin/AdminCourseList'));
const AdminCourseEditor = lazy(() => import('./modules/admin/AdminCourseEditor'));
const AdminLessonEditor = lazy(() => import('./modules/admin/AdminLessonEditor'));
const SchoolAdminDashboard = lazy(() => import('./modules/school-admin/SchoolAdminDashboard'));

const App = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [activeModule, setActiveModule] = useState('home');
  const [country, setCountryState] = useState(null);

  useEffect(() => {
    const userData = getUser();
    if (userData && isAuthenticated()) {
      setUser(userData);
      setIsAuth(true);
    }
    setCountryState(getCountry());
    setLoading(false);
  }, []);

  const handleCountrySelect = (code) => {
    persistCountry(code);
    setCountryState(code);
  };

  const handleChangeCountry = () => {
    removeCountry();
    setCountryState(null);
  };

  const handleLogin = (userData, token) => {
    authLogin(userData, token);
    // The account's real country is the source of truth once logged in - a
    // user who registered as GH but is logging in on a device where NG was
    // previously selected should see GH content.
    persistCountry(userData.country);
    setCountryState(userData.country);
    setUser(userData);
    setIsAuth(true);
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setIsAuth(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}</div>;
  }

  if (!isAuth) {
    if (!country) {
      return (
        <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
          <header style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#1a5f2b' }}>Pathway AI</h1>
            <p style={{ color: '#888' }}>{t('tagline')}</p>
          </header>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <LanguageSwitcher />
          </div>
          <CountrySelector onSelect={handleCountrySelect} />
        </div>
      );
    }

    const CountryFlag = COUNTRY_FLAGS[country];
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1a5f2b', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><CountryFlag size={24} /> Pathway AI</h1>
          <p style={{ color: '#888' }}>{t('tagline')} • {COUNTRY_NAMES[country]}</p>
        </header>
        {showLogin ? <Login onSuccess={handleLogin} /> : <Register onSuccess={() => setShowLogin(true)} />}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => setShowLogin(!showLogin)} style={{ background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer', textDecoration: 'underline' }}>
            {showLogin ? t('needAccountRegister') : t('alreadyHaveAccountLogin')}
          </button>
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px' }}>
          <button onClick={handleChangeCountry} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
            {t('changeCountry')}
          </button>
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px' }}>
          <LanguageSwitcher />
        </p>
        <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
          <p>{t('copyright')}</p>
        </footer>
      </div>
    );
  }

  const UserCountryFlag = COUNTRY_FLAGS[user?.country] || GhanaFlag;
  return (
    <BrowserRouter>
      <div style={{
        fontFamily: 'var(--font-family)',
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
            <h1 style={{ color: '#1a5f2b', fontSize: '22px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><UserCountryFlag size={22} /> Pathway AI</h1>
            <span style={{ fontSize: '11px', color: '#888' }}>{t('tagline')} • {COUNTRY_NAMES[user?.country] || ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#555', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> {user?.full_name || user?.name || t('student')}
            </span>
            {user?.is_admin && (
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a5f2b', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '999px', padding: '3px 10px' }}>
                {t('admin')}
              </span>
            )}
            <LanguageSwitcher />
            <button onClick={handleLogout} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}><LogOut size={14} /> {t('logout')}</button>
          </div>
        </header>

        <EcosystemNavigation activeModule={activeModule} setActiveModule={setActiveModule} user={user} />

        <main style={{ padding: '16px 0', width: '100%' }}>
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}</div>}>
          <Routes>
            <Route path="/" element={<DashboardModule setActiveModule={setActiveModule} />} />
            <Route path="/home" element={<DashboardModule setActiveModule={setActiveModule} />} />
            <Route path="/learn" element={<CourseGrid user={user} />} />
            <Route path="/learn/:courseId" element={<CourseDetail />} />
            <Route path="/learn/:courseId/lessons/:lessonId" element={<LessonView />} />

            {/* NEW Explore Routes */}
            <Route path="/explore" element={<ExploreLanding user={user} />} />
            <Route path="/explore/careers" element={<CareersPage user={user} />} />
            <Route path="/explore/universities" element={<UniversitiesPage user={user} />} />
            <Route path="/explore/scholarships" element={<ScholarshipsPage />} />
            <Route path="/explore/career-match" element={user?.country === 'GH' ? <CareerMatchPage /> : <Navigate to="/" />} />
            
            {/* OLD Explore (keep as fallback) */}
            <Route path="/explore-old" element={<ExploreModule />} />
            
            <Route path="/practice" element={<PracticeModule />} />
            <Route path="/plan" element={<PlanModule />} />
            <Route path="/profile" element={<ProfileModule />} />
            <Route path="/community" element={<CommunityModule />} />

            {/* Admin (content authoring) — client-side check is UX only, real
                enforcement is server-side via require_admin on every /api/admin/* route */}
            <Route path="/admin" element={user?.is_admin ? <AdminCourseList /> : <Navigate to="/" />} />
            <Route path="/admin/courses/:courseId" element={user?.is_admin ? <AdminCourseEditor /> : <Navigate to="/" />} />
            <Route path="/admin/lessons/:lessonId" element={user?.is_admin ? <AdminLessonEditor /> : <Navigate to="/" />} />
            <Route path="/school-admin" element={user?.is_school_admin ? <SchoolAdminDashboard /> : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </Suspense>
        </main>

        <footer style={{ 
          textAlign: 'center', 
          padding: '16px 0', 
          color: '#888', 
          borderTop: '1px solid #e0e0e0', 
          fontSize: '13px' 
        }}>
          <p>{t('copyright')}</p>
        </footer>

        <AIChat user={user} />
      </div>
    </BrowserRouter>
  );
};

export default App;
