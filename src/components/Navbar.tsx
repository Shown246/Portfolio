'use client';
import { useEffect, useState } from 'react';

const LINKS = [
  { id: 'home', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'skills', label: 'skills' },
  { id: 'projects', label: 'projects' },
  { id: 'ai_lab', label: 'ai_lab' },
  { id: 'contact', label: 'contact' },
];

export default function Navbar() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 120;
      for (const { id } of LINKS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y && el.offsetTop + el.offsetHeight > y) {
          setActive(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 md:gap-1 px-3 md:px-4 py-2 rounded-[40px]"
      style={{
        background: 'rgba(20,20,28,0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '0.5px solid rgba(220,20,60,0.2)',
      }}
    >
      {LINKS.map(l => (
        <a
          key={l.id}
          href={`#${l.id}`}
          onClick={go(l.id)}
          className={`px-3 py-1.5 rounded-[20px] text-[9px] md:text-[10px] transition-colors duration-200 ${
            active === l.id
              ? 'text-crimson'
              : 'text-[#888] hover:text-crimson hover:bg-[rgba(220,20,60,0.1)]'
          }`}
          style={active === l.id ? { background: 'rgba(220,20,60,0.1)' } : undefined}
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}
