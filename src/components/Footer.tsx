import { socialLinks } from '../data/socialLinks';

export default function Footer() {
  return (
    <footer className="px-5 md:px-12 mt-12">
      <div className="section-divider w-full mb-4" />
      <div className="max-w-6xl mx-auto h-[60px] flex items-center justify-between">
        <span className="text-[#333] text-[12px]">© 2026 Shihab Shown</span>
        <div className="flex gap-2">
          {socialLinks.map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="w-8 h-8 flex items-center justify-center text-[12px] text-[#666] hover:text-crimson hover:border-crimson" style={{ border: '0.5px solid #222' }}>{s.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
