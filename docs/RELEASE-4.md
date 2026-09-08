# Avalon 4.0 — connected production and decisions

Version 4 makes the campaign the shared starting point for strategy, writing, production, measurement and release. It preserves the original cinematic media, Avalon identity, completed projects and existing campaign storage while adding useful workbenches and clearer responsibility for each decision.

## Experience and navigation

The homepage route explorer lets visitors choose campaign launch, a content system or performance improvement, then enter the corresponding workspace stage. A command centre (`Ctrl/Cmd+K`) searches campaigns, output text, editorial items, delivery tasks and evidence. Results open the relevant campaign and record.

The overview brings outdated work, pending reviews, overdue or unassigned tasks and incomplete evidence into an actionable inbox. Quick tasks enter the existing production board. Portfolio health, planned content and activity remain tied to saved campaign records. Date-sensitive reminders use the device’s local calendar.

The public projects page retains authentic Kingsford & Perla and Trios Services previews. Marketing navigation, capability links and inquiry handoff continue to use the same workspace. Platform metadata derives its specialist count from the registry; the About and 404 pages reflect the current Avalon identity and published work.

## Specialists and workflows

There are now 18 specialists. The Research planner identifies evidence gaps and source responsibilities; the Release risk reviewer reviews unresolved exposure and release decisions; the Operations planner connects capacity, ownership and recovery.

Eight presets cover campaign launch, creative/content, growth/lifecycle, market entry, website/conversion, research/positioning, release/recovery and performance review. The custom composer accepts desired outputs and includes prerequisites in dependency order. Current outputs can be reused; upstream approvals gate dependent steps. Workflow tasks, proposed dates, owners and a handoff export carry plans into delivery.

When model drafting is configured, provider requests include bounded excerpts from current prerequisite outputs, with missing, stale and truncated context identified explicitly. Returned drafts retain server-controlled source lineage and never inherit approval. Brief or upstream changes invalidate affected downstream work.

Output-library edits create a new human-revised edition while preserving its source. They reset approval, retain upstream references and make dependent work stale. Source comparisons and an unsaved-change guard support review. New editions respect output capacity rather than silently evicting history.

## Editorial, web and production

The editorial desk adds original drafting, a monthly calendar, channel filters, unscheduled work, bulk date shifts and review requests. CSV imports are previewed and exact duplicates are skipped. Imported work starts as drafts; shifted dates reset approval. Calendar and publishing-team handoffs export as ICS and CSV.

The web desk previews supplied page and search copy, reports basic editorial structure and phrase placement, and prepares JSON-LD, an HTML page prototype and a Markdown review. These are handoff artifacts, not a live-site crawl, ranking score or automatic deployment.

The production register includes seven editable format presets, copy assets from editorial work, external source/final URLs, specifications, owners, rights and expiry, accessibility notes and delivery checks. Each asset retains up to 20 previous full versions and named review decisions; restoring an older version creates a new edition. Search, status filters, removal and undo support day-to-day use.

Approval requires usable content or a file reference, accountable ownership, specifications, rights/accessibility information and completed checks. Expired rights, including expiry before a future launch date, block approval. Changes invalidate affected approval and release records. The release handoff includes an owner, client approval reference, rollback contact and date, tied to the reviewed asset state. Markdown, CSV and JSON exports carry the manifest and version archive out of the workspace.

## Performance and growth

Reported results remain explicitly user-supplied. Coverage and anomaly checks expose incomplete channel/date records. Equal-length period comparisons, daily trends and evidence-led next actions support review without inventing missing observations. Follow-up actions can become delivery tasks.

The growth workbench works backwards from a customer goal using entered channel assumptions or reported acquisition costs. It separates media from fixed costs, shows contribution and break-even implications, and lets the user apply a scenario to the shared budget. Constant acquisition cost is an assumption, not a scaling guarantee.

Experiment planning uses an explicit hypothesis, baseline, lift and traffic assumption. Plans can be exported or handed to Experiments and Delivery; existing observations are protected from replacement. Campaign links preserve non-UTM query parameters and anchors and provide reusable exports.

## Reliability and security

- Revoked members retain their verified identity for sign-out while `workspaceAccess` denies cloud operations.
- Supabase configuration rejects privileged keys, insecure production transport and incorrectly pasted API paths or URL query fragments.
- JSON reads enforce byte limits and a 12-second deadline. A stalled stream or cancellation cannot hold the request indefinitely.
- Sensitive API responses bypass browser and proxy caches. Owner-change checks, current authentication and optimistic cloud revisions remain enforced.
- The database setup proposal requires an actual JSON boolean entitlement, matching the server; string `"true"` does not grant access.
- Blank campaigns begin with zero investment. Illustrative financial assumptions are not silently committed as a client budget.
- Version-2 storage and legacy Supabase names remain intact. New delivery and revision fields are optional for older backups.

## Verification and release boundary

All 147 automated tests, lint, the production build and route smoke checks passed, with successful CI checks. The build gate checks the actual rendered route-explorer classes against the linked CSS rather than accepting unused legacy selectors.

Desktop browser review against preview commit `d07164f` verified these connected journeys:

- A custom workflow generated five specialist stages and created five delivery tasks with an assigned owner.
- A human-edited output became a separate edition, retained its source and marked four dependent outputs as stale.
- An original editorial draft retained its planning date after native keyboard entry. CSV preview and import added dated items to the calendar; unified search opened the exact content result.
- Editorial copy became a production asset, then a second version with ownership, rights and accessibility information. Four checks enabled named approval, and the recorded decision appeared in history.
- A sourced two-row performance import calculated CAD 220 spend, CAD 1,000 revenue, five customers and 4.55 ROAS. Coverage gaps remained visible, and a follow-up action reached Delivery.
- Supplied web copy rendered in the search and page previews. No application console errors were observed during these journeys.

Responsive browser review against preview commit `f263c6f` covered the 390px phone overview, native custom-workflow selector, content composer, asset form and performance layouts. The Journey section also rendered at 768px tablet width. Review identified tablet homepage overflow in the objective switchboard; commit `11a7389a90dc2cfe71e18ed1b780bc3b7cce58ce` adds responsive grid sizing and keeps the decorative closing monogram within its section. Browser rechecking confirmed that the tablet document and viewport both measured 753px with the scrollbar present, the objective tabs switched correctly, and no application console errors appeared. The temporary responsive review page is removed from the release. Final production verification follows the merge and is recorded in the release handoff.

An isolated PGlite PostgreSQL run passed 36 assertions covering own/cross-account writes, ownership reassignment, stale revisions, constraints, strict entitlements, anonymous/non-member denial, private quota access, account separation, interval limits, daily limits and UTC rollover. This uses simulated Auth claims and separate PostgreSQL roles; it is not verification of a hosted Supabase project or concurrent remote sessions. Instructions are in [LAUNCH.md](LAUNCH.md).

The agency database, invitation/recovery delivery, cloud snapshots and live model provider still need dedicated configuration and hosted acceptance tests. Campaign search and editing work locally. No automatic publishing, messaging, media buying, payment handling, file hosting, team synchronization or live research is activated by this release. Reviewer identities and sign-off references are user-entered records. Record deployment and responsive browser evidence against the final release commit before announcing that it is live.
