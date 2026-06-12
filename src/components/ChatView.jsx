import { useState, useRef, useEffect } from 'react';
import { Send, Lightbulb, Sparkles, Bot, RefreshCw } from 'lucide-react';
import { chatWithAI, explainSimpler } from '../lib/gemini';

const MSGS = [
  { id: 1, role: 'user', text: "Можешь объяснить Первый закон Кирхгофа? Завтра экзамен, а я совсем запутался." },
  { id: 2, role: 'ai',
    text: "Конечно! Первый закон Кирхгофа (ЗТК) гласит, что алгебраическая сумма токов, сходящихся в любом узле цепи, равна нулю. Или проще: сколько тока втекает в узел, столько же должно из него вытекать.\n\nМатематически: ΣI_вх = ΣI_вых\n\nЕсли в узел втекает ток 5А, и он разделяется на две ветви с токами 2А и 3А, закон выполняется: 5А (вход) = 2А + 3А (выход). Это следствие закона сохранения заряда — заряд не может накапливаться в узле.",
    simpler: "Представь себе перекресток на дороге 🚗. Все машины, которые въезжают на перекресток, должны с него выехать по разным дорогам. Машины не могут просто исчезнуть или начать накапливаться в центре перекрестка! Если 5 машин въезжают каждую секунду, то 5 машин должны выезжать. Ток (электроны) работает точно так же — сколько втекло, столько и вытекло. Это просто правила дорожного движения для электричества!"
  },
  { id: 3, role: 'user', text: "Окей, это понятно! А как насчет Второго закона Кирхгофа?" },
  { id: 4, role: 'ai',
    text: "Второй закон Кирхгофа (ЗНК) утверждает, что алгебраическая сумма падений напряжений на всех элементах любого замкнутого контура цепи равна алгебраической сумме ЭДС в этом контуре.\n\nФормула: ΣE = Σ(I·R)\n\nНапример, если в контуре есть батарея на 12В и два резистора (где на одном падает 4В, а на другом 8В), то уравнение будет: 12В = 4В + 8В.",
    simpler: "Представь аквапарк! 🎢 Батарейка — это водяной насос, который поднимает воду наверх, давая ей энергию (напряжение). Трубы и горки — это резисторы. Вода скатывается вниз, теряя энергию. К тому моменту, когда вода возвращается обратно к насосу, вся энергия (высота), которую она получила, должна быть потрачена на горках. Второй закон просто говорит: сколько энергии насос дал, столько вода и потратила за один круг. Счёт всегда сводится к нулю! 💧"
  }
];

function Typing() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bot size={14} color="var(--text-2)" />
      </div>
      <div className="bubble-ai" style={{ padding: '14px 16px', display: 'flex', gap: 4 }}>
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  );
}

export default function ChatView() {
  const [msgs, setMsgs] = useState(MSGS);
  const [inp, setInp] = useState('');
  const [typing, setTyping] = useState(false);
  const [simps, setSimps] = useState(new Set());
  const [loadingSimp, setLoadingSimp] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const onSimp = async (id) => {
    const m = msgs.find(x => x.id === id);
    if (simps.has(id) || loadingSimp === id) return;
    setLoadingSimp(id);
    const simplerText = m.simpler ? m.simpler : await explainSimpler(m.text);
    setLoadingSimp(null);
    setSimps(s => new Set([...s, id]));
    setMsgs(p => {
      const i = p.findIndex(x => x.id === id);
      const nw = [...p];
      nw.splice(i + 1, 0, { id: Date.now(), role: 'ai', text: simplerText, isSimp: true });
      return nw;
    });
  };

  const onSend = async () => {
    if (!inp.trim()) return;
    const newMsg = { id: Date.now(), role: 'user', text: inp.trim() };
    setMsgs(p => [...p, newMsg]);
    setInp('');
    setTyping(true);
    
    // Call Gemini API
    const responseText = await chatWithAI(msgs, newMsg.text);
    
    setTyping(false);
    setMsgs(p => [...p, { id: Date.now()+1, role: 'ai', text: responseText }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxHeight: 720 }} className="anim-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Чат с ИИ-репетитором</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              В сети · Режим «Объясни на пальцах»
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setMsgs(MSGS); setSimps(new Set()); }}>
          <RefreshCw size={12} /> Новый чат
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 8, marginBottom: 16 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'user' ? (
              <div className="bubble-user">{m.text}</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 4 }}>
                  <Bot size={14} color="var(--text-2)" />
                </div>
                <div>
                  <div className={`bubble-ai ${m.isSimp ? 'anim-pop' : ''}`} style={m.isSimp ? { borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.05)' } : {}}>
                    {m.isSimp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
                        <Lightbulb size={12} /> Объяснение проще
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  </div>
                  {!m.isSimp && !simps.has(m.id) && (
                    <button
                      onClick={() => onSimp(m.id)}
                      disabled={loadingSimp === m.id}
                      style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(249,115,22,0.2)', cursor: loadingSimp === m.id ? 'not-allowed' : 'pointer', opacity: loadingSimp === m.id ? 0.6 : 1 }}>
                      {loadingSimp === m.id
                        ? <><span className="dot" /><span className="dot" /><span className="dot" /></>
                        : <><Lightbulb size={12} /> 💡 Объясни проще (на пальцах)</>
                      }
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {typing && <Typing />}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <textarea
          className="field" rows={1}
          placeholder="Спроси что-нибудь по учебе..."
          value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          style={{ minHeight: 46, maxHeight: 120, resize: 'none' }}
        />
        <button className="btn btn-primary" style={{ width: 46, height: 46, padding: 0, borderRadius: 12, flexShrink: 0 }} disabled={!inp.trim()} onClick={onSend}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
