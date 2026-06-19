import { useState, useEffect, useRef } from 'react';
import { Target, BookOpen, Zap, ArrowRight, Star, TrendingUp, Clock, Sparkles, RefreshCw, Send, X, Bell, Radio } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tryGenerateContent } from '../lib/gemini';

/* ── Виджет "Задание на день" ── */
function DailyQuestWidget({ onTab }) {
  const [quest, setQuest] = useState(null);          // { title, steps }
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Загружаем из localStorage, чтобы не генерировать каждый раз
  useEffect(() => {
    const stored = localStorage.getItem('eduai_daily_quest');
    if (stored) {
      try {
        const { quest: q, date } = JSON.parse(stored);
        if (date === new Date().toDateString()) {
          setQuest(q);
          return;
        }
      } catch { /* ignore */ }
    }
    generateQuest();
  }, []);

  const generateQuest = async () => {
    setLoading(true);
    setDone(false);
    try {
      const subjects = ['Математика', 'Физика', 'Информатика', 'История', 'Химия', 'Биология', 'Английский язык'];
      const subj = subjects[new Date().getDay() % subjects.length];
      const { text } = await tryGenerateContent(
        `Придумай одно конкретное учебное задание на сегодня по предмету "${subj}" для студента. 
Ответь СТРОГО в формате JSON (без markdown, без пояснений):
{"title":"название задания (1 предложение)","subject":"${subj}","steps":["шаг 1","шаг 2","шаг 3"]}
Задание должно быть выполнимо за 15-20 минут.`
      );
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const q = JSON.parse(match[0]);
        setQuest(q);
        localStorage.setItem('eduai_daily_quest', JSON.stringify({ quest: q, date: new Date().toDateString() }));
      }
    } catch (e) {
      console.error('[Quest]', e);
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={16} color="var(--gold)" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Задание на день</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!loading && (
            <button onClick={generateQuest} title="Обновить задание"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
              <RefreshCw size={14} />
            </button>
          )}
          <span className="chip chip-gold">Сегодня</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            <Sparkles size={14} color="var(--gold)" />
            ИИ генерирует задание...
          </div>
          <div style={{ display: 'flex', gap: 4 }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
        </div>
      ) : done ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🎉</div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>Задание выполнено!</p>
          <button className="btn btn-ghost btn-sm" onClick={generateQuest}>Новое задание</button>
        </div>
      ) : quest ? (
        <>
          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>{quest.subject}</div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>{quest.title}</p>

          {expanded && quest.steps?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }} className="anim-in">
              {quest.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--text-2)', alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  {step}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)}>
              {expanded ? 'Скрыть шаги' : 'Показать шаги'}
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => {
              setDone(true);
              window.dispatchEvent(new CustomEvent('xp_gained', { detail: { amount: 50 } }));
            }}>
              Отметить выполненным ✓
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>Нажми, чтобы ИИ придумал задание на сегодня</p>
          <button className="btn btn-primary btn-sm" onClick={generateQuest}>
            <Sparkles size={14} /> Получить задание
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Виджет "Подготовка к уроку" ── */
function LessonPrepWidget({ onTab }) {
  const [stage, setStage] = useState('idle'); // idle | input | loading | result
  const [subject, setSubject] = useState('');
  const [prep, setPrep] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (stage === 'input') setTimeout(() => inputRef.current?.focus(), 100);
  }, [stage]);

  const startPrep = async () => {
    if (!subject.trim()) return;
    setStage('loading');
    try {
      const { text } = await tryGenerateContent(
        `Студент хочет подготовиться к уроку/паре по теме: "${subject}".
Дай краткую 5-минутную подготовку:
1. Главная суть темы (2-3 предложения)
2. Ключевые понятия (3-4 штуки в виде списка с эмодзи)
3. Один совет на что обратить внимание на уроке

Пиши кратко, по-дружески, на русском языке. Используй эмодзи.`
      );
      setPrep(text);
      setStage('result');
    } catch (e) {
      setPrep('❌ Не удалось получить подготовку: ' + e.message);
      setStage('result');
    }
  };

  const reset = () => { setStage('idle'); setSubject(''); setPrep(''); };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} color="var(--violet)" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Подготовка к уроку</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {stage === 'result' && (
            <button onClick={reset} title="Сбросить"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
          <span className="chip chip-violet">ИИ</span>
        </div>
      </div>

      {stage === 'idle' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>
            Введи тему урока — ИИ даст краткую подготовку за 5 минут
          </p>
          <button className="btn btn-outline-accent btn-sm" onClick={() => setStage('input')}>
            <Zap size={14} /> Подготовиться к уроку
          </button>
        </div>
      )}

      {stage === 'input' && (
        <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            ref={inputRef}
            className="field"
            placeholder="Например: Интегралы, Вторая мировая война..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startPrep()}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Отмена</button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={startPrep} disabled={!subject.trim()}>
              <Send size={13} /> Подготовить
            </button>
          </div>
        </div>
      )}

      {stage === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            <Sparkles size={14} color="var(--violet)" />
            ИИ готовит материал по теме «{subject}»...
          </div>
          <div style={{ display: 'flex', gap: 4 }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
        </div>
      )}

      {stage === 'result' && (
        <div className="anim-in">
          <div style={{ fontSize: '0.7rem', color: 'var(--violet)', fontWeight: 600, marginBottom: 8 }}>📚 {subject}</div>
          <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{prep}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Другая тема</button>
            <button className="btn btn-outline-accent btn-sm" style={{ flex: 1 }} onClick={() => onTab('chat')}>
              <Zap size={13} /> Спросить ИИ подробнее
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Виджет "Материал от репетитора" ── */
function TeacherBroadcastWidget() {
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    // Check if user dismissed today
    const key = 'eduai_broadcast_dismissed';
    const stored = localStorage.getItem(key);

    supabase
      .from('lesson_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const item = data[0];
          // Dismiss only if same broadcast was dismissed
          if (stored === item.id) {
            setDismissed(true);
          }
          setBroadcast(item);
        }
        setLoading(false);
      });
  }, []);

  const dismiss = () => {
    if (broadcast?.id) {
      localStorage.setItem('eduai_broadcast_dismissed', broadcast.id);
    }
    setDismissed(true);
  };

  if (loading || !broadcast || dismissed) return null;

  return (
    <div className="card" style={{ padding: 20, borderColor: 'rgba(124,111,255,0.3)', background: 'rgba(124,111,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={16} color="var(--violet)" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Материал от репетитора</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="chip chip-violet"><Bell size={11} style={{ marginRight: 3 }} />Новое</span>
          <button onClick={dismiss} title="Скрыть"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--violet)', fontWeight: 600, marginBottom: 6 }}>
        📡 {broadcast.subject}
      </div>
      <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
        {broadcast.content}
      </p>
    </div>
  );
}

