/**
 * AUTHENTICATED VERSION OF APP
 * Test this separately before replacing App.jsx
 * 
 * To test: temporarily rename App.jsx to App.jsx.backup
 * and rename App.auth.jsx to App.jsx
 */

import React, { useState, useEffect } from 'react'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import HomeDashboard from './modules/home/HomeDashboard'
import EcosystemNavigation from './components/common/EcosystemNavigation'

// All other imports from your existing App.jsx
import AIRecommendation from './components/AIRecommendation'
import AICopilot from './components/AICopilot'
import RealRecommender from './components/RealRecommender'
import AdmissionPredictor from './components/AdmissionPredictor'
import CareerCharts from './components/CareerCharts'
import ExplainabilityPanel from './components/Explainability/ExplainabilityPanel'
import CareerRoadmap from './components/Roadmap/CareerRoadmap'
import SourceCitations from './components/Sources/SourceCitations'
import UniversityComparison from './components/Comparison/UniversityComparison'
import ConversationMemory from './components/Conversation/ConversationMemory'
import ActionPlan from './components/ActionPlan/ActionPlan'
import ScholarshipFinder from './components/Scholarship/ScholarshipFinder'
import SchoolDashboard from './components/Dashboard/SchoolDashboard'
import IntelligenceDashboard from './components/Dashboard/IntelligenceDashboard'
import ContextChat from './components/ContextEngine/ContextChat'
import WhatIfSimulator from './components/Simulator/WhatIfSimulator'
import FeedbackButtons from './components/Feedback/FeedbackButtons'
import CompleteProfileSetup from './components/Profile/CompleteProfileSetup'
import CourseCatalog from './modules/learn/CourseCatalog'
import CourseDetail from './modules/learn/CourseDetail'
import LessonPlayer from './modules/learn/LessonPlayer'

import API from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [activeModule, setActiveModule] = useState('home');
  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('pathwaygh_token');
    const savedUser = localStorage.getItem('pathwaygh_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
    
    fetchCareers();
    setLoading(false);
  }, []);

  const fetchCareers = async () => {
    try {
      const response = await API.get('/api/careers');
      setCareers(response.data);
    } catch (error) {
      console.error('Error fetching careers:', error);
    }
  };

  const viewCareerDetails = async (slug) => {
    try {
      const response = await API.get(`/api/careers/${slug}`);
      setSelectedCareer(response.data);
      
      const explainResponse = await API.post('/api/explain/recommendation', {
        career: response.data,
        student_profile: {
          aggregate: user?.academic?.aggregate || 12,
          subjects: ['Biology', 'Chemistry', 'Physics'],
          interests: ['healthcare', 'helping']
        }
      });
      setExplanation(explainResponse.data);
      
      const roadmapResponse = await API.get(`/api/roadmap/${slug}`);
      setRoadmap(roadmapResponse.data);
    } catch (error) {
      console.error('Error fetching career details:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('pathwaygh_token');
    localStorage.removeItem('pathwaygh_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1a5f2b', fontSize: '36px', margin: 0 }}>
            🇬🇭 Pathway AI
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            AI-Powered Education & Career Ecosystem • Ghana
          </p>
        </header>
        {showLogin ? (
          <Login onSuccess={handleLogin} />
        ) : (
          <Register onSuccess={() => setShowLogin(true)} />
        )}
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            onClick={() => setShowLogin(!showLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1a5f2b',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </p>
        <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
          <p>© 2026 Pathway AI | Built for Ghana</p>
        </footer>
      </div>
    );
  }

  // Main app - your existing content with auth
  const renderModule = () => {
    switch(activeModule) {
      case 'home':
        return <HomeDashboard user={user} careers={careers} onViewCareer={viewCareerDetails} />;
      case 'learn':
        return <CourseCatalog user={user} />;
      case 'explore':
        return <ExploreModule careers={careers} onViewCareer={viewCareerDetails} selectedCareer={selectedCareer} explanation={explanation} roadmap={roadmap} onCloseCareer={() => { setSelectedCareer(null); setExplanation(null); setRoadmap(null); }} />;
      case 'profile':
        return <CompleteProfileSetup />;
      default:
        return <HomeDashboard user={user} careers={careers} onViewCareer={viewCareerDetails} />;
    }
  };

  const ExploreModule = ({ careers, onViewCareer, selectedCareer, explanation, roadmap, onCloseCareer }) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {careers.map((career) => (
          <div key={career.id} onClick={() => onViewCareer(career.slug)} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', background: 'white', cursor: 'pointer' }}>
            <h3 style={{ color: '#1a5f2b' }}>{career.name}</h3>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '16px', fontSize: '12px' }}>{career.field}</span>
            <p style={{ fontSize: '14px', color: '#555' }}>{career.description}</p>
          </div>
        ))}
      </div>
      {selectedCareer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ color: '#1a5f2b' }}>{selectedCareer.name}</h2>
            {explanation && <ExplainabilityPanel explanation={explanation} />}
            {roadmap && <CareerRoadmap career={roadmap} />}
            <button onClick={onCloseCareer} style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ color: '#1a5f2b', fontSize: '36px', margin: 0 }}>🇬🇭 Pathway AI</h1>
        <p style={{ fontSize: '14px', color: '#888' }}>AI-Powered Education & Career Ecosystem • Ghana</p>
        <button onClick={handleLogout} style={{ position: 'absolute', right: '20px', top: '20px', padding: '6px 16px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Logout 👋</button>
      </header>
      <EcosystemNavigation activeModule={activeModule} setActiveModule={setActiveModule} user={user} />
      <main style={{ marginTop: '20px' }}>{renderModule()}</main>
      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
        <p>© 2026 Pathway AI | Built for Ghana</p>
      </footer>
    </div>
  );
}

export default App
