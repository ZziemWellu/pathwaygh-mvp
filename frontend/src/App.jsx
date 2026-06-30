import React, { useState, useEffect } from 'react'
import axios from 'axios'

// ALL components already exist - imported safely
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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
})

function App() {
  const [careers, setCareers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCareer, setSelectedCareer] = useState(null)
  const [activeTab, setActiveTab] = useState('browse')
  const [explanation, setExplanation] = useState(null)
  const [roadmap, setRoadmap] = useState(null)

  useEffect(() => {
    fetchCareers()
  }, [])

  const fetchCareers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/careers')
      setCareers(response.data)
    } catch (error) {
      console.error('Error fetching careers:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchCareers = async () => {
    if (!search.trim()) {
      fetchCareers()
      return
    }
    setLoading(true)
    try {
      const response = await api.get(`/api/careers?search=${search}`)
      setCareers(response.data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewCareerDetails = async (slug) => {
    setLoading(true)
    try {
      const response = await api.get(`/api/careers/${slug}`)
      setSelectedCareer(response.data)
      
      const explainResponse = await api.post('/api/explain/recommendation', {
        career: response.data,
        student_profile: {
          aggregate: 12,
          subjects: ['Biology', 'Chemistry', 'Physics'],
          interests: ['healthcare', 'helping']
        }
      })
      setExplanation(explainResponse.data)
      
      const roadmapResponse = await api.get(`/api/roadmap/${slug}`)
      setRoadmap(roadmapResponse.data)
    } catch (error) {
      console.error('Error fetching career details:', error)
    } finally {
      setLoading(false)
    }
  }

  // ALL 12 TABS - Every component that exists
  const tabs = [
    { id: 'browse', label: '🔍 Browse Careers', component: null },
    { id: 'smart', label: '🎯 Smart Match', component: AIRecommendation },
    { id: 'real', label: '📚 Real Data', component: RealRecommender },
    { id: 'admission', label: '📊 Admission', component: AdmissionPredictor },
    { id: 'charts', label: '📈 Analytics', component: CareerCharts },
    { id: 'copilot', label: '💬 Memory Chat', component: ConversationMemory },
    { id: 'plan', label: '📋 Action Plan', component: ActionPlan },
    { id: 'scholarship', label: '💰 Scholarships', component: ScholarshipFinder },
    { id: 'dashboard', label: '📊 School Dashboard', component: SchoolDashboard },
    { id: 'intelligence', label: '🧠 Intelligence', component: IntelligenceDashboard },
    { id: 'context', label: '🔮 Context AI', component: ContextChat },
    { id: 'profile', label: '👤 Profile', component: CompleteProfileSetup },
  ]

  const renderContent = () => {
    const tab = tabs.find(t => t.id === activeTab)
    if (tab && tab.component) {
      const Component = tab.component
      return <Component />
    }
    return renderBrowse()
  }

  const renderBrowse = () => (
    <>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Search a career... e.g., Doctor, Engineer, Lawyer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchCareers()}
          style={{ padding: '14px', width: '400px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <button
          onClick={searchCareers}
          style={{ padding: '14px 28px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
        >
          Search
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
        {['Doctor', 'Engineer', 'Lawyer', 'Accountant', 'Nurse'].map(career => (
          <button
            key={career}
            onClick={() => { setSearch(career); setTimeout(searchCareers, 100) }}
            style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
          >
            {career}
          </button>
        ))}
      </div>

      {selectedCareer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ color: '#1a5f2b' }}>{selectedCareer.name}</h2>
            <p><strong>Field:</strong> {selectedCareer.field}</p>
            <p><strong>Description:</strong> {selectedCareer.description}</p>
            <p><strong>Salary:</strong> {selectedCareer.salary_range}</p>
            <p><strong>Duration:</strong> {selectedCareer.duration_years} years</p>
            <p><strong>Typical Aggregate:</strong> ≤{selectedCareer.typical_aggregate}</p>
            
            {selectedCareer.universities && (
              <UniversityComparison universities={selectedCareer.universities.map(u => ({
                university: u,
                cutoff: selectedCareer.typical_aggregate,
                duration: selectedCareer.duration_years,
                admission_chance: 75,
                status: 'Possible'
              }))} />
            )}
            
            {roadmap && <CareerRoadmap career={roadmap} />}
            {explanation && <ExplainabilityPanel explanation={explanation} />}
            
            <SourceCitations sources={['University of Ghana', 'KNUST', 'UHAS', 'WAEC Ghana']} />
            <WhatIfSimulator career={selectedCareer.name} currentAggregate={12} />
            <FeedbackButtons career={selectedCareer.name} />
            
            <button
              onClick={() => {
                setSelectedCareer(null)
                setExplanation(null)
                setRoadmap(null)
              }}
              style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading careers...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {careers.map((career) => (
            <div
              key={career.id}
              onClick={() => viewCareerDetails(career.slug)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#1a5f2b' }}>{career.name}</h3>
              <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '16px', fontSize: '12px', marginBottom: '12px' }}>
                {career.field}
              </span>
              <p style={{ color: '#666', margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.4' }}>{career.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <span>💰 {career.salary_range}</span>
                <span>🎓 {career.duration_years} years</span>
                <span>📊 Aggregate: {career.typical_aggregate || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1a5f2b', fontSize: '48px', margin: '0' }}>🇬🇭 PathwayGH</h1>
        <p style={{ fontSize: '18px', color: '#555' }}>Real Data. Real Guidance. Real Futures.</p>
        <p style={{ fontSize: '14px', color: '#888' }}>Explainable AI • RAG-powered • Real Ghanaian Data</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderBottom: activeTab === tab.id ? '3px solid #1a5f2b' : 'none',
              color: activeTab === tab.id ? '#1a5f2b' : '#666',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}

      <footer style={{ textAlign: 'center', marginTop: '50px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
        <p>© 2026 PathwayGH | Built for Ghana AI Innovation Challenge</p>
        <p style={{ fontSize: '12px' }}>
          📚 Real Ghanaian Data | 🤖 Explainable AI | 🎓 12 Universities | 🏆 66 Programs
        </p>
      </footer>
    </div>
  )
}

export default App
