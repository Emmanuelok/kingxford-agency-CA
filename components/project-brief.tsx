"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, ShieldCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const goalOptions=["Launch or rebrand","Generate qualified leads","Increase local demand","Grow online sales","Build a content system","Enter a new market","Solve a different problem"];
const scopeOptions=["Strategy and research","Brand and design","Campaign creative","Film and photography","Media and performance","Social and creators","Website or digital product","CRM and automation","PR or experience","Not sure yet"];
const budgetOptions=["Under $5,000","$5,000–$15,000","$15,000–$40,000","$40,000–$100,000","$100,000+","Need help setting it"];

export function ProjectBrief(){
 const [step,setStep]=useState(1);const [goal,setGoal]=useState(goalOptions[0]);const [scopes,setScopes]=useState<string[]>([]);const [budget,setBudget]=useState("");const [timing,setTiming]=useState("");const [org,setOrg]=useState("");const [name,setName]=useState("");const [email,setEmail]=useState("");const [challenge,setChallenge]=useState("");const [consent,setConsent]=useState(false);
 const brief=useMemo(()=>`NEW KINGXFORD PROJECT BRIEF\n\nName: ${name}\nOrganization: ${org}\nEmail: ${email}\nPrimary objective: ${goal}\nCapabilities considered: ${scopes.join(", ")||"Recommend the right mix"}\nWorking investment: ${budget||"To be determined"}\nTiming: ${timing||"To be determined"}\n\nWhat must move:\n${challenge||"To discuss"}\n\nMarketing updates consent: ${consent?"Yes":"No"}`,[name,org,email,goal,scopes,budget,timing,challenge,consent]);
 const canContinue=step===1?goal.length>0:step===2?budget.length>0:true;
 function toggleScope(scope:string,state:boolean){setScopes(state?[...scopes,scope]:scopes.filter(x=>x!==scope))}
 return <div className="brief-builder">
  <div className="brief-progress"><span>PROJECT BRIEF</span><div>{[1,2,3,4].map(n=><i key={n} className={n<=step?"active":""}/>)}</div><b>0{step} / 04</b></div>
  {step===1&&<section className="brief-step"><small>START WITH THE RESULT</small><h2>What are we trying to move?</h2><RadioGroup value={goal} onValueChange={setGoal} className="brief-radio">{goalOptions.map((x,i)=><label key={x}><RadioGroupItem value={x} id={`goal-${i}`}/><span>{x}</span></label>)}</RadioGroup></section>}
  {step===2&&<section className="brief-step"><small>SHAPE THE SYSTEM</small><h2>What might the work involve?</h2><p>Choose as many as make sense. “Not sure yet” is a useful answer.</p><div className="brief-checks">{scopeOptions.map((x,i)=><label key={x}><Checkbox checked={scopes.includes(x)} onCheckedChange={state=>toggleScope(x,Boolean(state))} id={`scope-${i}`}/><span>{x}</span></label>)}</div><div className="brief-two"><label><span>Working investment</span><Select value={budget} onValueChange={setBudget}><SelectTrigger className="brief-select"><SelectValue placeholder="Choose a planning range"/></SelectTrigger><SelectContent>{budgetOptions.map(x=><SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></label><label><span>Ideal first launch</span><Input value={timing} onChange={e=>setTiming(e.target.value)} placeholder="e.g. November 2026"/></label></div></section>}
  {step===3&&<section className="brief-step"><small>THE BUSINESS CONTEXT</small><h2>Tell us what must change.</h2><label className="full-field"><span>Challenge, opportunity or ambition</span><Textarea value={challenge} onChange={e=>setChallenge(e.target.value)} placeholder="What is happening now, what should happen instead, and why does it matter?" rows={7}/></label><div className="brief-two"><label><span>Organization</span><Input value={org} onChange={e=>setOrg(e.target.value)} placeholder="Your company or organization"/></label><label><span>Your name</span><Input value={name} onChange={e=>setName(e.target.value)} placeholder="How should we address you?"/></label></div><label className="full-field"><span>Email</span><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@organization.ca"/></label><label className="consent-line"><Checkbox checked={consent} onCheckedChange={state=>setConsent(Boolean(state))}/><span>Email me occasional practical ideas and agency updates. Optional and separate from this project inquiry.</span></label></section>}
  {step===4&&<section className="brief-step brief-review"><div className="brief-success"><Check/><span>YOUR BRIEF IS READY</span></div><h2>Good briefs create better first moves.</h2><pre>{brief}</pre><p><ShieldCheck/> This launch version keeps your answers in this browser only. Nothing is sent until you choose the email action below.</p><Button asChild className="brief-send"><a href={`mailto:hello@kingxford.co?subject=${encodeURIComponent(`Project brief — ${org||goal}`)}&body=${encodeURIComponent(brief)}`}><Mail/> EMAIL THIS BRIEF TO KINGXFORD</a></Button></section>}
  <div className="brief-nav">{step>1&&<Button variant="outline" onClick={()=>setStep(step-1)}><ArrowLeft/> Back</Button>}<span/>{step<4&&<Button onClick={()=>setStep(step+1)} disabled={!canContinue}>{step===3?"Review brief":"Continue"}<ArrowRight/></Button>}</div>
 </div>
}
