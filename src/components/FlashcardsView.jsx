import { useState, useEffect, useRef } from 'react';
import {
  RotateCcw, ChevronLeft, ChevronRight, BookOpen,
  Sparkles, Upload, Type, X, CheckCircle, Loader2,
  Brain, Zap, Target, TrendingUp, RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tryGenerateContent } from '../lib/gemini';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function readFileText(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = rej;
    reader.readAsText(file, 'utf-8');
  });
}

async function generateCardsFromAI(content, isFile = false) {
  const context = isFile
    ? `Следующий текст — загруженная лекция или учебный материал:\n\n${content}`
    : `Тема для изучения: "${content}"`;

  const prompt =
    `${context}\n\n` +
    `Сгенерируй 8 учебных карточек для запоминания (флэш-карты).\n` +
    `Ответь СТРОГО в формате JSON-массива без markdown, без \`\`\`, без пояснений. Только чистый JSON:\n` +
    `[{"front":"термин или вопрос (кратко, до 10 слов)","back":"определение или ответ (2-4 предложения, понятно)"}]`;

  const { text } = await tryGenerateContent(prompt);
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('ИИ вернул неверный формат. Попробуйте ещё раз.');
  const parsed = JSON.parse(match[0]);
  return parsed.map((c, i) => ({ id: `gen_${Date.now()}_${i}`, front_text: c.front, back_text: c.back }));
}

// ─────────────────────────────────────────────────────────────
// Card component (3-D flip with spaced repetition buttons)
// ─────────────────────────────────────────────────────────────

function FlipCard({ card, cur, tot, onPrev, onNext, onRate, deckColor }) {
  const [flip, setFlip] = useState(false);

  // reset flip when card changes
  useEffect(() => { setFlip(false); }, [card.id]);

  const accent = deckColor || 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }} className="anim-up">
      {/* Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 600 }}>
        <span>Карточка {cur + 1} из {tot}</span>
        <span style={{ color: 'var(--text-3)' }}>·</span>
        <span style={{ color: 'var(--text-3)' }}>Нажмите, чтобы перевернуть</span>
      </div>

      {/* Progress track */}
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="bar-track">
          <div className="bar-fill" style={{ '--w': `${Math.round(((cur + 1) / tot) * 100)}%`, background: accent }} />
        </div>
      </div>

      {/* 3-D card */}
      <div className={`scene ${flip ? 'flipped' : ''}`} onClick={() => setFlip(f => !f)}
        style={{ boxShadow: flip ? `0 0 40px ${accent}22` : 'none', borderRadius: 'var(--radius-lg)', transition: 'box-shadow .4s' }}>
        <div className="inner">
          <div className="face face-front">
            <div className="chip chip-mono" style={{ marginBottom: 20 }}>ТЕРМИН</div>
            <h3 className="font-display" style={{ fontSize: '1.45rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
              {card.front_text}
            </h3>
          </div>
          <div className="face face-back" style={{ borderColor: `${accent}40` }}>
            <div className="chip chip-orange" style={{ marginBottom: 16 }}>ИИ-ОПРЕДЕЛЕНИЕ</div>
            <p style={{ fontSize: '0.875rem', textAlign: 'center', lineHeight: 1.7, color: 'var(--text)' }}>
              {card.back_text}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { onPrev(); setFlip(false); }} disabled={cur === 0}>
          <ChevronLeft size={14} /> Пред
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setFlip(f => !f)}>
          <RotateCcw size={14} /> Перевернуть
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { onNext(); setFlip(false); }} disabled={cur === tot - 1}>
          След <ChevronRight size={14} />
        </button>
      </div>

      {/* Rating buttons — appear after flip */}
      {flip && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }} className="anim-pop">
          <button className="btn btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)' }}
            onClick={() => { onRate('hard'); setFlip(false); }}>
            😰 Ещё сложно
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(234,179,8,0.25)' }}
            onClick={() => { onRate('ok'); setFlip(false); }}>
            👍 Нормально
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.25)' }}
            onClick={() => { onRate('easy'); setFlip(false); }}>
            🚀 Легко!
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Session summary screen
// ─────────────────────────────────────────────────────────────

