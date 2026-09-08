import type { Campaign } from "./campaign.ts";
import { performanceSummary } from "./performance.ts";

/** Reverse the existing channel model; a planning scenario, never an outcome promise. */
export function growthTargetPlan(c: Campaign, targetCustomers: number, basis: "plan" | "observed" = "plan") {
  if (!Number.isInteger(targetCustomers) || targetCustomers < 1 || targetCustomers > 10_000_000) return null;
  const totalWeight = c.media.reduce((n, row) => n + row.weight, 0);
  const closeRate = c.brief.objective === "sales" ? 1 : c.brief.leadToSale / 100;
  const assumedCustomersPerDollar = totalWeight > 0 ? c.media.reduce((n, row) => n + row.weight / totalWeight / row.cpc * row.cvr / 100 * closeRate, 0) : 0;
  const actual = performanceSummary(c, c.performance?.rows ?? []);
  const rate = basis === "observed" ? (actual.spend > 0 ? actual.customers / actual.spend : 0) : assumedCustomersPerDollar;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const media = targetCustomers / rate;
  if (!Number.isFinite(media)) return null;
  const fixedCosts = c.brief.agencyFee + c.brief.productionCost;
  const investment = media + fixedCosts;
  const grossProfitPerCustomer = c.brief.revenuePerCustomer * c.brief.margin / 100;
  const revenue = targetCustomers * c.brief.revenuePerCustomer;
  return {targetCustomers, basis, media, fixedCosts, investment, mediaCac: 1 / rate, revenue,
    contribution: targetCustomers * grossProfitPerCustomer - investment,
    grossProfitPerCustomer, breakEvenCustomers: grossProfitPerCustomer > 0 ? Math.ceil(investment / grossProfitPerCustomer) : null,
    dailyMedia: media / (c.brief.weeks * 7), budgetGap: investment - c.brief.budget,
    withinBudgetLimit: Number.isFinite(investment) && investment <= 10_000_000,
  };
}

export type TrackingLinkInput = {destination: string; source: string; medium: string; campaign: string; content: string; term: string};
export function campaignTrackingUrl(input: TrackingLinkInput): {url: string; error: null} | {url: null; error: string} {
  let url: URL;
  try {url = new URL(input.destination.trim());} catch {return {url: null, error: "Add a complete destination beginning with https:// or http://."};}
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return {url: null, error: "Use a public HTTP or HTTPS destination without embedded credentials."};
  if (url.href.length > 2000) return {url: null, error: "Keep the destination below 2,000 characters."};
  for (const key of ["source", "medium", "campaign"] as const) if (!input[key].trim()) return {url: null, error: `Add a ${key} value to identify this campaign link.`};
  for (const key of ["source", "medium", "campaign", "content", "term"] as const) {
    const value = input[key].trim();
    if (value.length > 200 || /[\u0000-\u001f\u007f]/.test(value)) return {url: null, error: `Keep ${key} under 200 characters without line breaks or control characters.`};
    if (value) url.searchParams.set(`utm_${key}`, value);
    else url.searchParams.delete(`utm_${key}`);
  }
  return {url: url.toString(), error: null};
}
