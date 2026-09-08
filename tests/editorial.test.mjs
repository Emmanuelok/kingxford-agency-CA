import test from "node:test";
import assert from "node:assert/strict";
import {createCampaign} from "../lib/campaign.ts";
import {editorialIcs, mergeEditorial, parseEditorialCsv, shiftEditorial, pageHandoff} from "../lib/editorial.ts";
test("editorial CSV preserves multiline copy, resets approval and rejects invalid rows",()=>{
 const rows=parseEditorialCsv('date,channel,title,copy,status\n2026-09-08,meta,"A, B","Line one\nLine ""two""",Approved',3);
 assert.equal(rows[0].channel,"Meta");assert.equal(rows[0].copy,'Line one\nLine "two"');assert.equal(rows[0].status,"Draft");assert.equal(rows[0].revision,3);
 assert.throws(()=>parseEditorialCsv('date,channel,title,copy\n2026-02-30,Meta,Title,Body',1),/real date/);
 assert.throws(()=>parseEditorialCsv('date,channel,title,copy\n,Unknown,Title,Body',1),/channel must/);
 assert.throws(()=>parseEditorialCsv('date,channel,title,copy\n,Meta,"Title"bad,Body',1),/Unexpected text/);
});
test("editorial merge retains existing edits and skips exact duplicates",()=>{const x=parseEditorialCsv('date,channel,title,copy\n,Organic,Title,Body',1);const result=mergeEditorial(x,[...x,{...x[0],id:crypto.randomUUID()}]);assert.equal(result.added,0);assert.equal(result.skipped,2);assert.equal(result.items[0].id,x[0].id);});
test("calendar rescheduling invalidates approval and refuses out-of-range shifts atomically",()=>{const x=parseEditorialCsv('date,channel,title,copy\n2026-12-31,Organic,Title,Body',1);x[0].status="Approved";const next=shiftEditorial(x,[x[0].id],1);assert.equal(next[0].date,"2027-01-01");assert.equal(next[0].status,"Draft");assert.equal(x[0].date,"2026-12-31");assert.throws(()=>shiftEditorial(x,[x[0].id],1.5));const far=[{...x[0],date:"2099-12-31"}];assert.throws(()=>shiftEditorial(far,[x[0].id],1));});
test("calendar export uses all-day dates, stable IDs and escapes injected properties",()=>{const c=createCampaign();c.content=parseEditorialCsv('date,channel,title,copy\n2026-09-08,Organic,Title,Body',1);c.content[0].title="Hello\nATTENDEE:attacker@example.com";c.content[0].copy="é".repeat(200);const ics=editorialIcs(c,new Date("2026-09-08T10:00:00Z"));assert.match(ics,/DTSTART;VALUE=DATE:20260908/);assert.match(ics,/DTEND;VALUE=DATE:20260909/);assert.ok(!ics.includes("\r\nATTENDEE:"));assert.ok(ics.split("\r\n").every(line=>new TextEncoder().encode(line).length<=75));assert.match(ics,/STATUS:TENTATIVE/);});
test("page prototype escapes untrusted copy and includes no active form or script",()=>{const c=createCampaign();c.web.title='</title><script>alert(1)</script>';c.web.body='<img src=x onerror=alert(1)>';const html=pageHandoff(c);assert.ok(!html.includes("<script>"));assert.ok(!html.includes("<img"));assert.match(html,/&lt;script&gt;/);assert.match(html,/noindex,nofollow/);});
