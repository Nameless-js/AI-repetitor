import { useState, useEffect } from 'react';
import { Target, BookOpen, Zap, ArrowRight, Star, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard({ user, onTab }) {
  const [quests, setQuests] = useState([]);
  const [nextLesson, setNextLesson] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user?.id) { setLoading(false); return; }

    const today = new Date().getDay() || 7; // 1=Пн ... 7=Вс

    Promise.all([
      supabase.from('daily_quests').select('*').eq('user_id', user.id),
      supabase.from('schedule_lessons').select('*').eq('day_of_week', today).order('time_start', { ascending: true }).limit(1),
      supabase.from('profiles').select('xp, streak').eq('id', user.id).single(),
    ]).then(([q, s, p]) => {
      if (q.data) setQuests(q.data);
      if (s.data?.[0]) setNextLesson(s.data[0]);
      if (p.data) setProfile(p.data);
      setLoading(false);
    });
  }, [user?.id]);

  const quest = quests[0] || null;
  const questProgress = quest ? quest.progress : 0;
  const questTarget = quest ? quest.target : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      {/* ── Banner ── */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '32px', background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="chip chip-gold" style={{ marginBottom: 12 }}><Star size={12} /> Студент</div>
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
            С возвращением, {user?.name?.split(' ')[0]}! 🎓
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 20 }}>
            {quests.length > 0 ? `У тебя ${quests.length} задач на сегодня. Давай продолжим!` : 'Хорошая работа! Новых заданий на сегодня нет.'}
          </p>
          <button className="btn btn-primary" onClick={() => onTab('chat')}>
            Начать занятие <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* ── Quest ── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={16} color="var(--gold)" />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Задание на день</span>
            </div>
            <span className="chip chip-gold">Сегодня</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 4, padding: '16px 0' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
          ) : quest ? (
            <>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{quest.title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 16 }}>{quest.subtitle}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-2)' }}>Прогресс</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{questProgress}/{questTarget}</span>
              </div>
              <div className="bar-track" style={{ marginBottom: 16 }}>
                <div className="bar-fill" style={{ '--w': `${(questProgress / questTarget) * 100}%` }} />
              </div>
              <button className="btn btn-primary btn-block" onClick={() => onTab('flashcards')}>К карточкам</button>
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', padding: '12px 0' }}>🎉 Все задания выполнены!</p>
          )}
        </div>

        {/* ── Next Lesson ── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={16} color="var(--violet)" />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Подготовка к уроку</span>
            </div>
            <span className="chip chip-violet">Сегодня</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 4, padding: '16px 0' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
          ) : nextLesson ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{nextLesson.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--violet)', marginBottom: 6 }}>{nextLesson.topic}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.5 }}>5-минутная подготовка с ИИ перед парой</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 16 }}>
                <Clock size={12} /> Пара в {nextLesson.time_start} • {nextLesson.room}
              </div>
              <button className="btn btn-outline-accent btn-block" onClick={() => onTab('chat')}>
                <Zap size={14} /> Начать 5-мин подготовку
              </button>
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', padding: '12px 0' }}>📅 Занятий на сегодня нет</p>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { l: 'XP заработано', v: profile ? profile.xp.toLocaleString('ru') : '—', i: <TrendingUp size={16}/>, c: 'var(--accent)' },
          { l: 'Серия дней', v: profile ? `${profile.streak}🔥` : '—', i: <Star size={16}/>, c: 'var(--gold)' },
          { l: 'Заданий сегодня', v: String(quests.length), i: <Clock size={16}/>, c: 'var(--violet)' },
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
