import test from "node:test";
import assert from "node:assert/strict";
import { createCampaign, newWorkspace, campaignSchema, CHECKS, readiness, agentSourceFingerprint } from "../lib/campaign.ts";
import { buildLaunchPackage, DELIVERY_PRESETS, deliveryCsv, deliverySummary, filterDeliveryTasks, localCalendarDate, offsetCalendarDate, scheduleDeliveryPreset, taskStatus } from "../lib/deliverables.ts";
import { appendInquiryCampaign, inquiryBudgetEstimate, prepareInquiryCampaign, validInquiryDate } from "../lib/inquiry.ts";

const today = "2026-09-07";
const task = (patch = {}) => ({ id: crypto.randomUUID(), title: "Review master", owner: "Kay", due: today, done: false, ...patch });
const input = (patch = {}) => ({ name: "  Emmanuel  ", org: "  Avalon client  ", email: "  client@example.ca  ", challenge: "  Build a useful campaign for the upcoming product launch.  ", goal: "launch", budget: "$5,000–$15,000", useBudgetEstimate: false, timing: "2026-10-01", scopes: ["Film and photography"], ...patch });

test("intake creates an isolated campaign, trims fields and never stores contact details", () => {
  const existing = newWorkspace();
  const before = JSON.stringify(existing);
  const created = prepareInquiryCampaign(createCampaign(), input());
  const result = appendInquiryCampaign(existing, created);
  assert.equal(result.campaigns.length, 2);
  assert.equal(result.activeId, created.id);
  assert.equal(JSON.stringify(existing), before);
  assert.equal(result.campaigns[0], existing.campaigns[0]);
  assert.equal(created.brief.brand, "Avalon client");
  assert.equal(created.brief.offer, input().challenge.trim());
  assert.equal(created.brief.launchDate, "2026-10-01");
  assert.ok(!JSON.stringify(created).includes("client@example.ca"));
  assert.ok(!JSON.stringify(created).includes("Emmanuel"));
  assert.ok(campaignSchema.safeParse(created).success);
});

test("investment midpoint requires explicit consent and open-ended ranges stay unset", () => {
  assert.equal(prepareInquiryCampaign(createCampaign(), input()).brief.budget, 0);
  assert.equal(prepareInquiryCampaign(createCampaign(), input({ useBudgetEstimate: true })).brief.budget, 10000);
  for (const budget of ["Under $5,000", "$100,000+", "Need help setting it"]) {
    assert.equal(inquiryBudgetEstimate(budget), null);
    assert.equal(prepareInquiryCampaign(createCampaign(), input({ budget, useBudgetEstimate: true })).brief.budget, 0);
  }
  const confirmed = prepareInquiryCampaign(createCampaign(), input({ useBudgetEstimate: true }));
  assert.match(confirmed.tasks.at(-1).title, /planning estimate only/);
  for (const key of ["agencyFee", "productionCost", "revenuePerCustomer", "margin", "leadToSale"]) assert.equal(confirmed.brief[key], 0);
});

test("invalid intake dates cannot be persisted and undecided timing remains empty", () => {
  for (const timing of ["2026-02-30", "October", "2100-01-01", "1999-12-31"]) {
    assert.equal(validInquiryDate(timing), false);
    assert.throws(() => prepareInquiryCampaign(createCampaign(), input({ timing })), /valid target date/);
  }
  assert.equal(prepareInquiryCampaign(createCampaign(), input({ timing: "" })).brief.launchDate, "");
});

test("a full workspace or duplicate identifier cannot overwrite any campaign", () => {
  const campaign = createCampaign();
  const workspace = { version: 2, activeId: campaign.id, campaigns: [campaign, ...Array.from({ length: 11 }, () => createCampaign())] };
  const snapshot = JSON.stringify(workspace);
  assert.throws(() => appendInquiryCampaign(workspace, createCampaign()), /12 campaigns/);
  assert.equal(JSON.stringify(workspace), snapshot);
  assert.throws(() => appendInquiryCampaign({ ...workspace, campaigns: [campaign] }, campaign), /already/);
});

test("calendar offsets preserve dates across leap years, year boundaries and daylight-saving dates", () => {
  assert.equal(offsetCalendarDate("2028-03-01", -1), "2028-02-29");
  assert.equal(offsetCalendarDate("2026-01-01", -1), "2025-12-31");
  assert.equal(offsetCalendarDate("2026-03-09", -1), "2026-03-08");
  assert.equal(offsetCalendarDate("2026-11-01", 1), "2026-11-02");
  assert.throws(() => offsetCalendarDate("2026-02-30", -1), /valid/);
  assert.throws(() => offsetCalendarDate("2026-01-01", 0.5), /valid/);
  assert.throws(() => scheduleDeliveryPreset([], "campaign", "9999-12-31"), /between 2000 and 2099/);
  assert.equal(localCalendarDate(new Date(2026, 8, 7, 23, 30)), today);
});

