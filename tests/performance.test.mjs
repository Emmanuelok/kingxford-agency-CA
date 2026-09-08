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

const {reportingCoverage, comparePerformance, performanceInsights, performanceDecisionBrief} = await import('../lib/performance.ts');
const {growthTargetPlan, campaignTrackingUrl} = await import('../lib/growth.ts');

test('pacing stops spend at campaign end and measures coverage for every expected channel', () => {
 const c = createCampaign(); c.brief.launchDate='2026-08-01';c.brief.weeks=1;c.brief.budget=1400;c.brief.agencyFee=0;c.brief.productionCost=0;
 c.media=[{channel:'Search',weight:50,cpc:2,cvr:5},{channel:'Meta',weight:50,cpc:2,cvr:5}];
 const day = sample()[0];
 c.performance={rows:[{...day,date:'2026-08-01'},{...day,id:crypto.randomUUID(),date:'2026-08-08',spend:900}]};
 const p=pacing(c,'2026-08-20'); assert.equal(p.spent,100);assert.equal(p.end,'2026-08-07');assert.equal(p.daysLeft,0);assert.equal(p.dailyRemaining,null);
 assert.equal(p.coverage.expected,14);assert.equal(p.coverage.recorded,1);assert.equal(p.completeCoverage,false);
 assert.equal(pacing(c,'2026-08-01').dailyRemaining,1300/6);
 assert.equal(pacing(c,'not-a-date').spent,0);
});

test('coverage cannot call a multi-channel day complete when one channel is missing', () => {
 const c=createCampaign();c.media=[{channel:'Search',weight:1,cpc:2,cvr:3},{channel:'Meta',weight:1,cpc:2,cvr:3}];
 const coverage=reportingCoverage(c,sample(),'2026-08-01','2026-08-01');
 assert.equal(coverage.expected,2);assert.equal(coverage.missing,1);assert.equal(coverage.percentage,50);
 assert.equal(reportingCoverage(c,sample(),'2026-08-01','2026-08-01','Search').percentage,100);
 assert.equal(reportingCoverage(c,sample(),'2026-08-02','2026-08-01'),null);
});

test('comparison uses matching date lengths, channel filters and no percentage for a zero baseline', () => {
 const c=createCampaign(), a=sample()[0];
 const rows=[{...a,date:'2026-08-08',spend:200},{...a,id:crypto.randomUUID(),date:'2026-08-01',spend:100},{...a,id:crypto.randomUUID(),date:'2026-08-01',channel:'Meta',spend:999}];
 const comparison=comparePerformance(c,rows,'2026-08-08','2026-08-14','Search');
 assert.equal(comparison.previousFrom,'2026-08-01');assert.equal(comparison.previousTo,'2026-08-07');assert.equal(comparison.changes.spend,100);assert.equal(comparison.previousRecords,1);
 const noBaseline=comparePerformance(c,rows,'2026-08-01','2026-08-07','Search');assert.equal(noBaseline.changes.spend,null);
 const zeroBaseline=comparePerformance(c,[{...a,date:'2026-08-02'}, {...a,id:crypto.randomUUID(),date:'2026-08-01',spend:0}],'2026-08-02','2026-08-02');assert.equal(zeroBaseline.changes.spend,null);
});

test('summary computes channel economics from totals, not average daily ratios', () => {
 const c=createCampaign();const a=sample()[0];
 const rows=[a,{...a,id:crypto.randomUUID(),date:'2026-08-02',spend:900,clicks:900,customers:18}];
 const channel=performanceSummary(c,rows).byChannel[0];
 assert.equal(channel.cpc,1);assert.equal(channel.cac,50);assert.equal(channel.days,2);assert.equal(channel.clicks,1000);
});

