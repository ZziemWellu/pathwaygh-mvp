import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function ContextChat() {
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem('pathwaygh_user_id');
    const savedProfile = localStorage.getItem('pathwaygh_profile');

    if (savedUserId && savedProfile) {
      setUserId(savedUserId);
      try {
        setUserProfile(JSON.parse(savedProfile));
        setHasProfile(true);
        setMessages([{
          role: 'assistant',
          content: '👋 Welcome back! I have your profile ready. Ask me anything about careers, universities, or education in Ghana.'
        }]);
      } catch (e) {
        console.error('Error parsing profile:', e);
        setMessages([{
          role: 'assistant',
          content: '⚠️ Your profile data is corrupted. Please recreate your profile by clicking the **Profile** tab above.'
        }]);
      }
    } else {
      setMessages([{
        role: 'assistant',
        content: '👋 Welcome to Context AI! This is a personalized assistant that remembers your profile.\n\nTo get started, please create your profile first by clicking the **Profile** tab above.'
      }]);
    }
  }, []);

  // Function to navigate to Profile tab
  const goToProfile = () => {
    // Find and click the Profile tab
    const tabs = document.querySelectorAll('button');
    for (const tab of tabs) {
      if (tab.textContent && tab.textContent.includes('👤 Profile')) {
        tab.click();
        return;
      }
    }
    // Fallback: look for any tab with "Profile" in text
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.textContent && btn.textContent.toLowerCase().includes('profile')) {
        btn.click();
        return;
      }
    }
    alert('Please click the "Profile" tab in the navigation bar above.');
  };

  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    if (!hasProfile) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Please create your profile first by clicking the **Profile** tab above. Then come back here for personalized guidance.'
      }]);
      setInput('');
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await API.post('/api/context/query', {
        user_id: userId,
        query: input
      });

      const contextData = response.data.context || {};
      setContext(contextData);

      let responseText = response.data.response || 'I processed your query.';
      
      if (contextData.guidance && contextData.guidance.focus) {
        responseText += `\n\n🎯 Focus: ${contextData.guidance.focus}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        context: contextData,
        resources: response.data.guidance?.resources || []
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had an error. Please make sure the backend is running.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getContextSummary = () => {
    if (!userProfile) return 'No profile';
    const profile = userProfile;
    const parts = [];
    if (profile.role) parts.push(`👤 ${profile.role.replace(/_/g, ' ')}`);
    if (profile.education_level) parts.push(`📚 ${profile.education_level.toUpperCase()}`);
    if (profile.geographic?.region) parts.push(`📍 ${profile.geographic.region}`);
    if (profile.academic?.aggregate) parts.push(`📊 Aggregate: ${profile.academic.aggregate}`);
    return parts.join(' | ') || 'Profile ready';
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>💬 Context-Aware Assistant</h2>
        <div style={{ 
          fontSize: '13px', 
          color: hasProfile ? '#2e7d32' : '#c62828', 
          background: hasProfile ? '#e8f5e9' : '#ffebee', 
          padding: '8px 16px', 
          borderRadius: '20px'
        }}>
          {hasProfile ? getContextSummary() : '⚠️ No profile'}
        </div>
      </div>

      {!hasProfile && (
        <div style={{
          background: '#fff3e0',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center',
          border: '1px solid #ffe0b2'
        }}>
          <p style={{ margin: 0, fontSize: '16px' }}>
            👤 To use Context AI, please create your profile first by clicking the 
            <strong style={{ color: '#1a5f2b' }}> Profile</strong> tab above.
          </p>
          <button
            onClick={goToProfile}
            style={{
              marginTop: '12px',
              padding: '10px 24px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔗 Go to Profile Setup
          </button>
        </div>
      )}

      <div style={{
        background: '#f9f9f9',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '400px',
        maxHeight: '500px',
        overflowY: 'auto',
        marginBottom: '15px'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '15px',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '80%',
                background: msg.role === 'user' ? '#1a5f2b' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
              {msg.resources && msg.resources.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>📚 Resources:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {msg.resources.map((res, i) => (
                      <span key={i} style={{
                        padding: '4px 12px',
                        background: '#e3f2fd',
                        borderRadius: '16px',
                        fontSize: '11px'
                      }}>
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-block', padding: '12px 16px', borderRadius: '12px', background: 'white', border: '1px solid #e0e0e0' }}>
              <span style={{ color: '#888' }}>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {context && hasProfile && (
        <div style={{
          background: '#e8f5e9',
          padding: '10px 15px',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '13px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {context.academic_context && context.academic_context.aggregate && (
            <span>📊 Aggregate: {context.academic_context.aggregate}</span>
          )}
          {context.career_context && context.career_context.career_goal && (
            <span>🎯 Goal: {context.career_context.career_goal}</span>
          )}
          {context.regional_context && (
            <span>📍 Region: {userProfile?.geographic?.region}</span>
          )}
          {context.financial_context && context.financial_context.needs_scholarship && (
            <span>💰 Scholarship needed</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={hasProfile ? "Ask about careers, universities, or education..." : "Please create your profile first..."}
          disabled={!hasProfile}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            resize: 'vertical',
            minHeight: '60px',
            fontFamily: 'inherit',
            fontSize: '14px',
            opacity: hasProfile ? 1 : 0.6
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.6 : 1,
            alignSelf: 'flex-end',
            height: '60px'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ContextChat;
