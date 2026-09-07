"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  Download,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  createCampaign,
  workspaceSchema,
  type Brief,
} from "@/lib/campaign";
import {
  appendInquiryCampaign,
  INQUIRY_BUDGETS,
  inquiryBudgetEstimate,
  inquirySchema,
  prepareInquiryCampaign,
  validInquiryDate,
} from "@/lib/inquiry";
const goals = [
  ["launch", "Launch or rebrand"],
  ["leads", "Generate qualified leads"],
  ["local", "Increase local demand"],
  ["sales", "Grow online sales"],
  ["content", "Build a content system"],
  ["expansion", "Enter a new market"],
] as const;
const scopesAvailable = [
  "Strategy and research",
  "Brand and design",
  "Campaign creative",
  "Film and photography",
  "Media and performance",
  "Social and creators",
  "Website or digital product",
  "CRM and automation",
  "PR or experience",
  "Not sure yet",
];
export function ProjectBrief() {
  const router = useRouter();
  const [step, setStep] = useState(1),
    [goal, setGoal] = useState<Brief["objective"]>("leads"),
    [scopes, setScopes] = useState<string[]>([]),
    [budget, setBudget] = useState(""),
    [useBudgetEstimate, setUseBudgetEstimate] = useState(false),
    [timing, setTiming] = useState(""),
    [org, setOrg] = useState(""),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [challenge, setChallenge] = useState(""),
    [consent, setConsent] = useState(false),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null),
    initial = useRef(true);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);
  const brief = useMemo(
    () =>
      `AVALON CREATIVE GROUP · PROJECT BRIEF\n\nName: ${name}\nOrganization: ${org}\nEmail: ${email}\nPrimary objective: ${goals.find(([id]) => id === goal)?.[1]}\nCapabilities: ${scopes.join(", ") || "Recommend the right mix"}\nWorking investment: ${budget || "To discuss"} CAD\nTarget launch: ${timing || "To discuss"}\n\nWhat must move:\n${challenge}\n\nMarketing updates consent: ${consent ? "Yes" : "No"}`,
    [name, org, email, goal, scopes, budget, timing, challenge, consent],
  );
  function download() {
    const url = URL.createObjectURL(new Blob([brief], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "avalon-project-brief.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setMessage("Brief copied.");
    } catch {
      setMessage("Clipboard unavailable. Download the brief instead.");
    }
  }
  function continueStep() {
    if (step === 2 && !budget) {
      setMessage("Choose a working investment range.");
      return;
    }
    if (step === 2 && !validInquiryDate(timing)) {
      setMessage("Choose a valid target launch date between 2000 and 2099, or leave it open.");
      document.getElementById("launch-timing")?.focus();
      return;
    }
    if (step === 3) {
      const parsed = inquirySchema.safeParse({ name, org, email, challenge });
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues)
          next[String(issue.path[0])] = issue.message;
        setErrors(next);
        setMessage("Check the highlighted fields before continuing.");
        document
          .getElementById(String(parsed.error.issues[0].path[0]))
          ?.focus();
        return;
      }
      setName(parsed.data.name);
      setOrg(parsed.data.org);
      setEmail(parsed.data.email);
      setChallenge(parsed.data.challenge);
    }
    setErrors({});
    setMessage("");
    setStep(Math.min(4, step + 1));
  }
  function sendToWorkspace() {
    try {
      const raw = localStorage.getItem("kingxford-workspace-v2");
      const campaign = prepareInquiryCampaign(createCampaign(), {
        name, org, email, challenge, goal, budget, useBudgetEstimate, timing, scopes,
      });
      const data = raw
        ? appendInquiryCampaign(workspaceSchema.parse(JSON.parse(raw)), campaign)
        : { version: 2 as const, activeId: campaign.id, campaigns: [campaign] };
      localStorage.setItem(
        "kingxford-workspace-v2",
        JSON.stringify(workspaceSchema.parse(data)),
      );
      router.push("/platform?view=brief");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.startsWith("Your workspace already")
          ? error.message
          : "The workspace could not be saved. Your existing campaigns have not changed. Download this brief to preserve your answers.",
      );
    }
  }
  const titles = [
    "What are we trying to move?",
    "What might the work involve?",
    "Tell us what must change.",
    "Your first move is ready.",
  ];
  return (
    <form
      className="brief-builder"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        continueStep();
      }}
    >
      <div className="brief-progress">
        <span>PROJECT BRIEF</span>
        <div>
          {[1, 2, 3, 4].map((n) => (
            <i key={n} className={n <= step ? "active" : ""} />
          ))}
        </div>
        <b aria-live="polite">0{step} / 04</b>
      </div>
      <section className="brief-step">
        <h2 ref={heading} tabIndex={-1}>
          {titles[step - 1]}
        </h2>
        {step === 1 && (
          <RadioGroup
            value={goal}
            onValueChange={(v) => setGoal(v as Brief["objective"])}
            className="brief-radio"
            aria-label="Primary project objective"
          >
            {goals.map(([id, label]) => (
              <label key={id}>
                <RadioGroupItem value={id} />
                <span>{label}</span>
              </label>
            ))}
          </RadioGroup>
        )}
        {step === 2 && (
          <>
            <p>
              Choose the disciplines that fit. We can recommend the right
              combination.
            </p>
            <div className="brief-checks">
              {scopesAvailable.map((x) => (
                <label key={x}>
                  <Checkbox
                    checked={scopes.includes(x)}
                    onCheckedChange={(v) =>
                      setScopes(
                        v === true
                          ? [...new Set([...scopes, x])]
                          : scopes.filter((s) => s !== x),
                      )
                    }
                  />
                  <span>{x}</span>
                </label>
              ))}
            </div>
            <div className="brief-two">
              <label>
                <span>Working investment</span>
                <Select value={budget} onValueChange={(value) => { setBudget(value); setUseBudgetEstimate(false); }}>
                  <SelectTrigger
                    className="brief-select"
                    aria-label="Working investment"
                  >
                    <SelectValue placeholder="Choose a planning range" />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_BUDGETS.map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label>
                <span>Ideal first launch</span>
                <Input
                  id="launch-timing"
                  type="date"
                  min="2000-01-01"
                  max="2099-12-31"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                />
                <small>Optional. Leave open if the date is undecided.</small>
              </label>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            {[
              ["org", "Organization", org, setOrg],
              ["name", "Your name", name, setName],
              ["email", "Email", email, setEmail],
            ].map(([key, label, value, set]) => (
              <label
                className="full-field"
                key={String(key)}
                htmlFor={String(key)}
              >
                <span>{String(label)} · required</span>
                <Input
                  id={String(key)}
                  type={key === "email" ? "email" : "text"}
                  autoComplete={
                    key === "email"
                      ? "email"
                      : key === "name"
                        ? "name"
                        : "organization"
                  }
                  maxLength={key === "email" ? 254 : 120}
                  value={String(value)}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  aria-invalid={!!errors[String(key)]}
                  aria-describedby={
                    errors[String(key)] ? `${key}-error` : undefined
                  }
                />
                {errors[String(key)] && (
                  <small id={`${key}-error`} className="brief-error">
                    {errors[String(key)]}
                  </small>
                )}
              </label>
            ))}
            <label className="full-field" htmlFor="challenge">
              <span>Challenge or opportunity · required</span>
              <Textarea
                id="challenge"
                rows={7}
                maxLength={2000}
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                aria-invalid={!!errors.challenge}
                aria-describedby={
                  errors.challenge ? "challenge-error" : undefined
                }
              />
              {errors.challenge && (
                <small id="challenge-error" className="brief-error">
                  {errors.challenge}
                </small>
              )}
            </label>
            <label className="consent-line">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              <span>
                Email me occasional practical ideas and agency updates. Optional
                and separate from this inquiry.
              </span>
            </label>
          </>
        )}
        {step === 4 && (
          <div className="brief-review">
            <div className="brief-success">
              <Check />
              <span>READY FOR YOUR REVIEW</span>
            </div>
            <pre>{brief}</pre>
            <p>
              <ShieldCheck /> Opening an email does not send it. Review and send
              it in your mail application. The inquiry itself is not submitted
              to a server.
            </p>
            <div className="ws-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => void copy()}
              >
                <Clipboard /> Copy
              </Button>
              <Button type="button" variant="outline" onClick={download}>
                <Download /> Download
              </Button>
              <Button asChild>
                <a
                  href={`mailto:hello@kingxford.co?subject=${encodeURIComponent("Project brief — " + org)}&body=${encodeURIComponent(brief)}`}
                >
                  <Mail /> Prepare email
                </a>
              </Button>
              <Button type="button" onClick={sendToWorkspace}>
                Continue in workspace <ArrowRight />
              </Button>
            </div>
            <p>
              Create a separate campaign with your organization, objective,
              challenge, target date and scope tasks. Your existing campaigns are
              preserved. Contact details stay out of the workspace.
            </p>
            {inquiryBudgetEstimate(budget) !== null ? (
              <label className="consent-line">
                <Checkbox checked={useBudgetEstimate} onCheckedChange={(value) => setUseBudgetEstimate(value === true)} />
                <span>Use CAD {inquiryBudgetEstimate(budget)!.toLocaleString("en-CA")} as an editable midpoint planning estimate in the new campaign. This is not a quote or a committed budget. Otherwise, the campaign investment remains unset.</span>
              </label>
            ) : (
              <p>Your budget range is saved as a task to confirm. No financial amount is assumed.</p>
            )}
          </div>
        )}
      </section>
      {message && (
        <p role="status" className="brief-error">
          {message}
        </p>
      )}
      <div className="brief-nav">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft /> Back
          </Button>
        )}
        <span />
        {step < 4 && (
          <Button type="submit">
            {step === 3 ? "Review brief" : "Continue"}
            <ArrowRight />
          </Button>
        )}
      </div>
    </form>
  );
}
