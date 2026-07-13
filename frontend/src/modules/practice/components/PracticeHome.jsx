import React, { useState } from 'react';

const PracticeHome = ({ 
  subjects, 
  weakAreas, 
  statistics,
  quizHistory,
  onStartQuiz, 
  onSelectSubject,
  onSelectTopic,
  setDifficulty,
  setIsTimed,
  setTimeLimit,
  selectedSubject
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [difficulty, setDifficultyState] = useState('medium');
  const [timed, setTimed] = useState(false);
  const [timeLimit, setTimeLimitState] = useState(300);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const topics = currentSubject?.topics || [];

  const handleStartQuiz = () => {
    if (!selectedSubjectId) return;
    onStartQuiz(selectedSubjectId, selectedTopicId, difficulty, timed, timeLimit);
    setDifficulty(difficulty);
    setIsTimed(timed);
    setTimeLimit(timeLimit);
  };

  const handleQuickPractice = () => {
    if (subjects.length === 0) return;
    const firstSubject = subjects[0];
    setSelectedSubjectId(firstSubject.id);
    onSelectSubject(firstSubject);
    // Auto-start quiz with default settings
    setTimeout(() => {
      onStartQuiz(firstSubject.id, null, 'medium', false, 300);
    }, 100);
  };

  const difficultyOptions = [
    { value: 'easy', label: '🟢 Easy', color: '#4caf50' },
    { value: 'medium', label: '🟡 Medium', color: '#ff9800' },
    { value: 'hard', label: '🔴 Hard', color: '#f44336' },
    { value: 'all', label: '📚 All Levels', color: '#9c27b0' },
  ];

  const timeOptions = [
    { value: 60, label: '1 min' },
    { value: 120, label: '2 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
    { value: 0, label: 'No limit' },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: '#1a5f2b', margin: 0 }}>✍️ Practice</h2>
          <p style={{ color: '#666', margin: '4px 0 0' }}>Practice quizzes and track your progress</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {weakAreas && weakAreas.length > 0 && (
            <span style={{ 
              background: '#fff3e0', 
              color: '#e65100', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '13px' 
            }}>
              ⚠️ {weakAreas.length} weak areas
            </span>
          )}
          <span style={{ 
            background: '#e8f5e9', 
            color: '#1a5f2b', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontSize: '13px' 
          }}>
            📚 {subjects.length} subjects
          </span>
        </div>
      </div>

      {/* Subjects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {subjects.map((subject) => (
          <div
            key={subject.id}
            onClick={() => {
              setSelectedSubjectId(subject.id);
              setSelectedTopicId(null);
              onSelectSubject(subject);
            }}
            style={{
              padding: '20px',
              background: selectedSubjectId === subject.id ? '#e8f5e9' : 'white',
              border: selectedSubjectId === subject.id ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '36px' }}>{subject.icon || '📚'}</div>
            <div style={{ fontWeight: 'bold', marginTop: '8px', fontSize: '14px' }}>
              {subject.name}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {subject.topics?.length || 0} topics
            </div>
            {selectedSubjectId === subject.id && (
              <div style={{ fontSize: '11px', color: '#1a5f2b', marginTop: '4px' }}>✓ Selected</div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Subject Details */}
      {currentSubject && (
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#1a5f2b', margin: '0 0 12px 0' }}>
            {currentSubject.icon} {currentSubject.name}
          </h3>
          
          {/* Topics */}
          {topics.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Select Topic (optional):</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedTopicId(null)}
                  style={{
                    padding: '6px 14px',
                    background: !selectedTopicId ? '#1a5f2b' : '#f0f0f0',
                    color: !selectedTopicId ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  All Topics
                </button>
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    style={{
                      padding: '6px 14px',
                      background: selectedTopicId === topic.id ? '#1a5f2b' : '#f0f0f0',
                      color: selectedTopicId === topic.id ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Difficulty:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {difficultyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficultyState(opt.value)}
                    style={{
                      padding: '4px 12px',
                      background: difficulty === opt.value ? opt.color : '#f0f0f0',
                      color: difficulty === opt.value ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Timed:</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setTimed(false)}
                  style={{
                    padding: '4px 12px',
                    background: !timed ? '#1a5f2b' : '#f0f0f0',
                    color: !timed ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Untimed
                </button>
                <button
                  onClick={() => setTimed(true)}
                  style={{
                    padding: '4px 12px',
                    background: timed ? '#1a5f2b' : '#f0f0f0',
                    color: timed ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Timed
                </button>
              </div>
            </div>

            {timed && (
              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Time Limit:</div>
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimitState(Number(e.target.value))}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    background: 'white',
                    fontSize: '12px',
                  }}
                >
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            disabled={!selectedSubjectId}
            style={{
              marginTop: '16px',
              padding: '12px 32px',
              background: selectedSubjectId ? '#1a5f2b' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedSubjectId ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
              width: '100%',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedSubjectId) e.currentTarget.style.background = '#144d21';
            }}
            onMouseLeave={(e) => {
              if (selectedSubjectId) e.currentTarget.style.background = '#1a5f2b';
            }}
          >
            🚀 Start Quiz
          </button>
        </div>
      )}

      {/* Quick Practice */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={handleQuickPractice}
          style={{
            padding: '8px 16px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          ⚡ Quick Practice
        </button>
        {weakAreas && weakAreas.length > 0 && (
          <button
            onClick={() => {
              const weakSubject = subjects.find(s => 
                weakAreas.some(w => w.subjectId === s.id)
              );
              if (weakSubject) {
                setSelectedSubjectId(weakSubject.id);
                onSelectSubject(weakSubject);
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#fff3e0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#e65100',
            }}
          >
            🎯 Focus on Weak Areas
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeHome;
