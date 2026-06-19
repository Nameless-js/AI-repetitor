import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Zap, Loader2, CheckCircle2, ChevronRight,
  BookOpen, Code2, HelpCircle, Send, Sparkles,
  LayoutDashboard, GraduationCap, Target, RefreshCw, X, Users, Radio,
} from 'lucide-react';
import { tryGenerateContent, generateQuiz } from '../lib/gemini';
import { supabase } from '../lib/supabase';

// ─── Shared helpers ────────────────────────────────────────────────────────

const SUBJECTS = [
  { value: 'ООП', label: '🧩 ООП' },
  { value: 'Математический анализ', label: '∫ Матан' },
  { value: 'Алгоритмы и структуры данных', label: '⚡ Алгоритмы' },
  { value: 'Линейная алгебра', label: '📐 Линейная алгебра' },
  { value: 'Базы данных', label: '🗄️ Базы данных' },
];

// Inline spinner
function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 20, height: 20,
      border: '2.5px solid rgba(255,255,255,0.2)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// Animated section card
function SectionCard({ children, accentColor = 'var(--accent)', delay = 0 }) {
  return (
    <div
      className="card anim-up"
      style={{
        padding: 28,
        borderRadius: 20,
        animationDelay: `${delay}s`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* subtle top-border accent glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        borderRadius: '20px 20px 0 0',
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        opacity: 0.6,
      }} />
      {children}
    </div>
  );
}

