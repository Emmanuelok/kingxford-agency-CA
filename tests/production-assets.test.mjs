import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSET_CHECKS, assetManifestCsv, assetReviewBlockers, assetSpecSchema, assetState,
  buildAssetHandoffMarkdown, createProductionAsset, deliveryAssetSignature,
  deliveryLaunchBlockers, deliveryStateSchema, duplicateDeliveryState,
  emptyAssetSpec, emptyDelivery, reviewProductionAsset, reviseProductionAsset, setAssetCheck,
} from "../lib/production-assets.ts";

const today = "2026-09-08";
function readyAsset() {
  let asset = createProductionAsset({ ...emptyAssetSpec(), title: "Launch copy", type: "Copy", content: "Book an appointment.", owner: "Producer", format: "Plain text, reviewed destination", rightsNotes: "Original copy; approved owned channels." }, 1);
  for (const [key] of ASSET_CHECKS) asset = setAssetCheck(asset, key, true);
  return asset;
}
function campaign(asset = readyAsset()) { return { revision: 1, brief: { launchDate: "2026-10-01" }, delivery: { ...emptyDelivery(), assets: [asset] } }; }

test("final approval requires real deliverable content, attribution and recorded checks", () => {
  const empty = createProductionAsset({ ...emptyAssetSpec(), title: "Hero image" }, 1);
  assert.ok(assetReviewBlockers(empty, campaign(empty), today).some((issue) => issue.includes("final file")));
  assert.throws(() => reviewProductionAsset(empty, campaign(empty), "Approved", "Reviewer", "", today), /owner/);
  const asset = readyAsset();
  assert.deepEqual(assetReviewBlockers(asset, campaign(asset), today), []);
  const approved = reviewProductionAsset(asset, campaign(asset), "Approved", "Reviewer", "Ready", today);
  assert.equal(assetState(approved, campaign(approved), today), "Approved");
  assert.equal(assetState(approved, { ...campaign(approved), revision: 2 }, today), "Needs refresh");
  const reopened = setAssetCheck(approved, "rights", false);
  assert.equal(assetState(reopened, campaign(approved), today), "Needs review");
  assert.equal(reopened.reviewHistory[0].reviewer, "Reviewer");
  assert.equal(reopened.reviewHistory[0].decision, "Approved");
});

test("revisions preserve immutable history and require fresh checks and approval", () => {
  const first = reviewProductionAsset(readyAsset(), campaign(), "Approved", "Reviewer", "Ready", today);
  let current = reviseProductionAsset(first, { ...first.spec, content: "A revised offer." }, 2);
  assert.equal(current.version, 2);
  assert.equal(current.briefRevision, 2);
  assert.equal(current.review, undefined);
  assert.equal(current.checks.rights, false);
  assert.equal(current.history[0].review.decision, "Approved");
  assert.equal(first.spec.content, "Book an appointment.");
  for (let i = 0; i < 25; i++) current = reviseProductionAsset(current, current.spec, 2);
  assert.equal(current.history.length, 20);
  assert.equal(current.history[0].version, current.version - 1);
});

test("review identity, change feedback, rights expiry and unsafe links are enforced", () => {
  const asset = readyAsset();
  assert.throws(() => reviewProductionAsset(asset, campaign(asset), "Approved", " ", "", today), /reviewer/);
  assert.throws(() => reviewProductionAsset(asset, campaign(asset), "Changes requested", "Reviewer", "", today), /Describe/);
  const requested = reviewProductionAsset(asset, campaign(asset), "Changes requested", "Reviewer", "Clarify the offer", today);
  assert.equal(assetState(requested, campaign(requested), today), "Changes requested");
  const expiresBeforeLaunch = { ...asset, spec: { ...asset.spec, rightsExpiry: "2026-09-30" } };
  assert.ok(assetReviewBlockers(expiresBeforeLaunch, campaign(expiresBeforeLaunch), today).some((issue) => issue.includes("2026-10-01")));
  assert.equal(assetSpecSchema.safeParse({ ...asset.spec, finalUrl: "javascript:alert(1)" }).success, false);
  assert.equal(assetSpecSchema.safeParse({ ...asset.spec, finalUrl: "https://user:password@example.com" }).success, false);
  assert.equal(assetSpecSchema.safeParse({ ...asset.spec, rightsExpiry: "2026-02-30" }).success, false);
});

test("handoff remains tied to the exact registered versions and review decisions", () => {
  const approved = reviewProductionAsset(readyAsset(), campaign(), "Approved", "Reviewer", "Ready", today);
  const c = campaign(approved);
  c.delivery.handoff = { owner: "Release owner", approvalReference: "Client record 42", rollbackContact: "Operations", deliveryDate: "2026-10-01", notes: "Check the published destination.", assetSignature: deliveryAssetSignature(c) };
  assert.deepEqual(deliveryLaunchBlockers(c, today), []);
  const revised = reviseProductionAsset(approved, { ...approved.spec, content: "Updated copy" }, 1);
  const changed = { ...c, delivery: { ...c.delivery, assets: [revised] } };
  assert.ok(deliveryLaunchBlockers(changed, today).some((issue) => issue.includes("current asset versions")));
  assert.ok(deliveryLaunchBlockers(changed, today).some((issue) => issue.includes("production asset")));
  assert.deepEqual(deliveryLaunchBlockers({ revision: 1 }, today), []);
});

test("campaign copies clear approvals, signatures, version history and asset identity", () => {
  const approved = reviewProductionAsset(readyAsset(), campaign(), "Approved", "Reviewer", "Ready", today);
  const c = campaign(approved);
  c.delivery.handoff.approvalReference = "Signed for original campaign";
  c.delivery.handoff.assetSignature = deliveryAssetSignature(c);
  const duplicate = duplicateDeliveryState(c.delivery, 1);
  assert.notEqual(duplicate.assets[0].id, approved.id);
  assert.equal(duplicate.assets[0].review, undefined);
  assert.equal(duplicate.assets[0].checks.brand, false);
  assert.deepEqual(duplicate.assets[0].history, []);
  assert.equal(duplicate.handoff.approvalReference, "");
  assert.equal(duplicate.handoff.assetSignature, undefined);
});

test("manifest exports preserve content safely and schema rejects duplicate asset IDs", () => {
  const asset = readyAsset();
  const c = campaign({ ...asset, spec: { ...asset.spec, title: "=HYPERLINK(\"bad\")", content: "<script>alert(1)</script>\nSecond line" } });
  assert.match(assetManifestCsv(c, today), /"'=HYPERLINK\(""bad""\)"/);
  const markdown = buildAssetHandoffMarkdown(c);
  assert.ok(markdown.includes("&lt;script&gt;"));
  assert.ok(markdown.includes("> Second line"));
  assert.equal(deliveryStateSchema.safeParse({ ...c.delivery, assets: [asset, asset] }).success, false);
  assert.equal(deliveryStateSchema.safeParse(c.delivery).success, true);
});
