import { useId } from "react";

/**
 * The A/V diagonals need overlapping bounding boxes to have the same optical
 * breathing room as the upright and round forms. These positions are deliberate:
 * diagonal pairs leave a 50-unit corridor; the remaining pairs have 34-unit
 * bounding-box gaps. Color regions follow each letter's stems, joints and crossbars.
 */
const glyphs = [
  {
    key: "a-first",
    x: 0,
    sourceX: 0,
    width: 735,
    outline: "M0 726 256 16H479L735 726H535L495 609H239L199 726ZM291 457H444L368 232Z",
    segments: [
      { fill: "#ff604c", d: "M0 0H368V742H0Z" },
      { fill: "#f69856", d: "M0 457H735V609H0Z" },
    ],
  },
  {
    key: "v",
    x: 529,
    sourceX: 749,
    width: 736,
    outline: "M1005 726 749 16H949L1117 504L1285 16H1485L1227 726Z",
    segments: [
      { fill: "#b8a1f4", d: "M368 0H736V742H368Z" },
      { fill: "#ff604c", d: "M0 504H736V742H0Z" },
    ],
  },
  {
    key: "a-second",
    x: 1059,
    sourceX: 1499,
    width: 735,
    outline: "M1499 726 1755 16H1978L2234 726H2034L1994 609H1738L1698 726ZM1790 457H1943L1867 232Z",
    segments: [
      { fill: "#c6e677", d: "M368 0H735V742H368Z" },
      { fill: "#b8a1f4", d: "M0 457H735V609H0Z" },
    ],
  },
  {
    key: "l",
    x: 1828,
    sourceX: 2248,
    width: 505,
    outline: "M2248 726V16H2444V685L2332 569H2753V726Z",
    segments: [
      { fill: "#ff604c", d: "M0 569H505V742H0Z" },
      { fill: "#f69856", d: "M0 569H196V742H0Z" },
    ],
  },
  {
    key: "o",
    x: 2367,
    sourceX: 2767,
    width: 720,
    outline: "M3127.03 742Q3015 742 2934 697Q2853 652 2810 569Q2767 486 2767 372Q2767 258 2810 174.5Q2853 91 2933.75 45.5Q3014.5 0 3127 0Q3240.15 0 3320.57 45.5Q3401 91 3444 174.5Q3487 258 3487 372Q3487 486 3444 569Q3401 652 3320.58 697Q3240.17 742 3127.03 742ZM3126.79 585Q3177 585 3212.54 559.85Q3248.09 534.69 3267.04 487.35Q3286 440 3286 372Q3286 304 3267 256.11Q3248 208.23 3212.38 182.61Q3176.75 157 3126.54 157Q3077 157 3041.46 182.61Q3005.91 208.23 2986.96 256.11Q2968 304 2968 372Q2968 440 2987 487.35Q3006 534.69 3041.62 559.85Q3077.25 585 3126.79 585Z",
    segments: [
      { fill: "#f69856", d: "M360 0H720V742H360Z" },
      { fill: "#c6e677", d: "M0 372H360V742H0Z" },
    ],
  },
  {
    key: "n",
    x: 3121,
    sourceX: 3501,
    width: 631,
    outline: "M3501 726V16H3699L3936 416V16H4132V726H3934L3697 346V726Z",
    segments: [
      { fill: "#b8a1f4", d: "M198 16 435 416V726L196 346Z" },
      { fill: "#ff604c", d: "M435 416H631V726H435Z" },
    ],
  },
] as const;

export function AvalonWordmark({ className }: { className?: string }) {
  const instanceId = useId();

  return (
    <svg
      className={className}
      viewBox="0 0 3752 742"
      width="3752"
      height="742"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {glyphs.map((glyph) => (
          <clipPath key={glyph.key} id={`${instanceId}-${glyph.key}`}>
            <path
              d={glyph.outline}
              transform={`translate(${-glyph.sourceX} 0)`}
            />
          </clipPath>
        ))}
      </defs>
      {glyphs.map((glyph) => (
        <g key={glyph.key} transform={`translate(${glyph.x} 0)`}>
          <g clipPath={`url(#${instanceId}-${glyph.key})`}>
            <rect width={glyph.width} height="742" fill="#f4eee3" />
            {glyph.segments.map((segment) => (
              <path key={segment.fill} fill={segment.fill} d={segment.d} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}
