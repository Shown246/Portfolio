import SectionHeader from './SectionHeader';

export default function AboutSection() {
  return (
    <section id="about" className="px-5 md:px-12 py-20 md:py-32 max-w-6xl mx-auto">
      <SectionHeader num="01" name="about_me" fn />
      <div className="flex flex-col gap-10 md:flex-row md:gap-16 md:items-start">
        {/* photo frame */}
        <div className="flex flex-col gap-2">
          <div className="relative w-[140px] h-[170px] bg-[#111] flex items-center justify-center overflow-hidden">
            <span className="text-white text-[28px] font-bold tracking-widest">SS</span>

            {/* glitch lines */}
            <span className="absolute left-0 h-[2px] bg-crimson opacity-70" style={{ top: '30%', width: '70%' }} />
            <span className="absolute left-0 h-[2px] bg-crimson opacity-50" style={{ top: '45%', width: '40%' }} />
            <span className="absolute left-0 h-[2px] bg-crimson opacity-60" style={{ top: '60%', width: '85%' }} />

            {/* corner brackets */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-crimson" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-crimson" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-crimson" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-crimson" />

            {/* photo-local scanlines */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.04) 2px 3px)',
              }}
            />
          </div>
          <span className="text-[#333] text-[11px]">x:0 y:0 // photo.jpg</span>
        </div>

        {/* bio */}
        <div className="flex-1 flex flex-col gap-6">
          <pre className="text-[14px] leading-[2] font-mono whitespace-pre">
            <code>
              <span className="text-[#999]">{'const '}</span>
              <span className="text-[#999]">{'shihab = {\n'}</span>
              <span className="text-[#999]">{'  role: '}</span>
              <span className="text-crimson">{'"Software Developer & AI Engineer"'}</span>
              <span className="text-[#999]">{',\n  passion: '}</span>
              <span className="text-crimson">{'"building intelligent systems"'}</span>
              <span className="text-[#999]">{'\n};'}</span>
            </code>
          </pre>

          <p className="text-[#666] text-[14px] leading-[2]">
            I&apos;m a software developer and AI engineer who treats every project like a small lab experiment.
            I care about clean systems, fast feedback loops, and the parts of a product users never notice
            but always feel. Lately I&apos;ve been building retrieval-augmented apps, fine-tuning small models,
            and shipping production web apps that don&apos;t get in the way. When I&apos;m not writing code I&apos;m
            usually reading papers, breaking things in a notebook, or improving my dotfiles.
          </p>
        </div>
      </div>
    </section>
  );
}
