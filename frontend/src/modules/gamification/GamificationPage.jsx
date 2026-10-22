import React, { useEffect, useState } from 'react';
import { Flame, Trophy, Users, Star } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';

const GamificationPage = () => {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [optInError, setOptInError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, achievementsRes, leaderboardRes] = await Promise.all([
        api.get('/api/gamification/profile'),
        api.get('/api/gamification/achievements'),
        api.get('/api/gamification/leaderboard'),
      ]);
      setProfile(profileRes.data);
      setAchievements(achievementsRes.data.achievements || []);
      setLeaderboard(leaderboardRes.data);
      setDisplayName(profileRes.data.leaderboard_display_name || '');
    } catch (err) {
      console.error('Gamification page error:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinLeaderboard = async () => {
    setOptInError(null);
    try {
      await api.patch('/api/gamification/leaderboard-opt-in', { opt_in: true, display_name: displayName });
      fetchAll();
    } catch (err) {
      setOptInError(extractErrorMessage(err, 'Could not join the leaderboard.'));
    }
  };

  const leaveLeaderboard = async () => {
    await api.patch('/api/gamification/leaderboard-opt-in', { opt_in: false });
    fetchAll();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading your progress...</div>;
  }
  if (!profile) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>Could not load your progress.</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '20px' }}>🏆 Your Progress</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard icon={Star} label="Total XP" value={profile.xp_points} color="var(--primary)" />
        <StatCard icon={Flame} label="Current streak" value={`${profile.current_streak_days} day${profile.current_streak_days === 1 ? '' : 's'}`} color="var(--warning)" />
        <StatCard icon={Trophy} label="Longest streak" value={`${profile.longest_streak_days} day${profile.longest_streak_days === 1 ? '' : 's'}`} color="var(--accent-strong)" />
        <StatCard icon={Users} label="Achievements" value={`${profile.achievements_earned}/${profile.achievements_total}`} color="var(--violet)" />
      </div>

      <h3 style={{ color: 'var(--primary)', fontSize: '16px', marginBottom: '12px' }}>Achievements</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {achievements.map((a) => (
          <div
            key={a.id}
            style={{
              padding: '16px',
              textAlign: 'center',
              background: a.earned ? 'white' : 'var(--surface-muted)',
              border: a.earned ? '1px solid var(--border)' : '1px dashed var(--border-strong)',
              borderRadius: '12px',
              opacity: a.earned ? 1 : 0.55,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>{a.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{a.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>{a.description}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: 'var(--primary)', fontSize: '16px', marginBottom: '12px' }}>School Leaderboard</h3>
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        {leaderboard?.reason ? (
          <p style={{ color: 'var(--gray-500)', margin: 0 }}>{leaderboard.reason}</p>
        ) : !profile.leaderboard_opt_in ? (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '10px' }}>
              Join with a nickname to see how you compare with other students at your school. Your real name is never shown, and this is nationwide-invisible - only students at your own school can see it.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Choose a nickname"
                maxLength={50}
                style={{ flex: 1, minWidth: '160px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}
              />
              <button onClick={joinLeaderboard} disabled={!displayName.trim()} style={{ padding: '8px 20px', background: displayName.trim() ? 'var(--primary)' : 'var(--border-strong)', color: 'white', border: 'none', borderRadius: '8px', cursor: displayName.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                Join
              </button>
            </div>
            {optInError && <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{optInError}</p>}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Playing as <strong>{profile.leaderboard_display_name}</strong></span>
              <button onClick={leaveLeaderboard} style={{ padding: '4px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Leave</button>
            </div>
            {leaderboard.leaderboard.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', margin: 0 }}>No one else at your school has joined yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {leaderboard.leaderboard.map((row) => (
                  <div
                    key={row.rank}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: row.is_you ? 'var(--primary-bg)' : 'var(--surface-muted)',
                      borderRadius: '8px',
                      fontWeight: row.is_you ? 'bold' : 'normal',
                      fontSize: '13px',
                    }}
                  >
                    <span>#{row.rank} {row.display_name}{row.is_you ? ' (you)' : ''}</span>
                    <span>{row.xp_points} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
    <Icon size={22} color={color} style={{ marginBottom: '6px' }} />
    <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{label}</div>
  </div>
);

export default GamificationPage;
