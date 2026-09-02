import Image from "next/image";
import type { ReactNode } from "react";

type MediaFrameProps = {
  alt: string;
  badge?: ReactNode;
  className?: string;
  priority?: boolean;
  src: string;
};

export function MediaFrame({ alt, badge, className = "", priority, src }: MediaFrameProps) {
  return (
    <figure className={`media-frame ${className}`}>
      <Image alt={alt} fill priority={priority} sizes="(max-width: 760px) 100vw, 60vw" src={src} />
      <span className="media-frame__wash" aria-hidden="true" />
      <span className="media-frame__provenance">AI-assisted conceptual artwork</span>
      {badge && <figcaption>{badge}</figcaption>}
    </figure>
  );
}
