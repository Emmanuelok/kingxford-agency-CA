# Avalon Creative Group — release and launch operations

## Release intent

Avalon brings strategy, creative production, content, media, measurement, and delivery into a shared campaign workspace. Browser planning works without an external account. Cloud snapshots and model-generated drafts remain separate integrations with verified-account boundaries.

The rebrand deliberately preserves the existing Supabase table, private schema, quota RPC, and `app_metadata.kingxford_access` entitlement. Existing backups and accounts must remain compatible. A brand change is not a database migration.

## Confirmed deployment baseline

On 7 September 2026, the existing deployment at `https://kingxford-agency-ca.vercel.app/api/workspace/status` reported `cloud: false` and `ai: false`. This is evidence that private cloud and AI drafting were not configured on that deployment at the start of this upgrade. Local campaign planning remains usable. Do not describe cloud sync, live model agents, or connected publishing as active until their integration checks pass.

No dedicated agency database project was identified in the connected Supabase account during this review. Existing projects belonged to other applications and were not modified. Activating cloud and model drafting therefore requires selecting or provisioning the intended agency database and supplying the project-specific server and AI gateway configuration.

The public service health endpoint reports application availability and release version only. It does not certify database access, email delivery, model availability, security compliance, or production launch readiness.

## Software verification

Run from the repository root:

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:smoke
```

Record results against the exact Git commit that is deployed. CI should run the same gates. Publishing source to GitHub does not prove Vercel is serving that source; confirm the intended project, commit, production domain, and successful deployment independently.

The automated suite covers deterministic campaign calculations, workspace schema integrity, stale output rules, exports, and input validation. Server tests additionally exercise:

- Incorrect privileged Supabase keys and insecure remote URLs are rejected before database access.
- API paths, dashboard paths, query strings and fragments are rejected as Supabase project URLs; a valid trailing slash is normalized.
- Avalon AI settings override legacy settings; an explicit disable cannot fall through to a legacy enable.
- Editable user metadata and anonymous accounts cannot grant workspace access.
- Revoked members retain a verified account identity so they can sign out, while cloud access remains denied.
- Mutations require the exact site origin and the JSON media type.
- Streamed request bodies are bounded by bytes, including multibyte text; malformed UTF-8 and JSON are rejected.
- Stalled body streams return 408 after a 12-second read deadline; failed stream cancellation cannot delay a size-limit rejection.
- Owner headers support old clients and the new Avalon naming.
- Provider refusals, truncated drafts, tool responses, empty content, and oversized output are rejected without saving a draft.

Automated unit tests do not replace a two-account database isolation test or an authenticated provider request. Never claim those passed merely because configuration variables exist.

### Isolated database policy verification

The setup proposal was executed in a fresh, in-memory PostgreSQL runtime using PGlite 0.5.8. All 36 assertions passed: own-account reads/writes, cross-account insert/update/delete denial, ownership reassignment denial, stale-revision updates, payload/revision constraints, strict boolean entitlements, anonymous/non-member denial, private quota protection, per-account quotas, the five-second interval, the daily cap, and UTC rollover. The test uses stub Auth identity functions and separate database roles. It verifies the SQL, not a hosted Supabase deployment, real account delivery, or concurrent connections.

Reproduce without adding database tooling to the application dependencies:

```sh
npm install --prefix /tmp/avalon-db-check --no-save --ignore-scripts @electric-sql/pglite@0.5.8
node scripts/verify-database.mjs /tmp/avalon-db-check
```

The verifier always creates an isolated in-memory database and reads `database/setup.sql`. It does not connect to or mutate a remote database. Run the hosted account-isolation acceptance checks below after the intended Supabase project is configured.

## Deployment settings

Use the existing Vercel project connected to `Emmanuelok/kingxford-agency-CA`, its intended production branch, the Next.js framework preset, Node 22 or newer, repository root, and `npm run build`. Static-export mode is incompatible with the protected server APIs.

Set `NEXT_PUBLIC_SITE_URL` to the exact canonical site origin. Configure preview deployments separately; production-origin configuration on another preview domain intentionally rejects mutations. Do not solve an origin mismatch by adding wildcard trusted origins or reflecting an arbitrary Origin header.

The AI route has a 90-second function budget, with bounded database calls and a 45-second provider deadline. JSON body reads have a separate 12-second deadline. Database requests and sensitive API responses bypass caches, including legacy proxy cache headers. Keep the CDN no-store behavior when adding proxies or monitoring.

The release sends standard anti-framing, MIME-sniffing, referrer, transport, opener, and restricted capability headers. Its CSP is a limited baseline, not a claim of complete XSS prevention. Preserve React escaping and do not render model responses with unfiltered HTML.

## Private cloud activation

Use the agency's intended Supabase project; do not attach unrelated applications' data or credentials. Runtime needs a publishable key (or an existing legacy anon key), never a secret or service-role key.

1. Review `database/setup.sql` on the selected project. It is an unapplied setup proposal, not proof that tables exist. Policy declarations are intended for first-time setup; use reviewed migrations for an existing database. Confirm Data API exposure/grants, RLS, and security advisors.
2. Set server-only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Production database transport must use HTTPS.
3. Configure invitation-only account provisioning, password recovery, verified delivery of invitation/recovery messages, Auth rate limits, and hosting protection for the login route. No public self-service signup is implemented.
4. Grant `app_metadata.kingxford_access: true` as a JSON boolean through trusted administration. Both the server and setup policies reject the string `"true"`. Keep the legacy entitlement name until a separate coordinated application-and-RLS migration is ready. Never use editable `user_metadata` for authorization.
5. Test invited accounts A and B through both the application and direct Data API: A cannot read, create, overwrite, or delete B's workspace; anonymous and non-member accounts are denied. Database JWT entitlement changes take effect when tokens refresh/expire; revocation operations must account for that delay.
6. Save and reload a snapshot, test two concurrent saves (the stale revision must return 409), switch signed-in accounts during pending operations, verify export/recovery paths, and confirm revoked users can sign out.
7. Establish database backups, retention, tested restore, customer deletion, access review, and incident ownership. Browser drafts are unencrypted local data; sign-out does not erase them.

`GET /api/workspace/status` retains `cloud`, `ai`, `email`, and `userId` for existing clients and returns `workspaceAccess`, a timestamp and capability messages. `cloud` means configuration is valid. The detailed cloud state distinguishes `not-configured`, `sign-in-required`, `access-denied`, `connected`, and `unavailable`. Revoked members retain their verified identity for sign-out, but `workspaceAccess` is false; clients must not infer entitlement from the presence of an email address. For an entitled signed-in user, `connected` means a read-only query to that user's workspace storage responded successfully. It does not certify write permissions or cross-account isolation. This probe never changes snapshots or consumes AI quota.

Cloud saves are manual per-account snapshots, bounded to a 2 MB request. They are not real-time organization collaboration or organization-level roles.

The review follows the current [Supabase server session guidance](https://supabase.com/docs/guides/auth/server-side/advanced-guide) and [explicit Data API grants requirement](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically). The setup includes explicit table grants together with RLS; removing either layer changes the access model.

## Model drafting activation

1. Complete cloud access and quota checks first. Verify `kingxford_reserve_agent_run` only allows entitled, non-anonymous accounts and atomically enforces the daily and minimum-interval limits.
2. Choose an available text model using the gateway's current model catalog. Set `AI_GATEWAY_API_KEY`, `AVALON_AI_MODEL` in `provider/model` format, and only then `AVALON_AI_ENABLED=true`.
3. Existing `KINGXFORD_AI_MODEL` and `KINGXFORD_AI_ENABLED` are still read when their corresponding Avalon settings are absent. Explicit Avalon values always win, including an empty model or `false` flag. Remove obsolete settings after confirming the replacement works.
4. Configure a project-scoped gateway key, hard spending controls, approved provider data handling, and appropriate privacy disclosures. Failed requests can consume a quota reservation; this is intentional abuse protection. Do not automatically retry a paid generation.
5. Request a bounded draft using approved non-sensitive test content. Verify valid output, expired sessions, account changes, 429 limits, 402 budget exhaustion, timeouts, provider errors, refusals, and incomplete responses. No partial/refused output should be saved as a valid draft.
6. Confirm the output is labelled as an unverified AI draft with source brief revision and model. Human review remains mandatory. The model receives no publishing, messaging, account modification, or payment tools.

The status endpoint reports AI as `configured`, never `connected`, based only on settings. Provider availability and quota are checked on an explicit draft request. Turning the feature flag off stops further requests while local planning remains available.

## Product acceptance before launch

- Verify the original cinematic assets and their poster on desktop and mobile, reduced motion and data-saving preferences, error fallback, readable overlays, and intended playback controls.
- Perform keyboard and mobile browser QA: navigation, menus, dialog focus/return, field errors, long content, 200% zoom, and the entire campaign-to-delivery workflow. Record browser and viewport results.
- Create a campaign; edit its brief; use the planning agents and financial tools; export/import; assign tasks; move deliverables through review; change the brief and check outdated approvals. Test storage-full and two-tab recovery.
- Verify only consented, owned, or approved imagery and claims are published. Example campaigns and performance assumptions must remain clearly illustrative.
- Confirm the actual inquiry inbox is owned and monitored. An email prepared in a mail client is not a form submitted to a server. No delivery or CRM capture should be implied without a configured and tested destination.
- Confirm support ownership, privacy/contact text, incident response, rollback, and data export/deletion procedures. Keep logs free of credentials, brief bodies, prompts, and provider response content.

## Boundaries that still require separate integration

Live advertising accounts, autonomous publishing, payment checkout, organization collaboration, transactional inquiry delivery, real-time analytics ingestion, live competitive research, and image/video generation are not established by the existing server integrations. Workspace plans and imported performance data must not be presented as those external capabilities. Select and verify each provider before describing it as connected.

## Studio publication hold — 8 September 2026

The owner has deferred public release of the studio, workbench and Supabase-backed workspace while development continues. `NEXT_PUBLIC_AVALON_WORKSPACE_ENABLED` defaults to false. In this mode `/studio`, `/studio/workbench`, `/platform` and `/tools` return 404; their cloud/session/agent APIs return a no-store 404 before reading credentials or contacting providers. Public navigation, homepage promotions, service CTAs and the project brief stay focused on agency inquiries. Search discovery omits the unpublished routes.

Source code, database schema and existing device backups are preserved. No database has been provisioned or connected by this change. To continue development, set `NEXT_PUBLIC_AVALON_WORKSPACE_ENABLED=true` in `.env.local` or an access-protected preview environment and rebuild. Run build and smoke checks with the same flag value. This setting controls availability and is not an authentication control; do not expose an enabled preview publicly or change production until the owner approves launch.

Before publishing: finish the studios and workbench, choose the dedicated Supabase organization and approve its cost, configure authentication/storage and model limits, run hosted account-isolation and recovery tests, then review the public release. A reminder to revisit this work is scheduled for 22 September 2026. It does not provision or publish anything automatically.
