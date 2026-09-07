import { ArrowDownRight } from "lucide-react";

export function PageHero({ eyebrow, title, accent, description, index }: { eyebrow: string; title: string; accent?: string; description: string; index: string }) {
  return (
    <section className="page-hero" id="main-content">
      <div className="page-hero-grid" aria-hidden="true" />
      <div className="page-hero-meta"><span>{index}</span><span>{eyebrow}</span><span>AVALON CREATIVE GROUP</span></div>
      <h1>{title}{accent && <><br /><em>{accent}</em></>}</h1>
      <div className="page-hero-bottom">
        <p>{description}</p>
        <ArrowDownRight size={42} strokeWidth={1} />
      </div>
    </section>
  );
}
