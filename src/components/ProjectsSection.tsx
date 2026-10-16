'use client';
import { useEffect, useState } from 'react';
import { projects, type Project } from '@/data/projects';

export default function ProjectsSection() {
  const [open, setOpen] = useState<Project | null>(null);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleProjects = showAll ? projects : projects.slice(0, 3);

  return (
    <section id="projects" className="px-5 md:px-12 py-20 md:py-32 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <span className="text-crimson text-[9px] tracking-[0.3em]">// 03</span>
        <h2 className="text-white text-[28px] font-bold">
          my_<span className="text-crimson">projects</span>
        </h2>
        <div className="section-divider w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleProjects.map(p => (
          <button
            key={p.id}
            onClick={() => setOpen(p)}
            className="group text-left bg-bg-card overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] flex flex-col justify-between"
            style={{ border: '0.5px solid #1A1A22', borderRadius: 8 }}
          >
            <div>
              <div className={`h-[180px] bg-gradient-to-br ${p.gradient}`} />
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-white text-[14px] font-bold">{p.title}</h3>
                <p className="text-[#888] text-[10px] leading-[1.6]">{p.short}</p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {p.tech.map(t => (
                  <span
                    key={t}
                    className="text-crimson text-[8px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(220,20,60,0.06)', border: '0.5px solid rgba(220,20,60,0.15)' }}
                  >{t}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {projects.length > 3 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-[11px] font-mono text-crimson transition-all duration-200 hover:bg-[rgba(220,20,60,0.1)] active:scale-95"
            style={{ border: '0.5px solid rgba(220,20,60,0.4)', background: 'rgba(220,20,60,0.04)' }}
          >
            <span>{showAll ? '< Show Less' : `Show More (${projects.length - 3} more) >`}</span>
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setOpen(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-bg-card p-8"
            style={{ border: '0.5px solid rgba(220,20,60,0.3)', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute top-3 right-4 text-[#888] hover:text-crimson text-[14px]"
              aria-label="close"
            >×</button>
            <div className={`h-[220px] mb-5 bg-gradient-to-br ${open.gradient}`} />
            <h3 className="text-white text-[20px] font-bold mb-2">{open.title}</h3>
            <p className="text-[#999] text-[12px] leading-[1.7] mb-4">{open.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {open.tech.map(t => (
                <span key={t} className="text-crimson text-[9px] px-2 py-1 rounded" style={{ background: 'rgba(220,20,60,0.06)', border: '0.5px solid rgba(220,20,60,0.15)' }}>{t}</span>
              ))}
            </div>
            <a href={open.liveUrl} className="inline-flex items-center gap-2 text-[12px] text-ink-body" style={{ border: '0.5px solid #333', padding: '8px 16px' }}>
              <span className="text-crimson">&gt;</span> View Live Project →
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
