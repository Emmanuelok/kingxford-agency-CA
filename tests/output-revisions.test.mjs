import test from "node:test";
import assert from "node:assert/strict";
import { campaignSchema, createCampaign, isRunCurrent, latestAgentRuns, runAgent, uid } from "../lib/campaign.ts";
import { executePipeline } from "../lib/orchestration.ts";
import { reviseOutput } from "../lib/output-revisions.ts";

function fixture() {
  const c = createCampaign(true);
  c.brief.proof = "";
  return executePipeline(c, "creative-system").campaign;
}

test("a revision preserves the approved source, creates a separate draft, and invalidates dependent work", () => {
  const c = fixture();
  const source = c.runs.find((run) => run.agent === "strategy");
  source.approved = true;
  const original = JSON.stringify(c);
  const revised = reviseOutput(c, source.id, `${source.title} — reviewed`, `${source.text}\n\nRevised customer language.`);
  const updated = { ...c, runs: [revised, ...c.runs] };
  assert.equal(JSON.stringify(c), original);
  assert.notEqual(revised.id, source.id);
  assert.equal(revised.approved, false);
  assert.equal(source.approved, true);
  assert.equal(revised.sourceRunId, source.id);
  assert.equal(revised.editedByUser, true);
  assert.equal(revised.revision, c.revision);
  assert.deepEqual(revised.inputRunIds, source.inputRunIds);
  assert.equal(isRunCurrent(updated, revised), true);
  assert.equal(isRunCurrent(updated, source), false);
  assert.ok(updated.runs.filter((run) => run.inputRunIds?.includes(source.id)).every((run) => !isRunCurrent(updated, run)));
  assert.equal(latestAgentRuns(updated).find((run) => run.agent === source.agent).id, revised.id);
  assert.equal(campaignSchema.safeParse(updated).success, true);
});

test("stale sources cannot create apparently current human editions", () => {
  const c = fixture();
  c.revision += 1;
  assert.throws(() => reviseOutput(c, c.runs[0].id, "Revised", "Changed text"), /Refresh this specialist/);
});

test("saving unchanged, blank, oversized or absent output revisions fails without mutation", () => {
  const c = fixture();
  const source = c.runs[0];
  const before = JSON.stringify(c);
  assert.throws(() => reviseOutput(c, source.id, source.title, source.text), /Make a change/);
  assert.throws(() => reviseOutput(c, source.id, "", "Text"), /title/);
  assert.throws(() => reviseOutput(c, source.id, "Title", " "), /text/);
  assert.throws(() => reviseOutput(c, source.id, "Title", "X".repeat(20001)), /20,000/);
  assert.throws(() => reviseOutput(c, uid(), "Title", "Text"), /no longer exists/);
  assert.equal(JSON.stringify(c), before);
});

test("library capacity cannot evict the source when creating a revision", () => {
  const c = createCampaign(true);
  const source = runAgent(c, "strategy");
  c.runs = [source, ...Array.from({ length: 99 }, (_, index) => ({ ...source, id: uid(), createdAt: new Date(Date.parse(source.createdAt) - index - 1).toISOString() }))];
  assert.throws(() => reviseOutput(c, source.id, "Edited", "Edited work"), /100 outputs/);
  assert.equal(c.runs.length, 100);
  assert.equal(c.runs[0].id, source.id);
});

test("a revision retains its source fingerprint and follows clock-skewed source timestamps", () => {
  const c = createCampaign(true);
  const source = runAgent(c, "delivery");
  source.createdAt = "2090-01-01T00:00:00.000Z";
  c.runs = [source];
  const revised = reviseOutput(c, source.id, source.title, `${source.text}\nA confirmed supplier note.`);
  assert.equal(revised.sourceFingerprint, source.sourceFingerprint);
  assert.ok(revised.createdAt > source.createdAt);
  assert.equal(isRunCurrent({ ...c, runs: [revised, source] }, revised), true);
});
