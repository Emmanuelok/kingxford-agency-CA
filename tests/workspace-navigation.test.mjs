import test from "node:test";
import assert from "node:assert/strict";
import { createCampaign, runAgent, uid } from "../lib/campaign.ts";
import { workspaceSearch, campaignAttention, localPlanningDate } from "../components/workspace-model.ts";

function fixture() {
  const a = createCampaign(true), b = createCampaign(true);
  a.name = "Coastal launch";
  b.name = "Alpine launch";
  return { version: 2, activeId: a.id, campaigns: [a, b] };
}

test("workspace search finds a task owner in a different campaign and preserves exact navigation", () => {
  const workspace = fixture();
  const task = { id: uid(), title: "Confirm mobile layout", owner: "Perla", due: "2026-09-19", done: false };
  workspace.campaigns[1].tasks = [task];
  const result = workspaceSearch(workspace, "perla mobile");
  assert.equal(result.length, 1);
  assert.equal(result[0].campaignId, workspace.campaigns[1].id);
  assert.equal(result[0].view, "production");
  assert.deepEqual(result[0].record, { kind: "task", id: task.id });
  assert.equal(workspaceSearch(workspace, "perla mobile", true).length, 0);
});

test("workspace search indexes evidence source and content body without changing records", () => {
  const workspace = fixture();
  const c = workspace.campaigns[0];
  c.evidence = [{ id: uid(), claim: "Durable material", source: "Laboratory report ABX42", owner: "Sam", verified: false }];
  c.content = [{ id: uid(), title: "New season", copy: "Our autumn collection", date: "", status: "Draft", revision: c.revision, channel: "Email" }];
  const snapshot = JSON.stringify(workspace);
  assert.equal(workspaceSearch(workspace, "abx42")[0].record.kind, "evidence");
  assert.equal(workspaceSearch(workspace, "autumn collection")[0].record.kind, "content");
  assert.equal(JSON.stringify(workspace), snapshot);
});

test("exact titles outrank incidental active-campaign matches", () => {
  const workspace = fixture();
  workspace.campaigns[0].name = "Other launch";
  workspace.campaigns[0].brief.offer = "A route to Alpine launch";
  assert.equal(workspaceSearch(workspace, "Alpine launch")[0].campaignId, workspace.campaigns[1].id);
});

test("inbox prioritizes overdue work and keeps completed unowned work visible", () => {
  const c = createCampaign();
  c.tasks = [
    { id: uid(), title: "Upcoming", owner: "Sam", due: "2026-09-20", done: false },
    { id: uid(), title: "Overdue", owner: "Sam", due: "2026-09-01", done: false },
    { id: uid(), title: "Unowned completion", owner: "", due: "2026-09-01", done: true },
    { id: uid(), title: "Done", owner: "Sam", due: "2026-09-01", done: true },
  ];
  const queue = campaignAttention(c, "2026-09-08");
  assert.equal(queue[0].title, "Overdue");
  assert.equal(queue.length, 3);
  assert.ok(queue.some((item) => item.title === "Unowned completion"));
  assert.ok(!queue.some((item) => item.title === "Done"));
});

test("inbox uses latest specialist edition and detects stale approvals", () => {
  const c = createCampaign(true);
  const older = runAgent(c, "strategy");
  c.runs = [older];
  const current = runAgent(c, "strategy");
  current.createdAt = "2026-09-08T12:00:00.000Z";
  older.createdAt = "2026-09-07T12:00:00.000Z";
  current.approved = true;
  c.runs = [current, older];
  assert.equal(campaignAttention(c, "2026-09-08").filter((item) => item.record?.kind === "run").length, 0);
  c.revision += 1;
  const queue = campaignAttention(c, "2026-09-08").filter((item) => item.record?.kind === "run");
  assert.equal(queue.length, 1);
  assert.equal(queue[0].record.id, current.id);
  assert.equal(queue[0].category, "Refresh");
});

test("inbox exposes incomplete verified evidence and stale approved content", () => {
  const c = createCampaign();
  c.revision = 2;
  c.evidence = [{ id: uid(), claim: "A claim", source: "", owner: "Sam", verified: true }];
  c.content = [{ id: uid(), title: "Old approved copy", copy: "Example", date: "", status: "Approved", revision: 1, channel: "Email" }];
  const queue = campaignAttention(c, "2026-09-08");
  assert.equal(queue.length, 2);
  assert.ok(queue.some((item) => item.category === "Evidence"));
  assert.ok(queue.some((item) => item.category === "Refresh"));
});

test("planning date uses local calendar components", () => {
  const date = new Date(2026, 0, 2, 23, 30);
  assert.equal(localPlanningDate(date), "2026-01-02");
});
