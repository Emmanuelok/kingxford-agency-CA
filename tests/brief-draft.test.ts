import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIEF_STORAGE_LIFETIME_MS,
  briefFromEstimate,
  parseSavedBrief,
} from "../lib/briefDraft";

test("restores a current draft and expires an old draft", () => {
  const now = Date.UTC(2026, 8, 2);
  const current = JSON.stringify({
    savedAt: now - 1_000,
    brief: { organization: "Harbour Co.", services: ["Integrated campaigns"], consent: true },
  });
  const expired = JSON.stringify({
    savedAt: now - BRIEF_STORAGE_LIFETIME_MS,
    brief: { organization: "Old draft" },
  });

  assert.equal(parseSavedBrief(current, now)?.organization, "Harbour Co.");
  assert.equal(parseSavedBrief(current, now)?.consent, true);
  assert.equal(parseSavedBrief(expired, now), null);
  assert.equal(parseSavedBrief("not-json", now), null);
});

test("builds an estimator handoff from allow-listed services and recomputed pricing", () => {
  const query = new URLSearchParams({
    from: "estimate",
    services: "brand,campaign,not-a-service",
    complexity: "standard",
    pace: "standard",
    low: "1",
    high: "2",
  });
  const brief = briefFromEstimate(query);

  assert.ok(brief);
  assert.deepEqual(brief.services, ["Brand strategy and identity", "Integrated campaigns"]);
  assert.match(brief.projectSummary, /\$23,000–\$85,000 CAD/);
  assert.doesNotMatch(brief.projectSummary, /\$1–\$2/);
  assert.equal(brief.source, "estimate-calculator");
});

test("ignores non-estimator and empty handoff URLs", () => {
  assert.equal(briefFromEstimate(new URLSearchParams()), null);
  assert.equal(briefFromEstimate(new URLSearchParams({ from: "estimate", services: "unknown" })), null);
});
