import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function AICopilot() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setChatHistory([...chatHistory, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await API.post('/api/chatbot/chat', {
        message: message,
        session_id: 'web-session'
      });
      const botMessage = { role: 'assistant', content: response.data.reply };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I had an error. Please try again.' }]);
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>🤖 AI Career Copilot</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>Ask me anything about careers, universities, and education in Ghana</p>

      <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', marginBottom: '20px' }}>
          {chatHistory.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
              <p style={{ fontSize: '18px' }}>👋 Welcome to PathwayGH!</p>
              <p>Ask me about:<br />
                📚 University requirements<br />
                🎓 Career pathways<br />
                📊 WASSCE aggregates<br />
                🏫 Best universities in Ghana</p>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
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
                  border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
                }}
              >
                <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
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

        {/* Input Area */}
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
            disabled={loading || !message.trim()}
            style={{
              padding: '12px 24px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !message.trim() ? 0.6 : 1,
              alignSelf: 'flex-end',
              height: '60px'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default AICopilot;
