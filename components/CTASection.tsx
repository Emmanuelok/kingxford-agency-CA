import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type CTASectionProps = {
  eyebrow?: string;
  title?: string;
  copy?: string;
};

export function CTASection({
  eyebrow = "Start with a useful conversation",
  title = "Bring us the ambition. We’ll build the way through.",
  copy = "Tell us what needs to move—your market, your brand or your pipeline. We’ll respond with a clear next step.",
}: CTASectionProps) {
  return (
    <section className="cta-section">
      <div className="cta-section__signal" aria-hidden="true" />
      <div className="shell cta-section__inner">
        <p className="eyebrow eyebrow--light"><span aria-hidden="true" />{eyebrow}</p>
        <h2>{title}</h2>
        <div className="cta-section__base">
          <p>{copy}</p>
          <Link className="button button--light" href="/start-a-project">
            Start a project <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
