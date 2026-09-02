import {
  ESTIMATE_SERVICES,
  calculateEstimate,
  formatCad,
  type EstimateComplexity,
  type EstimatePace,
  type InquiryPayload,
} from "./inquiry";

export const BRIEF_STORAGE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000;

export const EMPTY_PROJECT_BRIEF: InquiryPayload = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  role: "",
  sector: "",
  location: "",
  projectSummary: "",
  outcome: "",
  audience: "",
  services: [],
  deliverables: "",
  channels: "",
  budget: "",
  timeline: "",
  startDate: "",
  consent: false,
  website: "",
  source: "guided-project-brief",
};

type SavedDraft = {
  savedAt?: number;
  brief?: Partial<InquiryPayload>;
};

type QueryReader = {
  get(name: string): string | null;
};

const COMPLEXITY_LABELS: Record<EstimateComplexity, string> = {
  lean: "Focused",
  standard: "Integrated",
  flagship: "Flagship",
};

const PACE_LABELS: Record<EstimatePace, string> = {
  flexible: "Flexible",
  standard: "Standard",
  accelerated: "Accelerated",
};

export function parseSavedBrief(
  value: string,
  now = Date.now(),
  lifetime = BRIEF_STORAGE_LIFETIME_MS,
): InquiryPayload | null {
  let stored: SavedDraft;
  try {
    stored = JSON.parse(value) as SavedDraft;
  } catch {
    return null;
  }

  if (
    typeof stored.savedAt !== "number" ||
    !stored.brief ||
    typeof stored.brief !== "object" ||
    now - stored.savedAt < 0 ||
    now - stored.savedAt >= lifetime
  ) {
    return null;
  }

  return {
    ...EMPTY_PROJECT_BRIEF,
    ...stored.brief,
    services: Array.isArray(stored.brief.services)
      ? stored.brief.services.filter((service): service is string => typeof service === "string").slice(0, 12)
      : [],
    consent: stored.brief.consent === true,
  };
}

export function briefFromEstimate(query: QueryReader): InquiryPayload | null {
  if (query.get("from") !== "estimate") return null;

  const selectedIds = new Set(
    (query.get("services") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const selected = ESTIMATE_SERVICES.filter((service) => selectedIds.has(service.id));
  if (!selected.length) return null;

  const complexityValue = query.get("complexity");
  const paceValue = query.get("pace");
  const complexity: EstimateComplexity =
    complexityValue === "lean" || complexityValue === "flagship" ? complexityValue : "standard";
  const pace: EstimatePace =
    paceValue === "flexible" || paceValue === "accelerated" ? paceValue : "standard";
  const estimate = calculateEstimate(selected.map((service) => service.id), complexity, pace);
  const range = ` Indicative estimator range: ${formatCad(estimate.low)}–${formatCad(estimate.high)} CAD.`;

  return {
    ...EMPTY_PROJECT_BRIEF,
    services: selected.map((service) => service.briefService),
    projectSummary: `Estimator handoff for ${selected.map((service) => service.label).join(", ")}. Build level: ${COMPLEXITY_LABELS[complexity]}. Pace: ${PACE_LABELS[pace]}.${range} This is planning guidance, not a quote; I would like to turn it into a scoped recommendation.`,
    source: "estimate-calculator",
  };
}
