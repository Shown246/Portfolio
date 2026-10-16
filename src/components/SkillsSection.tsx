import { devSkills, aiSkills, type Skill } from '@/data/skills';

const sizeClass: Record<Skill['size'], string> = {
  lg: 'text-[12px] px-[18px] py-[8px]',
  md: 'text-[10px] px-[14px] py-[6px]',
  sm: 'text-[9px] px-[10px] py-[5px] opacity-70',
};

function Tags({ skills, variant }: { skills: Skill[]; variant: 'dev' | 'ai' }) {
  const base =
    variant === 'dev'
      ? 'text-crimson hover:shadow-[0_0_12px_rgba(220,20,60,0.18)]'
      : 'text-termgreen hover:shadow-[0_0_12px_rgba(74,246,38,0.18)]';
  const bgBorder =
    variant === 'dev'
      ? { background: 'rgba(220,20,60,0.06)', border: '0.5px solid rgba(220,20,60,0.15)' }
      : { background: 'rgba(74,246,38,0.04)', border: '0.5px solid rgba(74,246,38,0.12)' };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map(s => (
        <span
          key={s.name}
          className={`rounded-md transition-all duration-200 ${sizeClass[s.size]} ${base}`}
          style={bgBorder}
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}

function CategoryLabel({ text, variant }: { text: string; variant: 'dev' | 'ai' }) {
  const color = variant === 'dev' ? 'text-crimson' : 'text-termgreen';
  const line  = variant === 'dev' ? 'rgba(220,20,60,0.15)' : 'rgba(74,246,38,0.15)';
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-[10px] tracking-[0.3em] ${color}`}>{text}</span>
      <span className="flex-1" style={{ height: '0.5px', background: line }} />
    </div>
  );
}

export default function SkillsSection() {
  return (
    <section id="skills" className="px-5 md:px-12 py-20 md:py-32 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <span className="text-crimson text-[9px] tracking-[0.3em]">// 02</span>
        <h2 className="text-white text-[28px] font-bold">
          my_<span className="text-crimson">skills</span>
        </h2>
        <div className="section-divider w-full" />
      </div>

      <div className="flex flex-col gap-10">
        <div>
          <CategoryLabel text="DEVELOPMENT" variant="dev" />
          <Tags skills={devSkills} variant="dev" />
        </div>
        <div>
          <CategoryLabel text="AI / MACHINE LEARNING" variant="ai" />
          <Tags skills={aiSkills} variant="ai" />
        </div>
      </div>
    </section>
  );
}
