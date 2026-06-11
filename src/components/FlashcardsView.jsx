import { useState, useEffect } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Card({ card, cur, tot, onP, onN }) {
  const [flip, setFlip] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }} className="anim-up">
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>
        Карточка {cur + 1} из {tot} · Нажмите, чтобы перевернуть
      </div>
      <div className={`scene ${flip ? 'flipped' : ''}`} onClick={() => setFlip(f => !f)}>
        <div className="inner">
          <div className="face face-front">
            <div className="chip chip-mono" style={{ marginBottom: 16 }}>ТЕРМИН</div>
            <h3 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center' }}>{card.front_text}</h3>
          </div>
          <div className="face face-back">
            <div className="chip chip-orange" style={{ marginBottom: 12 }}>ИИ-ОПРЕДЕЛЕНИЕ</div>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6, color: 'var(--text)' }}>{card.back_text}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-ghost" onClick={() => { onP(); setFlip(false); }} disabled={cur === 0}><ChevronLeft size={16} /> Пред</button>
        <button className="btn btn-ghost" onClick={() => setFlip(f => !f)}><RotateCcw size={16} /> Перевернуть</button>
        <button className="btn btn-ghost" onClick={() => { onN(); setFlip(false); }} disabled={cur === tot - 1}>След <ChevronRight size={16} /></button>
      </div>
      {flip && (
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }} className="anim-pop">
          <button className="btn" style={{ background: 'var(--red-dim)', color: 'var(--red)' }} onClick={() => { onN(); setFlip(false); }}>😰 Ещё сложно</button>
          <button className="btn" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }} onClick={() => { onN(); setFlip(false); }}>👍 Нормально</button>
          <button className="btn" style={{ background: 'var(--green-dim)', color: 'var(--green)' }} onClick={() => { onN(); setFlip(false); }}>🚀 Легко</button>
        </div>
      )}
    </div>
  );
}

export default function FlashcardsView() {
  const [decks, setDecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [sub, setSub] = useState(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('flashcard_decks').select('*').then(({ data }) => {
      setDecks(data || []);
      setLoading(false);
    });
  }, []);

  const openDeck = async (deckId) => {
    setLoadingCards(true); setSub(deckId); setIdx(0);
    const { data } = await supabase.from('flashcards').select('*').eq('deck_id', deckId);
    setCards(data || []);
    setLoadingCards(false);
  };

  const act = sub ? decks.find(d => d.id === sub) : null;

  if (sub) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { setSub(null); setCards([]); }}><ChevronLeft size={14} /> Все предметы</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
          {act?.icon} {act?.title}
          <span className="chip chip-mono" style={{ marginLeft: 8 }}>{cards.length} карточек</span>
        </div>
      </div>
      {loadingCards ? (
        <div style={{ display: 'flex', gap: 4, padding: 32, justifyContent: 'center' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
      ) : cards.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600 }}>В этой колоде пока нет карточек</div>
        </div>
      ) : (
        <Card card={cards[idx]} cur={idx} tot={cards.length}
          onP={() => setIdx(i => i - 1)} onN={() => setIdx(i => Math.min(i + 1, cards.length - 1))} />
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div>
        <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Карточки</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Выберите предмет. Система использует интервальные повторения для максимизации памяти.</p>
      </div>
      {loading ? (
        <div style={{ display: 'flex', gap: 4, padding: 32, justifyContent: 'center' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
      ) : decks.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📚</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Колод пока нет</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Попросите преподавателя добавить карточки в базу.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {decks.map(s => (
            <div key={s.id} className="card card-hover" style={{ padding: 20, cursor: 'pointer' }} onClick={() => openDeck(s.id)}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 16 }}>{s.total_cards} карточек</div>
              <div className="bar-track" style={{ marginBottom: 8 }}>
                <div className="bar-fill" style={{ '--w': s.total_cards > 0 ? `${Math.round((s.mastered / s.total_cards) * 100)}%` : '0%', background: s.color || 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: s.color || 'var(--accent)', fontWeight: 600 }}>
                <BookOpen size={12} /> {s.mastered} / {s.total_cards} изучено
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="inset" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem' }}>💡</div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Как работают интервальные повторения</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            После переворота оцените знания: «Ещё сложно» — скоро снова, «Нормально» — через день, «Легко» — через 4 дня.
          </p>
        </div>
      </div>
    </div>
  );
}
