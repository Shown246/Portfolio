'use client';
import { useEffect, useRef, useState } from 'react';
import { sendMessage, type ChatMessage } from '@/lib/chatbot';

const SEED: ChatMessage[] = [
  { role: 'ai', text: "Hi — I'm Shihab's AI. Ask me about his skills, projects, or experience." },
  { role: 'user', text: 'what are your top skills?' },
  { role: 'ai', text: 'React/Next.js, TypeScript, Python, and the modern AI stack — LangChain, RAG, LLMs.' },
];

export default function TerminalChat() {
  const [history, setHistory] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }); }, [history]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setHistory(h => [...h, { role: 'user', text: q }]);
    const reply = await sendMessage(q, history);
    setHistory(h => [...h, { role: 'ai', text: reply }]);
    setBusy(false);
  };

  return (
    <div
      className="w-[340px] flex flex-col bg-bg-term overflow-hidden"
      style={{ border: '0.5px solid #1A3A1A', borderRadius: 8 }}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '0.5px solid #1A3A1A' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: '#E24B4A' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#EF9F27' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#97C459' }} />
        <span className="ml-2 text-[10px] text-[#666]">shihab-ai ~ ask-me-anything</span>
      </div>

      {/* body */}
      <div ref={bodyRef} className="px-3 py-3 h-[280px] overflow-y-auto text-[12px] leading-[1.6]">
        {history.map((m, i) => (
          <div key={i} className="mb-2">
            {m.role === 'user' ? (
              <div>
                <span className="text-termgreen">visitor@portfolio:~$ </span>
                <span style={{ color: '#B0FFB0' }}>{m.text}</span>
              </div>
            ) : (
              <div style={{ color: '#6B8F6B' }}>{m.text}</div>
            )}
          </div>
        ))}
        <form onSubmit={submit} className="flex items-center">
          <span className="text-termgreen">visitor@portfolio:~$&nbsp;</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={busy}
            className="flex-1 bg-transparent outline-none text-[#B0FFB0] text-[12px]"
            autoComplete="off"
          />
          <span className="inline-block w-2 h-3 bg-termgreen animate-blink" />
        </form>
      </div>

      {/* footer label */}
      <div className="px-3 py-2 text-termgreen text-[9px] tracking-[0.1em]" style={{ borderTop: '0.5px solid #1A3A1A' }}>
        // ASK MY AI ABOUT ME
      </div>
    </div>
  );
}
