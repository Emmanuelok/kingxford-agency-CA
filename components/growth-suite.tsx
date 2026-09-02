"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Clipboard, Download, Gauge, Mail, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const goals={
  launch:{label:"Launch something new",focus:"Brand & Digital Launch",channels:[["Strategy",28],["Brand & creative",28],["Web / conversion",24],["Launch media",20]],moves:["Clarify the market and offer","Build the identity and conversion path","Launch with measured creative and media"]},
  leads:{label:"Generate qualified leads",focus:"Campaign Pilot",channels:[["Search",32],["Paid social",24],["Landing / CRO",22],["Content",12],["CRM",10]],moves:["Sharpen the offer and audience","Build tracked landing journeys","Connect media to lead quality"]},
  local:{label:"Increase local demand",focus:"Local Market Launch",channels:[["Local search",30],["Paid social",24],["Reputation",18],["Content",18],["Email / SMS",10]],moves:["Fix local discovery and proof","Create community-relevant content","Turn visits into repeat demand"]},
  sales:{label:"Grow online sales",focus:"Commerce Growth Sprint",channels:[["Performance media",30],["Commerce UX",25],["Creative",20],["Lifecycle",15],["Analytics",10]],moves:["Find checkout and offer friction","Build conversion-ready creative","Improve acquisition and retention together"]},
  content:{label:"Build a content system",focus:"Always-On Content Studio",channels:[["Production",36],["Social",24],["Creator / UGC",18],["Distribution",12],["Learning",10]],moves:["Define repeatable content pillars","Batch-produce channel-ready assets","Learn from attention and response"]},
  expansion:{label:"Enter a new market",focus:"Next-City Expansion Playbook",channels:[["Market intelligence",26],["Localization",22],["Creative",20],["Media",20],["Sales enablement",12]],moves:["Read the next market before entering","Adapt the proposition and proof","Launch a controlled market test"]},
};
const sectors=["Tourism & hospitality","Retail & commerce","Construction & real estate","Technology & SaaS","Ocean & energy","Professional services","Healthcare & wellness","Education","Government & public","Nonprofit & community","Other"];
const readiness=["Our business objective is specific","The offer and next action are clear","We know the priority audience","A conversion destination is ready","Analytics and lead tracking work","Sales can follow up quickly","Creative rights and approvals are clear","Budget includes both agency and media"];

