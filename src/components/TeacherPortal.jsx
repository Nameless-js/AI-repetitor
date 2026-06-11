import React, { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, CheckSquare, Brain, 
  AlertTriangle, User, UploadCloud, FileText, CheckCircle, 
  ChevronDown, Clock, Loader 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tryGenerateContent } from '../lib/gemini';

export function TeacherDashboard() {
  const [stats, setStats] = useState({ students: 0, pendingLabs: 0, materials: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!supabase) return;
      try {
        const [pRes, lRes, mRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('lab_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('study_materials').select('*', { count: 'exact', head: true })
        ]);
        setStats({
          students: pRes.count || 0,
          pendingLabs: lRes.count || 0,
          materials: mRes.count || 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="anim-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { icon: <Users size={24} />, label: 'Всего студентов', val: loading ? '...' : stats.students, color: 'var(--accent)' },
          { icon: <GraduationCap size={24} />, label: 'Ср. балл', val: '78%', color: 'var(--accent)' },
          { icon: <CheckSquare size={24} />, label: 'Лабораторных', val: loading ? '...' : stats.pendingLabs, color: 'var(--red)' },
          { icon: <Brain size={24} />, label: 'ИИ-материалов', val: loading ? '...' : stats.materials, color: 'var(--accent)' },
        ].map((s, i) => (
          <div key={i} className="card anim-up" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, animationDelay: `${i * 0.1}s` }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 4 }}>{s.label}</div>
              <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>
                {s.val}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card anim-up delay-3" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="var(--red)" /> Проблемные зоны группы
          </h3>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-3)', padding: '20px 0' }}>
            Соберите больше статистики тестов для ИИ-анализа проблемных тем.
          </div>
        </div>

        <div className="card anim-up delay-4" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--accent)" /> Студенты в зоне риска
          </h3>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-3)', padding: '20px 0' }}>
            Студентов с критически низкой активностью не найдено.
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeacherMaterials() {
  const [uploadState, setUploadState] = useState('idle');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizJson, setQuizJson] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleUpload = () => {
    setUploadState('uploading');
    setTimeout(async () => {
      if (supabase) {
        await supabase.from('study_materials').insert({
          filename: 'Основы_алгоритмизации_Лекция2.pdf',
          size_kb: 1200,
          status: 'processed'
        }).select().single();
      }
      setUploadState('done');
    }, 2000);
  };

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setShowQuizModal(true);
    try {
      const prompt = `Сгенерируй JSON-массив из 2 вопросов для теста по теме "Основы алгоритмизации". Структура: [{"question": "...", "options": ["...", "..."], "correct_answer": "..."}]. Ответь ТОЛЬКО чистым JSON.`;
      const res = await tryGenerateContent(prompt);
      setQuizJson(res.text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
    } catch (e) {
      setQuizJson(JSON.stringify({ error: e.message }, null, 2));
    }
    setGenerating(false);
  };

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        {uploadState === 'idle' && (
          <div 
            style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 40, cursor: 'pointer', transition: 'all .2s' }}
            onClick={handleUpload}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <UploadCloud size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Загрузить учебную программу</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>Нажми, чтобы симулировать загрузку в БД</p>
          </div>
        )}

        {uploadState === 'uploading' && (
          <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader size={40} color="var(--accent)" className="spin" style={{ marginBottom: 16 }} />
            <p style={{ color: 'var(--text)', fontWeight: 500 }}>Загрузка и ИИ-анализ...</p>
          </div>
        )}

        {uploadState === 'done' && (
          <div className="anim-up" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--surface-2)', borderRadius: 12, marginBottom: 24, border: '1px solid var(--border)' }}>
              <FileText size={24} color="var(--accent)" />
              <div>
                <div style={{ color: 'var(--text)', fontWeight: 600 }}>Основы_алгоритмизации_Лекция2.pdf</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Сохранено в базу данных • 1.2 МБ</div>
              </div>
              <button 
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => setUploadState('idle')}
              >
                Загрузить другой
              </button>
            </div>

            <h4 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} color="var(--accent)" /> ИИ-Ассистент готов:
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div 
                className="card"
                style={{ padding: 20, cursor: 'pointer', transition: 'border-color .2s', border: '1px solid var(--border)' }}
                onClick={handleGenerateQuiz}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: 'var(--accent)' }}>📝</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Сгенерировать умный квиз</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Реальный запрос к Gemini API</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showQuizModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card anim-up" style={{ width: '100%', maxWidth: 700, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text)', fontWeight: 700 }}>Превью умного квиза (Gemini JSON)</h3>
              <button onClick={() => setShowQuizModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: 'var(--surface-2)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
              {generating ? <span style={{ opacity: 0.5 }}>Gemini генерирует...</span> : quizJson}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowQuizModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeacherGrading() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('lab_submissions').select(`*, profiles(full_name)`).order('created_at', { ascending: false })
      .then(({ data }) => {
        setSubmissions(data || []);
        setLoading(false);
      });
  }, []);

  const approve = async (id) => {
    await supabase.from('lab_submissions').update({ status: 'approved' }).eq('id', id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  };

  return (
    <div className="card anim-in" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Студент</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Предмет</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Статус</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Оценка ИИ</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Развернуть</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка из БД...</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Нет лабораторных в базе данных.</td></tr>
            ) : submissions.map((sub) => (
              <React.Fragment key={sub.id}>
                <tr 
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: expandedRow === sub.id ? 'var(--surface-2)' : 'transparent', transition: 'background .2s' }}
                  onClick={() => setExpandedRow(expandedRow === sub.id ? null : sub.id)}
                >
                  <td style={{ padding: '16px 24px', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>{sub.profiles?.full_name || 'Студент'}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-2)', fontSize: '0.9rem' }}>{sub.subject}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-3)', fontSize: '0.85rem' }}>{sub.status === 'approved' ? '✅ Утверждено' : '⏳ Ожидает'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-20)', color: 'var(--accent)' }}>{sub.ai_score}/5</span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <ChevronDown size={18} style={{ color: 'var(--text-3)', transition: 'transform .2s', transform: expandedRow === sub.id ? 'rotate(180deg)' : 'none' }} />
                  </td>
                </tr>
                {expandedRow === sub.id && (
                  <tr>
                    <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <div className="anim-in" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, marginBottom: 8 }}>Текст отчета студента</div>
                          <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, fontSize: '0.85rem', color: 'var(--text-2)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
                            {sub.report_text}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Brain size={14} /> Анализ ИИ-ассистента
                          </div>
                          <div style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid var(--accent-20)', padding: 16, borderRadius: 12, fontSize: '0.85rem', color: 'var(--text)', flex: 1, whiteSpace: 'pre-wrap' }}>
                            {sub.ai_analysis}
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            {sub.status !== 'approved' && (
                              <button className="btn-primary" onClick={() => approve(sub.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <CheckCircle size={16} /> Утвердить оценку
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TeacherSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('schedule_lessons').select('*').order('time_start')
      .then(({ data }) => {
        setSchedule(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="card anim-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 20 }}>Загрузка расписания из БД...</div>
        ) : schedule.length === 0 ? (
          <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 20 }}>Расписание пусто.</div>
        ) : schedule.map((lesson, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}>{lesson.time_start}</div>
              <div>
                <div style={{ color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {lesson.title}
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '.05em', padding: '2px 6px', borderRadius: 4, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    {lesson.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Clock size={12} /> День {lesson.day_of_week} • {lesson.room}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
