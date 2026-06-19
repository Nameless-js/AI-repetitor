import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronRight, Brain, ArrowLeft, Trophy, Plus, Sparkles, BookOpen } from 'lucide-react';
import { analyzeMistake, generateQuiz } from '../lib/gemini';
import { supabase } from '../lib/supabase';

/* ── Результаты пройденного теста из БД ── */
function Results({ quiz, onBack }) {
  const [exp, setExp] = useState(null);
  const [aiExps, setAiExps] = useState({});
  const [loadingExp, setLoadingExp] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !quiz?.id) return;
    supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id)
      .then(({ data }) => { setQuestions(data || []); setLoading(false); });
  }, [quiz?.id]);

  const ok = questions.filter(q => q.is_correct).length;
  const tot = questions.length;
  const p = tot > 0 ? Math.round((ok / tot) * 100) : 0;
  const c = p >= 80 ? 'var(--green)' : p >= 60 ? 'var(--gold)' : 'var(--red)';
  const bg = p >= 80 ? 'var(--green-dim)' : p >= 60 ? 'var(--gold-dim)' : 'var(--red-dim)';
  const label = p >= 80 ? 'Отлично!' : p >= 60 ? 'Хорошая работа!' : 'Нужно потренироваться';

  const handleExpand = async (index, question) => {
    if (question.is_correct) return;
    if (exp === index) { setExp(null); return; }
    setExp(index);
    if (!aiExps[index]) {
      setLoadingExp(true);
      const result = await analyzeMistake(question.question_text, question.user_answer, question.correct_answer);
      setAiExps(prev => ({ ...prev, [index]: result }));
      setLoadingExp(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div><button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14} /> К списку тестов</button></div>
      <div className="card" style={{ padding: '32px 24px', textAlign: 'center', borderColor: c }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: bg, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trophy size={32} color={c} />
        </div>
        {loading ? <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}><span className="dot"/><span className="dot"/><span className="dot"/></div> : (
          <>
            <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: c, lineHeight: 1 }}>{p}%</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 8, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Верно {ok} из {tot} вопросов</div>
          </>
        )}
      </div>
      {!loading && questions.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>Разбор вопросов</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, i) => {
              const aiExp = aiExps[i];
              return (
                <div key={i} style={{ borderRadius: 'var(--radius)', border: `1px solid ${q.is_correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.35)'}`, background: 'var(--surface)', overflow: 'hidden' }}>
                  <div className={`q-row ${q.is_correct ? 'ok' : 'bad'}`} style={{ margin: 0, border: 'none', borderRadius: 0 }} onClick={() => handleExpand(i, q)}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>{q.is_correct ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>В{i + 1}. {q.question_text}</div>
                      <div style={{ fontSize: '0.75rem', color: q.is_correct ? 'var(--green)' : 'var(--red)' }}>Твой ответ: {q.user_answer}</div>
                      {!q.is_correct && <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 2 }}>Верный ответ: {q.correct_answer}</div>}
                    </div>
                    {!q.is_correct && <ChevronRight size={16} style={{ color: 'var(--text-3)', transform: exp === i ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />}
                  </div>
                  {!q.is_correct && exp === i && (
                    <div className="anim-in" style={{ padding: '16px 20px', background: 'var(--accent-dim)', borderTop: '1px solid rgba(249,115,22,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Brain size={14} color="var(--accent)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>🤖 ИИ-разбор ошибки</span>
                      </div>
                      {loadingExp && !aiExp ? (
                        <div style={{ display: 'flex', gap: 4 }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
                      ) : (
                        <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{aiExp}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Прохождение ИИ-теста ── */
function TakeQuiz({ questions, subject, topic, onBack, onSaveHistory }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [aiExps, setAiExps] = useState({});
  const [exp, setExp] = useState(null);
  const [loadingExp, setLoadingExp] = useState(false);

  const q = questions[current];
  // Защита на случай, если структура ключей ИИ поменяется
  const correctAnswerText = q?.correctAnswer || q?.correct;

  const pickAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    
    const isCorrect = opt === correctAnswerText;
    const newAnswers = [...answers, { 
      question: q.question, 
      userAnswer: opt, 
      correct: correctAnswerText, 
      isCorrect 
    }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setSelected(null);
      } else {
        onSaveHistory(subject, topic, questions, newAnswers);
        
        const ok = newAnswers.filter(a => a.isCorrect).length;
        const p = Math.round((ok / newAnswers.length) * 100);
        if (p >= 80) {
           window.dispatchEvent(new CustomEvent('xp_gained', { detail: { amount: 100 } }));
        } else if (p >= 60) {
           window.dispatchEvent(new CustomEvent('xp_gained', { detail: { amount: 50 } }));
        }
        
        setDone(true);
      }
    }, 800);
  };

  const handleExpand = async (i) => {
    const a = answers[i];
    if (a.isCorrect) return;
    if (exp === i) { setExp(null); return; }
    setExp(i);
    if (!aiExps[i]) {
      setLoadingExp(true);
      const result = await analyzeMistake(a.question, a.userAnswer, a.correct);
      setAiExps(prev => ({ ...prev, [i]: result }));
      setLoadingExp(false);
    }
  };

  if (done) {
    const ok = answers.filter(a => a.isCorrect).length;
    const p = Math.round((ok / answers.length) * 100);
    const c = p >= 80 ? 'var(--green)' : p >= 60 ? 'var(--gold)' : 'var(--red)';
    const bg = p >= 80 ? 'var(--green-dim)' : p >= 60 ? 'var(--gold-dim)' : 'var(--red-dim)';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
        <div><button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14} /> К списку моих тестов</button></div>
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center', borderColor: c }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: bg, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy size={32} color={c} />
          </div>
          <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: c }}>{p}%</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 8 }}>{subject} — {topic}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 4 }}>Верно {ok} из {answers.length}</div>
        </div>
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>Разбор ошибок</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {answers.map((a, i) => (
              <div key={i} style={{ borderRadius: 'var(--radius)', border: `1px solid ${a.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.35)'}`, background: 'var(--surface)', overflow: 'hidden' }}>
                <div className={`q-row ${a.isCorrect ? 'ok' : 'bad'}`} style={{ margin: 0, border: 'none', borderRadius: 0 }} onClick={() => handleExpand(i)}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>{a.isCorrect ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>В{i+1}. {a.question}</div>
                    <div style={{ fontSize: '0.75rem', color: a.isCorrect ? 'var(--green)' : 'var(--red)' }}>Твой ответ: {a.userAnswer}</div>
                    {!a.isCorrect && <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 2 }}>Верный: {a.correct}</div>}
                  </div>
                  {!a.isCorrect && <ChevronRight size={16} style={{ color: 'var(--text-3)', transform: exp === i ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />}
                </div>
                {!a.isCorrect && exp === i && (
                  <div className="anim-in" style={{ padding: '16px 20px', background: 'var(--accent-dim)', borderTop: '1px solid rgba(249,115,22,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Brain size={14} color="var(--accent)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>🤖 ИИ-разбор</span>
                    </div>
                    {loadingExp && !aiExps[i] ? <div style={{ display: 'flex', gap: 4 }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
                      : <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{aiExps[i]}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14} /> Отмена</button>
        <span className="chip chip-orange">{current + 1} / {questions.length}</span>
      </div>
      <div className="card" style={{ padding: 32 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 8 }}>{subject} · {topic}</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 24, lineHeight: 1.5 }}>{q?.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q?.options?.map((opt, i) => {
            let style = { padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: '0.85rem', transition: 'all .15s', textAlign: 'left', color: 'var(--text)', fontFamily: 'inherit', width: '100%' };
            if (selected !== null) {
              if (opt === correctAnswerText) style = { ...style, borderColor: 'rgba(34,197,94,0.5)', background: 'rgba(34,197,94,0.1)', color: 'var(--green)' };
              else if (opt === selected && opt !== correctAnswerText) style = { ...style, borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.1)', color: 'var(--red)' };
              else style = { ...style, opacity: 0.4 };
            }
            return <button key={i} style={style} onClick={() => pickAnswer(opt)} disabled={selected !== null}>{opt}</button>;
          })}
        </div>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ '--w': `${((current + 1) / questions.length) * 100}%` }} /></div>
    </div>
  );
}

/* ── Главный компонент ── */
export default function QuizzesView() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [view, setView] = useState(null); // null | 'res' | 'my' | 'create' | 'take'
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [generatedQs, setGeneratedQs] = useState(null);
  const [myHistory, setMyHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eduai_my_quizzes') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('quizzes').select('*').then(({ data }) => {
      setQuizzes(data || []);
      setLoading(false);
    });
  }, []);

  const saveToHistory = (subj, top, questionsList, answersList) => {
    const ok = answersList.filter(a => a.isCorrect).length;
    const entry = { 
      id: Date.now(), 
      subject: subj, 
      topic: top, 
      score: Math.round((ok / answersList.length) * 100), 
      total: answersList.length, 
      date: new Date().toLocaleDateString('ru-RU') 
    };
    const updated = [entry, ...myHistory].slice(0, 20);
    setMyHistory(updated);
    localStorage.setItem('eduai_my_quizzes', JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!subject.trim() || !topic.trim()) return;
    setGenerating(true);
    setGenError('');
    try {
      const qs = await generateQuiz(subject.trim(), topic.trim(), count);
      if (!Array.isArray(qs) || qs.length === 0) throw new Error('ИИ вернул пустой результат');
      setGeneratedQs(qs);
      setView('take');
    } catch (e) {
      setGenError(e.message || 'Ошибка генерации');
    }
    setGenerating(false);
  };

  if (view === 'res') return <Results quiz={selectedQuiz} onBack={() => { setView(null); setSelectedQuiz(null); }} />;

  if (view === 'take' && generatedQs) return (
    <TakeQuiz
      questions={generatedQs}
      subject={subject}
      topic={topic}
      onBack={() => { setView('my'); setGeneratedQs(null); }}
      onSaveHistory={saveToHistory}
    />
  );

  if (view === 'my') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setView(null)}><ArrowLeft size={14} /> Назад</button>
        <button className="btn btn-primary btn-sm" onClick={() => setView('create')}><Plus size={14} /> Создать тест</button>
      </div>
      <div>
        <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Мои тесты</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Тесты, которые ты сгенерировал с помощью ИИ.</p>
      </div>
      {myHistory.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧪</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Пока пусто</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 16 }}>Создай свой первый тест — выбери предмет, тему, и ИИ сгенерирует вопросы.</div>
          <button className="btn btn-primary" onClick={() => setView('create')}><Sparkles size={14} /> Создать тест</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myHistory.map(h => (
            <div key={h.id} className="card card-hover" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{h.subject} — {h.topic}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>{h.date} · {h.total} вопросов</div>
              </div>
              <span className={`chip ${h.score >= 80 ? 'chip-green' : h.score >= 60 ? 'chip-gold' : 'chip-red'}`}>{h.score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (view === 'create') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div><button className="btn btn-ghost btn-sm" onClick={() => setView('my')}><ArrowLeft size={14} /> Назад</button></div>
      <div>
        <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Создать тест</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Укажи предмет и тему — ИИ сгенерирует вопросы с вариантами ответов.</p>
      </div>
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Предмет</label>
          <input className="field" placeholder="Например: Информатика" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Тема</label>
          <input className="field" placeholder="Например: Циклы в Python" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Кол-во вопросов</label>
          <select className="field" value={count} onChange={e => setCount(Number(e.target.value))}>
            <option value={3}>3 вопроса</option>
            <option value={5}>5 вопросов</option>
            <option value={7}>7 вопросов</option>
            <option value={10}>10 вопросов</option>
          </select>
        </div>
        {genError && <div style={{ fontSize: '0.8rem', color: 'var(--red)', padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 8 }}>{genError}</div>}
        <button className="btn btn-primary btn-lg btn-block" onClick={handleGenerate} disabled={generating || !subject.trim() || !topic.trim()}>
          {generating ? <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}><span className="dot"/><span className="dot"/><span className="dot"/></div> : <><Sparkles size={16} /> Сгенерировать тест</>}
        </button>
      </div>
    </div>
  );

  /* ── Главный экран: список тестов ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Тесты</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Проверь свои знания.</p>
        </div>
        <button className="btn btn-outline-accent" onClick={() => setView('my')}>
          <BookOpen size={14} /> Мои тесты
        </button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', gap: 4, padding: 32, justifyContent: 'center' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
      ) : quizzes.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📝</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Тестов от репетитора пока нет</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 16 }}>Но ты можешь сам создать тест с помощью ИИ!</div>
          <button className="btn btn-primary" onClick={() => setView('my')}><Sparkles size={14} /> Мои тесты</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {quizzes.map(t => (
            <div key={t.id} className="card card-hover" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setSelectedQuiz(t); setView('res'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '2rem' }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{t.questions_count} вопросов · {t.time_minutes}</div>
                  </div>
                </div>
                <span className={`chip ${t.difficulty === 'Сложно' ? 'chip-red' : 'chip-gold'}`}>{t.difficulty}</span>
              </div>
              <div className="bar-track" style={{ marginBottom: 12 }}>
                <div className="bar-fill" style={{ '--w': t.last_score ? `${t.last_score}%` : '0%' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
                  {t.last_score ? `Прошлый рез: ${t.last_score}%` : 'Не начато'}
                </span>
                <button className="btn btn-primary btn-sm">
                  {t.last_score ? 'Результаты' : 'Начать тест'} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="inset" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Brain size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>🤖 ИИ-анализ ошибок</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            После завершения теста для каждого неверного ответа Gemini сгенерирует персональный разбор — не просто правильный ответ, но и объяснение, <em>почему</em> вы ошиблись.
          </p>
        </div>
      </div>
    </div>
  );
}