test("all production plans assign actual anchor-relative dates and create schema-valid tasks", () => {
  for (const preset of DELIVERY_PRESETS) {
    const c = createCampaign();
    const result = scheduleDeliveryPreset([], preset.id, "2026-10-01", "  Kay  ");
    assert.equal(result.added, preset.steps.length);
    result.tasks.forEach((item, index) => {
      assert.equal(item.due, offsetCalendarDate("2026-10-01", preset.steps[index].days));
      assert.equal(item.owner, "Kay");
      assert.equal(item.done, false);
    });
    assert.ok(campaignSchema.safeParse({ ...c, tasks: result.tasks }).success);
  }
});

test("reapplying a plan preserves existing owners and dates; capacity reporting is exact", () => {
  const existing = scheduleDeliveryPreset([], "film", "2026-10-01").tasks;
  existing[0].owner = "Approved owner";
  existing[0].due = "2026-09-01";
  const snapshot = JSON.stringify(existing);
  const result = scheduleDeliveryPreset(existing, "film", "2026-12-01", "New owner");
  assert.equal(result.added, 0);
  assert.equal(result.duplicates, existing.length);
  assert.equal(JSON.stringify(existing), snapshot);
  assert.equal(result.tasks[0].owner, "Approved owner");
  const limited = scheduleDeliveryPreset(Array.from({ length: 198 }, (_, index) => task({ title: `Existing ${index}` })), "campaign", "2026-10-01");
  assert.equal(limited.tasks.length, 200);
  assert.equal(limited.added, 2);
  assert.equal(limited.excluded, DELIVERY_PRESETS[0].steps.length - 2);
});

test("due today is not overdue, completed tasks are excluded, and filter combinations work", () => {
  const tasks = [task({ title: "Old", due: "2026-09-06" }), task({ title: "Today" }), task({ title: "Later", due: "2026-09-08", owner: "Nana" }), task({ title: "Done", due: "2026-09-01", done: true }), task({ title: "Open", due: "", owner: " " })];
  assert.equal(taskStatus(tasks[1], today), "Due today");
  assert.deepEqual(filterDeliveryTasks(tasks, { status: "overdue", today }).map((item) => item.title), ["Old"]);
  assert.deepEqual(filterDeliveryTasks(tasks, { status: "open", owner: "Kay", dueBefore: today, search: "to", today }).map((item) => item.title), ["Today"]);
  assert.equal(filterDeliveryTasks(tasks, { status: "unassigned", today })[0].title, "Open");
  assert.equal(filterDeliveryTasks(tasks, { status: "unscheduled", today })[0].title, "Open");
});

test("delivery CSV escapes spreadsheet formula injection, quotes and multiline values", () => {
  const output = deliveryCsv([task({ title: '=HYPERLINK("https://example.ca")', owner: "Kay, Nana\nand team" })], today);
  assert.match(output, /"'=HYPERLINK\(""https:\/\/example.ca""\)"/);
  assert.match(output, /"Kay, Nana\nand team"/);
  assert.match(output, /"Due today","No"/);
});

test("launch package records stale approvals, incomplete evidence and real release blockers", () => {
  const c = createCampaign();
  c.revision = 2;
  c.name = "A | B <script>";
  c.content = [{ id: crypto.randomUUID(), date: today, channel: "Meta", title: "Old asset", copy: "Draft\ncopy", status: "Approved", revision: 1 }];
  c.evidence = [{ id: crypto.randomUUID(), claim: "An important claim", source: "", owner: "Kay", verified: true }];
  c.tasks = [task({ due: "2026-09-06" })];
  const output = buildLaunchPackage(c, { today, generatedAt: "2026-09-07T12:00:00Z", review: readiness(c), checks: CHECKS });
  assert.match(output, /STALE — revision 1/);
  assert.match(output, /0\/1 content items approved/);
  assert.match(output, /Review required/);
  assert.match(output, /unresolved launch blockers/);
  assert.match(output, /1 overdue/);
  assert.ok(!output.includes("<script>"));
  assert.equal(deliverySummary(c, today).verifiedEvidence, 0);
});

test("launch package detects changed same-revision task inputs in specialist approvals", () => {
  const c = createCampaign();
  c.tasks = [task()];
  const run = { id: crypto.randomUUID(), agent: "delivery", title: "Delivery review", text: "Reviewed earlier", mode: "Planning engine", revision: c.revision, createdAt: "2026-09-07T10:00:00Z", approved: true, sourceFingerprint: agentSourceFingerprint(c, "delivery") };
  c.runs = [run];
  c.tasks[0].owner = "Different owner";
  const output = buildLaunchPackage(c, { today, generatedAt: "2026-09-07T12:00:00Z", review: readiness(c), checks: CHECKS });
  assert.match(output, /STALE — revision 1; inputs changed or output superseded/);
  assert.ok(!output.includes("Approved for current brief"));
});
