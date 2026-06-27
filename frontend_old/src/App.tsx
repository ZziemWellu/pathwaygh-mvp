import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [careers, setCareers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCareers()
  }, [])

  const fetchCareers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/careers')
      setCareers(response.data)
    } catch (error) {
      console.error('Error fetching careers:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchCareers = async () => {
    if (!search.trim()) return fetchCareers()
    setLoading(true)
    try {
      const response = await axios.get(`/api/careers?search=${search}`)
      setCareers(response.data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#1a5f2b' }}>🇬🇭 PathwayGH</h1>
        <p style={{ fontSize: '18px', color: '#555' }}>AI-Powered Career Guidance for Ghanaian Students</p>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Search a career... e.g., Doctor, Engineer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchCareers()}
          style={{ padding: '12px', width: '300px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={searchCareers} style={{ padding: '12px 24px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Search
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {careers.map((career: any) => (
            <div key={career.id} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1a5f2b' }}>{career.name}</h3>
              <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>{career.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#888' }}>
                <span>💰 {career.salary_range}</span>
                <span>🎓 {career.duration_years} years</span>
                <span>📊 Aggregate: {career.typical_aggregate || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: '50px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
        <p>© 2026 PathwayGH | Built for Ghana AI Innovation Challenge</p>
      </footer>
    </div>
  )
}

export default App
