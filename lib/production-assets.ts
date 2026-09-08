import { z } from "zod";

export const ASSET_TYPES = ["Image", "Video", "Copy", "Website", "Audio", "Document"] as const;
export const ASSET_CHANNELS = ["Multi-channel", "Website", "Search", "Meta", "LinkedIn", "YouTube", "Organic", "Email", "Print"] as const;
export const ASSET_CHECKS = [
  ["technical", "Format, quality and destination checked"],
  ["rights", "Usage rights and expiry reviewed"],
  ["accessibility", "Alternative text, captions or accessible copy reviewed"],
  ["brand", "Brand, claims and current brief reviewed"],
] as const;
const date = z.string().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value >= "2000-01-01" && value <= "2099-12-31", "Choose a valid date between 2000 and 2099.");
export function assetUrl(value: string): string | null {
  try { const parsed = new URL(value); return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : null; } catch { return null; }
}
const url = z.string().trim().max(2000).refine((value) => !value || !!assetUrl(value), "Use an HTTP or HTTPS link without embedded credentials.");
export const assetSpecSchema = z.object({
  title: z.string().trim().min(1, "Give the asset a title.").max(180),
  type: z.enum(ASSET_TYPES), channel: z.enum(ASSET_CHANNELS),
  format: z.string().trim().max(300), owner: z.string().trim().max(100),
  finalUrl: url, sourceUrl: url,
  content: z.string().max(10000),
  rightsNotes: z.string().max(2000), rightsExpiry: date,
  accessibleText: z.string().max(3000), notes: z.string().max(2000),
});
const checksSchema = z.object({ technical: z.boolean(), rights: z.boolean(), accessibility: z.boolean(), brand: z.boolean() });
const reviewSchema = z.object({
  decision: z.enum(["Approved", "Changes requested"]), reviewer: z.string().trim().min(1).max(100),
  note: z.string().max(2000), at: z.string().datetime(), version: z.number().int().min(1),
});
const versionSchema = z.object({
  version: z.number().int().min(1).max(1000000), briefRevision: z.number().int().min(1),
  savedAt: z.string().datetime(), spec: assetSpecSchema, checks: checksSchema, review: reviewSchema.optional(),
  reviewHistory: z.array(reviewSchema).max(20).default([]),
});
export const productionAssetSchema = versionSchema.extend({ id: z.string().uuid(), history: z.array(versionSchema).max(20) }).superRefine((asset, ctx) => {
  if (asset.review && asset.review.version !== asset.version) ctx.addIssue({ code: "custom", path: ["review"], message: "Asset review must refer to its current version." });
  if (asset.reviewHistory.some((review) => review.version !== asset.version)) ctx.addIssue({ code: "custom", path: ["reviewHistory"], message: "Review history must refer to its asset version." });
  if (asset.history.some((entry) => entry.version >= asset.version || entry.review && entry.review.version !== entry.version || entry.reviewHistory.some((review) => review.version !== entry.version)) || new Set(asset.history.map((entry) => entry.version)).size !== asset.history.length) ctx.addIssue({ code: "custom", path: ["history"], message: "Version history must contain distinct earlier versions with matching review records." });
});
export const deliveryHandoffSchema = z.object({
  owner: z.string().trim().max(100), approvalReference: z.string().trim().max(1000),
  rollbackContact: z.string().trim().max(300), deliveryDate: date, notes: z.string().max(3000),
  assetSignature: z.string().max(100).optional(),
});
export const deliveryStateSchema = z.object({ assets: z.array(productionAssetSchema).max(100), handoff: deliveryHandoffSchema }).superRefine((state, ctx) => {
  if (new Set(state.assets.map((asset) => asset.id)).size !== state.assets.length) ctx.addIssue({ code: "custom", path: ["assets"], message: "Duplicate asset IDs are not allowed." });
});
export type AssetSpec = z.infer<typeof assetSpecSchema>;
export type ProductionAsset = z.infer<typeof productionAssetSchema>;
export type DeliveryState = z.infer<typeof deliveryStateSchema>;
export type DeliveryHandoff = z.infer<typeof deliveryHandoffSchema>;
export type AssetCheck = typeof ASSET_CHECKS[number][0];
type AssetCampaign = { revision: number; delivery?: DeliveryState; brief?: { launchDate: string } };

