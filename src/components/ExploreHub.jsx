import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, Bot, X, Sparkles, CheckCircle2, ChevronRight, Compass } from 'lucide-react';

const DEFAULT_CARDS = [
  { id: 1, title: 'Шпаргалка по основам ООП', subject: 'Основы ООП', source: 'Habr', url: 'https://habr.com/' },
  { id: 2, title: 'Сборник лекций по Матану', subject: 'Математический анализ', source: 'Викиучебник', url: 'https://ru.wikibooks.org/' },
  { id: 3, title: 'Визуализатор алгоритмов', subject: 'Алгоритмы', source: 'VisuAlgo', url: 'https://visualgo.net/' },
  { id: 4, title: 'Гайд по паттернам проектирования', subject: 'Основы ООП', source: 'Refactoring Guru', url: 'https://refactoring.guru/' },
];

const FILTERS = ['Все', 'Основы ООП', 'Математический анализ', 'Алгоритмы'];

export default function ExploreHub() {
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Все');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', subject: 'Основы ООП', description: '', url: '' });

  const [studyModalItem, setStudyModalItem] = useState(null);
  const [studyStage, setStudyStage] = useState('loading'); // 'loading', 'result'
  const [quizAnswers, setQuizAnswers] = useState({});

  // Filter Logic
  const filteredCards = cards.filter(c => {
    const matchFilter = filter === 'Все' || c.subject === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                        c.subject.toLowerCase().includes(search.toLowerCase()) ||
                        c.source.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleAddLink = () => {
    if (!newLink.title || !newLink.url) return;
    setCards([{ ...newLink, id: Date.now(), source: 'Пользователь' }, ...cards]);
    setAddModalOpen(false);
    setNewLink({ title: '', subject: 'Основы ООП', description: '', url: '' });
  };

  const handleStudy = (card) => {
    setStudyModalItem(card);
    setStudyStage('loading');
    setQuizAnswers({});
    setTimeout(() => {
      setStudyStage('result');
    }, 2000);
  };

  const getQuizData = (subject) => {
    if (subject === 'Основы ООП') {
      return {
        summary: "Объектно-ориентированное программирование (ООП) — парадигма разработки, основанная на представлении программы в виде совокупности объектов. Главные принципы: инкапсуляция, наследование, полиморфизм и абстракция. Они позволяют делать код гибким и легко масштабируемым.",
        questions: [
          { q: "Какой принцип скрывает внутреннюю реализацию?", a: ["Наследование", "Инкапсуляция", "Полиморфизм"], correct: 1 },
          { q: "Что позволяет использовать один и тот же интерфейс для разных типов?", a: ["Абстракция", "Инкапсуляция", "Полиморфизм"], correct: 2 },
          { q: "Создание нового класса на базе существующего — это:", a: ["Наследование", "Делегация", "Композиция"], correct: 0 },
        ]
      };
    } else if (subject === 'Математический анализ') {
      return {
        summary: "Математический анализ изучает функции, пределы, производные и интегралы. Производная описывает скорость изменения функции, а интеграл позволяет вычислять площади под кривой. Это основа для понимания непрерывных процессов в науке и инженерии.",
        questions: [
          { q: "Что показывает производная функции в точке?", a: ["Площадь под графиком", "Угловой коэффициент касательной", "Точку пересечения с осью"], correct: 1 },
          { q: "Обратная операция к дифференцированию?", a: ["Интегрирование", "Логарифмирование", "Умножение"], correct: 0 },
          { q: "Что такое предел?", a: ["Точное значение функции", "Значение, к которому стремится функция", "Максимум функции"], correct: 1 },
        ]
      };
    } else {
      return {
        summary: "Алгоритмы — это точные наборы инструкций для решения задач. Важнейшие характеристики: временная и пространственная сложность. Хороший алгоритм должен быть не только правильным, но и эффективным.",
        questions: [
          { q: "Какая сложность у бинарного поиска?", a: ["O(n)", "O(n log n)", "O(log n)"], correct: 2 },
          { q: "Какой алгоритм сортировки работает за O(n log n) в худшем случае?", a: ["Merge Sort", "Quick Sort", "Bubble Sort"], correct: 0 },
          { q: "Структура данных LIFO — это:", a: ["Очередь", "Стек", "Дерево"], correct: 1 },
        ]
      };
    }
  };

  const currentQuizData = studyModalItem ? getQuizData(studyModalItem.subject) : null;

  return (
    <div className="anim-in" style={{ 
      display: 'flex', flexDirection: 'column', gap: 24, 
      '--accent': '#0C969C', '--accent-dim': 'rgba(12, 150, 156, 0.15)',
      '--accent-hover': '#097a7e'
    }}>
      
      {/* Search and Filters Header */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input 
              className="field" 
              style={{ paddingLeft: 44, width: '100%', borderColor: 'var(--border)' }}
              placeholder="Найти шпору, статью или конспект..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn" style={{ background: 'var(--accent)', color: '#fff', border: 'none' }} onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Добавить ссылку
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button 
              key={f} 
              className={`chip ${filter === f ? 'active' : ''}`}
              style={{ 
                border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: filter === f ? 'var(--accent-dim)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer',
                fontWeight: filter === f ? 600 : 500,
                padding: '6px 14px',
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {filteredCards.length > 0 ? filteredCards.map(card => (
          <div key={card.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 20, transition: 'transform 0.2s, box-shadow 0.2s' }} 
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="chip" style={{ background: 'var(--surface)', color: 'var(--text-2)', fontSize: '0.7rem' }}>{card.subject}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.source}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.3, color: 'var(--text)' }}>{card.title}</h3>
              {card.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>{card.description}</p>}
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <a href={card.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                <ExternalLink size={14} /> Открыть оригинал
              </a>
              <button className="btn" style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                      onClick={() => handleStudy(card)}>
                <Bot size={14} /> Изучить с ИИ
              </button>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
            <Compass size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p>По вашему запросу ничего не найдено.</p>
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      {addModalOpen && (
        <>
          <div className="overlay open" onClick={() => setAddModalOpen(false)} style={{ zIndex: 100 }} />
          <div className="modal card anim-in" style={{ zIndex: 101, maxWidth: 450, padding: 30, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Добавить материал</h2>
              <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 6 }}>Название</label>
                <input className="field" style={{ width: '100%' }} value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} placeholder="Например: Архитектура REST API" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 6 }}>Предмет / Тег</label>
                <select className="field" style={{ width: '100%', appearance: 'none' }} value={newLink.subject} onChange={e => setNewLink({...newLink, subject: e.target.value})}>
                  {FILTERS.filter(f => f !== 'Все').map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="Другое">Другое</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 6 }}>URL-ссылка</label>
                <input className="field" style={{ width: '100%' }} value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} placeholder="https://..." />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 6 }}>Краткое описание (опционально)</label>
                <textarea className="field" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} placeholder="О чем этот материал?" />
              </div>

              <button className="btn" style={{ background: 'var(--accent)', color: '#fff', width: '100%', padding: '12px', marginTop: 8 }} onClick={handleAddLink} disabled={!newLink.title || !newLink.url}>
                Сохранить
              </button>
            </div>
          </div>
        </>
      )}

      {/* Study with AI Modal */}
      {studyModalItem && (
        <>
          <div className="overlay open" onClick={() => setStudyModalItem(null)} style={{ zIndex: 100 }} />
          <div className="modal card anim-in" style={{ zIndex: 101, maxWidth: 600, width: '90%', padding: 0, overflow: 'hidden', background: 'var(--surface-2)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Изучение с ИИ</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{studyModalItem.title}</p>
                </div>
              </div>
              <button onClick={() => setStudyModalItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, minHeight: 300 }}>
              {studyStage === 'loading' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, gap: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    <Sparkles size={24} color="var(--accent)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  </div>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', animation: 'pulse 2s infinite' }}>ИИ считывает страницу по ссылке...</p>
                  
                  <style>{`
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                  `}</style>
                </div>
              ) : (
                <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Summary */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} /> Конспект «на пальцах»
                    </h4>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text)' }}>
                      {currentQuizData?.summary}
                    </p>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  {/* Quiz */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} /> Мини-квиз для проверки
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {currentQuizData?.questions.map((q, i) => (
                        <div key={i} style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>{i + 1}. {q.q}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {q.a.map((ans, j) => {
                              const isSelected = quizAnswers[i] === j;
                              const isSubmitted = quizAnswers[i] !== undefined;
                              const isCorrect = j === q.correct;
                              
                              let bg = 'var(--surface-2)';
                              let border = '1px solid var(--border)';
                              let color = 'var(--text)';

                              if (isSubmitted) {
                                if (isCorrect) {
                                  bg = 'rgba(16, 185, 129, 0.1)';
                                  border = '1px solid #10b981';
                                  color = '#10b981';
                                } else if (isSelected) {
                                  bg = 'rgba(239, 68, 68, 0.1)';
                                  border = '1px solid #ef4444';
                                  color = '#ef4444';
                                }
                              } else if (isSelected) {
                                border = '1px solid var(--accent)';
                              }

                              return (
                                <button 
                                  key={j}
                                  disabled={isSubmitted}
                                  onClick={() => setQuizAnswers({...quizAnswers, [i]: j})}
                                  style={{
                                    textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                                    background: bg, border: border, color: color,
                                    fontSize: '0.85rem', cursor: isSubmitted ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                  }}
                                >
                                  {ans}
                                  {isSubmitted && isCorrect && <CheckCircle2 size={16} />}
                                  {isSubmitted && isSelected && !isCorrect && <X size={16} />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
