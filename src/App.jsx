import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ChatView from './components/ChatView';
import FlashcardsView from './components/FlashcardsView';
import QuizzesView from './components/QuizzesView';
import ScheduleView from './components/ScheduleView';
import { TeacherDashboard, TeacherMaterials, TeacherGrading, TeacherSchedule } from './components/TeacherPortal';

const TITLES_STUDENT = {
  home:       'Главная',
  chat:       'ИИ-чат',
  flashcards: 'Карточки',
  quizzes:    'Тесты',
  schedule:   'Расписание',
};

const TITLES_TEACHER = {
  home:       'Дашборд Преподавателя',
  materials:  'Учебные материалы',
  grading:    'Проверка работ',
  schedule:   'Расписание занятий',
};

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [dbRole, setDbRole] = useState(null);
  const [tab, setTab] = useState('home');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setSession(session);
      setUser(currentUser);
      
      if (currentUser) {
        const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
        if (data) setDbRole(data.role);
      }
      setLoading(false);
    };

    fetchSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setSession(session);
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
        if (data) setDbRole(data.role);
      } else {
        setDbRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setDbRole(null);
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}><span className="dot"/><span className="dot"/><span className="dot"/></div>;
  }

  // Fallback if Supabase fails to initialize, show AuthPage
  if (!user && !session) return <AuthPage onLogin={(u) => { setUser(u); setTab('home'); }} />;

  const isTeacher = dbRole === 'teacher' || user?.user_metadata?.role === 'teacher';
  const TITLES = isTeacher ? TITLES_TEACHER : TITLES_STUDENT;

  const Content = () => {
    if (isTeacher) {
      switch (tab) {
        case 'home':       return <TeacherDashboard />;
        case 'materials':  return <TeacherMaterials />;
        case 'grading':    return <TeacherGrading />;
        case 'schedule':   return <TeacherSchedule />;
        default:           return <TeacherDashboard />;
      }
    } else {
      switch (tab) {
        case 'home':       return <Dashboard user={user} onTab={setTab} />;
        case 'chat':       return <ChatView />;
        case 'flashcards': return <FlashcardsView />;
        case 'quizzes':    return <QuizzesView />;
        case 'schedule':   return <ScheduleView />;
        default:           return <Dashboard user={user} onTab={setTab} />;
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Background radial effects */}
      <div style={{ position: 'fixed', top: -200, left: 100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -100, right: 200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Sidebar active={tab} onChange={setTab} user={user} onLogout={logout} open={open} onClose={() => setOpen(false)} isTeacher={isTeacher} />

      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: 'var(--sidebar-w)', position: 'relative', zIndex: 1, transition: 'margin-left .28s' }}>
        <Header user={user} onMenu={() => setOpen(o => !o)} />

        <main style={{ flex: 1, padding: '24px 20px', maxWidth: 960, width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }} className="anim-in">
            <h1 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>
              {TITLES[tab]}
            </h1>
            <div style={{ width: 32, height: 4, borderRadius: 99, background: 'var(--accent)', marginTop: 8 }} />
          </div>

          <Content />
        </main>
      </div>
    </div>
  );
}
