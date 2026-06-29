import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function ConversationMemory() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Create or retrieve session
    const savedSession = localStorage.getItem('pathwaygh_session');
    if (savedSession) {
      setSessionId(savedSession);
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewSession = async () => {
    try {
      const response = await API.post('/api/conversation/session');
      setSessionId(response.data.session_id);
      localStorage.setItem('pathwaygh_session', response.data.session_id);
      
      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: "👋 Welcome to PathwayGH! I remember our conversations.\n\nTell me about:\n- Your WASSCE aggregate\n- Your favorite subjects\n- What careers interest you\n- Your goals for university"
        }
      ]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await API.post('/api/conversation/chat', {
        session_id: sessionId,
        message: input
      });

      // Update context
      if (response.data.context) {
        setContext(response.data.context);
      }

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.reply
      }]);
    } catch (error) {
      console.error('Chat error:', error);
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

  const clearMemory = () => {
    localStorage.removeItem('pathwaygh_session');
    setMessages([]);
    setContext({});
    createNewSession();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>💬 AI Career Copilot</h2>
        <button
          onClick={clearMemory}
          style={{
            padding: '8px 16px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🗑️ Clear Memory
        </button>
      </div>

      {/* Context Display */}
      {Object.keys(context).length > 0 && (
        <div style={{
          background: '#e8f5e9',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          <strong style={{ color: '#2e7d32' }}>🧠 I remember:</strong>
          <div style={{ marginTop: '5px' }}>
            {context.aggregate && <span style={{ marginRight: '15px' }}>📊 Aggregate: {context.aggregate}</span>}
            {context.career_goal && <span style={{ marginRight: '15px' }}>🎯 Career: {context.career_goal}</span>}
            {context.interests && <span>💡 Interests: {context.interests.join(', ')}</span>}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div style={{
        background: '#f9f9f9',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '400px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '12px',
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about careers, universities, or education in Ghana..."
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

export default ConversationMemory;
