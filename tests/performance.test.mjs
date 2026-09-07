import test from 'node:test';
import assert from 'node:assert/strict';
import {createCampaign, workspaceSchema} from '../lib/campaign.ts';
import {parseResultsCsv, mergeResults, performanceSummary, performanceSchema, pacing} from '../lib/performance.ts';
const header = 'date,channel,spend,impressions,clicks,leads,customers,revenue,source\n';
const sample = () => parseResultsCsv(header + '2026-08-01,Search,100,1000,100,10,2,600,"Account export, 7-day clicks"');
test('results CSV supports quoted sources and normalizes channel case', () => {
 const rows = parseResultsCsv(header + '2026-08-01,meta,10,100,20,2,1,70,"Dated export\nreviewed by team"');
 assert.equal(rows[0].channel,'Meta'); assert.ok(rows[0].source.includes('\n'));
});
test('results imports reject malformed CSV, duplicate channel/dates, blank and invalid numeric data', () => {
 for (const row of ['2026-02-30,Search,10,100,20,2,1,70,x','2026-08-01,Search,,100,20,2,1,70,x','2026-08-01,Search,10,100,101,2,1,70,x','2026-08-01,Search,10,100,20,2,1,70,"unclosed']) assert.throws(() => parseResultsCsv(header+row));
 assert.throws(() => parseResultsCsv(header+'2026-08-01,Search,10,100,20,2,1,70,x\n2026-08-01,Search,20,100,20,2,1,70,x'));
});
test('conflicting reports require explicit replacement and retain stable record identity', () => {
 const rows = sample(); const incoming = [{...rows[0],id:crypto.randomUUID(),spend:200}];
 assert.throws(() => mergeResults(rows,incoming));
 const result = mergeResults(rows,incoming,true); assert.equal(result.length,1); assert.equal(result[0].spend,200); assert.equal(result[0].id,rows[0].id);
});
test('actual economics use reported revenue and isolate media contribution from agency fees', () => {
 const c = createCampaign(); c.brief.margin=50;
 const r = performanceSummary(c,sample());
 assert.equal(r.roas,6);assert.equal(r.cpl,10);assert.equal(r.cac,50);assert.equal(r.mediaContribution,200);
 const empty=performanceSummary(c,[]);assert.equal(empty.roas,null);assert.equal(empty.cac,null);
});
test('pacing excludes pre-launch and future records, caps campaign duration', () => {
 const c=createCampaign(); c.brief.launchDate='2026-08-01';c.brief.weeks=2;c.brief.budget=1400;c.brief.agencyFee=0;c.brief.productionCost=0;
 c.performance={rows:[...sample(),{...sample()[0],id:crypto.randomUUID(),date:'2026-07-31',spend:500},{...sample()[0],id:crypto.randomUUID(),date:'2026-08-05',spend:400}]};
 const p=pacing(c,'2026-08-01');assert.equal(p.elapsed,1);assert.equal(p.spent,100);assert.equal(p.expected,100);assert.equal(p.remaining,1300);
 assert.equal(pacing(c,'2026-09-01').elapsed,14);
});
test('v2 workspace backups preserve optional results; legacy backups still validate', () => {
 const c=createCampaign(); const w={version:2,activeId:c.id,campaigns:[c]};assert.ok(workspaceSchema.safeParse(w).success);
 c.performance={rows:sample()}; assert.equal(workspaceSchema.parse(w).campaigns[0].performance.rows.length,1);
 assert.equal(performanceSchema.safeParse({rows:[{...sample()[0],spend:Infinity}]}).success,false);
});
