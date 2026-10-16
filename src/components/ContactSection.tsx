'use client';
import { useState } from 'react';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong.');
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#0D0D0D',
    border: '0.5px solid #222',
    borderRadius: 4,
    color: '#E8E8E8',
  };

  return (
    <section id="contact" className="px-5 md:px-12 py-20 md:py-32 max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <span className="text-crimson text-[9px] tracking-[0.3em]">// 05</span>
        <h2 className="text-white text-[28px] font-bold">
          contact_me<span className="text-crimson">()</span>
        </h2>
        <div className="section-divider w-full" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          required
          placeholder="name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          disabled={status === 'sending'}
          className="px-4 py-3 text-[12px] outline-none focus:border-crimson focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] placeholder:text-[#333] disabled:opacity-50"
          style={inputStyle}
        />
        <input
          required
          type="email"
          placeholder="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          disabled={status === 'sending'}
          className="px-4 py-3 text-[12px] outline-none focus:border-crimson focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] placeholder:text-[#333] disabled:opacity-50"
          style={inputStyle}
        />
        <textarea
          required
          placeholder="message"
          rows={5}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          disabled={status === 'sending'}
          className="px-4 py-3 text-[12px] outline-none focus:border-crimson focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] placeholder:text-[#333] resize-none disabled:opacity-50"
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="self-start inline-flex items-center gap-2 px-4 py-2 text-[12px] text-ink-body transition-all duration-200 hover:border-crimson hover:shadow-[0_0_12px_rgba(220,20,60,0.2)] disabled:opacity-50"
          style={{ border: '0.5px solid #333' }}
        >
          <span className="text-crimson">&gt;</span> {status === 'sending' ? 'sending_message...' : 'send_message'}
        </button>
        {status === 'sent' && (
          <span className="text-termgreen text-[10px] font-mono">// message sent successfully! I will get back to you soon.</span>
        )}
        {status === 'error' && (
          <span className="text-crimson text-[10px] font-mono">// error: {errorMessage}</span>
        )}
      </form>

      <div className="flex gap-2 mt-8">
        {['GH','LI','X'].map(s => (
          <a key={s} href="#" className="w-8 h-8 flex items-center justify-center text-[10px] text-[#666] hover:text-crimson hover:border-crimson" style={{ border: '0.5px solid #222' }}>{s}</a>
        ))}
      </div>
    </section>
  );
}
