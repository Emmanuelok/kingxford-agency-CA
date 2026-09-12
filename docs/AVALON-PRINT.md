# Avalon Print

Avalon Print is the printing division inside `Emmanuelok/kingxford-agency-CA`. The existing Avalon agency site and its production Vercel project remain the host. The print catalogue, artwork editor, live mockups and estimates work without cloud credentials; accounts and production requests require the separate print backend described below.

## Studio v2: implemented workflows

The public workspace uses `components/next/app.tsx`, with its own forest, ivory and lime design system and bespoke photography. All 51 catalogue formats have distinct product illustrations, searchable specifications, filters, favourites and a three-product comparison. Twelve editable templates, a persistent brand kit, campaign composition, pricing experiments and a live API playground form the creation workflow.

The editor supports text, embedded PNG/JPG/WebP uploads, shapes, layer ordering, duplication, alignment, rotation, opacity, drag/resize, undo/redo and keyboard controls. Artwork uses millimetres, physical image proportions and resolution checks. Product-specific Three.js previews distinguish mugs, bottles, apparel, bags, packaging, books and flat formats; unsupported specialty products use an explicitly flat proof. Preview colour, materials and geometry are approximations. Artwork currently describes one printable face.

Projects save stable identities and immutable revisions (the latest 20 retained), with search, duplication, recoverable archives and restoration. Estimates contain multiple independently editable specifications, customer and delivery drafts, validation before review, CSV export and browser print/save-to-PDF. A local review status is preparation for human review, not a submitted production order. Prices remain proposed CAD planning estimates; tax, carrier pricing and final supplier rates are not live.

### Device storage and recovery

The default workspace saves to IndexedDB after a hydration gate and debounced, serialized writes. The save indicator reflects the transaction outcome. Atomic revision comparison and cross-tab notifications detect conflicting edits, preserve the current tab's unsaved work and offer backup export before reload. Storage can fail or be cleared by the browser; export/import is provided for recovery and transfer. Imports validate nested artwork and references before an atomic merge and remap colliding design identities consistently. Workspace limits are 200 projects, 200 estimates, 100 lines per estimate and 20 retained project revisions. Each embedded image is limited to 12 MB; raster export rejects allocations above 100 megapixels. Large embedded images and histories can consume browser storage quickly.

Device and cloud workspaces are deliberately separate. The optional Team & cloud panel requires the dedicated backend below. Cloud artwork enters device storage only through an explicit copy action. The campaign planner composes curated layouts; it does not present templates as AI generation. Authenticated cloud AI advice requires the separately configured server service. Payments, subscriptions, supplier fulfilment, carrier quotes and machine integrations still require implementation and provider activation.

Individual tools have an error boundary that keeps the parent workspace mounted if a lazy download or render fails, including an old asset URL after deployment. The recovery panel can export the retained workspace or save and reload. Reload only follows a successful IndexedDB flush; a storage failure or cross-tab conflict keeps the current page open.

## Application layout

| Location | Responsibility |
| --- | --- |
| `apps/print/components` | React studio, catalogue, account and workspace UI |
| `apps/print/lib/presswerk` | Catalogue/quote engine, client workspace access and server helpers |
| `apps/print/api` | Node API handlers; only these server modules read print secrets |
| `pages/api/print` | Next Pages API wrappers with a 600 KB body-parser limit |
| `apps/print/database/schema.sql` | Workspace, artwork, order, proof, quota and storage bootstrap |
| `apps/print/database/platform.sql` | Invitations and revocable developer API keys |
| `apps/print/tests` | Price, database access-control and API boundary tests |
| `public/print-app` | Generated Vite client assets; rebuilt with the agency site |

`npm run build:print` type-checks the print app and builds its Vite client into `public/print-app`. `npm run build` runs that step before the existing Next production build. Print styles and static assets are scoped to the print application, and browser requests use `/api/print/*`.

Next rewrites `/print` to `/print-app/index.html`. It also rewrites the root path to that file when the hostname is exactly `print.avaloncreative.group`. Requests to the agency apex continue to use the existing homepage. Application navigation after entry uses URL hashes; no catch-all rewrite captures the agency's other routes.

## Publish and attach the subdomain

The existing Vercel project is **kingxford-agency-ca** in **emmanueloks-projects**. Its production Git branch is `main` in `Emmanuelok/kingxford-agency-CA`. The print app is built from that repository root with the agency; do not change the Vercel root directory to `apps/print`.

