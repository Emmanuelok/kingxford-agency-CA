# Avalon identity — 22 October 2026

A connected AV monogram in coral, paired with Avalon’s existing custom outlined wordmark and an outlined CREATIVES GROUP descriptor.

## Masters

- `public/brand/avalon-logo-dark.svg` and `.png`: transparent, for light backgrounds.
- `public/brand/avalon-logo-light.svg` and `.png`: transparent, for dark backgrounds.
- `public/brand/avalon-logo-mono-dark.svg` and `-light.svg`: single-colour reproduction.
- `public/brand/avalon-symbol.svg`: independent coral AV.
- `public/brand/avalon-og-2026.jpg`: 1200 × 630 social preview.
- `public/favicon.svg`, `public/brand/favicon-32.png`, and `public/brand/apple-touch-icon.png`: browser and bookmark icons.

## Construction and reuse

Keep at least one-quarter of the symbol’s height clear around the lockup. Use the symbol alone below 160 px of available horizontal space. The horizontal website lockup is 200–260 CSS pixels wide. Keep the SVG proportions; do not stretch. PNG logos have true alpha and are 2120 × 480. All lettering in the SVG and React master is outlined, requiring no font downloads.

`python scripts/build-brand-assets.py` rebuilds the SVG masters and `components/avalon-logo.tsx`. It requires fontTools and DejaVu Sans at the documented system path. The font license is included alongside this file. PNG exports use Sharp.

## Open Graph generation

Created with the built-in image-generation tool using the new logo as reference. Prompt direction: exact AV silhouette and AVALON CREATIVES GROUP lockup, an architectural satin-vermilion emblem with warm metal sides on a charcoal gallery floor, ivory and pale-peach headlines, large readable typography, no people or additional imagery. Exact text: “Ideas with vision. Work with impact.”, “STRATEGY · BRAND · FILM · DIGITAL · GROWTH”, and “avaloncreative.group”. The generated master was resized and JPEG-encoded for the 1200 × 630 delivery.

Root Open Graph and Twitter metadata point to the versioned JPEG. Project-specific previews continue to use the project images.