test('rule-based next actions withhold scaling language from thin or inconsistent observations', () => {
 const c=createCampaign(), a=sample()[0];
 assert.equal(performanceInsights(c,[a])[0].level,'watch');
 assert.match(performanceInsights(c,[{...a,leads:101}])[0].title,/Reconcile/);
 assert.match(performanceInsights(c,[{...a,clicks:0,leads:0,customers:0,revenue:0}])[0].title,/delivery/);
 const full=Array.from({length:7},(_,i)=>({...a,id:crypto.randomUUID(),date:`2026-08-0${i+1}`}));
 assert.equal(performanceInsights(c,full)[0].level,'opportunity');
 assert.equal(performanceInsights(c,full.map((r)=>({...r,revenue:1})))[0].level,'review');
 assert.equal(performanceInsights(c,[]).length,0);
});

test('CSV merge rejects duplicate incoming dates even if replacement is enabled', () => {
 const rows=sample();
 assert.throws(()=>mergeResults([], [rows[0], {...rows[0],id:crypto.randomUUID()}], true));
 assert.throws(()=>parseResultsCsv(header+'2026-08-01,Search,10,100,20,2,1,70,"'+ 'é'.repeat(260000) +'"'),/500 KB/);
});

test('decision brief keeps the selected window and source caveats with exported evidence', () => {
 const c=createCampaign();const brief=performanceDecisionBrief(c,sample(),'2026-08-01','2026-08-01','Search');
 assert.match(brief,/2026-08-01 through 2026-08-01/);assert.match(brief,/Account export, 7-day clicks/);assert.match(brief,/excludes fees and production/);assert.match(brief,/No budgets or campaigns were changed/);
});

test('reverse customer planning reconciles fixed costs and direct-sales objectives', () => {
 const c=createCampaign();c.brief.objective='sales';c.brief.leadToSale=10;c.brief.agencyFee=500;c.brief.productionCost=500;c.brief.revenuePerCustomer=100;c.brief.margin=50;
 c.media=[{channel:'Search',weight:100,cpc:2,cvr:10}];
 const plan=growthTargetPlan(c,100);assert.equal(plan.media,2000);assert.equal(plan.investment,3000);assert.equal(plan.contribution,2000);assert.equal(plan.breakEvenCustomers,60);
 c.brief.objective='leads';assert.ok(Math.abs(growthTargetPlan(c,100).media - 20000) < 0.000001);
 c.brief.leadToSale=0;assert.equal(growthTargetPlan(c,100),null);
 assert.equal(growthTargetPlan(c,0),null);assert.equal(growthTargetPlan(c,1.5),null);
 c.brief.objective='sales';c.media[0].cvr=1e-300;assert.equal(growthTargetPlan(c,10_000_000),null);
});

test('observed customer goal uses actual media CAC but keeps brief customer value and margin', () => {
 const c=createCampaign();c.performance={rows:sample()};
 assert.equal(growthTargetPlan(c,10,'observed').media,500);
 c.performance={rows:[]};assert.equal(growthTargetPlan(c,10,'observed'),null);
});

test('campaign URL builder preserves destination queries and anchors and replaces existing UTMs', () => {
 const result=campaignTrackingUrl({destination:'https://example.com/offer?plan=annual&utm_source=old&utm_term=old#details',source:'email list',medium:'email',campaign:'autumn & winter',content:'hero-a',term:''});
 assert.equal(result.error,null);const url=new URL(result.url);
 assert.equal(url.searchParams.get('plan'),'annual');assert.equal(url.hash,'#details');assert.equal(url.searchParams.get('utm_source'),'email list');assert.equal(url.searchParams.get('utm_campaign'),'autumn & winter');assert.equal(url.searchParams.has('utm_term'),false);
 const base={source:'x',medium:'email',campaign:'launch',content:'',term:''};
 for(const destination of ['javascript:alert(1)','https://user:password@example.com','not-a-url']) assert.equal(campaignTrackingUrl({...base,destination}).url,null);
 assert.equal(campaignTrackingUrl({...base,destination:'https://example.com',source:''}).url,null);
});