1. Deploy the tested repository change using the existing production Git integration. Confirm the deployment is **Ready**, then visit `https://avaloncreative.group/print` and `/api/print/status`.
2. Open the [project domain settings](https://vercel.com/emmanueloks-projects/kingxford-agency-ca/settings/domains). Choose **Add Domain**, enter `print.avaloncreative.group`, and attach it to **Production** on this existing project.
3. Read the DNS recommendation Vercel displays **after attaching this exact subdomain**. At the authoritative DNS provider, add the indicated record for `print` using that exact target. Add any ownership-verification record Vercel explicitly requests. Preserve the apex, `www`, email and all unrelated records. Do not substitute a generic guessed CNAME target.
4. Wait for Vercel's domain check and TLS certificate to complete. Confirm `https://print.avaloncreative.group/` opens Avalon Print and `https://avaloncreative.group/` still opens the agency site.
5. Once the canonical subdomain works, configure the print authentication redirects below and redeploy if environment variables changed.

The code rewrite does not create a DNS record or attach a domain. The domain steps require access to the Vercel project and the authoritative DNS account. This document does not assert that those external steps are complete. See [Vercel's custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain).

## Activate the isolated cloud backend

All variables below are **server environment variables** on this Vercel project. None uses a `NEXT_PUBLIC_` or `VITE_` prefix. No print handler falls back to the agency's `SUPABASE_*`, `AI_GATEWAY_API_KEY` or model settings.

| Variable | Purpose |
| --- | --- |
| `AVALON_PRINT_SUPABASE_URL` | URL of the dedicated print Supabase project |
| `AVALON_PRINT_SUPABASE_PUBLISHABLE_KEY` | Public client credential for that project, constrained by row-level security |
| `AVALON_PRINT_SUPABASE_SECRET_KEY` | Server-only credential for validated order insertion |
| `AVALON_PRINT_AI_GATEWAY_API_KEY` | Server-only Vercel AI Gateway credential; optional |
| `AVALON_PRINT_AI_MODEL` | Verified, available gateway model ID; optional |

Use a dedicated Supabase project for print. Apply `apps/print/database/schema.sql` and then `apps/print/database/platform.sql` there. These files are bootstrap SQL for an empty print schema; they are not an idempotent migration runner. Do not apply them to an unrelated existing product database.

The SQL explicitly grants only required access and enables row-level security on the exposed tables. This handles Supabase's requirement for [explicit Data API grants on new tables](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically). Keep the `pw_private` schema outside the exposed API schemas. Keep `presswerk-artwork` private; its legacy internal name is intentional and does not affect the Avalon Print brand.

Configure Supabase Auth Site URL as `https://print.avaloncreative.group/` after domain verification. Allow the exact signup and password-recovery destinations used in production, including `https://print.avaloncreative.group/`, `https://print.avaloncreative.group/?recovery=1`, `https://avaloncreative.group/print` and `https://avaloncreative.group/print?recovery=1`. Configure verified transactional email delivery and test confirmation, sign-in and recovery in a separate browser session. Development and protected preview URLs need their own explicit allow-list entries.

Add the three print Supabase variables to the required Vercel environments, then redeploy. `/api/print/config` returns only the print URL and publishable key. It never returns secret or gateway credentials. `/api/print/status` reports configuration presence; it is not a database, email or gateway health test. Before inviting customers, verify real account creation, cross-account isolation, private uploads, saved revisions, proof approval and trusted order creation against the configured project.

AI advice additionally requires both print AI variables and a verified model. The server validates the Supabase access token, applies the database quota and uses the gateway server-side. If AI is not configured, the studio's catalogue guidance remains available and is presented separately from AI advice.

## API contract

Every handler returns JSON with `Cache-Control: no-store`. Unsupported methods return `405` with an `Allow` header. Next parses request bodies with a 600 KB limit; handler-level JSON object validation additionally bounds UTF-8 request size at 600,000 bytes.

| Endpoint | Method | Access / behavior |
| --- | --- | --- |
| `/api/print/config` | GET | Public; publishable cloud config or `null` |
| `/api/print/status` | GET | Public; activation flags, no secrets |
| `/api/print/catalogue` | GET | Public; 51 formats and proposed CAD estimates |
| `/api/print/quote` | POST | Public; validates a specification and calculates a planning estimate |
| `/api/print/orders` | POST | Authenticated workspace role; exact saved revision, idempotency key and server-calculated estimate |
| `/api/print/assistant` | POST | Authenticated workspace role and quota; requires print AI configuration |
| `/api/print/platform` | POST | Revocable print API key; scoped `catalogue`, `quote` or read-only `orders` operation |

Unconfigured account/order/AI/platform requests return an activation response instead of contacting the agency backend. The order API does not trust a browser-submitted total or production status. Proof approval is tied to the immutable saved artwork revision, and production transitions are role-restricted, forward-only and audited. Invitation tokens are email-bound and single-use. Developer key secrets are stored hashed and do not reappear in key listings.

## Verification

Run from the repository root:

```sh
npm run build
npm test
npm run test:print
node --experimental-strip-types --test apps/print/tests/api-handlers.test.mjs
npm run test:smoke
```

The print SQL test runs the actual bootstrap files in isolated PGlite with test Auth and Storage scaffolding. It verifies tenant isolation, roles, private uploads, immutable revisions, stale-version conflicts, proof/order integrity, production audit, quotas, invitations and key revocation. It does not provision or certify a live Supabase project. The API boundary test verifies actual Next wrapper exports, method handling, invalid bodies, non-binding quotes and that agency credentials cannot activate print services or leak through public configuration.

### Studio v2 browser acceptance

The deployed application was exercised through its visible controls: image upload, text editing and undo/redo, project saves across reloads, restoring an older revision as a new version, multi-item estimates with quantities and finishes, review readiness, CSV export, printable estimates, backup export/import, campaign creation, brand changes and the live quote API playground. Imported copies preserved the existing workspace. A downloaded business-card PNG measured 1,051 × 602 pixels with 300-DPI metadata.

Phone and tablet review covered 390 px and 768 px frames. The editor fit the phone viewport; the corrected estimate layout had no page-level horizontal overflow at either size. The estimate library scrolls independently when several saved estimates are present.

The verification browser disables WebGL, so GPU rendering was not visually certified in that environment. The fallback was verified with real mug artwork on a product illustration and a working switch to the exact flat proof. The cloud panel accurately reported that team sync is not connected. These checks do not certify physical print output or activate external services.

Payments, subscription billing, final taxes, shipping/carrier services, supplier order submission and machine integrations are not live integrations in this release. Production stages are manually updated by authorized workspace operators. Catalogue prices are proposed launch estimates; custom-quote formats have no invented product price. These boundaries must remain visible when evaluating the deployed application.
