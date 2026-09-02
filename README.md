# KINGXFORD Agency

The original production website for KINGXFORD, an independent integrated agency launching from St. John's, Newfoundland and Labrador.

## Experience

- Scroll-operated cinematic opening sequence
- Integrated work, services, studio, platform, markets and agency pages
- Interactive agency operating system and planning tools
- Responsive desktop and mobile frame sequences
- Accessible reduced-motion fallback

## Local development

```bash
npm ci
npm run dev
```

## Production checks

```bash
npm run lint
npm run build
```

The production deployment uses Vercel's Next.js runtime. Set `NEXT_PUBLIC_SITE_URL` only when moving the canonical site to a different public domain.
