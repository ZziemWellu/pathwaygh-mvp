import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const LessonPlayer = ({
  lesson,
  moduleData,
  course,
  onClose,
  onComplete,
  onNext,
  onPrevious,
  totalLessons,
  currentIndex,
}) => {
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState('');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const videoRef = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`lesson_${lesson?.id}_progress`);
    if (savedProgress) {
      setProgress(parseInt(savedProgress));
    }
    const savedNotes = localStorage.getItem(`lesson_${lesson?.id}_notes`);
    if (savedNotes) {
      setSavedNotes(savedNotes);
      setNotes(savedNotes);
    }
    const completed = localStorage.getItem(`lesson_${lesson?.id}_complete`);
    if (completed === 'true') {
      setLessonComplete(true);
    }
  }, [lesson?.id]);

  // Save progress to localStorage
  const saveProgress = (value) => {
    setProgress(value);
    localStorage.setItem(`lesson_${lesson?.id}_progress`, value.toString());
  };

  // ============================================================
  // START LESSON
  // ============================================================
  const handleStartLesson = () => {
    setLessonStarted(true);
    setIsPlaying(true);
    console.log('📖 Lesson started:', lesson?.title);
    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      if (prog <= 100) {
        saveProgress(prog);
      } else {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 1000);
    // Store interval for cleanup
    window._progressInterval = interval;
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (window._progressInterval) {
        clearInterval(window._progressInterval);
      }
    };
  }, []);

  // ============================================================
  // TAKE NOTES
  // ============================================================
  const handleSaveNotes = () => {
    if (notes.trim()) {
      setSavedNotes(notes);
      localStorage.setItem(`lesson_${lesson?.id}_notes`, notes);
      console.log('📝 Notes saved for', lesson?.title, ':', notes);
      // Could also save to backend
      alert('✅ Notes saved successfully!');
      setShowNotes(false);
    } else {
      alert('⚠️ Please write some notes before saving.');
    }
  };

  // ============================================================
  // MARK COMPLETE
  // ============================================================
  const handleMarkComplete = () => {
    if (!lessonComplete) {
      setLessonComplete(true);
      localStorage.setItem(`lesson_${lesson?.id}_complete`, 'true');
      console.log('✅ Lesson marked complete:', lesson?.title);
      // Could call API: POST /api/learn/lessons/${lesson.id}/complete
      alert('🎉 Lesson completed! +20 XP');
      if (onComplete) onComplete(lesson);
    } else {
      setLessonComplete(false);
      localStorage.removeItem(`lesson_${lesson?.id}_complete`);
      console.log('↩️ Lesson unmarked:', lesson?.title);
    }
  };

  // ============================================================
  // AI TUTOR
  // ============================================================
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      // Simulate AI response - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const responses = [
        "Great question! Let me explain...",
        "Here's a simple way to understand this...",
        "This is a key concept. Think of it like...",
        "Let me break this down step by step...",
        "I can help with that. The main idea is..."
      ];
      setAiResponse(responses[Math.floor(Math.random() * responses.length)] + `\n\n${aiQuestion} is an important topic in ${course?.subject || 'this subject'}. I'd recommend reviewing the key concepts and practicing with examples.`);
    } catch (err) {
      setAiResponse('Sorry, I had trouble processing your question. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ============================================================
  // QUIZ
  // ============================================================
  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    // Check answers
    const questions = lesson?.quiz_questions || [
      { id: 'q1', question: 'Sample question?', options: ['A', 'B', 'C', 'D'], correct: 0 }
    ];
    let correct = 0;
    questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    alert(`📊 Quiz Results\n\nScore: ${score}%\nCorrect: ${correct}/${questions.length}`);
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!lesson) return null;

  const isVideo = lesson.lesson_type === 'video' || lesson.lesson_type === 'Video';
  const isQuiz = lesson.lesson_type === 'quiz' || lesson.lesson_type === 'Quiz';
  const isInteractive = lesson.lesson_type === 'interactive' || lesson.lesson_type === 'Interactive';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
        <div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              color: '#1a5f2b',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Back to Course
          </button>
          <h2 style={{ margin: '8px 0 4px 0', color: '#1a5f2b' }}>{lesson.title}</h2>
          <p style={{ color: '#888', margin: 0 }}>
            {course?.title} • {moduleData?.title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 12px', background: '#e8f5e9', borderRadius: '12px', fontSize: '12px', color: '#1a5f2b' }}>
            {lesson.lesson_type || 'Lesson'}
          </span>
          {lesson.duration_minutes && (
            <span style={{ padding: '4px 12px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: '#666' }}>
              ⏱️ {lesson.duration_minutes} min
            </span>
          )}
          {lessonComplete && (
            <span style={{ padding: '4px 12px', background: '#c8e6c9', borderRadius: '12px', fontSize: '12px', color: '#2e7d32' }}>
              ✅ Complete
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginBottom: '4px' }}>
          <span>Lesson {currentIndex + 1} of {totalLessons}</span>
          <span>{progress}% complete</span>
        </div>
        <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1a5f2b, #4caf50)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Lesson Content */}
        <div>
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '24px',
            minHeight: '300px',
          }}>
            {/* Video Player */}
            {isVideo && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  color: 'white',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {lessonStarted ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>▶️</div>
                      <p>Video Player</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>Video content would play here</p>
                      <div style={{ marginTop: '16px', width: '80%', height: '4px', background: '#333', borderRadius: '2px' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#1a5f2b', borderRadius: '2px' }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                      <p>Ready to watch</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>Click "Start Lesson" to begin</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Text Content */}
            {!isVideo && !isQuiz && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#333', margin: '0 0 12px 0' }}>📖 Lesson Content</h3>
                <p style={{ color: '#555', lineHeight: '1.8', fontSize: '15px' }}>
                  {lesson.content || lesson.description || 'No content available for this lesson.'}
                </p>
              </div>
            )}

            {/* Quiz */}
            {isQuiz && showQuiz && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#333', margin: '0 0 16px 0' }}>📝 Quiz</h3>
                {quizSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '48px' }}>📊</p>
                    <p>Quiz submitted! Check your results.</p>
                  </div>
                ) : (
                  (lesson.quiz_questions || [
                    { id: 'q1', question: 'Sample question: What is the main concept?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 }
                  ]).map((q, i) => (
                    <div key={i} style={{ marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>{i + 1}. {q.question}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => handleQuizAnswer(i, oi)}
                            style={{
                              padding: '8px 12px',
                              background: quizAnswers[i] === oi ? '#1a5f2b' : '#f0f0f0',
                              color: quizAnswers[i] === oi ? 'white' : '#333',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {!quizSubmitted && (
                  <button
                    onClick={handleSubmitQuiz}
                    style={{
                      padding: '10px 24px',
                      background: '#1a5f2b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            )}

            {/* Learning Objectives */}
            {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#333', margin: '0 0 8px 0' }}>🎯 Learning Objectives</h4>
                <ul style={{ color: '#555', paddingLeft: '20px' }}>
                  {lesson.learning_objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons - WORKING */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
              <button
                onClick={handleStartLesson}
                style={{
                  padding: '10px 24px',
                  background: lessonStarted ? '#4caf50' : '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!lessonStarted) e.currentTarget.style.background = '#144d21';
                }}
                onMouseLeave={(e) => {
                  if (!lessonStarted) e.currentTarget.style.background = '#1a5f2b';
                }}
              >
                {lessonStarted ? '✅ In Progress' : '▶️ Start Lesson'}
              </button>

              <button
                onClick={() => setShowNotes(!showNotes)}
                style={{
                  padding: '10px 24px',
                  background: showNotes ? '#e8f5e9' : 'white',
                  color: '#333',
                  border: showNotes ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📝 {showNotes ? 'Hide Notes' : 'Take Notes'}
              </button>

              <button
                onClick={handleMarkComplete}
                style={{
                  padding: '10px 24px',
                  background: lessonComplete ? '#c8e6c9' : '#fff3e0',
                  color: lessonComplete ? '#2e7d32' : '#e65100',
                  border: lessonComplete ? '2px solid #4caf50' : 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {lessonComplete ? '✅ Completed' : '✅ Mark Complete'}
              </button>

              <button
                onClick={() => setShowQuiz(!showQuiz)}
                style={{
                  padding: '10px 24px',
                  background: showQuiz ? '#e3f2fd' : 'white',
                  color: '#1565c0',
                  border: showQuiz ? '2px solid #1565c0' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📝 {showQuiz ? 'Hide Quiz' : 'Take Quiz'}
              </button>

              <button
                onClick={() => setShowResources(!showResources)}
                style={{
                  padding: '10px 24px',
                  background: showResources ? '#fce4ec' : 'white',
                  color: '#c62828',
                  border: showResources ? '2px solid #c62828' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📚 Resources
              </button>
            </div>

            {/* Notes Section */}
            {showNotes && (
              <div style={{ marginTop: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>📝 Your Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your notes here..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={handleSaveNotes}
                    style={{
                      padding: '8px 16px',
                      background: '#1a5f2b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    💾 Save Notes
                  </button>
                  {savedNotes && (
                    <span style={{ fontSize: '12px', color: '#888', alignSelf: 'center' }}>
                      💡 Notes saved
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Resources Section */}
            {showResources && (
              <div style={{ marginTop: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>📚 Resources</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { icon: '📄', label: 'Lesson Summary', available: true },
                    { icon: '📝', label: 'Vocabulary List', available: true },
                    { icon: '📥', label: 'Download Materials', available: false },
                    { icon: '❓', label: 'Practice Questions', available: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '10px',
                        background: item.available ? '#f8f9fa' : '#f0f0f0',
                        borderRadius: '6px',
                        textAlign: 'center',
                        cursor: item.available ? 'pointer' : 'not-allowed',
                        opacity: item.available ? 1 : 0.5,
                      }}
                    >
                      <div style={{ fontSize: '20px' }}>{item.icon}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                      {!item.available && <div style={{ fontSize: '10px', color: '#ccc' }}>Coming soon</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              {lessonStarted && !lessonComplete && '📖 Lesson in progress...'}
              {lessonComplete && '🎉 Lesson completed successfully!'}
              {!lessonStarted && !lessonComplete && '💡 Click "Start Lesson" to begin'}
            </div>
          </div>
        </div>

        {/* Right Column - AI Tutor & Info */}
        <div>
          {/* AI Tutor */}
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h4 style={{ color: '#1a5f2b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 AI Tutor
            </h4>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px 0' }}>
              Need help understanding this lesson?
            </p>

            {aiResponse && (
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                fontSize: '14px',
                color: '#333',
                whiteSpace: 'pre-wrap',
                maxHeight: '150px',
                overflow: 'auto',
              }}>
                {aiResponse}
              </div>
            )}

            {aiLoading && (
              <div style={{ textAlign: 'center', padding: '12px', color: '#888' }}>
                🤔 Thinking...
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask anything..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAskAI();
                }}
              />
              <button
                onClick={handleAskAI}
                disabled={aiLoading || !aiQuestion.trim()}
                style={{
                  padding: '8px 16px',
                  background: aiLoading || !aiQuestion.trim() ? '#ccc' : '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: aiLoading || !aiQuestion.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                Ask
              </button>
            </div>
          </div>

          {/* Lesson Info */}
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{ color: '#333', margin: '0 0 12px 0' }}>📋 Lesson Info</h4>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
              <div><strong>Type:</strong> {lesson.lesson_type || 'Standard'}</div>
              <div><strong>Duration:</strong> {lesson.duration_minutes || 'N/A'} min</div>
              <div><strong>Status:</strong> {lessonComplete ? '✅ Complete' : lessonStarted ? '🟢 In Progress' : '⏳ Not Started'}</div>
              <div><strong>Progress:</strong> {progress}%</div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
          }}>
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: currentIndex === 0 ? '#f0f0f0' : '#1a5f2b',
                color: currentIndex === 0 ? '#888' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              ← Previous
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === totalLessons - 1}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: currentIndex === totalLessons - 1 ? '#f0f0f0' : '#1a5f2b',
                color: currentIndex === totalLessons - 1 ? '#888' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentIndex === totalLessons - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
