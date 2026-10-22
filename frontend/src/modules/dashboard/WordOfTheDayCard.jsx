import React, { useEffect, useState } from 'react';
import { BookMarked } from 'lucide-react';
import api from '../../services/api';
import { useGamificationNotify } from '../../contexts/GamificationNotifyContext';

const WordOfTheDayCard = () => {
  const { notify } = useGamificationNotify();
  const [data, setData] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    api.get('/api/vocabulary/word-of-the-day').then((res) => setData(res.data)).catch(() => {});
  }, []);

  const markLearned = async () => {
    setMarking(true);
    try {
      const response = await api.post(`/api/vocabulary/${data.word.id}/learned`);
      setData((prev) => ({ ...prev, learned: true }));
      notify(response.data.gamification);
    } catch {
      // A duplicate/failed mark-as-learned is a safe no-op here.
    } finally {
      setMarking(false);
    }
  };

  if (!data) return null;
  const { word, learned } = data;

  return (
    <div className="dash-card" style={{ marginTop: '20px' }}>
      <h2 className="dash-section-title" style={{ marginBottom: '10px' }}>
        <BookMarked size={17} /> Word of the Day
      </h2>
      <p style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>{word.word}</p>
      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--gray-500)' }}>{word.phonetic} · {word.part_of_speech}</p>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{word.definition}</p>
      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--gray-600)', fontStyle: 'italic' }}>"{word.context_sentence}"</p>
      <button
        onClick={markLearned}
        disabled={learned || marking}
        style={{
          padding: '8px 18px',
          background: learned ? 'var(--primary-bg)' : 'var(--primary)',
          color: learned ? 'var(--primary)' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: learned ? 'default' : 'pointer',
          fontWeight: 'bold',
          fontSize: '13px',
        }}
      >
        {learned ? '✓ Learned' : marking ? 'Marking...' : 'Mark as learned'}
      </button>
    </div>
  );
};

export default WordOfTheDayCard;
