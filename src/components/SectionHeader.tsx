export default function SectionHeader({ num, name, fn }: { num: string; name: string; fn?: boolean }) {
  return (
    <div className="flex flex-col gap-3 mb-10">
      <span className="text-crimson text-[9px] tracking-[0.3em]">// {num}</span>
      <h2 className="text-white text-[28px] font-bold">
        {name}
        <span className="text-crimson">{fn ? '()' : ''}</span>
      </h2>
      <div className="section-divider w-full" />
    </div>
  );
}
