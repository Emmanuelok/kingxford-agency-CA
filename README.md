# KINGXFORD Agency

Production website for KINGXFORD, an independent creative and growth agency launching in St. John’s, Newfoundland and Labrador, and serving organizations across Canada.

The site combines brand strategy, integrated campaigns, social, digital products, search, performance media, film and content production, AI-enabled marketing operations, and data/CRM services. Portfolio entries currently published under **Work** are explicitly labelled fictional concept demonstrations; they are not represented as client engagements or completed results.

## Technology

- Next.js 16 App Router and React 19
- TypeScript with strict type checking
- Self-hosted variable Manrope and Inter fonts
- Vercel Analytics and Speed Insights
- Server-side inquiry validation with optional Resend and CRM webhook delivery
- Native metadata routes for `sitemap.xml`, `robots.txt`, and `manifest.webmanifest`

## Local development

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before publishing a change, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Optional on Vercel | Canonical public origin used by metadata, the sitemap, and `robots.txt`, for example `https://www.example.ca`. Vercel deployments fall back to `VERCEL_PROJECT_PRODUCTION_URL`; set this explicitly for a custom domain. |
| `NEXT_PUBLIC_CINEMATIC_VIDEO_URL` | Optional | Overrides the bundled cinematic hero video with a stable public HTTPS video URL. When empty, `/public/media/kingxford-cinematic-hero.mp4` is used. |
| `RESEND_API_KEY` | For email delivery | Resend API key used only by the server-side inquiry route. |
| `CONTACT_TO_EMAIL` | For email delivery | Verified destination that receives project inquiries. |
| `CONTACT_FROM_EMAIL` | For email delivery | Sender accepted by the configured Resend account, normally on a verified domain. |
| `CRM_WEBHOOK_URL` | Optional alternative | HTTPS endpoint that receives a `kingxford.inquiry.created` JSON event. |

At least one delivery path—complete Resend configuration or `CRM_WEBHOOK_URL`—must be present for online inquiry delivery. If neither is configured, the API returns a clear unavailable response and the interface lets the visitor download or copy the brief instead of claiming it was sent. The route validates and sanitizes fields, includes a honeypot, and applies a best-effort in-memory rate limit. For sustained or high-risk traffic, replace that limit with a durable shared store and add server-side bot verification.

Keep `.env.local` and production secrets out of Git. Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Content and routes

Core offer, industry, concept-work, insight, and location records live in `lib/content.ts`. Site identity and media defaults live in `lib/site.ts`.

Main routes include:

- `/services` and nine service detail pages
- `/industries` and six sector detail pages
- `/work` and three clearly disclosed concept demonstrations
- `/insights` and three strategic articles
- `/locations`, with St. John’s identified as the launch base and all other markets described honestly
- `/approach`, `/about`, `/studio`, `/estimate`, `/start-a-project`, and `/contact`
- `/accessibility`, `/privacy`, `/cookies`, and `/terms`

The estimate tool is an indicative planning aid in Canadian dollars, not a quote. Final scope, fees, timing, media investment, travel, talent, licensing, taxes, and third-party costs require a written proposal.

## Deploy from GitHub to Vercel

1. In Vercel, create a project and import `Emmanuelok/kingxford-agency-CA` from GitHub.
2. Keep the detected framework preset as **Next.js**. The repository root is the application root; no custom build or output directory is required.
3. Add the production environment variables listed above. Use the final Vercel or custom-domain origin for `NEXT_PUBLIC_SITE_URL`.
4. Deploy. Vercel will run `next build` and create a production deployment.
5. If the first deployment used a temporary URL, update `NEXT_PUBLIC_SITE_URL` to the final production origin and redeploy so canonical metadata is correct.
6. Verify the homepage video, `/services`, `/start-a-project`, `/contact`, `/sitemap.xml`, and an unknown route before announcing launch.

Once imported, commits to the production branch deploy automatically through the GitHub integration. Use Vercel preview deployments for review branches and promote only verified builds.

## Inquiry delivery contract

`POST /api/inquiry` accepts JSON, validates required contact and project fields, and attempts every configured delivery path. It returns success when at least one configured destination accepts the inquiry. It does not store submissions in this repository or a bundled database.

Before collecting real inquiries, publish the correct legal identity and contact details in the privacy and terms pages, verify the selected email or CRM destination, and test end-to-end delivery with a non-sensitive sample submission.

## Accessibility and performance

The interface includes a skip link, semantic landmarks, a focus-contained mobile navigation dialog, labelled controls, first-error focus, status announcements, reduced-motion behaviour, responsive layouts, self-hosted fonts, optimized raster media, and literal alternative text. AI-assisted cinematic and still imagery is disclosed visibly. Accessibility and performance should be regression-tested after content, motion, or third-party-script changes.

© KINGXFORD. Repository contents are for this project; no license for reuse is granted by default.
