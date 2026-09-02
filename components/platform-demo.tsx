"use client";

import { ArrowUpRight, Check, CircleDollarSign, Clock3, FileCheck2, Gauge, MessageSquareText, MousePointerClick, Play, Target, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const modules=[
  ["Command","Goals, KPIs, sprint status and the next decisions in one view."],
  ["Briefs","Living campaign briefs, scope, owners, assumptions and change history."],
  ["Creative","Versioned work, frame-accurate comments and formal approvals."],
  ["Content","One calendar for production, review, localization and publishing."],
  ["Media","Plan, channel spend, agency fee, pacing and performance separated."],
  ["Intelligence","Definitions, sources, timestamps, attribution and next actions."],
  ["Assets","Approved brand files, rights, releases and provenance records."],
  ["Commercial","Estimates, purchase orders, invoices and change requests."],
];

export function PlatformDemo(){return <div className="platform-demo">
  <div className="demo-topbar"><div><span className="demo-mark">K</span><b>KINGXFORD / CLIENT</b></div><span className="demo-badge">INTERACTIVE DEMONSTRATION</span><div className="demo-avatar">KO</div></div>
  <div className="demo-shell">
    <aside className="demo-sidebar"><span>WORKSPACE</span>{["Command","Projects","Creative","Content","Media","Reports","Assets","Billing"].map((x,i)=><button className={i===0?"active":""} key={x}><i>0{i+1}</i>{x}</button>)}</aside>
    <div className="demo-main">
      <div className="demo-welcome"><div><small>DEMONSTRATION WORKSPACE</small><h2>Good afternoon.</h2><p>Here&apos;s what the work needs from you.</p></div><button>NEW REQUEST <ArrowUpRight/></button></div>
      <Tabs defaultValue="command" className="demo-tabs">
        <TabsList variant="line" className="demo-tablist"><TabsTrigger value="command">Command</TabsTrigger><TabsTrigger value="creative">Creative</TabsTrigger><TabsTrigger value="media">Media</TabsTrigger><TabsTrigger value="revenue">Revenue</TabsTrigger></TabsList>
        <TabsContent value="command"><div className="demo-kpis"><div><Target/><span>PRIMARY GOAL</span><b>Qualified pipeline</b><small>One source of truth</small></div><div><Clock3/><span>NEXT DECISION</span><b>2 approvals</b><small>Due this week</small></div><div><Gauge/><span>ACTIVE SPRINT</span><b>68% complete</b><small>On planned pace</small></div><div><CircleDollarSign/><span>BUDGET STATUS</span><b>54% deployed</b><small>Fees + media separate</small></div></div><div className="demo-workgrid"><div className="demo-decisions"><header><b>Decisions waiting</b><span>2 OPEN</span></header><div><FileCheck2/><p><b>Campaign key visual / V03</b><small>Approve or request a precise change</small></p><button>REVIEW</button></div><div><MessageSquareText/><p><b>September content calendar</b><small>12 posts · 4 reels · 2 articles</small></p><button>REVIEW</button></div></div><div className="demo-progress"><header><b>Launch readiness</b><span>68%</span></header>{[["Strategy",100],["Creative",82],["Production",60],["Media",72],["Measurement",48]].map(([x,n])=><div key={String(x)}><span>{x}</span><i><em style={{width:`${n}%`}}/></i><b>{n}%</b></div>)}</div></div></TabsContent>
        <TabsContent value="creative"><div className="demo-feature-view"><div className="demo-video"><Play/><span>CAMPAIGN FILM / CUT 03</span></div><div><small>FRAME-ACCURATE REVIEW</small><h3>Fewer email chains.<br/>Clearer decisions.</h3><p>Pin feedback to the exact moment, compare versions, record approvals and preserve the decision history.</p><div className="demo-comment"><div className="demo-avatar small">KO</div><span><b>00:14</b> Let the product reveal breathe for two more beats.</span></div></div></div></TabsContent>
        <TabsContent value="media"><div className="demo-feature-view"><div className="channel-chart">{[["Search",34],["Social",27],["CTV",18],["Audio",11],["OOH",10]].map(([x,n])=><div key={String(x)}><span>{x}</span><i style={{height:`${Number(n)*2.8}px`}}/><b>{n}%</b></div>)}</div><div><small>MEDIA TRANSPARENCY</small><h3>Every channel.<br/>Every dollar.</h3><p>See platform spend, production, agency fees, pacing and source data without combining unlike costs.</p></div></div></TabsContent>
        <TabsContent value="revenue"><div className="demo-feature-view"><div className="funnel-view">{[["Attention","148K"],["Engaged","12.4K"],["Leads","418"],["Qualified","96"],["Won","18"]].map(([x,n],i)=><div key={String(x)} style={{width:`${100-i*13}%`}}><span>{x}</span><b>{n}</b></div>)}</div><div><small>ATTRIBUTION WITH CONTEXT</small><h3>Follow the signal<br/>to the sale.</h3><p>Connect campaign activity to lead stages and revenue while keeping source, window and confidence visible.</p></div></div></TabsContent>
      </Tabs>
    </div>
  </div>
  <div className="demo-note"><Check/> Concept demonstration—sample data, not represented as client performance.</div>
</div>}

export function PlatformModules(){return <div className="platform-module-grid">{modules.map(([title,desc],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{desc}</p></article>)}</div>}
