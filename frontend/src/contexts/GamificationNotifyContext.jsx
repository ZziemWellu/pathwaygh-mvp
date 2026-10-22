import React, { createContext, useCallback, useContext, useState, useRef } from 'react';

const GamificationNotifyContext = createContext();

// A single, app-wide place to surface "you just earned XP / unlocked an
// achievement" moments. Every write endpoint that awards gamification
// (quiz submit, lesson complete, word learned, flashcard reviewed)
// already returns a `gamification` object in its response - this is what
// was missing to actually show it to the student instead of the data
// silently going unused. Call notify(response.data.gamification)
// wherever one of those calls succeeds.
export const GamificationNotifyProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const notify = useCallback((gamification) => {
    if (!gamification) return;
    const newAchievements = gamification.new_achievements || [];
    if (gamification.xp_awarded > 0 || newAchievements.length > 0) {
      setToast({ xp: gamification.xp_awarded, achievements: newAchievements });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setToast(null), newAchievements.length > 0 ? 5000 : 2500);
    }
  }, []);

  return (
    <GamificationNotifyContext.Provider value={{ notify }}>
      {children}
      {toast && <GamificationToast toast={toast} onDismiss={() => setToast(null)} />}
    </GamificationNotifyContext.Provider>
  );
};

const GamificationToast = ({ toast, onDismiss }) => (
  <div
    role="status"
    style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2000,
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      padding: '14px 20px',
      minWidth: '220px',
      maxWidth: '90vw',
      textAlign: 'center',
      cursor: 'pointer',
    }}
    onClick={onDismiss}
  >
    {toast.achievements.map((a) => (
      <div key={a.id} style={{ marginBottom: '6px' }}>
        <span style={{ fontSize: '22px', marginRight: '8px' }}>{a.icon}</span>
        <strong style={{ fontSize: '14px' }}>Achievement unlocked: {a.name}</strong>
        <div style={{ fontSize: '12px', color: 'var(--gray-500, var(--text-muted))' }}>{a.description}</div>
      </div>
    ))}
    {toast.xp > 0 && (
      <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>+{toast.xp} XP</div>
    )}
  </div>
);

export const useGamificationNotify = () => {
  const context = useContext(GamificationNotifyContext);
  if (!context) {
    throw new Error('useGamificationNotify must be used within a GamificationNotifyProvider');
  }
  return context;
};

export default GamificationNotifyContext;