/* ── Главный Dashboard ── */
export default function Dashboard({ user, onTab }) {
  const [profile, setProfile] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user?.id) { setLoading(false); return; }

    Promise.all([
      supabase.from('daily_quests').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('xp, streak').eq('id', user.id).single(),
    ]).then(([q, p]) => {
      if (q.data) setQuests(q.data);
      if (p.data) setProfile(p.data);
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      {/* ── Banner ── */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '32px', background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="chip chip-gold" style={{ marginBottom: 12 }}><Star size={12} /> Студент</div>
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
            С возвращением, {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}! 🎓
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 20 }}>
            Готов к учёбе? ИИ поможет тебе подготовиться и проверить знания.
          </p>
          <button className="btn btn-primary" onClick={() => onTab('chat')}>
            Начать занятие <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Виджеты ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <TeacherBroadcastWidget />
        <DailyQuestWidget onTab={onTab} />
        <LessonPrepWidget onTab={onTab} />
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { l: 'XP заработано', v: loading ? '—' : profile ? profile.xp.toLocaleString('ru') : '0', i: <TrendingUp size={16}/>, c: 'var(--accent)' },
          { l: 'Серия дней',    v: loading ? '—' : profile ? `${profile.streak}🔥` : '0🔥',            i: <Star size={16}/>,       c: 'var(--gold)' },
          { l: 'Заданий сегодня', v: String(quests.length),                                              i: <Clock size={16}/>,      c: 'var(--violet)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: s.c, marginBottom: 8 }}>{s.i}</div>
            <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 2 }}>{s.v}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
