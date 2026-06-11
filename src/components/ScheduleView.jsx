import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const TYPES = {
  'Лекция': 'chip-mono', 'Практика': 'chip-violet', 'Лаба': 'chip-gold',
  'Семинар': 'chip-green', 'Экзамен': 'chip-red', 'Спорт': 'chip-green', 'Факультатив': 'chip-violet',
};

export default function ScheduleView() {
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Пн, 4=Пт
  const clampedIdx = Math.min(todayIdx, 4); // max Пт
  const [dayIdx, setDayIdx] = useState(clampedIdx);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekStats, setWeekStats] = useState({ total: 0, exams: 0 });

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('schedule_lessons').select('*').order('time_start', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const grouped = {};
          data.forEach(l => {
            const d = l.day_of_week; // 1=Пн ... 5=Пт
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(l);
          });
          setSchedule(grouped);
          setWeekStats({
            total: data.length,
            exams: data.filter(l => l.type === 'Экзамен').length,
          });
        }
        setLoading(false);
      });
  }, []);

  const ls = schedule[dayIdx + 1] || []; // dayIdx 0=Пн → day_of_week 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div>
        <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Расписание</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Твоё расписание на неделю из базы данных.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {DAYS.map((d, i) => (
          <button key={d} onClick={() => setDayIdx(i)}
            style={{
              flexShrink: 0, padding: '10px 24px', borderRadius: 12,
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
              background: dayIdx === i ? 'var(--accent)' : 'var(--surface-2)',
              color: dayIdx === i ? '#fff' : 'var(--text-2)',
              border: `1px solid ${i === clampedIdx && dayIdx !== i ? 'rgba(249,115,22,0.4)' : 'transparent'}`,
              boxShadow: dayIdx === i ? '0 4px 16px rgba(249,115,22,0.3)' : 'none'
            }}>
            {d}
            {i === clampedIdx && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: dayIdx === i ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }}>• Сегодня</span>}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 4, padding: 32, justifyContent: 'center' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
        ) : ls.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Сегодня нет занятий!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Используй это время для повторения карточек.</div>
          </div>
        ) : ls.map((l, i) => (
          <div key={i} className="lesson-row">
            <div style={{ width: 4, height: 48, borderRadius: 99, background: l.color, flexShrink: 0 }} />
            <div className="lesson-time">{l.time_start}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{l.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {l.topic && <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{l.topic}</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  <MapPin size={12} /> {l.room}
                </span>
              </div>
            </div>
            <span className={`chip ${TYPES[l.type] || 'chip-mono'}`} style={{ flexShrink: 0 }}>{l.type}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>На этой неделе</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { v: String(weekStats.total), l: 'Всего занятий', c: 'var(--accent)' },
            { v: String(weekStats.exams), l: 'Экзамен / Защита', c: 'var(--red)' },
            { v: `${weekStats.total * 1.5}ч`, l: 'Часов учёбы', c: 'var(--violet)' }
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