export function GrowthSuite(){
  const [goal,setGoal]=useState<keyof typeof goals>("leads");
  const [sector,setSector]=useState(sectors[0]);
  const [budget,setBudget]=useState([18000]);
  const [weeks,setWeeks]=useState([10]);
  const [checked,setChecked]=useState<number[]>([0,1,2]);
  const plan=goals[goal];
  const readinessScore=Math.round(checked.length/readiness.length*100);
  const mediaBudget=Math.round(budget[0]*.42);
  const agencyBudget=budget[0]-mediaBudget;
  const summary=useMemo(()=>`KINGXFORD GROWTH PLAN\n\nObjective: ${plan.label}\nSector: ${sector}\nWorking investment: $${budget[0].toLocaleString()} CAD\nPlanning window: ${weeks[0]} weeks\nRecommended engagement: ${plan.focus}\n\nFirst moves:\n${plan.moves.map((m,i)=>`${i+1}. ${m}`).join("\n")}\n\nIndicative allocation:\n${plan.channels.map(([c,p])=>`${c}: ${p}%`).join("\n")}\n\nPlanning note: This is an indicative decision aid, not a quote or performance forecast. Media, production, talent, travel, taxes and third-party costs require confirmation.`,[plan,sector,budget,weeks]);
  function downloadPlan(){const url=URL.createObjectURL(new Blob([summary],{type:"text/plain"}));const a=document.createElement("a");a.href=url;a.download="kingxford-growth-plan.txt";a.click();URL.revokeObjectURL(url)}
  async function copyPlan(){await navigator.clipboard?.writeText(summary)}
  return <Tabs defaultValue="planner" className="growth-suite">
    <TabsList variant="line" className="suite-tabs"><TabsTrigger value="planner">Growth planner</TabsTrigger><TabsTrigger value="media">Media split</TabsTrigger><TabsTrigger value="readiness">Readiness check</TabsTrigger></TabsList>
    <TabsContent value="planner" className="suite-panel">
      <div className="suite-controls">
        <div className="control-head"><span>01 / DEFINE THE MOVE</span><b>Shape a realistic first engagement.</b></div>
        <label><span>Primary objective</span><Select value={goal} onValueChange={(v)=>setGoal(v as keyof typeof goals)}><SelectTrigger className="suite-select"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(goals).map(([k,v])=><SelectItem value={k} key={k}>{v.label}</SelectItem>)}</SelectContent></Select></label>
        <label><span>Sector</span><Select value={sector} onValueChange={setSector}><SelectTrigger className="suite-select"><SelectValue/></SelectTrigger><SelectContent>{sectors.map(s=><SelectItem value={s} key={s}>{s}</SelectItem>)}</SelectContent></Select></label>
        <div className="slider-control"><span>Working investment <b>${budget[0].toLocaleString()} CAD</b></span><Slider value={budget} onValueChange={setBudget} min={5000} max={100000} step={1000} aria-label="Working investment in Canadian dollars"/><small>$5K diagnostic <i/> $100K+ integrated launch</small></div>
        <div className="slider-control"><span>Time to first launch <b>{weeks[0]} weeks</b></span><Slider value={weeks} onValueChange={setWeeks} min={4} max={24} step={1} aria-label="Weeks to launch"/><small>4 weeks <i/> 24 weeks</small></div>
      </div>
      <div className="suite-result">
        <div className="result-label"><Sparkles/> LIVE RECOMMENDATION</div><h2>{plan.focus}</h2><p>For a {sector.toLowerCase()} organization aiming to <b>{plan.label.toLowerCase()}</b>, begin with a focused {weeks[0]}-week plan before expanding scope.</p>
        <div className="first-moves">{plan.moves.map((m,i)=><div key={m}><span>0{i+1}</span>{m}</div>)}</div>
        <div className="budget-split"><div><span>Agency / production allowance</span><b>${agencyBudget.toLocaleString()}</b></div><div><span>Indicative media allowance</span><b>${mediaBudget.toLocaleString()}</b></div></div>
        <small className="result-disclaimer">Decision aid only. Final scope depends on deliverables, production, media markets, rights, travel and available client resources.</small>
        <Dialog><DialogTrigger asChild><Button className="suite-primary">OPEN MY PLAN <ArrowUpRight/></Button></DialogTrigger><DialogContent className="plan-dialog"><DialogHeader><DialogTitle>Your starting plan</DialogTitle><DialogDescription>A practical brief you can keep, share or bring into a fit call.</DialogDescription></DialogHeader><pre>{summary}</pre><div className="dialog-actions"><Button variant="outline" onClick={copyPlan}><Clipboard/> Copy</Button><Button onClick={downloadPlan}><Download/> Download</Button><Button asChild><a href={`mailto:hello@kingxford.co?subject=${encodeURIComponent("KINGXFORD growth plan")}&body=${encodeURIComponent(summary)}`}><Mail/> Discuss</a></Button></div></DialogContent></Dialog>
      </div>
    </TabsContent>
    <TabsContent value="media" className="suite-panel media-panel">
      <div className="suite-controls"><div className="control-head"><span>02 / INDICATIVE MIX</span><b>See how the objective changes allocation.</b></div><label><span>Campaign objective</span><Select value={goal} onValueChange={(v)=>setGoal(v as keyof typeof goals)}><SelectTrigger className="suite-select"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(goals).map(([k,v])=><SelectItem value={k} key={k}>{v.label}</SelectItem>)}</SelectContent></Select></label><div className="slider-control"><span>Total working investment <b>${budget[0].toLocaleString()} CAD</b></span><Slider value={budget} onValueChange={setBudget} min={5000} max={100000} step={1000}/></div><p className="tool-explain">This model separates media from strategy, creative and production. Real recommendations require audience, geography, season, inventory and conversion economics.</p></div>
      <div className="suite-result"><div className="result-label"><Gauge/> ILLUSTRATIVE CHANNEL SYSTEM</div><h2>{plan.label}</h2><div className="allocation-list">{plan.channels.map(([c,p])=><div key={String(c)}><span>{c}</span><i><em style={{width:`${p}%`}}/></i><b>{p}%</b><small>${Math.round(budget[0]*Number(p)/100).toLocaleString()}</small></div>)}</div><small className="result-disclaimer">No result is promised or forecast. Percentages illustrate planning logic only and include non-media work where noted.</small></div>
    </TabsContent>
    <TabsContent value="readiness" className="suite-panel readiness-panel">
      <div className="suite-controls"><div className="control-head"><span>03 / READINESS</span><b>Find the risks before media goes live.</b></div><div className="readiness-list">{readiness.map((item,i)=><label key={item}><Checkbox checked={checked.includes(i)} onCheckedChange={(state)=>setChecked(state?[...checked,i]:checked.filter(x=>x!==i))}/><span>{item}</span></label>)}</div></div>
      <div className="suite-result readiness-result"><div className="score-ring" style={{background:`conic-gradient(var(--acid) ${readinessScore}%, rgba(255,255,255,.1) 0)`}}><div><b>{readinessScore}</b><span>/100</span></div></div><h2>{readinessScore>=75?"Ready to plan the launch.":readinessScore>=45?"Promising—with gaps to close.":"Diagnose before you amplify."}</h2><p>{8-checked.length} readiness factor{8-checked.length===1?"":"s"} still need attention. A campaign cannot compensate for an unclear offer, broken follow-up or missing measurement.</p><a className="suite-primary" href="/start">TURN THIS INTO A BRIEF <ArrowUpRight/></a></div>
    </TabsContent>
  </Tabs>
}
