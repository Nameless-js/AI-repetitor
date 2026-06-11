import { Home, MessageCircle, Layers, Brain, Calendar, GraduationCap, LogOut, X, FileText, CheckSquare } from 'lucide-react';

const NAV_STUDENT = [
  { id: 'home',       label: 'Главная',    Icon: Home },
  { id: 'chat',       label: 'ИИ-чат',     Icon: MessageCircle },
  { id: 'flashcards', label: 'Карточки',   Icon: Layers },
  { id: 'quizzes',    label: 'Тесты',      Icon: Brain },
  { id: 'schedule',   label: 'Расписание', Icon: Calendar },
];

const NAV_TEACHER = [
  { id: 'home',       label: 'Дашборд',    Icon: Home },
  { id: 'materials',  label: 'Материалы',  Icon: FileText },
  { id: 'grading',    label: 'Проверка',   Icon: CheckSquare },
  { id: 'schedule',   label: 'Расписание', Icon: Calendar },
];

export default function Sidebar({ active, onChange, user, onLogout, open, onClose, isTeacher }) {
  const NAV = isTeacher ? NAV_TEACHER : NAV_STUDENT;
  
  return (
    <>
      <div className={`overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={16} color="#fff" />
            </div>
            <span className="font-display" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-.01em' }}>ЭдуАИ</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }} className="md:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="divider" />

        {/* User */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent)', textTransform: 'capitalize' }}>
                {isTeacher ? 'преподаватель' : 'студент'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
          <div style={{ padding: '0 14px 6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Меню
          </div>
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-item ${active === id ? 'active' : ''}`}
              onClick={() => { onChange(id); onClose(); }}>
              <Icon size={16} className="nav-icon" style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </nav>

        <div className="divider" />

        {/* Logout */}
        <div style={{ padding: '10px 8px' }}>
          <button className="nav-item" onClick={onLogout} style={{ color: 'var(--red)' }}>
            <LogOut size={16} style={{ flexShrink: 0 }} />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
