import React from 'react';

function PracticeModule() {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2 style={{ color: '#1a5f2b' }}>✍️ Practice</h2>
      <p style={{ color: '#888' }}>Quizzes, mock exams, and practice exercises</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '30px', maxWidth: '800px', margin: '30px auto' }}>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px' }}>📝</div>
          <h4>Quizzes</h4>
          <p style={{ fontSize: '12px', color: '#888' }}>Test your knowledge</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px' }}>📊</div>
          <h4>Mock Exams</h4>
          <p style={{ fontSize: '12px', color: '#888' }}>Prepare for WASSCE</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px' }}>🃏</div>
          <h4>Flashcards</h4>
          <p style={{ fontSize: '12px', color: '#888' }}>Learn with spaced repetition</p>
        </div>
      </div>
    </div>
  )
}

export default PracticeModule