export const ASSET_FORMATS: { label: string; type: AssetSpec["type"]; channel: AssetSpec["channel"]; format: string }[] = [
  { label: "Vertical social film", type: "Video", channel: "Meta", format: "9:16 portrait · 1080 × 1920 · captions · confirm placement limits" },
  { label: "Landscape film", type: "Video", channel: "YouTube", format: "16:9 landscape · 1920 × 1080 · captions + transcript" },
  { label: "Social campaign image", type: "Image", channel: "Organic", format: "4:5 portrait · 1080 × 1350 · web colour profile" },
  { label: "Website image", type: "Image", channel: "Website", format: "Responsive WebP / AVIF · reviewed alternative text" },
  { label: "Campaign copy", type: "Copy", channel: "Multi-channel", format: "Editable copy · channel variants · verified destination" },
  { label: "Website release", type: "Website", channel: "Website", format: "Responsive release · keyboard review · tested conversion journey" },
  { label: "Print artwork", type: "Document", channel: "Print", format: "Printer-approved PDF · bleed, trim, colour and proof confirmed" },
];
export function emptyDelivery(): DeliveryState { return { assets: [], handoff: { owner: "", approvalReference: "", rollbackContact: "", deliveryDate: "", notes: "" } }; }
export function emptyAssetSpec(): AssetSpec { return { title: "", type: "Image", channel: "Multi-channel", format: "", owner: "", finalUrl: "", sourceUrl: "", content: "", rightsNotes: "", rightsExpiry: "", accessibleText: "", notes: "" }; }
const emptyChecks = () => ({ technical: false, rights: false, accessibility: false, brand: false });
function localToday() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }
export function createProductionAsset(spec: AssetSpec, briefRevision: number): ProductionAsset { return productionAssetSchema.parse({ id: crypto.randomUUID(), version: 1, briefRevision, savedAt: new Date().toISOString(), spec: assetSpecSchema.parse(spec), checks: emptyChecks(), history: [] }); }
export function duplicateDeliveryState(state: DeliveryState, briefRevision: number): DeliveryState {
  return { assets: state.assets.map((asset) => createProductionAsset({ ...asset.spec }, briefRevision)), handoff: { ...state.handoff, approvalReference: "", assetSignature: undefined } };
}
export function reviseProductionAsset(asset: ProductionAsset, spec: AssetSpec, briefRevision: number): ProductionAsset {
  const { id, history, ...snapshot } = asset;
  return productionAssetSchema.parse({ id, version: asset.version + 1, briefRevision, savedAt: new Date().toISOString(), spec: assetSpecSchema.parse(spec), checks: emptyChecks(), history: [snapshot, ...history].slice(0, 20) });
}
export function setAssetCheck(asset: ProductionAsset, check: AssetCheck, checked: boolean): ProductionAsset {
  return { ...asset, checks: { ...asset.checks, [check]: checked }, ...(asset.review?.decision === "Approved" ? { review: undefined } : {}) };
}
export function assetReviewBlockers(asset: ProductionAsset, c: AssetCampaign, today = localToday()): string[] {
  const issues: string[] = [];
  if (asset.briefRevision !== c.revision) issues.push("Review and save a version against the current brief.");
  if (!asset.spec.owner.trim()) issues.push("Assign an accountable asset owner.");
  if (!asset.spec.finalUrl && !(asset.spec.type === "Copy" && asset.spec.content.trim())) issues.push("Add the final file / live preview link, or supply the complete copy for a copy asset.");
  if (!asset.spec.format.trim()) issues.push("Record the delivery format and specification.");
  if (!asset.spec.rightsNotes.trim()) issues.push("Record the source and permitted usage, or explain why clearance is not applicable.");
  const reviewDate = c.brief?.launchDate && c.brief.launchDate > today ? c.brief.launchDate : today;
  if (asset.spec.rightsExpiry && asset.spec.rightsExpiry < reviewDate) issues.push(`Usage rights expire before ${reviewDate}.`);
  if (!asset.spec.accessibleText.trim() && ["Image", "Video", "Audio"].includes(asset.spec.type)) issues.push("Supply alternative text, a transcript, or caption delivery details.");
  for (const [key, label] of ASSET_CHECKS) if (!asset.checks[key]) issues.push(label + ".");
  return issues;
}
export function assetState(asset: ProductionAsset, c: AssetCampaign, today = localToday()): "Needs refresh" | "Approved" | "Changes requested" | "Needs review" {
  if (asset.briefRevision !== c.revision) return "Needs refresh";
  if (asset.review?.decision === "Approved" && !assetReviewBlockers(asset, c, today).length) return "Approved";
  if (asset.review?.decision === "Changes requested") return "Changes requested";
  return "Needs review";
}
export function reviewProductionAsset(asset: ProductionAsset, c: AssetCampaign, decision: "Approved" | "Changes requested", reviewer: string, note: string, today = localToday()): ProductionAsset {
  if (!reviewer.trim()) throw new Error("Record the reviewer's name.");
  if (decision === "Changes requested" && !note.trim()) throw new Error("Describe the changes required.");
  if (decision === "Approved") { const issues = assetReviewBlockers(asset, c, today); if (issues.length) throw new Error(issues[0]); }
  const review = { decision, reviewer: reviewer.trim(), note: note.trim(), at: new Date().toISOString(), version: asset.version };
  return productionAssetSchema.parse({ ...asset, review, reviewHistory: [review, ...asset.reviewHistory].slice(0, 20) });
}
/** Change detection only; this is not a cryptographic proof of file integrity. */
export function deliveryAssetSignature(c: AssetCampaign): string {
  const text = JSON.stringify([c.revision, [...(c.delivery?.assets ?? [])].sort((a, b) => a.id.localeCompare(b.id)).map((asset) => [asset.id, asset.version, asset.briefRevision, asset.checks, asset.review])]);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `asset-manifest-v1-${(hash >>> 0).toString(16)}`;
}
export function deliveryLaunchBlockers(c: AssetCampaign, today = localToday()): string[] {
  if (!c.delivery?.assets.length) return [];
  const blocked = c.delivery.assets.filter((asset) => assetState(asset, c, today) !== "Approved");
  const issues = blocked.length ? [`${blocked.length} production asset${blocked.length === 1 ? " needs" : "s need"} current review and approval.`] : [];
  if (!c.delivery.handoff.owner.trim()) issues.push("Name the release owner in the delivery handoff.");
  if (!c.delivery.handoff.approvalReference.trim()) issues.push("Record the client approval reference in the delivery handoff.");
  if (!c.delivery.handoff.rollbackContact.trim()) issues.push("Record the release rollback contact.");
  if (!c.delivery.handoff.deliveryDate) issues.push("Set the planned handoff date.");
  if (c.delivery.handoff.assetSignature !== deliveryAssetSignature(c)) issues.push("Review and save the handoff against the current asset versions and decisions.");
  return issues;
}
function csvCell(value: string): string { const safe = /^\s*[=+\-@＝＋－＠]/u.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value; return `"${safe.replace(/"/g, '""')}"`; }
export function assetManifestCsv(c: AssetCampaign, today = localToday()): string {
  return [["Asset", "Type", "Channel", "Format", "Owner", "Version", "Brief revision", "Status", "Final file", "Editable source", "Rights notes", "Rights expiry", "Accessibility", "Reviewer", "Review note"], ...(c.delivery?.assets ?? []).map((asset) => [asset.spec.title, asset.spec.type, asset.spec.channel, asset.spec.format, asset.spec.owner, String(asset.version), String(asset.briefRevision), assetState(asset, c, today), asset.spec.finalUrl, asset.spec.sourceUrl, asset.spec.rightsNotes, asset.spec.rightsExpiry, asset.spec.accessibleText, asset.review?.reviewer ?? "", asset.review?.note ?? ""])].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
const md = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\r\n]+/g, " ");
const quote = (value: string) => (value || "Not supplied.").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split("\n").map((line) => `> ${line}`).join("\n");
export function buildAssetHandoffMarkdown(c: AssetCampaign): string {
  const state = c.delivery ?? emptyDelivery();
  return ["## Asset handoff", "", `Release owner: ${md(state.handoff.owner || "Not assigned")}`, `Client approval reference: ${md(state.handoff.approvalReference || "Not recorded")}`, `Rollback contact: ${md(state.handoff.rollbackContact || "Not assigned")}`, `Planned handoff: ${state.handoff.deliveryDate || "Not scheduled"}`, "", quote(state.handoff.notes), "", "Linked files are external references. Review decisions are user-recorded and do not grant access to the files or publish them.", "", ...deliveryLaunchBlockers(c).map((issue) => `- Open: ${md(issue)}`), "", ...state.assets.flatMap((asset) => [
    `### ${md(asset.spec.title)} · v${asset.version}`, "", `${md(asset.spec.type)} / ${md(asset.spec.channel)} · Brief v${asset.briefRevision} · ${assetState(asset, c)}`,
    `Owner: ${md(asset.spec.owner || "Unassigned")}`, `Specification: ${md(asset.spec.format || "Not supplied")}`, `Final file: ${md(asset.spec.finalUrl || "No link")}`, `Editable source: ${md(asset.spec.sourceUrl || "No link")}`, `Rights: ${md(asset.spec.rightsNotes || "Not recorded")}`, `Rights expiry: ${asset.spec.rightsExpiry || "Not specified"}`, `Accessibility: ${md(asset.spec.accessibleText || "Not supplied")}`, "", ...ASSET_CHECKS.map(([key, label]) => `- [${asset.checks[key] ? "x" : " "}] ${label}`), "",
    ...(asset.spec.content ? ["#### Editable copy", "", quote(asset.spec.content), ""] : []),
    `Review: ${asset.review ? `${md(asset.review.decision)} by ${md(asset.review.reviewer)} on ${asset.review.at} for v${asset.review.version}` : "Not recorded"}`, quote(asset.review?.note ?? ""), "", ...asset.reviewHistory.flatMap((entry) => [`- Recorded decision: ${md(entry.decision)} by ${md(entry.reviewer)} on ${entry.at}`, quote(entry.note)]), "", quote(asset.spec.notes), "", `Version history: ${asset.history.map((entry) => `v${entry.version} saved ${entry.savedAt}`).join("; ") || "First version"}`, "",
  ]), ...(!state.assets.length ? ["No production assets registered.", ""] : [])].join("\n");
}
