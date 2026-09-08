# Avalon Creative Group — version 4.0

Avalon connects campaign strategy, original content, production assets, commercial planning, measured results and delivery decisions in one workspace. Version 4 adds a searchable campaign command centre, 18 specialists, eight workflow presets and a custom composer, editable output editions, production version control, editorial and web workbenches, and evidence-based growth planning.

The public experience includes the original cinematic landing film, an interactive route explorer, 12 service disciplines, and completed projects with real website previews. Existing version-2 campaign backups remain supported.

## Working capabilities

| Entry point | Capability |
| --- | --- |
| `/` | Cinematic introduction and interactive routes for campaign launch, content and performance |
| `/platform` | Campaign portfolio, shared brief, actionable inbox, delivery reminders and `Ctrl/Cmd+K` search across saved work |
| `/platform?view=workflows` | Eight workflow presets and a custom composer, automatic prerequisites, approval gates, delivery tasks and handoff exports |
| `/platform?view=agents` | 18 specialist planning engines and optional authenticated model drafts with current upstream context |
| `/platform?view=content` | Original copy drafting, visual calendar, previewed CSV imports, bulk date shifts, review requests, CSV and ICS exports |
| `/studio/workbench` | Production treatment, shot lists, delivery adaptations and assigned production tasks |
| `/platform?view=delivery` | Asset register, version history, named review decisions, rights/accessibility checks and accountable release handoffs |
| `/tools` | Channel economics, contribution and break-even modelling, customer-target scenarios, experiment plans and campaign links |
| `/platform?view=performance` | Sourced actual results, reporting coverage, equal-window comparisons, trend charts, pacing and follow-up tasks |
| `/platform?view=search` | Supplied-copy analysis, search/page previews, JSON-LD, an exported HTML prototype and developer handoff |
| `/platform?view=experiments` | Fixed-horizon sample planning and observed two-proportion intervals |
| `/platform?view=proof` | Evidence ledger, campaign readiness, stale-output detection and human release checks |
| `/platform?view=library` | Searchable outputs, explicit human revisions as new editions, source comparison and report exports |
| `/projects` | Kingsford & Perla and Trios Services, authentic previews, project details and live website links |
| `/start` | Validated inquiry, review/copy/download/email preparation and a separate campaign handoff |

The new specialists are the **Research planner**, **Release risk reviewer** and **Operations planner**. They join strategy, brand, creative, editorial, production, conversion, lifecycle, media, search, accessibility, experiments, performance, market expansion, delivery and proof. Planning engines use deterministic rules and supplied data. Optional model responses are labelled **AI draft**, require an invited account and remain subject to human review.

## Run and verify

Node 22.13+ is required. CI uses Node 22; the existing Vercel project uses Node 24.

```sh
npm ci
npm run dev
```

Release gates:

```sh
npm run lint
npm test
npm run build
npm run test:smoke
```

The build verifies the styles actually linked by the rendered homepage, including the interactive route explorer, plus all 12 service images. The automated suite covers calculations, imports, schema integrity, output lineage, workflow dependencies, asset approvals, calendar exports and server boundaries. Smoke checks start a production server and check routes, assets, disabled integrations and headers. Responsive browser review is a separate acceptance step.

`scripts/verify-database.mjs` can additionally run the setup SQL in an isolated PostgreSQL runtime without adding database tooling to the application dependencies. See [launch operations](docs/LAUNCH.md) for its setup and the distinct hosted-database acceptance checks.

## Storage, compatibility and integrations

- Campaigns retain the `kingxford-workspace-v2` browser key. Version-2 backups gain optional delivery and output-revision fields; older application releases may discard newer fields when exporting them.
- Local drafts are device-specific and unencrypted. Search runs on saved browser data. Cross-tab conflicts pause autosaving; imports validate before replacing or appending work. Export backups before clearing browser data or changing devices.
- Production assets store copy, file URLs, specifications and review records. Files are not uploaded to Avalon. Reviewer names and client approval references are user-recorded information, not verified electronic signatures.
- Cloud snapshots remain explicit per-account saves and loads with ownership checks and optimistic concurrency. A present email address does not grant workspace access; clients use the verified `workspaceAccess` flag.
- Cloud accounts and model drafting remain unconfigured in the inspected production environment. The intended agency Supabase project and gateway credentials are still required. The SQL proposal has only been tested locally; unrelated projects were not modified.
- No social publishing, advertising activation, mail delivery, payment collection, website crawling or live analytics connectors are implemented. Imports, drafts, prototypes and plans must not be presented as those external capabilities.
- Avalon configuration names coexist with legacy database, entitlement and environment names. The contact mailbox remains `hello@kingxford.co` and the deployment remains `https://kingxford-agency-ca.vercel.app`.

Read [version 4 release notes](docs/RELEASE-4.md), [launch operations](docs/LAUNCH.md) and [adding completed projects](docs/adding-projects.md). A successful application deployment does not activate unconfigured external services.
