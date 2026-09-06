# KINGXFORD — connected campaign platform

Version 2 keeps the original KINGXFORD cinematic website and adds an operational, device-local campaign workspace. It is a Next.js application, intended for the existing Vercel project; it is not the earlier replacement design.

## Working capabilities

| Entry point              | Capability                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `/`                      | Original scroll-operated film, local desktop/mobile video, accessible static fallback, connected workspace entry |
| `/platform`              | Multi-campaign workspace, shared brief, revision history, backup/import and nine specialist planning engines     |
| `/tools`                 | Same workspace opened in the media lab: allocation, CPC/CVR scenarios, CAC, ROAS, contribution and break-even    |
| `/studio/workbench`      | Production treatment, shot-list export, format matrix and assigned delivery tasks                                |
| Workspace content studio | Editable 12-item starter calendars, planning dates, status workflow and CSV export                               |
| Workspace search/web     | Supplied-copy heuristics and a safe UTM link builder; not a live crawler                                         |
| Workspace experiments    | Sample sizing, fixed-horizon planning and observed two-proportion confidence intervals                           |
| Workspace proof/library  | Evidence ledger, approval checks, stale-output detection, searchable drafts and Markdown exports                 |
| `/start`                 | Validated inquiry, review/copy/download/email preparation, campaign-context handoff                              |

The nine specialists cover strategy, creative, editorial, production, media, search, experiments, proof and market expansion. **Planning engines are deterministic**, not model calls or independent research. Optional model-generated drafts are visibly labelled **AI draft**. Nothing automatically publishes, emails clients, purchases media or certifies compliance.

## Run and verify

Node 22.13+ is required. Node 22 is used by CI.

```bash
npm ci
npm run dev
```

For release checks:

```bash
npm run lint
npm test
npm run build
npm run test:smoke
npm audit
```

`test:smoke` starts and stops an isolated production server and checks routes, original media, disabled integration responses, request-origin validation and response headers. It does not replace browser accessibility or connected-service testing.

## Data and integrations

- Browser drafts persist in `localStorage`. They are not encrypted or automatically shared. Export backups before changing devices or clearing browser data.
- Imports validate the v2 schema and merge copies. Cross-tab changes pause autosaving; cloud snapshots use optimistic concurrency and account identity checks.
- Cloud and AI are disabled until configured. Use `.env.example` as the configuration reference; never commit secrets.
- A **dedicated** Supabase project and the proposed `database/setup.sql` are required. The migration is supplied, not automatically applied.
- AI requires an invited account, owner-approved model, Vercel AI Gateway key and explicit feature flag. The database quota is 20 requests per account per UTC day, with five-second spacing; provider budget caps are still required.
- Production uses verified Supabase identity. The obsolete, unused hosted-proxy header-auth helper has been removed.

Read [the launch and activation checklist](docs/LAUNCH.md) before connecting client accounts or promoting to production. A successful build is not a claim of completed operational, privacy or accessibility sign-off.
