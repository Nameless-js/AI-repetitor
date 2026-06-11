import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GraduationCap, Eye, EyeOff, Users, BookOpen, Zap, ShieldCheck } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('in');       // 'in' | 'up'
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ login: '', password: '', name: '', email: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (tab === 'in') {
      if (supabase) {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: form.login,
          password: form.password,
        });
        if (err) {
          const fullError = JSON.stringify(err, Object.getOwnPropertyNames(err));
          setError(`Ошибка входа: ${err.message}. Полный лог: ${fullError}`);
        }
      } else {
        setError('Связь с базой данных отсутствует (проверьте .env ключи Supabase).');
      }
    } else {
      if (form.name && form.email && form.password.length >= 6) {
        if (supabase) {
          const { error: err, data } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.name, role } }
          });
          if (err) {
            const fullError = JSON.stringify(err, Object.getOwnPropertyNames(err));
            setError(`Сбой регистрации БД! Причина: ${err.message}. Полный лог: ${fullError}`);
          } else {
            setError('Успешная регистрация в БД! (Проверьте почту, если включено подтверждение)');
          }
        } else {
          setError('Связь с базой данных отсутствует (проверьте .env ключи Supabase).');
        }
      } else {
        setError('Заполните все поля (пароль минимум 6 символов).');
      }
    }
    setLoading(false);
  };

  const features = [
    { icon: <Zap size={14} />, text: 'Режим «Объясни на пальцах»' },
    { icon: <BookOpen size={14} />, text: '3D-карточки с интервальными повторениями' },
    { icon: <ShieldCheck size={14} />, text: 'ИИ-анализ ошибок в тестах' },
  ];

  return (
    <div className="auth-wrap">
      <div style={{ display: 'flex', width: '100%', maxWidth: 960, gap: 56, alignItems: 'center', justifyContent: 'center' }}>

        {/* ── Left panel ── */}
        <div className="anim-up" style={{ display: 'none', flex: 1, maxWidth: 400 }}
          ref={el => el && (el.style.display = window.innerWidth >= 768 ? 'flex' : 'none')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <div>
                <div className="font-display" style={{ fontSize: '1rem', fontWeight: 700 }}>ЭдуАИ</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Платформа ИИ-репетитора</div>
              </div>
            </div>

            <div>
              <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
                Учись умнее,<br />
                <span style={{ color: 'var(--accent)' }}>а не усерднее.</span>
              </h1>
              <p style={{ marginTop: 14, fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                Персональный ИИ-репетитор, который объясняет сложные темы простыми словами, помогает строить серии и отслеживает твой прогресс — 24/7.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--accent)' }}>{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 28 }}>
              {[['10К+', 'Студентов'], ['98%', 'Довольны'], ['40+', 'Предметов']].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{v}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Auth Card ── */}
        <div className="card anim-up delay-1" style={{ width: '100%', maxWidth: 420, padding: '32px 28px' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }} className="md:hidden">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={17} color="#fff" />
            </div>
            <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 700 }}>ЭдуАИ</span>
          </div>

          {/* Tabs */}
          <div className="auth-tabs" style={{ marginBottom: 22 }}>
            <button className={`auth-tab ${tab === 'in' ? 'active' : ''}`} onClick={() => { setTab('in'); setError(''); }}>Войти</button>
            <button className={`auth-tab ${tab === 'up' ? 'active' : ''}`} onClick={() => { setTab('up'); setError(''); }}>Регистрация</button>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Войти как</div>
            <div className="role-wrap">
              <button className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                <GraduationCap size={13} /> Студент
              </button>
              <button className={`role-btn ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>
                <Users size={13} /> Преподаватель
              </button>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'up' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Полное имя</label>
                <input className="field" name="name" placeholder="Алексей Иванов" value={form.name} onChange={set('name')} />
              </div>
            )}
            {tab === 'up' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Email</label>
                <input className="field" name="email" type="email" placeholder="ты@университет.рф" value={form.email} onChange={set('email')} />
              </div>
            )}
            {tab === 'in' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Логин</label>
                <input className="field" name="login" placeholder={role === 'student' ? 'admin' : 'teacher'} value={form.login} onChange={set('login')} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="field" name="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={set('password')} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ fontSize: '0.78rem', padding: '12px', borderRadius: 8, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="dot" /><span className="dot" /><span className="dot" /></> : (tab === 'in' ? 'Войти →' : 'Создать аккаунт →')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
