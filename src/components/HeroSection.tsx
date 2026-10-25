import TerminalChat from './TerminalChat';
import { socialLinks } from '../data/socialLinks';

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center px-5 md:px-12 pt-24 pb-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-12 md:flex-row md:gap-16 md:items-center">
        <div className="flex-1 flex flex-col gap-6">
          <span className="text-crimson text-[10px] tracking-[0.2em]">// HELLO WORLD</span>

          <div
            className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-[10px] text-ink-body"
            style={{ border: '0.5px solid rgba(220,20,60,0.3)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse2" />
            Available for opportunities
          </div>

          <h1 className="font-bold leading-[1.05]">
            <span className="block text-white text-[44px] md:text-[64px]">Shihab</span>
            <span className="block text-[44px] md:text-[64px]">
              <span className="text-crimson">Shown</span>
              <span className="text-termgreen">.</span>
            </span>
          </h1>

          <p className="text-[#888] text-[13px] italic">
            &ldquo;Building intelligent systems, one line at a time&rdquo;
          </p>

          <a
            href="/Shihab_Shown-Resume.pdf"
            download
            className="inline-flex items-center gap-2 self-start px-4 py-2 text-[12px] text-ink-body transition-all duration-200 hover:border-termgreen hover:shadow-[0_0_12px_rgba(74,246,38,0.15)]"
            style={{ border: '0.5px solid #333' }}
          >
            <span className="text-crimson">&gt;</span>
            download_resume.pdf
          </a>

          <div className="flex gap-2">
            {socialLinks.map(s => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="w-8 h-8 flex items-center justify-center text-[12px] text-[#666] transition-colors duration-200 hover:text-crimson hover:border-crimson"
                style={{ border: '0.5px solid #222' }}
              >{s.label}</a>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0">
          <TerminalChat />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#333] text-[10px] tracking-[0.3em]">
        SCROLL
        <span className="animate-bob">▾</span>
      </div>
    </section>
  );
}
