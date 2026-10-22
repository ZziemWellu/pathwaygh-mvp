import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ReadAloudButton from '../common/ReadAloudButton';
import api from '../../services/api';

const markdownComponents = {
  p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '0 0 8px', paddingLeft: '18px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 8px', paddingLeft: '18px' }}>{children}</ol>,
  h1: ({ children }) => <div style={{ fontWeight: 'bold', fontSize: '15px', margin: '4px 0' }}>{children}</div>,
  h2: ({ children }) => <div style={{ fontWeight: 'bold', fontSize: '14px', margin: '4px 0' }}>{children}</div>,
  h3: ({ children }) => <div style={{ fontWeight: 'bold', fontSize: '14px', margin: '4px 0' }}>{children}</div>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />,
  code: ({ children }) => <code style={{ background: 'var(--surface-sunken)', padding: '1px 4px', borderRadius: '4px', fontSize: '13px' }}>{children}</code>,
};

const AIChat = ({ user }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI tutor. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    api.get('/api/practice/subjects')
      .then(response => {
        const loaded = response.data.subjects || [];
        setSubjects(loaded);
        // Defaults to the student's first subject rather than "General":
        // the tutor's prerequisite-check feature (surfacing this
        // student's actual weak topics, see backend/modules/tutor/
        // router.py) only activates when a subject_id is sent, and most
        // students never touch this dropdown - leaving it on "General"
        // left that feature dormant for almost everyone.
        if (loaded.length > 0) {
          setSelectedSubject((prev) => prev || loaded[0].id);
        }
      })
      .catch(err => console.error('Failed to load subjects:', err));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/tutor/chat', {
        message: input,
        subject_id: selectedSubject || undefined,
        history,
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response || 'I\'m here to help!',
        grounded: response.data.grounded,
        computedMath: response.data.computed_math,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="ai-chat-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI tutor"
        title="AI tutor"
        style={{
          position: 'fixed',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: 'white',
          border: 'none',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 999,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🤖
      </button>
    );
  }

  return (
    <div
      className="ai-chat-panel"
      role="dialog"
      aria-label="AI tutor"
      style={{
        position: 'fixed',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>AI Tutor</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Online • Powered by AI</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Subject picker */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'white',
        }}
      >
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <option value="">General (no personalized help)</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          background: 'var(--surface-muted)',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: msg.role === 'user' ? 'var(--primary)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {msg.role === 'assistant' ? (
                <>
                  <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <ReadAloudButton text={msg.content} />
                    {msg.grounded && (
                      <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 8px', borderRadius: '10px' }}>
                        📚 grounded in curriculum
                      </span>
                    )}
                    {msg.computedMath && (
                      <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 8px', borderRadius: '10px' }}>
                        🧮 verified: {msg.computedMath.expression} = {msg.computedMath.result}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'white',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '4px',
              }}
            >
              <span style={{ animation: 'pulse 1.2s infinite 0s' }}>•</span>
              <span style={{ animation: 'pulse 1.2s infinite 0.2s' }}>•</span>
              <span style={{ animation: 'pulse 1.2s infinite 0.4s' }}>•</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px',
          background: 'white',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '14px',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 16px',
            background: loading || !input.trim() ? 'var(--border-strong)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChat;
