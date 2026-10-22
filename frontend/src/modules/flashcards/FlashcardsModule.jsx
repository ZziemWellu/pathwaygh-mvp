import React, { useEffect, useState } from 'react';
import { LayersIcon, PartyPopperIcon, Trash2 } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';
import { useGamificationNotify } from '../../contexts/GamificationNotifyContext';

const FlashcardsModule = () => {
  const { notify } = useGamificationNotify();
  const [dueCards, setDueCards] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dueRes, allRes] = await Promise.all([api.get('/api/flashcards/due'), api.get('/api/flashcards')]);
      setDueCards(dueRes.data.cards || []);
      setAllCards(allRes.data.cards || []);
      setReviewIndex(0);
      setShowBack(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load flashcards.'));
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (e) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.post('/api/flashcards', { front, back });
      setFront('');
      setBack('');
      fetchAll();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create the flashcard.'));
    } finally {
      setCreating(false);
    }
  };

  const deleteCard = async (id) => {
    await api.delete(`/api/flashcards/${id}`);
    fetchAll();
  };

  const rate = async (rating) => {
    const card = dueCards[reviewIndex];
    try {
      const response = await api.post(`/api/flashcards/${card.id}/review`, { rating });
      notify(response.data.gamification);
    } catch {
      // A transient failure here just means this card stays due - safe
      // to move on and let the student try it again next session.
    }
    setShowBack(false);
    setReviewIndex((prev) => prev + 1);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading flashcards...</div>;
  }

  const currentCard = dueCards[reviewIndex];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: 'var(--primary)' }}><LayersIcon className="icon-inline" size="1em" aria-hidden="true" /> Flashcards</h2>
        <button onClick={() => setShowManage(!showManage)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: showManage ? 'var(--primary)' : 'white', color: showManage ? 'white' : 'var(--text)', cursor: 'pointer', fontSize: '13px' }}>
          {showManage ? 'Back to review' : `Manage (${allCards.length})`}
        </button>
      </div>

      {showManage ? (
        <div>
          <form onSubmit={createCard} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>New flashcard</h3>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front (question/prompt)" rows={2} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px', fontFamily: 'inherit' }} />
            <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back (answer)" rows={2} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px', fontFamily: 'inherit' }} />
            <button type="submit" disabled={creating || !front.trim() || !back.trim()} style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {creating ? 'Adding...' : 'Add Card'}
            </button>
            {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
          </form>

          {allCards.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No flashcards yet - add your first one above.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allCards.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{c.front}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{c.back}</div>
                  </div>
                  <button onClick={() => deleteCard(c.id)} aria-label={`Delete flashcard: ${c.front}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : dueCards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--gray-500)' }}>No cards due for review right now.</p>
          <button onClick={() => setShowManage(true)} style={{ marginTop: '10px', padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Add a flashcard
          </button>
        </div>
      ) : !currentCard ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <p style={{ fontSize: '18px' }}><PartyPopperIcon className="icon-inline" size="1em" aria-hidden="true" /> All done for now!</p>
          <p style={{ color: 'var(--gray-500)' }}>You've reviewed every card due today.</p>
        </div>
      ) : (
        <div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
            {reviewIndex + 1} of {dueCards.length} due today
          </p>
          <div
            onClick={() => setShowBack(!showBack)}
            style={{
              minHeight: '180px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            {showBack ? currentCard.back : currentCard.front}
          </div>
          {!showBack ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px' }}>Tap the card to reveal the answer</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <RatingButton label="Again" color="var(--danger)" onClick={() => rate('again')} />
              <RatingButton label="Hard" color="var(--warning)" onClick={() => rate('hard')} />
              <RatingButton label="Good" color="var(--primary)" onClick={() => rate('good')} />
              <RatingButton label="Easy" color="var(--success)" onClick={() => rate('easy')} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RatingButton = ({ label, color, onClick }) => (
  <button onClick={onClick} style={{ padding: '10px 0', background: color, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
    {label}
  </button>
);

export default FlashcardsModule;
