import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Star } from 'lucide-react';
import api from '../../services/api';

// A compact, always-visible entry point to the full progress page
// (modules/gamification/GamificationPage.jsx) - without this, XP and
// streaks exist only in API responses no student ever sees.
// hideWhenEmpty: render nothing for a brand-new student (0 XP) instead of
// leading with zeros.
const GamificationSummary = ({ hideWhenEmpty = false }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/api/gamification/profile').then((res) => setProfile(res.data)).catch(() => {});
  }, []);

  if (!profile) return null;
  if (hideWhenEmpty && !profile.xp_points) return null;

  return (
    <button
      onClick={() => navigate('/progress')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '16px',
        padding: '10px 18px',
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '999px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '13px',
        marginTop: '12px',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <Star size={14} /> {profile.xp_points} XP
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <Flame size={14} /> {profile.current_streak_days} day streak
      </span>
    </button>
  );
};

export default GamificationSummary;