// Section header
function SectionHeader({ icon, title, subtitle, accentColor = 'var(--accent)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: `${accentColor}18`,
        border: `1px solid ${accentColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 3 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Block 1: AI Lesson Plan Generator ────────────────────────────────────

const PLAN_SECTIONS = [
  {
    key: 'theses',
    icon: <BookOpen size={16} />,
    label: 'Тезисы для объяснения',
    sublabel: 'на пальцах',
    color: 'var(--violet)',
  },
  {
    key: 'code',
    icon: <Code2 size={16} />,
    label: 'Пример кода',
    sublabel: 'для демонстрации',
    color: 'var(--accent)',
  },
  {
    key: 'questions',
    icon: <HelpCircle size={16} />,
    label: '3 каверзных вопроса',
    sublabel: 'для проверки',
    color: '#22D3EE',
  },
];

function LessonPlanBlock() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setPlan(null);
    setError('');

    const prompt = `Ты — опытный репетитор-методист. Тема занятия: "${topic.trim()}".

Сгенерируй план урока СТРОГО в JSON-формате:
{
  "theses": ["тезис 1 (2-3 предложения простым языком)", "тезис 2", "тезис 3"],
  "code": "// Пример кода с комментариями на русском\n...",
  "questions": ["Каверзный вопрос 1?", "Каверзный вопрос 2?", "Каверзный вопрос 3?"]
}

Отвечай ТОЛЬКО чистым JSON, без markdown-блоков.`;

    try {
      const { text } = await tryGenerateContent(prompt, { temperature: 0.75 });
      const clean = text.replace(/```(json)?/gi, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('ИИ не вернул корректный JSON');
      const parsed = JSON.parse(match[0]);
      setPlan(parsed);
    } catch (e) {
      setError(`Ошибка: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard accentColor="var(--violet)" delay={0.05}>
      <SectionHeader
        icon={<Bot size={20} />}
        title="🤖 ИИ-Ассистент подготовки к уроку"
        subtitle="Вставьте тему или конспект — получите готовый план занятия"
        accentColor="var(--violet)"
      />

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: plan || error ? 24 : 0 }}>
        <textarea
          className="field"
          rows={3}
          placeholder="Например: «Полиморфизм в Python» или ссылка на статью..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
          style={{ flex: 1, resize: 'vertical', minHeight: 72, fontFamily: 'inherit' }}
        />
        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-end', gap: 8, minWidth: 160, height: 42 }}
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
        >
          {loading ? <Spinner /> : <Sparkles size={15} />}
          {loading ? 'Генерирую...' : 'Сгенерировать план'}
        </button>
      </div>

      {/* Loader animation */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '32px 0', color: 'var(--text-3)',
        }} className="anim-in">
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '3px solid var(--surface-3)',
              borderTopColor: 'var(--violet)',
              animation: 'spin 1s linear infinite',
            }} />
            <Bot size={20} style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'var(--violet)',
            }} />
          </div>
          <span style={{ fontSize: '0.85rem' }}>ИИ составляет план урока…</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: 'var(--red)', fontSize: '0.85rem',
        }} className="anim-in">
          {error}
        </div>
      )}

      {/* Result */}
      {plan && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="anim-in">
          {PLAN_SECTIONS.map(({ key, icon, label, sublabel, color }) => {
            const content = plan[key];
            if (!content) return null;
            return (
              <div key={key} style={{
                borderRadius: 14,
                border: `1px solid ${color}25`,
                background: `${color}08`,
                overflow: 'hidden',
              }}>
                {/* header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderBottom: `1px solid ${color}18`,
                  background: `${color}10`,
                }}>
                  <span style={{ color }}>{icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>— {sublabel}</span>
                </div>
                {/* content */}
                <div style={{ padding: '12px 16px' }}>
                  {key === 'theses' && Array.isArray(content) && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {content.map((t, i) => (
                        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                          <ChevronRight size={14} style={{ color, marginTop: 3, flexShrink: 0 }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  {key === 'code' && (
                    <pre style={{
                      margin: 0, padding: 0,
                      fontFamily: 'monospace', fontSize: '0.82rem',
                      color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                    }}>
                      {content}
                    </pre>
                  )}
                  {key === 'questions' && Array.isArray(content) && (
                    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {content.map((q, i) => (
                        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                          <span style={{
                            minWidth: 20, height: 20, borderRadius: '50%',
                            background: `${color}22`, border: `1px solid ${color}40`,
                            color, fontWeight: 700, fontSize: '0.7rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 2,
                          }}>{i + 1}</span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Block 2: Quick Quiz Launcher ──────────────────────────────────────────

function QuizLauncherBlock() {
  const [subject, setSubject] = useState(SUBJECTS[0].value);
  const [quizTopic, setQuizTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleLaunch = async () => {
    if (!quizTopic.trim()) return;
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      // Generate quiz via AI
      const questions = await generateQuiz(subject, quizTopic.trim(), 5);

      // Save to supabase if available
      if (supabase) {
        await supabase.from('quizzes').insert({
          subject,
          topic: quizTopic.trim(),
          questions: JSON.stringify(questions),
          status: 'published',
          created_at: new Date().toISOString(),
        });
      }

      setSuccess(true);
      setQuizTopic('');

      // hide success banner after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      setError(`Ошибка генерации: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard accentColor="#22D3EE" delay={0.12}>
      <SectionHeader
        icon={<Zap size={20} />}
        title="🚀 Быстрый запуск заданий"
        subtitle="Сгенерируйте тест и мгновенно отправьте его на дашборды студентов"
        accentColor="#22D3EE"
      />

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Subject selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Предмет
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUBJECTS.map(s => (
              <button
                key={s.value}
                onClick={() => setSubject(s.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 9,
                  border: `1px solid ${subject === s.value ? 'rgba(34,211,238,0.5)' : 'var(--border)'}`,
                  background: subject === s.value ? 'rgba(34,211,238,0.1)' : 'var(--surface-2)',
                  color: subject === s.value ? '#22D3EE' : 'var(--text-2)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Тема теста
          </label>
          <input
            className="field"
            type="text"
            placeholder="Например: «Наследование и интерфейсы»"
            value={quizTopic}
            onChange={e => setQuizTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLaunch()}
            style={{
              '--field-focus-ring': 'rgba(34,211,238,0.15)',
            }}
          />
        </div>

        {/* CTA button */}
        <button
          className="btn btn-lg"
          onClick={handleLaunch}
          disabled={loading || !quizTopic.trim()}
          style={{
            background: loading || !quizTopic.trim()
              ? 'var(--surface-3)'
              : 'linear-gradient(135deg, #22D3EE, #06B6D4)',
            color: loading || !quizTopic.trim() ? 'var(--text-3)' : '#fff',
            border: 'none',
            boxShadow: (!loading && quizTopic.trim()) ? '0 4px 20px rgba(34,211,238,0.25)' : 'none',
            transition: 'all .2s',
            alignSelf: 'flex-start',
            cursor: (loading || !quizTopic.trim()) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? <Spinner /> : <Send size={16} />}
          {loading ? 'ИИ генерирует тест…' : 'Сгенерировать и отправить студентам'}
        </button>

        {/* Loading overlay */}
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
            borderRadius: 12,
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.18)',
          }} className="anim-in">
            <div style={{ display: 'flex', gap: 5 }}>
              <span className="dot" style={{ background: '#22D3EE' }} />
              <span className="dot" style={{ background: '#22D3EE', animationDelay: '.16s' }} />
              <span className="dot" style={{ background: '#22D3EE', animationDelay: '.32s' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: '#22D3EE' }}>
              Генерирую 5 вопросов по теме «{quizTopic}»…
            </span>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '16px 20px',
            borderRadius: 14,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)',
          }} className="anim-up">
            <CheckCircle2 size={20} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>
                Квиз успешно добавлен!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 3 }}>
                Тест по теме <strong style={{ color: 'var(--text)' }}>«{subject}»</strong> добавлен в базу данных и отправлен на дашборды студентов.
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--red)', fontSize: '0.85rem',
          }} className="anim-in">
            {error}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Block 3: Teacher Quest Sender (mirrors student DailyQuestWidget) ──────

