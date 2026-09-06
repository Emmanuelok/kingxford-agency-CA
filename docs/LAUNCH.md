# KINGXFORD v2 — release and activation checklist

## Release scope

The original research-wall film, cream/red identity, marketing pages and original media remain. New work replaces disconnected demo tools with a shared campaign workspace and adds guarded server integration paths. Local functionality is usable without external accounts.

Source publication and live deployment are separate. Do not infer that Vercel is running a commit simply because GitHub has it. Confirm the intended project, source commit and deployment URL before promotion. Do not replace the original site with a template or proxy the old site.

## Verification performed by the release scripts

- Schema round trips, record ID integrity, positive revisions and valid output lineage.
- Financial reconciliation, zero values, infeasible budgets and conservative/upside scenarios.
- Experiment sample size, sparse-event guards and observed conversion-count validation.
- Stale-output detection, approval invalidation and evidence review requirements.
- All nine planning outputs, maximum-size brief/evidence inputs and calendar generation.
- CSV formula escaping, UTM query preservation, URL protocol checks and inquiry validation.
- Production routes/assets, server-rendered original headline, branded 404, no-store integration responses and security headers.
- CI runs lint, unit tests, production build and HTTP smoke tests on pushes to main and pull requests.

These checks do not assert every possible bug is fixed. No paid AI call, production database migration, provider configuration change or live-browser accessibility certification is implied.

## Before public launch

1. Confirm the correct Vercel project and connect `Emmanuelok/kingxford-agency-CA`, main branch, Next.js preset, repository root, `npm run build`, Node 22. Do not use static-export mode: protected APIs need the server runtime. If production promotion requires approval, obtain it first.
2. Set `NEXT_PUBLIC_SITE_URL` to the exact canonical production origin. The same value enforces API request origins. Configure preview deployments separately; a production origin on a different preview domain will intentionally reject writes.
3. Verify both hero videos and their poster on desktop/mobile, scroll seeking, hold/skip, reduced motion, data-saving preference and media-error fallback.
4. Perform real browser QA at desktop/mobile widths and 200% zoom. Exercise keyboard-only navigation, tab arrow keys, focus trapping/return, form errors, dropdowns, export/import and long content. Test Chrome, Safari and Firefox. Run accessibility and performance audits; record results rather than assuming AA conformance.
5. Create a campaign, edit context, generate all nine plans, export a calendar, assign tasks, model a budget, enter an experiment and approve deliverables. Change the brief and verify stale approval warnings. Test storage-full and two-tab recovery, malformed backups, switching campaigns during AI requests and deletion confirmations.
6. Confirm `hello@kingxford.co` is an owned, monitored inbox and all public claims, service descriptions, example imagery, pricing assumptions and privacy/contact details are owner-approved. Inquiry email preparation does not submit a form automatically; verify delivery from the user's mail client or commission a configured transactional-email service separately.
7. Establish support ownership, incident response, deployment rollback and customer-data deletion procedures. Configure monitoring without logging brief bodies, credentials or prompts. Keep backups and test restore.

## Optional private cloud activation

Do not reuse unrelated applications' Supabase projects. Select a dedicated project and approve region, processing terms and operational costs. The source includes no service-role key and does not need one at runtime.

1. Review `database/setup.sql`; execute once on the chosen project. Re-running its policy declarations without a migration plan is not supported.
2. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the server environment. Configure provider email delivery/recovery and invitation-only access. Confirm the configured Auth and API rate limits; set hosting rate limits for the login route.
3. Provision the intended users and grant `app_metadata.kingxford_access: true` through trusted administrative tooling only. Never use editable `user_metadata` as entitlement. No self-service registration is implemented.
4. Sign in with two separate invited accounts. Verify account A cannot select, insert, update or delete B's row through either the app or direct Data API. Verify non-members/anonymous users are denied. Verify revoked users can sign out. JWT-based database policy revocation takes effect when the token refreshes/expires; account lifecycle procedures must account for this.
5. Save/load snapshots; simulate simultaneous writes and verify the second save returns 409. Confirm cross-account session changes cannot load or overwrite the other account's snapshot. Encrypted transport is provided by HTTPS; browser drafts remain unencrypted.
6. Confirm backup retention, database recovery, deletion requests and processor disclosures. Cloud saves are manual per-account snapshots up to 2 MB, not real-time team collaboration or organization-level RBAC.

## Optional AI activation

1. Complete cloud/auth/quota verification first. Verify the quota RPC is callable only by entitled, non-anonymous users and limits requests atomically.
2. Choose a model available to the account. Set `AI_GATEWAY_API_KEY`, `KINGXFORD_AI_MODEL`, and only then `KINGXFORD_AI_ENABLED=true`. Keep keys server-side and install a provider hard budget/cap. Failed requests can consume a quota reservation; this is intentional abuse protection.
3. Confirm provider data-use settings, region and costs. Briefs, relevant evidence and planning context are sent only after the user selects the AI action. No autonomous tools are given to the model.
4. Test a bounded request with approved non-sensitive data. Verify success, expired sessions, 429 quota responses, malformed inputs, timeouts, provider errors and model refusals. Validate output quality and labels. Model drafts always require human review.
5. Turning the feature flag off disables further AI requests. The deterministic engines continue to work without a model.

## Explicitly not represented as complete

Live advertising-account integrations, autonomous publishing, multi-user organization roles, billing/checkout, a transactional-email backend, real-time analytics ingestion, live competitive research, video generation and legal certification are not implemented or activated by this release. The corresponding workspace outputs are planning tools or guarded drafts, not fabricated live capabilities.
