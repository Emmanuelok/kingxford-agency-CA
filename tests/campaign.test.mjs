import test from "node:test";
import assert from "node:assert/strict";
import {
  AGENTS,
  CHECKS,
  createCampaign,
  newWorkspace,
  workspaceSchema,
  campaignSchema,
  changed,
  forecast,
  experimentMath,
  contentCalendar,
  runAgent,
  readiness,
  csv,
  buildUtm,
  safeUrl,
  validDate,
  auditWeb,
  uid,
} from "../lib/campaign.ts";
import { inquirySchema } from "../lib/inquiry.ts";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function economics() {
  const c = createCampaign(true);
  c.brief = {
    ...c.brief,
    budget: 15000,
    agencyFee: 3000,
    productionCost: 2000,
    revenuePerCustomer: 1000,
    margin: 50,
    leadToSale: 20,
  };
  c.media = [{ channel: "Search", weight: 100, cpc: 5, cvr: 10 }];
  return c;
}
test("default workspace and example roundtrip through schema", () => {
  assert.ok(workspaceSchema.safeParse(newWorkspace()).success);
  assert.ok(campaignSchema.safeParse(createCampaign(true)).success);
});
test("media base case reconciles acquisition economics", () => {
  const f = forecast(economics());
  assert.equal(f.spend, 10000);
  assert.equal(f.clicks, 2000);
  assert.equal(f.conversions, 200);
  assert.equal(f.customers, 40);
  assert.equal(f.revenue, 40000);
  assert.equal(f.contribution, 5000);
  assert.equal(f.cpa, 250);
  assert.equal(f.fullyLoadedCac, 375);
  assert.equal(f.roas, 4);
  assert.equal(f.breakEvenCustomers, 30);
});
test("conservative case combines explicit cost/rate changes", () => {
  const f = forecast(economics(), "conservative");
  close(f.customers, 24);
  close(f.contribution, -3000);
});
test("upside case preserves unit economics", () => {
  const f = forecast(economics(), "upside");
  close(f.customers, 62.5);
  close(f.contribution, 16250);
});
test("sales objective does not apply a lead close rate twice", () => {
  const c = economics();
  c.brief.objective = "sales";
  assert.equal(forecast(c).customers, 200);
});
test("infeasible budgets flagged without negative media", () => {
  const c = economics();
  c.brief.budget = 100;
  const f = forecast(c);
  assert.equal(f.invalidBudget, true);
  assert.equal(f.spend, 0);
  assert.equal(f.roas, null);
});
test("zero weights preserve unallocated spend and null ROAS", () => {
  const c = economics();
  c.media[0].weight = 0;
  const f = forecast(c);
  assert.equal(f.allocated, 0);
  assert.equal(f.unallocated, 10000);
  assert.equal(f.roas, null);
});
test("positive weights do not create a false zero-weight warning", () => {
  const c = economics();
  c.brief = { ...c.brief, budget: 1, agencyFee: 0, productionCost: 0 };
  c.media = [1, 4, 1].map((weight) => ({
    channel: "Search",
    weight,
    cpc: 5,
    cvr: 10,
  }));
  assert.equal(forecast(c).unallocated, 0);
});
test("zero conversions produce no invented acquisition cost", () => {
  const c = economics();
  c.media[0].cvr = 0;
  assert.equal(forecast(c).cpa, null);
  assert.equal(forecast(c).fullyLoadedCac, null);
});
test("zero margin produces no finite break-even number", () => {
  const c = economics();
  c.brief.margin = 0;
  assert.equal(forecast(c).breakEvenCustomers, null);
});
test("upside cannot exceed 100 percent conversion", () => {
  const c = economics();
  c.media[0].cvr = 90;
  const f = forecast(c, "upside");
  close(f.conversions, f.clicks);
});
test("non-finite and out-of-range assumptions rejected", () => {
  for (const value of [NaN, Infinity, -1, 101]) {
    const c = economics();
    c.media[0].cvr = value;
    assert.equal(campaignSchema.safeParse(c).success, false);
  }
});
test("experiment sample size matches reference", () => {
  const e = {
    ...createCampaign().experiment,
    baseline: 2,
    lift: 20,
    dailyVisitors: 1000,
  };
  const m = experimentMath(e);
  assert.equal(m.sample, 21109);
  assert.equal(m.days, 43);
});
test("invalid target rate produces no sample", () => {
  const m = experimentMath({
    ...createCampaign().experiment,
    baseline: 50,
    lift: 100,
  });
  assert.equal(m.sample, null);
  assert.equal(m.days, null);
});
test("observed conversions cannot exceed visitors", () => {
  const m = experimentMath({
    ...createCampaign().experiment,
    controlVisitors: 10,
    controlConversions: 11,
  });
  assert.equal(m.valid, false);
  assert.equal(m.interval, null);
  assert.equal(m.sufficient, false);
});
test("sparse results are not treated as sufficient", () => {
  const m = experimentMath({
    ...createCampaign().experiment,
    controlVisitors: 100000,
    variantVisitors: 100000,
    controlConversions: 2,
    variantConversions: 3,
  });
  assert.equal(m.sufficient, false);
});
test("observed interval agrees with two-proportion approximation", () => {
  const m = experimentMath({
    ...createCampaign().experiment,
    baseline: 2,
    lift: 20,
    controlVisitors: 25000,
    controlConversions: 500,
    variantVisitors: 25000,
    variantConversions: 600,
  });
  close(m.difference, 0.004);
  close(m.interval[0], 0.001428766845);
  close(m.interval[1], 0.006571233155);
  assert.equal(m.sufficient, true);
});
test("fractional observed counts rejected", () => {
  const c = createCampaign();
  c.experiment.controlVisitors = 1.5;
  assert.equal(campaignSchema.safeParse(c).success, false);
});
test("calendar is deterministic in dates and retains revision", () => {
  const c = createCampaign(true);
  c.brief.launchDate = "2026-12-20";
  const items = contentCalendar(c);
  assert.equal(items.length, 12);
  assert.equal(items[0].date, "2026-12-20");
  assert.equal(items[11].date, "2027-01-11");
  assert.ok(
    items.every((x) => x.status === "Draft" && x.revision === c.revision),
  );
});
test("maximum brief fields never overflow generated copy", () => {
  const c = createCampaign(true);
  c.brief.audience = "a".repeat(2000);
  c.brief.offer = "b".repeat(2000);
  c.brief.proof = "p".repeat(2000);
  c.content = contentCalendar(c);
  assert.ok(campaignSchema.safeParse(c).success);
  assert.ok(c.content.every((x) => x.copy.length <= 5000));
});
test("all registered specialist outputs are valid and explicitly labelled", () => {
  const c = createCampaign(true);
  c.runs = AGENTS.map((a) => runAgent(c, a.id));
  assert.equal(c.runs.length, AGENTS.length);
  assert.ok(campaignSchema.safeParse(c).success);
  assert.ok(
    c.runs.every(
      (r) =>
        r.mode === "Planning engine" &&
        !r.approved &&
        r.text.includes("Human review required"),
    ),
  );
});
test("large evidence ledgers do not overflow review output", () => {
  const c = createCampaign(true);
  c.evidence = Array.from({ length: 100 }, () => ({
    id: uid(),
    claim: "c".repeat(1000),
    source: "s".repeat(1000),
    owner: "owner",
    verified: false,
  }));
  c.runs = [runAgent(c, "review")];
  assert.ok(campaignSchema.safeParse(c).success);
  assert.ok(c.runs[0].text.includes("first 12"));
});
test("brief edits invalidate approval context", () => {
  const c = createCampaign(true);
  c.runs = [{ ...runAgent(c, "strategy"), approved: true }];
  c.checks = { signoff: true };
  const next = changed(
    c,
    { brief: { ...c.brief, offer: "Different offer" } },
    "Edited offer",
    true,
  );
  assert.equal(next.revision, 2);
  assert.deepEqual(next.checks, {});
  assert.equal(readiness(next).stale, 1);
});
test("experiment edits invalidate dependent outputs", () => {
  const c = createCampaign(true);
  const next = changed(
    c,
    { experiment: { ...c.experiment, baseline: 4 } },
    "Changed experiment",
  );
  assert.equal(next.revision, 2);
});
test("content mutations reopen final signoff", () => {
  const c = createCampaign(true);
  c.checks = { signoff: true };
  const next = changed(c, { content: contentCalendar(c) }, "Generated content");
  assert.equal(next.checks.signoff, false);
  assert.ok(
    readiness(next).blockers.includes("Content drafts still need approval"),
  );
});
test("latest current output supersedes old history regardless of order", () => {
  const c = createCampaign(true);
  const old = runAgent(c, "strategy");
  c.revision = 2;
  const current = runAgent(c, "strategy");
  c.runs = [old, current];
  assert.equal(readiness(c).stale, 0);
});
test("empty evidence claim cannot satisfy proof review", () => {
  const c = createCampaign(true);
  c.evidence = [
    { id: uid(), claim: "", source: "doc", owner: "Owner", verified: true },
  ];
  assert.ok(readiness(c).blockers.some((x) => x.includes("evidence")));
});
test("default readiness never prechecks unsupported claims", () => {
  assert.equal(readiness(createCampaign()).score, 0);
});
test("all checks alone cannot approve draft outputs", () => {
  const c = createCampaign(true);
  c.checks = Object.fromEntries(CHECKS.map(([id]) => [id, true]));
  c.runs = [runAgent(c, "creative")];
  assert.ok(readiness(c).blockers.some((x) => x.includes("specialist")));
});
test("activity messages are bounded at schema maximum", () => {
  const c = changed(createCampaign(), {}, "Completed " + "a".repeat(300));
  assert.equal(c.activity[0].action.length, 300);
  assert.ok(campaignSchema.safeParse(c).success);
});
test("duplicate child IDs are rejected", () => {
  const c = createCampaign();
  const r = runAgent(c, "strategy");
  c.runs = [r, r];
  assert.equal(campaignSchema.safeParse(c).success, false);
});
test("backup rejects inactive and duplicate campaign references", () => {
  const w = newWorkspace();
  w.activeId = uid();
  assert.equal(workspaceSchema.safeParse(w).success, false);
  w.activeId = w.campaigns[0].id;
  w.campaigns.push(w.campaigns[0]);
  assert.equal(workspaceSchema.safeParse(w).success, false);
});
test("unsafe URL protocols and credentials rejected", () => {
  for (const s of [
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:pass@example.ca",
  ]) {
    assert.equal(safeUrl(s), null);
  }
});
test("UTM builder preserves query parameters and hash", () => {
  const url = new URL(
    buildUtm(
      "https://example.ca/book?x=a&x=b&utm_source=old#rooms",
      "Google",
      "Paid Search",
      "Summer & Fall",
    ),
  );
  assert.deepEqual(url.searchParams.getAll("x"), ["a", "b"]);
  assert.equal(url.searchParams.get("utm_source"), "google");
  assert.equal(url.searchParams.get("utm_campaign"), "summer_&_fall");
  assert.equal(url.hash, "#rooms");
});
test("incomplete UTM request stays invalid", () => {
  assert.equal(buildUtm("https://example.ca", "", "cpc", "launch"), null);
});
test("CSV escapes quotes and shields formula starters", () => {
  for (const value of ["=1+1", " +SUM(A1)", "\n=1+1", "＠SUM(A1)", "\tbad"]) {
    assert.ok(csv([[value]]).startsWith("\"'"));
  }
  assert.equal(csv([[-5]]), '"-5"');
  assert.equal(csv([['He said "yes"']]), '"He said ""yes"""');
});
test("date validation handles leap years and rollover", () => {
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-02-29"), false);
  assert.equal(validDate("2026-13-01"), false);
});
test("copy heuristics flag isolated percentage claims", () => {
  const c = createCampaign();
  c.web.heading = "100% effective";
  assert.equal(
    auditWeb(c.web).find((c) => c.title === "Claims review").passed,
    false,
  );
});
test("inquiry requires meaningful contact and challenge fields", () => {
  assert.equal(
    inquirySchema.safeParse({ name: "", org: "", email: "bad", challenge: "" })
      .success,
    false,
  );
  assert.equal(
    inquirySchema.safeParse({
      name: "Agency Client",
      org: "Sample Company",
      email: "hello@example.ca",
      challenge: "We want to improve qualified bookings in our city.",
    }).success,
    true,
  );
});
test("revision lineage rejects negative, future and unsafe revisions", () => {
  for (const revision of [-1, 0, 999]) {
    const c = createCampaign(true);
    c.runs = [{ ...runAgent(c, "strategy"), revision }];
    assert.equal(campaignSchema.safeParse(c).success, false);
  }
  const c = createCampaign(true);
  c.revision = 9007199254740992;
  assert.equal(campaignSchema.safeParse(c).success, false);
});
test("brief and media mutations invalidate context without a caller flag", () => {
  const c = createCampaign(true);
  c.checks = { signoff: true };
  for (const patch of [
    { brief: { ...c.brief, brand: "Changed" } },
    { media: c.media.map((m) => ({ ...m, cpc: m.cpc + 1 })) },
  ]) {
    const next = changed(c, patch, "Changed context");
    assert.equal(next.revision, 2);
    assert.deepEqual(next.checks, {});
  }
});
test("infeasible media output withholds misleading contribution", () => {
  const c = createCampaign(true);
  c.brief.budget = 100;
  c.brief.agencyFee = 3000;
  c.brief.productionCost = 2000;
  const output = runAgent(c, "media").text;
  assert.match(output, /Infeasible budget/);
  assert.match(output, /4900/);
  assert.doesNotMatch(output, /Contribution after all planned campaign costs/);
});
test("review export does not call whitespace evidence verified", () => {
  const c = createCampaign(true);
  c.evidence = [
    {
      id: crypto.randomUUID(),
      claim: "Test claim",
      source: " ",
      owner: " ",
      verified: true,
    },
  ];
  const output = runAgent(c, "review").text;
  assert.match(output, /Needs review/);
  assert.doesNotMatch(output, /Marked verified by user/);
});
test("calendar planning date cannot overflow its supported date range", () => {
  const c = createCampaign();
  c.brief.launchDate = "9999-12-31";
  assert.equal(campaignSchema.safeParse(c).success, false);
  assert.ok(contentCalendar(c).every((item) => validDate(item.date)));
});
test("specialist output changes reopen final signoff", () => {
  const c = createCampaign(true);
  c.checks = { signoff: true };
  assert.equal(
    changed(c, { runs: [runAgent(c, "strategy")] }, "Ran strategy").checks
      .signoff,
    false,
  );
});
