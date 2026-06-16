import { useState, useEffect } from 'react';
import { Bell, Menu, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Header({ user, onMenu, onSwitchRole }) {
  const [stats, setStats] = useState({ xp: 0, xpMax: 3000, streak: 1 });

  useEffect(() => {
    if (!supabase || !user?.id) return;
    supabase
      .from('profiles')
      .select('xp, streak')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setStats({ xp: data.xp || 0, xpMax: 3000, streak: data.streak || 1 });
      });

    const handleXpGained = (e) => {
      setStats(prev => {
        const newXp = prev.xp + e.detail.amount;
        let newXpMax = prev.xpMax;
        while (newXp >= newXpMax) newXpMax += 3000;
        return { ...prev, xp: newXp, xpMax: newXpMax };
      });
    };
    window.addEventListener('xp_gained', handleXpGained);
    return () => window.removeEventListener('xp_gained', handleXpGained);
  }, [user?.id]);

  const { xp, xpMax, streak } = stats;

  const getDaysWord = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
    return 'дней';
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px', height: 56,
      gap: 12,
    }}>
      <button
        onClick={onMenu}
        className="md:hidden"
        style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', padding: 4 }}
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:flex items-center gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
        <div>Привет, <span style={{ color: 'var(--text)', fontWeight: 600 }}>{user?.name?.split(' ')[0]} 👋</span></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          className="hidden sm:flex">
          <Zap size={12} color="var(--accent)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{xp.toLocaleString('ru')} XP</span>
          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${Math.min((xp / xpMax) * 100, 100)}%` }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <span role="img" aria-label="огонь" style={{ fontSize: '14px', lineHeight: 1 }}>🔥</span>
          <span className="streak-num" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{streak} {getDaysWord(streak)}</span>
        </div>

        <button style={{ position: 'relative', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Bell size={15} color="var(--text-2)" />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', border: '1px solid var(--surface-2)' }} />
        </button>

        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          fontSize: '0.8rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          {user?.name?.charAt(0)}
        </div>
      </div>
    </header>
  );
}
