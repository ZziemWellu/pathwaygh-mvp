import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function AICopilot() {
  const [aggregate, setAggregate] = useState('');
  const [interests, setInterests] = useState([]);
  const [strongSubjects, setStrongSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const interestOptions = ['healthcare', 'technology', 'business', 'creative', 'engineering', 'law', 'education'];
  const subjectOptions = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'ICT', 'Accounting', 'Government', 'Literature'];

  const handleInterestToggle = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubjectToggle = (subject) => {
    if (strongSubjects.includes(subject)) {
      setStrongSubjects(strongSubjects.filter(s => s !== subject));
    } else {
      setStrongSubjects([...strongSubjects, subject]);
    }
  };

  const getAdvice = async () => {
    if (!aggregate || interests.length === 0 || strongSubjects.length === 0) {
      alert('Please enter aggregate, interests, and strong subjects!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/copilot/advise', {
        aggregate: parseInt(aggregate),
        interests: interests,
        strong_subjects: strongSubjects
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error getting advice. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) return;
    
    setChatHistory([...chatHistory, { role: 'user', content: chatMessage }]);
    setChatMessage('');
    
    try {
      const response = await API.post('/api/copilot/chat', null, {
        params: { message: chatMessage }
      });
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I had an error processing your request.' }]);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>🤖 AI Career Copilot</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Powered by GPT-4o-mini + RAG Knowledge Base
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Panel - Input */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
          <h3>Your Profile</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label>WASSCE Aggregate (lower is better)</label>
            <input
              type="number"
              min="6"
              max="36"
              value={aggregate}
              onChange={(e) => setAggregate(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Your Interests</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  style={{
                    padding: '8px 16px',
                    background: interests.includes(interest) ? '#1a5f2b' : 'white',
                    color: interests.includes(interest) ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Your Strong Subjects</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {subjectOptions.map(subject => (
                <button
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  style={{
                    padding: '8px 16px',
                    background: strongSubjects.includes(subject) ? '#1a5f2b' : 'white',
                    color: strongSubjects.includes(subject) ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={getAdvice}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Analyzing...' : '🎯 Get AI Career Advice'}
          </button>
        </div>

        {/* Right Panel - Results */}
        <div>
          {result && (
            <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>🎯 Your Top Career Matches</h3>
              {result.recommendations?.map((career, idx) => (
                <div key={idx} style={{ marginBottom: '15px', padding: '10px', background: 'white', borderRadius: '8px' }}>
                  <strong>{idx + 1}. {career.career}</strong>
                  <span style={{ marginLeft: '10px', color: '#1a5f2b' }}>{career.confidence}% match</span>
                  <div style={{ fontSize: '12px', color: '#666' }}>{career.aggregate_match}</div>
                </div>
              ))}
              
              <div style={{ marginTop: '20px', padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
                <h4>🤖 AI Guidance</h4>
                <p style={{ lineHeight: '1.6' }}>{result.guidance?.guidance}</p>
                <small style={{ color: '#888' }}>Source: {result.guidance?.source}</small>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
            <h3>💬 Ask the AI Copilot</h3>
            <div style={{ height: '200px', overflowY: 'auto', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '8px' }}>
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
                </div>
              ))}
              {chatHistory.length === 0 && <div style={{ color: '#888', textAlign: 'center' }}>Ask me anything about careers in Ghana!</div>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                placeholder="e.g., Can I become a doctor with aggregate 14?"
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
              <button onClick={sendChat} style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICopilot;
