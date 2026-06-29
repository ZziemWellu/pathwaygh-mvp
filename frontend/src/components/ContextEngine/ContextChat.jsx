import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileSetup from '../Profile/ProfileSetup';

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
      setUserProfile(JSON.parse(savedProfile));
      setHasProfile(true);
      setMessages([{
        role: 'assistant',
        content: `👋 Welcome back! I have your profile ready. Ask me anything about careers, universities, or education.`
      }]);
    }
  }, []);

  const handleProfileComplete = (profile) => {
    setUserProfile(profile);
    setHasProfile(true);
    setMessages([{
      role: 'assistant',
      content: `✅ Profile complete! I now understand your context. Ask me anything about careers, universities, or education.`
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId || !hasProfile) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await API.post('/api/context/query', {
        user_id: userId,
        query: input
      });

      const contextData = response.data.context;
      setContext(contextData);

      // Build response with context info
      let responseText = response.data.response;
      
      // Add context summary if available
      if (contextData.guidance) {
        responseText += `\n\n🎯 Focus: ${contextData.guidance.focus || 'Career guidance'}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        context: contextData,
        resources: response.data.guidance || []
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had an error. Please try again.'
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

  if (!hasProfile) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  // Show context summary
  const getContextSummary = () => {
    if (!userProfile) return '';
    const profile = userProfile;
    const parts = [];
    if (profile.role) parts.push(`👤 ${profile.role}`);
    if (profile.education_level) parts.push(`📚 ${profile.education_level.toUpperCase()}`);
    if (profile.geographic?.region) parts.push(`📍 ${profile.geographic.region}`);
    if (profile.academic?.aggregate) parts.push(`📊 Aggregate: ${profile.academic.aggregate}`);
    return parts.join(' | ');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>💬 Context-Aware Assistant</h2>
        <div style={{ fontSize: '13px', color: '#666', background: '#f5f5f5', padding: '8px 16px', borderRadius: '20px' }}>
          {getContextSummary() || 'Profile setup complete'}
        </div>
      </div>

      {/* Chat Messages */}
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

      {/* Context Display */}
      {context && (
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

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about careers, universities, or education..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            resize: 'vertical',
            minHeight: '60px',
            fontFamily: 'inherit',
            fontSize: '14px'
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
