import { z } from "zod";
import type { Campaign, Workspace } from "./campaign";
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  org: z.string().trim().min(2, "Enter your organization.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  challenge: z
    .string()
    .trim()
    .min(20, "Describe the challenge in at least 20 characters.")
    .max(2000),
});

export const INQUIRY_BUDGETS = [
  "Under $5,000",
  "$5,000–$15,000",
  "$15,000–$40,000",
  "$40,000–$100,000",
  "$100,000+",
  "Need help setting it",
] as const;

// A range is not a committed investment. Only bounded ranges have a midpoint,
// and it is copied only after the person explicitly chooses that assumption.
export function inquiryBudgetEstimate(range: string): number | null {
  const estimates: Record<string, number> = {
    "$5,000–$15,000": 10000,
    "$15,000–$40,000": 27500,
    "$40,000–$100,000": 70000,
  };
  return estimates[range] ?? null;
}

export function validInquiryDate(date: string): boolean {
  if (!date) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= "2000-01-01" && date <= "2099-12-31" &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date;
}

export function prepareInquiryCampaign(
  fresh: Campaign,
  input: z.input<typeof inquirySchema> & {
    goal: Campaign["brief"]["objective"];
    budget: string;
    useBudgetEstimate: boolean;
    timing: string;
    scopes: string[];
  },
): Campaign {
  const fields = inquirySchema.parse(input);
  if (!validInquiryDate(input.timing)) throw new Error("Choose a valid target date through 2099.");
  const estimate = input.useBudgetEstimate ? inquiryBudgetEstimate(input.budget) : null;
  const scopeTasks = input.scopes.map((scope) => ({
    id: crypto.randomUUID(),
    title: `Confirm scope: ${scope}`.slice(0, 300),
    owner: "",
    due: "",
    done: false,
  }));
  return {
    ...fresh,
    name: fields.org,
    brief: {
      ...fresh.brief,
      brand: fields.org,
      sector: "",
      market: "",
      audience: "",
      objective: input.goal,
      offer: fields.challenge,
      budget: estimate ?? 0,
      agencyFee: 0,
      productionCost: 0,
      revenuePerCustomer: 0,
      margin: 0,
      leadToSale: 0,
      launchDate: input.timing,
    },
    tasks: [
      ...scopeTasks,
      {
        id: crypto.randomUUID(),
        title: estimate === null
          ? `Confirm campaign investment: ${input.budget || "To discuss"}`
          : `Confirm investment: ${input.budget}; CAD ${estimate.toLocaleString("en-CA")} is a midpoint planning estimate only`,
        owner: "",
        due: "",
        done: false,
      },
    ],
    activity: [{ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Created a new campaign from the project brief. Contact details were not stored." }],
  };
}

export function appendInquiryCampaign(workspace: Workspace, campaign: Campaign): Workspace {
  if (workspace.campaigns.length >= 12)
    throw new Error("Your workspace already has 12 campaigns. Export and remove a campaign in the workspace, then try again. Your existing campaigns have not changed.");
  if (workspace.campaigns.some((item) => item.id === campaign.id))
    throw new Error("This campaign is already in the workspace.");
  return { ...workspace, activeId: campaign.id, campaigns: [...workspace.campaigns, campaign] };
}
