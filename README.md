# AVALON Creative Group — connected campaign platform

Avalon brings strategy, brand, creative production, media and delivery into one shared campaign workspace. Version 3 retains existing version-2 campaign backups and the original cinematic assets, while rebranding the public experience and adding workflow orchestration, delivery management and actual performance reporting.

## Working capabilities

| Entry point | Capability |
| --- | --- |
| `/` | Avalon identity, original cinematic film with motion controls, studio launchpad and capability pages |
| `/platform` | Multi-campaign workspace, shared brief, campaign duplication, live quality checks and decision history |
| `/platform?view=workflows` | Four dependency-aware workflows; reusable current outputs, upstream approval gates, recorded handoffs and lineage |
| `/platform?view=agents` | Fifteen specialist planning engines and optional authenticated model drafts |
| `/platform?view=content` | Editable content calendar, date/status/channel management and CSV export |
| `/studio/workbench` | Production treatment, shot lists, adaptations and assigned tasks |
| `/platform?view=delivery` | Production task presets, owners, due dates, delivery filtering and launch dossiers |
| `/tools` | Channel allocation, acquisition economics, scenarios, contribution and break-even modelling |
| `/platform?view=performance` | Sourced daily actual results, CSV import preview, explicit conflict replacement, channel/date filters and spending pace |
| `/platform?view=search` | Supplied-copy checks and safe UTM link builder |
| `/platform?view=experiments` | Fixed-horizon experiment planning and observed two-proportion intervals |
| `/platform?view=proof` | Evidence ledger, human launch checks, stale-output detection and approval controls |
| `/platform?view=library` | Searchable output history, freshness/status filtering and report exports |
| `/start` | Validated inquiry, review/copy/download/email preparation and safe new-campaign handoff |

The fifteen specialists cover strategy, brand, creative, editorial, production, conversion, lifecycle, media, search, accessibility, experiments, performance, market expansion, delivery and proof. Planning engines run deterministically on supplied data. They are not autonomous researchers or model calls. Optional model responses are labelled **AI draft** and require an invited account and configured service. Nothing publishes, emails, buys media or approves itself.

## Run and verify

Node 22.13+ is required. CI uses Node 22; the existing Vercel project uses Node 24.

```bash
npm ci
npm run dev
```

Release checks:

```bash
npm run lint
npm test
npm run build
npm run test:smoke
npm audit --omit=dev
```

The test suite covers campaign economics, experiment assumptions, input validation, output lineage, workflow dependencies, CSV imports, actual-results calculations, intake preservation and request/security boundaries. Smoke tests start an isolated production server and verify routes, original assets, integration boundaries and response headers. Browser checks cover rendered navigation and representative studio flows.

## Storage and connected services

- Browser campaigns remain in the original `kingxford-workspace-v2` key. Existing data is not renamed or discarded by the Avalon rebrand.
- New optional performance and output-lineage fields remain compatible with older v2 backups. Older versions of the application do not preserve these newer fields when exporting; use this release to manage them.
- Local drafts are device-specific and not encrypted. Back up before changing devices or clearing browser data.
- Imports validate schemas. Cross-tab conflicts pause autosaving. Cloud snapshots retain optimistic concurrency and account checks.
- Cloud accounts and model AI were **not configured** in the inspected production environment. This release exposes that state honestly and keeps useful local work available.
- A dedicated Supabase database and gateway model configuration are required for connected accounts and AI. The prepared SQL remains unapplied; unrelated Supabase projects are untouched.
- New Avalon configuration names coexist with legacy environment, database, authorization and header names.
- Real mail remains `hello@kingxford.co` until a replacement mailbox is provisioned. The production URL remains `https://kingxford-agency-ca.vercel.app`.

Read [docs/LAUNCH.md](docs/LAUNCH.md) for the configuration, database isolation, quota and operational release checks. Passing code checks is not a claim that unconfigured cloud services have been activated or that every production business process has been certified.
