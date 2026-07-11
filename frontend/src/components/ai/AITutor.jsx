import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001'
});

function AITutor({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchSession();
    }
  }, [userId]);

  const fetchSession = async () => {
    try {
      const response = await API.get(`/api/ai/tutor/session/${userId}`);
      setSession(response.data);
      if (response.data.conversation) {
        setMessages(response.data.conversation);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await API.post('/api/ai/tutor/ask', {
        user_id: userId,
        query: input
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }]);

      // Update session
      setSession(response.data.context);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had an error. Please try again.',
        timestamp: new Date().toISOString()
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

  if (!userId) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>🤖 AI Tutor</h3>
        <p>Please login to use the AI Tutor</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>🤖 AI Tutor</h2>
        <span style={{ fontSize: '12px', color: '#888' }}>
          {session?.conversation?.length || 0} interactions
        </span>
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
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            <p style={{ fontSize: '18px' }}>👋 Welcome to AI Tutor!</p>
            <p>Ask me about Biology, Chemistry, Physics, Mathematics, and more.</p>
            <p style={{ fontSize: '13px', marginTop: '10px' }}>
              Example: "Explain photosynthesis" or "Help me with algebra"
            </p>
          </div>
        )}
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
                border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
              }}
            >
              <strong>{msg.role === 'user' ? 'You' : 'AI Tutor'}:</strong>
              <div style={{ marginTop: '5px' }}>{msg.content}</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              </div>
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
      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about any subject..."
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

      {/* Learning Summary */}
      {session && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          background: '#e8f5e9',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <strong>📊 Learning Summary</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '8px' }}>
            <span>📚 Subjects: {Object.keys(session.knowledge?.subjects || {}).join(', ') || 'None yet'}</span>
            <span>💬 Interactions: {session.conversation?.length || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AITutor;