function SessionSummary({ ratings, total, deckTitle, onRestart, onBack }) {
  const easy = Object.values(ratings).filter(r => r === 'easy').length;
  const ok   = Object.values(ratings).filter(r => r === 'ok').length;
  const hard = Object.values(ratings).filter(r => r === 'hard').length;
  const scored = easy + ok + hard;
  const pct = total > 0 ? Math.round((easy / total) * 100) : 0;

  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '📈' : '💪';
  const msg   = pct >= 80 ? 'Отличный результат!' : pct >= 50 ? 'Хороший прогресс!' : 'Продолжай практиковаться!';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '12px 0' }} className="anim-pop">
      <div style={{ fontSize: '4rem' }}>{emoji}</div>
      <div style={{ textAlign: 'center' }}>
        <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>{msg}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Сессия по колоде «{deckTitle}» завершена</div>
      </div>

      {/* Score ring */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="55" cy="55" r="46" fill="none" stroke="var(--surface-3)" strokeWidth="10" />
          <circle cx="55" cy="55" r="46" fill="none" stroke="var(--green)" strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{pct}%</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-2)' }}>знаю</span>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'Легко', count: easy, color: 'var(--green)', dim: 'var(--green-dim)', icon: '🚀' },
          { label: 'Нормально', count: ok,   color: 'var(--gold)',  dim: 'var(--gold-dim)',  icon: '👍' },
          { label: 'Сложно',   count: hard, color: 'var(--red)',   dim: 'var(--red-dim)',   icon: '😰' },
        ].map(({ label, count, color, dim, icon }) => (
          <div key={label} style={{ background: dim, border: `1px solid ${color}30`, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {scored < total && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', background: 'var(--surface-2)', padding: '8px 16px', borderRadius: 8 }}>
          {total - scored} карточек не оценено
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onRestart}><RefreshCw size={14} /> Повторить снова</button>
        <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={14} /> Все колоды</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI Generator panel
// ─────────────────────────────────────────────────────────────

function AIGenerator({ onGenerated, onClose }) {
  const [mode, setMode]         = useState('topic'); // 'topic' | 'file'
  const [topic, setTopic]       = useState('');
  const [file, setFile]         = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState('');
  const fileRef                 = useRef();

  const handleGenerate = async () => {
    setError('');
    if (mode === 'topic' && !topic.trim()) { setError('Введите тему'); return; }
    if (mode === 'file'  && !file)         { setError('Выберите файл'); return; }

    setGenerating(true);
    try {
      let content = topic.trim();
      let label   = topic.trim();
      if (mode === 'file') {
        content = await readFileText(file);
        label   = file.name.replace(/\.[^.]+$/, '');
        if (content.length > 12000) content = content.slice(0, 12000) + '\n...[обрезано]';
      }
      const cards = await generateCardsFromAI(content, mode === 'file');
      onGenerated({ label, cards });
    } catch (e) {
      setError(e.message || 'Ошибка генерации');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card anim-pop" style={{ padding: 24, border: '1px solid rgba(124,111,255,0.3)', boxShadow: '0 4px 32px rgba(124,111,255,0.08)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="var(--violet)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Сгенерировать карточки с ИИ</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>8 карточек автоматически</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px 8px' }}><X size={14} /></button>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { key: 'topic', icon: <Type size={13} />, label: 'Введите тему' },
          { key: 'file',  icon: <Upload size={13} />, label: 'Загрузить лекцию' },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => setMode(key)}
            className="btn btn-sm"
            style={{ flex: 1, background: mode === key ? 'var(--violet-dim)' : 'var(--surface-2)', color: mode === key ? '#A99FFF' : 'var(--text-2)', border: mode === key ? '1px solid rgba(124,111,255,0.35)' : '1px solid var(--border)' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Input */}
      {mode === 'topic' ? (
        <input
          className="field"
          placeholder="Например: Фотосинтез, Теорема Пифагора, Великая Отечественная…"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          style={{ marginBottom: 14 }}
        />
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? 'rgba(124,111,255,0.5)' : 'var(--border)'}`,
            borderRadius: 12, padding: '20px 16px', textAlign: 'center',
            cursor: 'pointer', marginBottom: 14, transition: 'border-color .2s',
            background: file ? 'var(--violet-dim)' : 'var(--surface-2)',
          }}>
          <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <>
              <CheckCircle size={22} color="var(--violet)" style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#A99FFF' }}>{file.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
            </>
          ) : (
            <>
              <Upload size={22} color="var(--text-3)" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>Нажмите для выбора файла</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>TXT, MD (PDF/DOCX — текст будет извлечён)</div>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.8rem', color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)' }}>
          ❌ {error}
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={handleGenerate} disabled={generating}
        style={{ background: generating ? 'var(--surface-3)' : 'linear-gradient(135deg, #7C6FFF, #9B8FFF)', boxShadow: generating ? 'none' : '0 4px 20px rgba(124,111,255,0.4)' }}>
        {generating ? (
          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Генерирую карточки…</>
        ) : (
          <><Sparkles size={15} /> Создать 8 карточек</>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Deck card tile
// ─────────────────────────────────────────────────────────────

function DeckTile({ deck, onOpen }) {
  const pct = deck.total_cards > 0 ? Math.round((deck.mastered / deck.total_cards) * 100) : 0;
  const color = deck.color || 'var(--accent)';
  const isGenerated = deck.generated;

  return (
    <div className="card card-hover" style={{ padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={onOpen}>
      {isGenerated && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className="chip chip-violet"><Sparkles size={9} />ИИ</span>
        </div>
      )}
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>{deck.icon}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 2, paddingRight: isGenerated ? 40 : 0 }}>{deck.title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 16 }}>{deck.total_cards} карточек</div>
      <div className="bar-track" style={{ marginBottom: 8 }}>
        <div className="bar-fill" style={{ '--w': `${pct}%`, background: color }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color, fontWeight: 600 }}>
        <BookOpen size={11} /> {deck.mastered} / {deck.total_cards} изучено · {pct}%
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main FlashcardsView
// ─────────────────────────────────────────────────────────────

const DECK_EMOJIS = ['📘','📙','📗','📕','🧠','🔬','⚗️','🌍','📐','🎵'];
const DECK_COLORS = ['var(--violet)', 'var(--accent)', 'var(--green)', '#FF6B9D', '#00D4AA'];

export default function FlashcardsView() {
  const [dbDecks, setDbDecks]         = useState([]);
  const [genDecks, setGenDecks]       = useState([]); // AI-generated local decks
  const [activeDeck, setActiveDeck]   = useState(null);
  const [cards, setCards]             = useState([]);
  const [idx, setIdx]                 = useState(0);
  const [ratings, setRatings]         = useState({}); // { cardId: 'easy'|'ok'|'hard' }
  const [done, setDone]               = useState(false);
  const [loading, setLoading]         = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [showGen, setShowGen]         = useState(false);

  // Load DB decks
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('flashcard_decks').select('*').then(({ data }) => {
      setDbDecks(data || []);
      setLoading(false);
    });
  }, []);

  const allDecks = [
    ...dbDecks.map(d => ({ ...d, generated: false })),
    ...genDecks,
  ];

  // Open a DB deck
  const openDbDeck = async (deck) => {
    setLoadingCards(true);
    setActiveDeck(deck);
    setIdx(0); setRatings({}); setDone(false);
    const { data } = await supabase.from('flashcards').select('*').eq('deck_id', deck.id);
    setCards(data || []);
    setLoadingCards(false);
  };

  // Open an AI-generated deck (cards already in memory)
  const openGenDeck = (deck) => {
    setActiveDeck(deck);
    setCards(deck.cards);
    setIdx(0); setRatings({}); setDone(false);
  };

  const handleDeckOpen = (deck) => {
    if (deck.generated) openGenDeck(deck);
    else openDbDeck(deck);
  };

  // Rate current card and advance
  const handleRate = (rating) => {
    const cardId = cards[idx]?.id;
    setRatings(r => ({ ...r, [cardId]: rating }));
    if (idx < cards.length - 1) {
      setIdx(i => i + 1);
    } else {
      setDone(true);
    }
  };

  // AI generation callback
  const handleGenerated = ({ label, cards: newCards }) => {
    const colorIdx = genDecks.length % DECK_COLORS.length;
    const emojiIdx = genDecks.length % DECK_EMOJIS.length;
    const deck = {
      id: `gen_${Date.now()}`,
      title: label,
      icon: DECK_EMOJIS[emojiIdx],
      color: DECK_COLORS[colorIdx],
      total_cards: newCards.length,
      mastered: 0,
      cards: newCards,
      generated: true,
    };
    setGenDecks(g => [...g, deck]);
    setShowGen(false);
    // Auto-open the generated deck
    openGenDeck(deck);
  };

  // Progress stats for header
  const easyCount = Object.values(ratings).filter(r => r === 'easy').length;
  const okCount   = Object.values(ratings).filter(r => r === 'ok').length;
  const hardCount = Object.values(ratings).filter(r => r === 'hard').length;

  // ── View: inside a deck ──
  if (activeDeck) {
    const deckColor = activeDeck.color || 'var(--accent)';

    if (loadingCards) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="anim-up">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setActiveDeck(null); setCards([]); setDone(false); }}>
            <ChevronLeft size={14} /> Все колоды
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{activeDeck.icon}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{activeDeck.title}</span>
            <span className="chip chip-mono">{cards.length} карточек</span>
            {activeDeck.generated && <span className="chip chip-violet"><Sparkles size={9} /> ИИ</span>}
          </div>
        </div>

        {/* Rating mini-stats (shown while studying) */}
        {!done && cards.length > 0 && (Object.keys(ratings).length > 0) && (
          <div className="inset anim-pop" style={{ padding: '10px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { count: easyCount, label: 'Легко',     color: 'var(--green)', icon: '🚀' },
              { count: okCount,   label: 'Нормально', color: 'var(--gold)',  icon: '👍' },
              { count: hardCount, label: 'Сложно',    color: 'var(--red)',   icon: '😰' },
            ].map(({ count, label, color, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                <span>{icon}</span>
                <span style={{ fontWeight: 700, color }}>{count}</span>
                <span style={{ color: 'var(--text-2)' }}>{label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-2)' }}>
              <TrendingUp size={12} />
              {Object.keys(ratings).length} / {cards.length} оценено
            </div>
          </div>
        )}

        {/* Content */}
        {cards.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600 }}>В этой колоде нет карточек</div>
          </div>
        ) : done ? (
          <SessionSummary
            ratings={ratings}
            total={cards.length}
            deckTitle={activeDeck.title}
            onRestart={() => { setIdx(0); setRatings({}); setDone(false); }}
            onBack={() => { setActiveDeck(null); setCards([]); setDone(false); }}
          />
        ) : (
          <FlipCard
            card={cards[idx]}
            cur={idx}
            tot={cards.length}
            onPrev={() => setIdx(i => Math.max(i - 1, 0))}
            onNext={() => setIdx(i => Math.min(i + 1, cards.length - 1))}
            onRate={handleRate}
            deckColor={deckColor}
          />
        )}

        {/* Spaced repetition tip */}
        {!done && (
          <div className="inset" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.2rem' }}>💡</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 3 }}>Как работают интервальные повторения</div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                «Ещё сложно» — карточка вернётся скоро.&nbsp;
                «Нормально» — повторение через день.&nbsp;
                «Легко» — через 4 дня.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── View: deck list ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      {/* Header with CTA */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
            Интервальные повторения · Выберите колоду или создайте с ИИ
          </p>
        </div>
        <button className="btn btn-sm"
          onClick={() => setShowGen(s => !s)}
          style={{ background: showGen ? 'var(--violet-dim)' : 'linear-gradient(135deg, #7C6FFF, #9B8FFF)', color: '#fff', boxShadow: showGen ? 'none' : '0 4px 18px rgba(124,111,255,0.4)', border: showGen ? '1px solid rgba(124,111,255,0.4)' : 'none' }}>
          {showGen ? <><X size={13} /> Закрыть</> : <><Sparkles size={13} /> Создать с ИИ</>}
        </button>
      </div>

      {/* AI Generator panel */}
      {showGen && (
        <AIGenerator onGenerated={handleGenerated} onClose={() => setShowGen(false)} />
      )}

      {/* Quick stats row */}
      {allDecks.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { icon: <Brain size={14} />, label: 'Всего колод', val: allDecks.length, color: 'var(--violet)' },
            { icon: <Target size={14} />, label: 'Всего карточек', val: allDecks.reduce((s, d) => s + d.total_cards, 0), color: 'var(--accent)' },
            { icon: <Zap size={14} />, label: 'Изучено', val: allDecks.reduce((s, d) => s + (d.mastered || 0), 0), color: 'var(--green)' },
          ].map(({ icon, label, val, color }) => (
            <div key={label} className="inset" style={{ flex: '1 1 120px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color, opacity: 0.85 }}>{icon}</div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decks grid */}
      {loading ? (
        <div style={{ display: 'flex', gap: 4, padding: 48, justifyContent: 'center' }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      ) : allDecks.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 14 }}>📚</div>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '1rem' }}>Ещё нет ни одной колоды</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 20 }}>
            Создайте первую колоду с помощью ИИ — введите тему или загрузите лекцию!
          </div>
          <button className="btn btn-primary" onClick={() => setShowGen(true)}>
            <Sparkles size={14} /> Создать с ИИ
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          {allDecks.map(deck => (
            <DeckTile key={deck.id} deck={deck} onOpen={() => handleDeckOpen(deck)} />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="inset" style={{ padding: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.4rem' }}>💡</div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 5 }}>Как работает система</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Введите тему</strong> или&nbsp;
            <strong style={{ color: 'var(--text)' }}>загрузите лекцию</strong> — ИИ автоматически создаст карточки.&nbsp;
            Переверните карточку, оцените знания, и система запомнит, когда повторить снова. &nbsp;
            Чем чаще отвечаете «Легко» — тем реже карточка будет попадаться.
          </p>
        </div>
      </div>
    </div>
  );
}
