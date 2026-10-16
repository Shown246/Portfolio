'use client';
import { useState } from 'react';
import { experiments, type ExperimentType } from '@/data/experiments';

const typeColor: Record<ExperimentType, string> = {
  Demo: 'text-termgreen',
  Notebook: 'text-crimson',
  Research: 'text-[#888]',
};

export default function AILabSection() {
  const [showAll, setShowAll] = useState(false);

  const visibleExperiments = showAll ? experiments : experiments.slice(0, 3);

  return (
    <section id="ai_lab" className="px-5 md:px-12 py-20 md:py-32 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <h2 className="text-termgreen text-[20px] font-bold">
          $ ./ai-experiments<span className="inline-block w-2 h-4 bg-termgreen ml-1 animate-blink align-middle" />
        </h2>
        <div className="section-divider w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleExperiments.map(e => (
          <div
            key={e.id}
            className="bg-bg-term overflow-hidden transition-all duration-200 hover:shadow-[0_0_18px_rgba(74,246,38,0.12)] flex flex-col justify-between"
            style={{ border: '1px dashed rgba(74,246,38,0.25)', borderRadius: 8 }}
          >
            <div>
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '0.5px dashed rgba(74,246,38,0.2)' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#E24B4A' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF9F27' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#97C459' }} />
                <span className="ml-2 text-[9px] text-[#666]">{e.name}</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <p className="text-[#999] text-[11px] leading-[1.6]">{e.description}</p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] tracking-[0.2em] ${typeColor[e.type]}`}>[{e.type.toUpperCase()}]</span>
                <a href={e.link} className="text-[10px] text-termgreen hover:underline">open →</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {experiments.length > 3 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-[11px] font-mono text-termgreen transition-all duration-200 hover:bg-[rgba(74,246,38,0.08)] active:scale-95"
            style={{ border: '1px dashed rgba(74,246,38,0.4)', background: 'rgba(74,246,38,0.03)' }}
          >
            <span>{showAll ? '$ cd .. # show less' : `$ ./load-more --all (${experiments.length - 3} more)`}</span>
          </button>
        </div>
      )}
    </section>
  );
}
