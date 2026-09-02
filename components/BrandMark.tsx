import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link className="brand-mark" href="/" aria-label="KINGXFORD home">
      <span aria-hidden="true" className="brand-mark__signal" />
      <span className="brand-mark__name">KINGXFORD</span>
      {!compact && <span className="brand-mark__descriptor">Agency</span>}
    </Link>
  );
}
