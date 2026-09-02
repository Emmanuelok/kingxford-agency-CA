import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  copy?: ReactNode;
  align?: "left" | "split";
};

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "split",
}: SectionHeadingProps) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <p className="eyebrow"><span aria-hidden="true" />{eyebrow}</p>
      <div className="section-heading__body">
        <h2 className="section-title">{title}</h2>
        {copy && <div className="section-heading__copy">{copy}</div>}
      </div>
    </div>
  );
}