function TeacherQuestSenderWidget() {
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  const generateQuest = async () => {
    setLoading(true);
    setQuest(null);
    setError('');
    setSent(false);
    try {
      const subjects = ['Математика', 'Физика', 'Информатика', 'История', 'Химия', 'Биология', 'Английский язык'];
      const subj = subjects[new Date().getDay() % subjects.length];
      const { text } = await tryGenerateContent(
        `Придумай одно конкретное учебное задание для студентов на сегодня по предмету "${subj}".
Ответь СТРОГО в формате JSON (без markdown, без пояснений):
{"title":"название задания (1 предложение)","subject":"${subj}","steps":["шаг 1","шаг 2","шаг 3"]}
Задание должно быть выполнимо за 15-20 минут.`
      );
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) setQuest(JSON.parse(match[0]));
      else throw new Error('Не удалось распарсить ответ ИИ');
    } catch (e) {
      setError('Ошибка: ' + e.message);
    }
    setLoading(false);
  };

  const sendToStudents = async () => {
    if (!quest) return;
    setSending(true);
    setError('');
    try {
      if (supabase) {
        await supabase.from('daily_quests').insert({
          title: quest.title,
          subject: quest.subject,
          steps: JSON.stringify(quest.steps),
          broadcast: true,
          created_at: new Date().toISOString(),
        });
      }
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (e) {
      setError('Ошибка отправки: ' + e.message);
    }
    setSending(false);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={16} color="var(--gold)" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Задание студентам на день</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!loading && quest && (
            <button onClick={generateQuest} title="Перегенерировать"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
              <RefreshCw size={14} />
            </button>
          )}
          <span className="chip chip-gold"><Users size={11} style={{ marginRight: 3 }} />Студенты</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            <Sparkles size={14} color="var(--gold)" />
            ИИ генерирует задание для студентов...
          </div>
          <div style={{ display: 'flex', gap: 4 }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
        </div>
      ) : error ? (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.82rem' }}>
          {error}
        </div>
      ) : sent ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }} className="anim-in">
          <CheckCircle2 size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.88rem' }}>Задание отправлено!</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 2 }}>
              Студенты увидят его на своих дашбордах.
            </div>
          </div>
        </div>
      ) : quest ? (
        <div className="anim-in">
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
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1, gap: 6 }}
              onClick={sendToStudents}
              disabled={sending}
            >
              {sending ? <><span className="dot" style={{ background: '#fff' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.16s' }}/></> : <Send size={13} />}
              {sending ? 'Отправляю...' : 'Отправить студентам'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>
            ИИ придумает задание, которое вы сможете отправить всем студентам
          </p>
          <button className="btn btn-primary btn-sm" onClick={generateQuest}>
            <Sparkles size={14} /> Сгенерировать задание
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Block 4: Teacher Lesson Broadcast (mirrors student LessonPrepWidget) ──

function TeacherLessonBroadcastWidget() {
  const [stage, setStage] = useState('idle'); // idle | input | loading | result
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (stage === 'input') setTimeout(() => inputRef.current?.focus(), 100);
  }, [stage]);

  const generateBroadcast = async () => {
    if (!subject.trim()) return;
    setStage('loading');
    setError('');
    setSent(false);
    try {
      const { text } = await tryGenerateContent(
        `Ты — репетитор. Тема предстоящего урока: "${subject}".
Составь краткий материал для подготовки студентов (как напоминание/объявление):
1. Главная суть темы (2-3 предложения)
2. Ключевые понятия (3-4 штуки в виде списка с эмодзи)
3. Что студентам нужно повторить/подготовить заранее

Пиши кратко, по-дружески, на русском языке. Используй эмодзи.`
      );
      setContent(text);
      setStage('result');
    } catch (e) {
      setError('❌ Не удалось сгенерировать: ' + e.message);
      setStage('result');
    }
  };

  const sendToStudents = async () => {
    setSending(true);
    setError('');
    try {
      if (supabase) {
        await supabase.from('lesson_broadcasts').insert({
          subject: subject.trim(),
          content,
          created_at: new Date().toISOString(),
        });
      }
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (e) {
      setError('Ошибка отправки: ' + e.message);
    }
    setSending(false);
  };

  const reset = () => { setStage('idle'); setSubject(''); setContent(''); setSent(false); setError(''); };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={16} color="var(--violet)" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Рассылка материала студентам</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {stage === 'result' && (
            <button onClick={reset} title="Сбросить"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
          <span className="chip chip-violet"><Radio size={11} style={{ marginRight: 3 }} />Broadcast</span>
        </div>
      </div>

      {stage === 'idle' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>
            Введи тему урока — ИИ составит подготовительный материал, который вы разошлёте студентам
          </p>
          <button className="btn btn-outline-accent btn-sm" onClick={() => setStage('input')}>
            <Zap size={14} /> Подготовить рассылку
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
            onKeyDown={e => e.key === 'Enter' && generateBroadcast()}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Отмена</button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={generateBroadcast} disabled={!subject.trim()}>
              <Sparkles size={13} /> Сгенерировать
            </button>
          </div>
        </div>
      )}

      {stage === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            <Sparkles size={14} color="var(--violet)" />
            ИИ составляет материал по теме «{subject}»...
          </div>
          <div style={{ display: 'flex', gap: 4 }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
        </div>
      )}

      {stage === 'result' && (
        <div className="anim-in">
          <div style={{ fontSize: '0.7rem', color: 'var(--violet)', fontWeight: 600, marginBottom: 8 }}>📡 {subject}</div>
          <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{content}</p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.82rem', marginBottom: 12 }}>
              {error}
            </div>
          )}

          {sent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }} className="anim-in">
              <CheckCircle2 size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.88rem' }}>Материал отправлен!</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 2 }}>Студенты получат его на своих дашбордах.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={reset}>Другая тема</button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1, gap: 6 }}
                onClick={sendToStudents}
                disabled={sending}
              >
                {sending ? <><span className="dot" style={{ background: '#fff' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.16s' }}/></> : <Send size={13} />}
                {sending ? 'Отправляю...' : 'Отправить студентам'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Block 5: Teacher Students Management ──────────────────────────────────

function TeacherStudentsWidget() {
  const [email, setEmail] = useState('');
  const [students, setStudents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher_students') || '[]'); } catch { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    if (students.find(s => s.email === trimmed)) {
      setError('Этот студент уже добавлен');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess(false);

    // Simulate network request
    setTimeout(() => {
      const newStudent = { email: trimmed, date: new Date().toLocaleDateString('ru-RU') };
      const updated = [newStudent, ...students];
      setStudents(updated);
      localStorage.setItem('teacher_students', JSON.stringify(updated));
      setEmail('');
      setAdding(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }, 600);
  };

  const handleRemove = (studentEmail) => {
    const updated = students.filter(s => s.email !== studentEmail);
    setStudents(updated);
    localStorage.setItem('teacher_students', JSON.stringify(updated));
  };

  return (
    <SectionCard accentColor="var(--green)" delay={0.05}>
      <SectionHeader
        icon={<Users size={20} />}
        title="👥 Мои ученики"
        subtitle="Добавьте студентов по email, чтобы они получали ваши расписания, задания и тесты"
        accentColor="var(--green)"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Add form */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="field"
            placeholder="email.студента@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1, borderColor: 'var(--border)' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={adding || !email.trim()}
            style={{
              background: (adding || !email.trim()) ? 'var(--surface-3)' : 'var(--green)',
              color: (adding || !email.trim()) ? 'var(--text-3)' : '#fff',
              border: 'none', minWidth: 120,
            }}
          >
            {adding ? <><span className="dot" style={{ background: '#fff' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.16s' }}/></> : 'Добавить'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }} className="anim-in">
            <CheckCircle2 size={16} /> Студент успешно привязан к вам!
          </div>
        )}

        {/* List */}
        {students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-3)', fontSize: '0.82rem' }}>
            Пока нет добавленных учеников
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {students.map(s => (
              <div key={s.email} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
              }} className="anim-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-dim)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    {s.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.email}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>Добавлен {s.date}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(s.email)}
                  title="Удалить студента"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Main "home" view: the full Tutor Control Panel ───────────────────────

export function TeacherDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-in">
      {/* Welcome strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '18px 22px',
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(124,111,255,0.08), rgba(249,115,22,0.06))',
        border: '1px solid var(--border-2)',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'var(--accent)', opacity: 0.9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            Панель Репетитора
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
            Подготовка к занятиям и управление заданиями с помощью ИИ
          </div>
        </div>
      </div>

      <TeacherStudentsWidget />

      {/* Student widgets row — teacher versions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <TeacherQuestSenderWidget />
        <TeacherLessonBroadcastWidget />
      </div>

      {/* Two main AI blocks */}
      <LessonPlanBlock />
      <QuizLauncherBlock />
    </div>
  );
}


// ─── Full page: Подготовка к уроку (Teacher version) ─────────────────────

const SEND_TARGETS = [
  { value: 'broadcast', label: '📡 Всем студентам' },
  { value: 'group_a',   label: '👥 Группа А' },
  { value: 'group_b',   label: '👥 Группа Б' },
];

export function TeacherLessonPrepView() {
  const [stage, setStage] = useState('idle'); // idle | input | loading | result
  const [subject, setSubject] = useState('');
  const [prep, setPrep] = useState('');
  const [sendTarget, setSendTarget] = useState('broadcast');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');
  const inputRef = useRef(null);

  // History of sent broadcasts
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher_prep_history') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (stage === 'input') setTimeout(() => inputRef.current?.focus(), 100);
  }, [stage]);

  const startPrep = async () => {
    if (!subject.trim()) return;
    setStage('loading');
    setSent(false);
    setSendError('');
    try {
      const { text } = await tryGenerateContent(
        `Ты — репетитор. Тема предстоящего урока: "${subject.trim()}".
Подготовь краткий материал для студентов (напоминание перед занятием):
1. 📌 Главная суть темы (2-3 предложения простым языком)
2. 🔑 Ключевые понятия (3-4 штуки в виде списка с эмодзи)
3. 📝 Что студентам нужно повторить/подготовить заранее (1-2 пункта)
4. 💡 Один интересный факт или «зацепка» по теме

Пиши кратко, по-дружески, на русском. Используй эмодзи. Не больше 15 строк.`
      );
      setPrep(text);
      setStage('result');
    } catch (e) {
      setPrep('❌ Не удалось получить подготовку: ' + e.message);
      setStage('result');
    }
  };

  const sendToStudents = async () => {
    setSending(true);
    setSendError('');
    try {
      if (supabase) {
        await supabase.from('lesson_broadcasts').insert({
          subject: subject.trim(),
          content: prep,
          target: sendTarget,
          created_at: new Date().toISOString(),
        });
      }
      // Save to local history
      const entry = { subject: subject.trim(), target: sendTarget, date: new Date().toLocaleString('ru') };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('teacher_prep_history', JSON.stringify(updated));
      setSent(true);
    } catch (e) {
      setSendError('Ошибка отправки: ' + e.message);
    }
    setSending(false);
  };

  const reset = () => {
    setStage('idle');
    setSubject('');
    setPrep('');
    setSent(false);
    setSendError('');
  };

  const TARGET_LABEL = { broadcast: 'всем студентам', group_a: 'Группе А', group_b: 'Группе Б' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-in">

      {/* ── Main prep card ── */}
      <SectionCard accentColor="var(--violet)" delay={0.05}>
        <SectionHeader
          icon={<BookOpen size={20} />}
          title="📚 Подготовка материала к уроку"
          subtitle="ИИ составит краткую шпаргалку для студентов — вы рассылаете одним кликом"
          accentColor="var(--violet)"
        />

        {/* ─ idle ─ */}
        {stage === 'idle' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }} className="anim-in">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✏️</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
              Введите тему урока — ИИ сгенерирует краткий подготовительный материал,
              который вы сможете отправить студентам прямо на их дашборд.
            </p>
            <button className="btn btn-primary" style={{ gap: 8, minWidth: 220 }} onClick={() => setStage('input')}>
              <Zap size={15} /> Начать подготовку
            </button>
          </div>
        )}

        {/* ─ input ─ */}
        {stage === 'input' && (
          <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Тема урока
              </label>
              <input
                ref={inputRef}
                className="field"
                placeholder="Например: Полиморфизм в ООП, Интегралы, Вторая мировая война..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startPrep()}
                style={{ fontSize: '0.95rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ minWidth: 90 }} onClick={reset}>Отмена</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, gap: 8 }}
                onClick={startPrep}
                disabled={!subject.trim()}
              >
                <Sparkles size={15} /> Сгенерировать материал
              </button>
            </div>
          </div>
        )}

        {/* ─ loading ─ */}
        {stage === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }} className="anim-in">
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '3px solid var(--surface-3)',
                borderTopColor: 'var(--violet)',
                animation: 'spin 1s linear infinite',
              }} />
              <BookOpen size={20} style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'var(--violet)',
              }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
              ИИ готовит материал по теме «{subject}»…
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {/* ─ result ─ */}
        {stage === 'result' && (
          <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Generated content */}
            <div style={{
              borderRadius: 14, border: '1px solid rgba(124,111,255,0.2)',
              background: 'rgba(124,111,255,0.04)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderBottom: '1px solid rgba(124,111,255,0.12)',
                background: 'rgba(124,111,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={14} color="var(--violet)" />
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--violet)' }}>
                    📚 {subject}
                  </span>
                </div>
                <button onClick={reset} title="Сбросить"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {prep}
                </p>
              </div>
            </div>

            {/* Send controls */}
            {!sent ? (
              <div style={{
                borderRadius: 14, border: '1px solid var(--border-2)',
                background: 'var(--surface-2)', padding: 18,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="var(--accent)" /> Отправить студентам
                </div>

                {/* Target selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Кому
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SEND_TARGETS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setSendTarget(t.value)}
                        style={{
                          padding: '7px 14px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                          border: `1px solid ${sendTarget === t.value ? 'rgba(249,115,22,0.5)' : 'var(--border)'}`,
                          background: sendTarget === t.value ? 'rgba(249,115,22,0.1)' : 'var(--surface-3)',
                          color: sendTarget === t.value ? 'var(--accent)' : 'var(--text-2)',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {sendError && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.82rem' }}>
                    {sendError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={reset}>Изменить тему</button>
                  <button
                    className="btn btn-lg"
                    style={{
                      flex: 1, gap: 8,
                      background: sending ? 'var(--surface-3)' : 'linear-gradient(135deg, var(--accent), #f97316cc)',
                      color: sending ? 'var(--text-3)' : '#fff',
                      border: 'none',
                      boxShadow: !sending ? '0 4px 20px rgba(249,115,22,0.25)' : 'none',
                      cursor: sending ? 'not-allowed' : 'pointer',
                      transition: 'all .2s',
                    }}
                    onClick={sendToStudents}
                    disabled={sending}
                  >
                    {sending
                      ? <><span className="dot" style={{ background: '#fff' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.16s' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.32s' }}/></>
                      : <Send size={16} />
                    }
                    {sending ? 'Отправляю на дашборды…' : `Отправить ${TARGET_LABEL[sendTarget]}`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '18px 20px', borderRadius: 14,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
              }} className="anim-up">
                <CheckCircle2 size={24} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem', marginBottom: 4 }}>
                    Материал успешно отправлен! 🎉
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                    Тема <strong style={{ color: 'var(--text)' }}>«{subject}»</strong> отправлена{' '}
                    <strong style={{ color: 'var(--text)' }}>{TARGET_LABEL[sendTarget]}</strong>.
                    Студенты увидят карточку на своём дашборде.
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={reset}>
                    Подготовить следующий урок
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── History ── */}
      {history.length > 0 && (
        <SectionCard accentColor="var(--accent)" delay={0.1}>
          <SectionHeader
            icon={<ChevronRight size={20} />}
            title="📋 История рассылок"
            subtitle="Последние материалы, отправленные студентам"
            accentColor="var(--accent)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{h.subject}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                    {TARGET_LABEL[h.target] || h.target} · {h.date}
                  </div>
                </div>
                <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Full page: Тесты (Teacher) ───────────────────────────────────────────

export function TeacherQuizzesView() {
  const [subject, setSubject] = useState(SUBJECTS[0].value);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sentTopic, setSentTopic] = useState('');
  // History saved locally
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher_quiz_history') || '[]'); } catch { return []; }
  });

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSuccess(false);
    setError('');
    setSentTopic(topic.trim());
    try {
      const questions = await generateQuiz(subject, topic.trim(), count);
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('ИИ вернул пустой результат');

      if (supabase) {
        const { error: dbErr } = await supabase.from('quizzes').insert({
          subject,
          topic: topic.trim(),
          questions: JSON.stringify(questions),
          questions_count: questions.length,
          title: `${subject}: ${topic.trim()}`,
          status: 'published',
          difficulty: 'Средне',
          icon: '🧠',
          time_minutes: `${count * 2} мин`,
          created_at: new Date().toISOString(),
        });
        if (dbErr) throw new Error(dbErr.message);
      }

      // Save to local history
      const entry = { subject, topic: topic.trim(), count, date: new Date().toLocaleString('ru') };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('teacher_quiz_history', JSON.stringify(updated));

      setSuccess(true);
      setTopic('');
      setTimeout(() => setSuccess(false), 6000);
    } catch (e) {
      setError('Ошибка: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-in">

      {/* Main card */}
      <SectionCard accentColor="#22D3EE" delay={0.05}>
        <SectionHeader
          icon={<Zap size={20} />}
          title="🧠 Создать тест для студентов"
          subtitle="ИИ генерирует вопросы с вариантами ответов и сразу публикует тест — студенты видят его в разделе «Тесты»"
          accentColor="#22D3EE"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Предмет
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUBJECTS.map(s => (
                <button key={s.value} onClick={() => setSubject(s.value)} style={{
                  padding: '7px 14px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  border: `1px solid ${subject === s.value ? 'rgba(34,211,238,0.5)' : 'var(--border)'}`,
                  background: subject === s.value ? 'rgba(34,211,238,0.1)' : 'var(--surface-2)',
                  color: subject === s.value ? '#22D3EE' : 'var(--text-2)',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Тема теста
            </label>
            <input
              className="field"
              placeholder="Например: «Наследование и интерфейсы»"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          {/* Count */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Количество вопросов
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[3, 5, 7, 10].map(n => (
                <button key={n} onClick={() => setCount(n)} style={{
                  padding: '7px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                  border: `1px solid ${count === n ? 'rgba(34,211,238,0.5)' : 'var(--border)'}`,
                  background: count === n ? 'rgba(34,211,238,0.12)' : 'var(--surface-2)',
                  color: count === n ? '#22D3EE' : 'var(--text-2)',
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Send button */}
          <button
            className="btn btn-lg"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            style={{
              background: (loading || !topic.trim()) ? 'var(--surface-3)' : 'linear-gradient(135deg, #22D3EE, #06B6D4)',
              color: (loading || !topic.trim()) ? 'var(--text-3)' : '#fff',
              border: 'none',
              boxShadow: (!loading && topic.trim()) ? '0 4px 20px rgba(34,211,238,0.25)' : 'none',
              transition: 'all .2s',
              cursor: (loading || !topic.trim()) ? 'not-allowed' : 'pointer',
              gap: 10,
            }}
          >
            {loading
              ? <><span className="dot" style={{ background: '#fff' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.16s' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.32s' }}/></>
              : <Send size={16} />
            }
            {loading ? `Генерирую ${count} вопросов по «${topic}»…` : 'Сгенерировать и отправить студентам'}
          </button>

          {/* Success */}
          {success && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }} className="anim-up">
              <CheckCircle2 size={22} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem', marginBottom: 4 }}>
                  Тест опубликован! 🎉
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                  Тест <strong style={{ color: 'var(--text)' }}>«{sentTopic}»</strong> ({count} вопросов) сохранён в базу данных.
                  Студенты видят его в разделе <strong style={{ color: 'var(--text)' }}>«Тесты»</strong> прямо сейчас.
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* History */}
      {history.length > 0 && (
        <SectionCard accentColor="var(--violet)" delay={0.1}>
          <SectionHeader
            icon={<ChevronRight size={20} />}
            title="📋 История опубликованных тестов"
            subtitle="Тесты, которые студенты уже могут проходить"
            accentColor="var(--violet)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.subject}: {h.topic}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{h.count} вопросов · {h.date}</div>
                </div>
                <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Full page: Расписание (Teacher) ──────────────────────────────────────

const LESSON_TYPES = [
  { value: 'Лекция',      color: '#94A3B8' },
  { value: 'Практика',    color: 'var(--violet)' },
  { value: 'Лаба',        color: 'var(--gold)' },
  { value: 'Семинар',     color: 'var(--green)' },
  { value: 'Экзамен',     color: 'var(--red)' },
];
const DAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

export function TeacherScheduleView() {
  const [form, setForm] = useState({
    day: 1,           // 1=Пн ... 5=Пт
    time_start: '09:00',
    title: '',
    topic: '',
    room: '',
    type: 'Лекция',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeDay, setActiveDay] = useState(1);

  // Load schedule from Supabase
  const loadSchedule = async () => {
    if (!supabase) { setLoadingList(false); return; }
    const { data } = await supabase
      .from('schedule_lessons')
      .select('*')
      .order('time_start', { ascending: true });
    setLessons(data || []);
    setLoadingList(false);
  };

  useEffect(() => { loadSchedule(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.room.trim()) {
      setError('Заполните название занятия и аудиторию');
      return;
    }
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const typeObj = LESSON_TYPES.find(t => t.value === form.type);
      const { error: dbErr } = await supabase.from('schedule_lessons').insert({
        day_of_week: form.day,
        time_start: form.time_start,
        title: form.title.trim(),
        topic: form.topic.trim(),
        room: form.room.trim(),
        type: form.type,
        color: typeObj?.color || '#94A3B8',
        created_at: new Date().toISOString(),
      });
      if (dbErr) throw new Error(dbErr.message);
      setSuccess(true);
      setForm(f => ({ ...f, title: '', topic: '', room: '' }));
      await loadSchedule(); // refresh list
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      setError('Ошибка сохранения: ' + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    await supabase.from('schedule_lessons').delete().eq('id', id);
    setLessons(l => l.filter(x => x.id !== id));
  };

  const dayLessons = lessons.filter(l => l.day_of_week === activeDay);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-in">

      {/* Add lesson form */}
      <SectionCard accentColor="var(--accent)" delay={0.05}>
        <SectionHeader
          icon={<Send size={20} />}
          title="📅 Добавить занятие в расписание"
          subtitle="Заполните форму — студенты сразу увидят занятие в своём расписании"
          accentColor="var(--accent)"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Day selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              День недели
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS_SHORT.map((d, i) => (
                <button key={d} onClick={() => set('day', i + 1)} style={{
                  padding: '8px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                  border: `1px solid ${form.day === i + 1 ? 'rgba(249,115,22,0.5)' : 'var(--border)'}`,
                  background: form.day === i + 1 ? 'rgba(249,115,22,0.12)' : 'var(--surface-2)',
                  color: form.day === i + 1 ? 'var(--accent)' : 'var(--text-2)',
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time + Type row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Время начала
              </label>
              <input
                type="time"
                className="field"
                value={form.time_start}
                onChange={e => set('time_start', e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Тип занятия
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LESSON_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    border: `1px solid ${form.type === t.value ? t.color : 'var(--border)'}`,
                    background: form.type === t.value ? `${t.color}18` : 'var(--surface-2)',
                    color: form.type === t.value ? t.color : 'var(--text-2)',
                  }}>
                    {t.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Название предмета *
            </label>
            <input
              className="field"
              placeholder="Например: Математический анализ"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Topic + Room row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Тема занятия (необязательно)
              </label>
              <input
                className="field"
                placeholder="Например: Интегралы Римана"
                value={form.topic}
                onChange={e => set('topic', e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Аудитория *
              </label>
              <input
                className="field"
                placeholder="А-101"
                style={{ width: 90 }}
                value={form.room}
                onChange={e => set('room', e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.83rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }} className="anim-in">
              <CheckCircle2 size={20} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>Занятие добавлено!</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 2 }}>
                  Студенты уже видят его в своём расписании.
                </div>
              </div>
            </div>
          )}

          <button
            className="btn btn-lg"
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.room.trim()}
            style={{
              background: (saving || !form.title.trim() || !form.room.trim())
                ? 'var(--surface-3)'
                : 'linear-gradient(135deg, var(--accent), #f97316cc)',
              color: (saving || !form.title.trim() || !form.room.trim()) ? 'var(--text-3)' : '#fff',
              border: 'none',
              boxShadow: (!saving && form.title.trim() && form.room.trim()) ? '0 4px 20px rgba(249,115,22,0.25)' : 'none',
              cursor: (saving || !form.title.trim() || !form.room.trim()) ? 'not-allowed' : 'pointer',
              transition: 'all .2s', gap: 10,
            }}
          >
            {saving
              ? <><span className="dot" style={{ background: '#fff' }}/><span className="dot" style={{ background: '#fff', animationDelay: '.16s' }}/></>
              : <Send size={16} />
            }
            {saving ? 'Сохраняю…' : `Добавить в расписание (${DAYS_SHORT[form.day - 1]}, ${form.time_start})`}
          </button>
        </div>
      </SectionCard>

      {/* View schedule */}
      <SectionCard accentColor="var(--violet)" delay={0.1}>
        <SectionHeader
          icon={<BookOpen size={20} />}
          title="📋 Текущее расписание студентов"
          subtitle="Все занятия, которые видят студенты"
          accentColor="var(--violet)"
        />

        {/* Day tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {DAYS_SHORT.map((d, i) => (
            <button key={d} onClick={() => setActiveDay(i + 1)} style={{
              padding: '8px 18px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              background: activeDay === i + 1 ? 'var(--accent)' : 'var(--surface-2)',
              color: activeDay === i + 1 ? '#fff' : 'var(--text-2)',
              border: 'none',
              boxShadow: activeDay === i + 1 ? '0 4px 14px rgba(249,115,22,0.3)' : 'none',
            }}>
              {d}
            </button>
          ))}
        </div>

        {loadingList ? (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: 24 }}>
            <span className="dot"/><span className="dot"/><span className="dot"/>
          </div>
        ) : dayLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
            Нет занятий в {DAYS_FULL[activeDay - 1].toLowerCase()}. Добавьте через форму выше.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dayLessons.map((l) => {
              const typeObj = LESSON_TYPES.find(t => t.value === l.type);
              const color = typeObj?.color || l.color || '#94A3B8';
              return (
                <div key={l.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 12,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}>
                  <div style={{ width: 4, height: 44, borderRadius: 99, background: color, flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-3)', minWidth: 44 }}>{l.time_start}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{l.title}</div>
                    {l.topic && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{l.topic}</div>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>🏛️ {l.room}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 700,
                    background: `${color}18`, color, border: `1px solid ${color}40`, flexShrink: 0,
                  }}>{l.type}</span>
                  <button
                    onClick={() => handleDelete(l.id)}
                    title="Удалить занятие"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', flexShrink: 0 }}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Updated stubs ────────────────────────────────────────────────────────

export function TeacherMaterials() { return <TeacherLessonPrepView />; }
export function TeacherGrading()   { return <TeacherQuizzesView />; }
export function TeacherSchedule()  { return <TeacherScheduleView />; }
