export const SERVICE_OPTIONS = [
  "Brand strategy and identity",
  "Integrated campaigns",
  "Social and creator systems",
  "Websites and digital products",
  "Film, photography and production",
  "Media, search and performance",
  "AI, automation and analytics",
  "Experiential and activations",
] as const;

export const CONTACT_REASON_OPTIONS = [
  ...SERVICE_OPTIONS,
  "Privacy or accessibility request",
] as const;

export const BUDGET_OPTIONS = [
  "Under $10,000",
  "$10,000–$25,000",
  "$25,000–$50,000",
  "$50,000–$100,000",
  "$100,000–$250,000",
  "$250,000+",
  "Not set yet",
] as const;

export const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 4–8 weeks",
  "Within 2–4 months",
  "Within 4–8 months",
  "Exploring for later",
] as const;

export type InquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  organization: string;
  role?: string;
  sector?: string;
  location?: string;
  projectSummary: string;
  outcome?: string;
  audience?: string;
  services: string[];
  deliverables?: string;
  channels?: string;
  budget?: string;
  timeline?: string;
  startDate?: string;
  consent: boolean;
  website?: string;
  source?: string;
};

export type InquiryValidation =
  | { valid: true; data: InquiryPayload }
  | { valid: false; errors: Record<string, string> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 4_000;

function cleanText(value: unknown, maximum = MAX_FIELD_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maximum);
}

function cleanServices(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanText(item, 120))
    .filter(Boolean)
    .slice(0, 12);
}

export function validateInquiry(value: unknown): InquiryValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: { form: "The submitted brief is not valid." } };
  }

  const raw = value as Record<string, unknown>;
  const data: InquiryPayload = {
    name: cleanText(raw.name, 120),
    email: cleanText(raw.email, 254).toLowerCase(),
    phone: cleanText(raw.phone, 80),
    organization: cleanText(raw.organization, 180),
    role: cleanText(raw.role, 120),
    sector: cleanText(raw.sector, 160),
    location: cleanText(raw.location, 160),
    projectSummary: cleanText(raw.projectSummary),
    outcome: cleanText(raw.outcome, 1_500),
    audience: cleanText(raw.audience, 1_500),
    services: cleanServices(raw.services),
    deliverables: cleanText(raw.deliverables, 1_500),
    channels: cleanText(raw.channels, 1_000),
    budget: cleanText(raw.budget, 120),
    timeline: cleanText(raw.timeline, 120),
    startDate: cleanText(raw.startDate, 40),
    consent: raw.consent === true,
    website: cleanText(raw.website, 240),
    source: cleanText(raw.source, 120),
  };

  const errors: Record<string, string> = {};
  if (!data.name) errors.name = "Tell us who we should speak with.";
  if (!data.email || !EMAIL_PATTERN.test(data.email)) {
    errors.email = "Enter a valid work email address.";
  }
  if (!data.organization) errors.organization = "Enter your organization name.";
  if (data.projectSummary.length < 30) {
    errors.projectSummary = "Give us at least 30 characters of project context.";
  }
  if (!data.consent) errors.consent = "Consent is required so we can respond.";

  return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data };
}

export function inquiryToText(data: InquiryPayload): string {
  const lines: Array<[string, string | undefined]> = [
    ["Contact", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Organization", data.organization],
    ["Role", data.role],
    ["Sector", data.sector],
    ["Location", data.location],
    ["Project", data.projectSummary],
    ["Desired outcome", data.outcome],
    ["Audience", data.audience],
    ["Services", data.services.join(", ")],
    ["Deliverables", data.deliverables],
    ["Channels", data.channels],
    ["Indicative budget", data.budget],
    ["Timeline", data.timeline],
    ["Preferred start", data.startDate],
  ];

  return [
    "KINGXFORD project brief",
    `Prepared ${new Date().toLocaleDateString("en-CA")}`,
    "",
    ...lines.filter(([, content]) => content).map(([label, content]) => `${label}: ${content}`),
  ].join("\n");
}

export const ESTIMATE_SERVICES = [
  { id: "brand", label: "Brand strategy + identity", briefService: "Brand strategy and identity", low: 8_000, high: 25_000 },
  { id: "campaign", label: "Integrated campaign", briefService: "Integrated campaigns", low: 15_000, high: 60_000 },
  { id: "social", label: "Social content system", briefService: "Social and creator systems", low: 6_000, high: 22_000 },
  { id: "web", label: "Website or digital product", briefService: "Websites and digital products", low: 15_000, high: 65_000 },
  { id: "production", label: "Film + photography production", briefService: "Film, photography and production", low: 12_000, high: 55_000 },
  { id: "performance", label: "Search, media + measurement setup", briefService: "Media, search and performance", low: 5_000, high: 20_000 },
  { id: "automation", label: "AI, automation + analytics", briefService: "AI, automation and analytics", low: 10_000, high: 45_000 },
  { id: "experience", label: "Experience or activation", briefService: "Experiential and activations", low: 25_000, high: 90_000 },
] as const;

export type EstimateComplexity = "lean" | "standard" | "flagship";
export type EstimatePace = "flexible" | "standard" | "accelerated";

const COMPLEXITY_MULTIPLIER: Record<EstimateComplexity, number> = {
  lean: 0.82,
  standard: 1,
  flagship: 1.45,
};

const PACE_MULTIPLIER: Record<EstimatePace, number> = {
  flexible: 0.92,
  standard: 1,
  accelerated: 1.2,
};

export function calculateEstimate(
  selected: string[],
  complexity: EstimateComplexity,
  pace: EstimatePace,
) {
  const services = ESTIMATE_SERVICES.filter((service) => selected.includes(service.id));
  const multiplier = COMPLEXITY_MULTIPLIER[complexity] * PACE_MULTIPLIER[pace];
  const rawLow = services.reduce((total, service) => total + service.low, 0) * multiplier;
  const rawHigh = services.reduce((total, service) => total + service.high, 0) * multiplier;
  const round = (amount: number) => Math.max(0, Math.round(amount / 1_000) * 1_000);

  return {
    low: round(rawLow),
    high: round(rawHigh),
    services,
    multiplier,
  };
}

export function formatCad(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}
