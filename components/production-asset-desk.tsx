"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpRight, CheckCheck, ChevronDown, FileCheck2, Files, History, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign } from "@/lib/campaign";
import {
  ASSET_CHANNELS, ASSET_CHECKS, ASSET_FORMATS, ASSET_TYPES, assetManifestCsv,
  assetReviewBlockers, assetSpecSchema, assetState, assetUrl, buildAssetHandoffMarkdown,
  createProductionAsset, deliveryAssetSignature, deliveryHandoffSchema, deliveryLaunchBlockers, emptyAssetSpec,
  emptyDelivery, reviewProductionAsset, reviseProductionAsset, setAssetCheck,
  type AssetSpec, type DeliveryHandoff, type DeliveryState, type ProductionAsset,
} from "@/lib/production-assets";
import styles from "./production-asset-desk.module.css";

type Props = { c: Campaign; update: (patch: Partial<Campaign>, event: string, invalidate?: boolean) => void; notify: (message: string) => void };
function download(name: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function AssetEditor({ asset, briefRevision, onSave, onCancel }: {
  asset?: ProductionAsset; briefRevision: number; onSave: (spec: AssetSpec) => void; onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<AssetSpec>(asset?.spec ?? emptyAssetSpec());
  const [error, setError] = useState("");
  const [restored, setRestored] = useState<number | null>(null);
  const changed = !asset || JSON.stringify(draft) !== JSON.stringify(asset.spec) || asset.briefRevision !== briefRevision;
  const id = asset?.id ?? "new-asset";
  const field = (key: keyof AssetSpec, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  return <form className={styles.editor} onSubmit={(event) => {
    event.preventDefault();
    const parsed = assetSpecSchema.safeParse(draft);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    try { onSave(parsed.data); setError(""); } catch (failure) { setError(failure instanceof Error ? failure.message : "The asset could not be saved."); }
  }}>
    {!asset && <div className={styles.formatPicker}><span>Start with a delivery format</span><div>{ASSET_FORMATS.map((format) => <button type="button" key={format.label} onClick={() => setDraft((previous) => ({ ...previous, type: format.type, channel: format.channel, format: format.format, title: previous.title || format.label }))}>{format.label}</button>)}</div><small>Starting specifications are editable. Confirm the actual placement or supplier requirements.</small></div>}
    {restored !== null && <p className={styles.notice}>Version {restored} loaded into this editor. Save to create a new version; earlier work is preserved.</p>}
    <div className={styles.formGrid}>
      <label className={`${styles.field} ${styles.full}`} htmlFor={`${id}-title`}><span>Asset title</span><Input id={`${id}-title`} required maxLength={180} value={draft.title} onChange={(event) => field("title", event.target.value)} placeholder="For example: Autumn launch — vertical film" /></label>
      <label className={styles.field}><span>Asset type</span><Select value={draft.type} onValueChange={(value) => field("type", value)}><SelectTrigger aria-label="Asset type"><SelectValue /></SelectTrigger><SelectContent>{ASSET_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label>
      <label className={styles.field}><span>Channel</span><Select value={draft.channel} onValueChange={(value) => field("channel", value)}><SelectTrigger aria-label="Asset channel"><SelectValue /></SelectTrigger><SelectContent>{ASSET_CHANNELS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label>
      <label className={styles.field} htmlFor={`${id}-owner`}><span>Asset owner</span><Input id={`${id}-owner`} maxLength={100} value={draft.owner} onChange={(event) => field("owner", event.target.value)} placeholder="Person accountable for this file" /></label>
      <label className={styles.field} htmlFor={`${id}-format`}><span>Format / technical specification</span><Input id={`${id}-format`} maxLength={300} value={draft.format} onChange={(event) => field("format", event.target.value)} placeholder="Dimensions, duration, format or release version" /></label>
      <label className={styles.field} htmlFor={`${id}-final`}><span>Final file or live preview link</span><Input id={`${id}-final`} type="url" maxLength={2000} value={draft.finalUrl} onChange={(event) => field("finalUrl", event.target.value)} placeholder="https://…" /><small>Use a version-specific link and check recipient access.</small></label>
      <label className={styles.field} htmlFor={`${id}-source`}><span>Editable source link · optional</span><Input id={`${id}-source`} type="url" maxLength={2000} value={draft.sourceUrl} onChange={(event) => field("sourceUrl", event.target.value)} placeholder="Design source, project file or repository" /></label>
      {draft.type === "Copy" && <label className={`${styles.field} ${styles.full}`} htmlFor={`${id}-copy`}><span>Complete editable copy</span><Textarea id={`${id}-copy`} rows={7} maxLength={10000} value={draft.content} onChange={(event) => field("content", event.target.value)} placeholder="Keep the final copy and its channel variants here." /></label>}
      <label className={styles.field} htmlFor={`${id}-rights`}><span>Usage rights and source</span><Textarea id={`${id}-rights`} rows={3} maxLength={2000} value={draft.rightsNotes} onChange={(event) => field("rightsNotes", event.target.value)} placeholder="Source, permission reference, permitted channels/territories, or why clearance is not applicable" /></label>
      <label className={styles.field} htmlFor={`${id}-accessible`}><span>Alternative text / captions / transcript</span><Textarea id={`${id}-accessible`} rows={3} maxLength={3000} value={draft.accessibleText} onChange={(event) => field("accessibleText", event.target.value)} placeholder="Image alternative, transcript, or where reviewed captions are delivered" /></label>
      <label className={styles.field} htmlFor={`${id}-expiry`}><span>Rights expiry · if applicable</span><Input id={`${id}-expiry`} type="date" min="2000-01-01" max="2099-12-31" value={draft.rightsExpiry} onChange={(event) => field("rightsExpiry", event.target.value)} /></label>
      <label className={styles.field} htmlFor={`${id}-notes`}><span>Production notes</span><Textarea id={`${id}-notes`} rows={2} maxLength={2000} value={draft.notes} onChange={(event) => field("notes", event.target.value)} placeholder="Delivery instructions, dependencies or revision notes" /></label>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.editorFooter}><p>{asset ? `Saving creates version ${asset.version + 1} for brief v${briefRevision} and resets its review checks. The last 20 versions are retained.` : "Create a draft first. Add the final file and complete review before approval."}</p><div className="ws-actions">{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}<Button type="submit" disabled={!changed}><Files />{asset ? `Save version ${asset.version + 1}` : "Create asset"}</Button></div></div>
    {!!asset?.history.length && <details className={styles.history}><summary><History size={16} /> Earlier versions <span>{asset.history.length}</span><ChevronDown size={16} /></summary><ol>{asset.history.map((entry) => <li key={entry.version}><div><strong>Version {entry.version} · {entry.spec.title}</strong><span>Brief v{entry.briefRevision} · {new Date(entry.savedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span><small>{entry.review ? `${entry.review.decision} by ${entry.review.reviewer}` : "No recorded review"}</small></div><Button type="button" size="sm" variant="outline" onClick={() => { setDraft({ ...entry.spec }); setRestored(entry.version); setError(""); }}><RotateCcw /> Load this version</Button></li>)}</ol></details>}
  </form>;
}

function AssetReview({ asset, c, save, notify }: { asset: ProductionAsset; c: Campaign; save: (asset: ProductionAsset, event: string) => void; notify: Props["notify"] }) {
  const [reviewer, setReviewer] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const blockers = assetReviewBlockers(asset, c);
  const record = (decision: "Approved" | "Changes requested") => {
    try { save(reviewProductionAsset(asset, c, decision, reviewer, note), `${decision === "Approved" ? "Approved" : "Requested changes to"} asset ${asset.spec.title}`); setError(""); notify(decision === "Approved" ? "Asset approval recorded for this version and brief." : "Change request saved with the reviewer and feedback."); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "The review could not be saved."); }
  };
  return <div className={styles.review}>
    <p>Open the actual file and verify each item before recording your decision.</p>
    <div className={styles.checks}>{ASSET_CHECKS.map(([key, label]) => <label key={key}><Checkbox checked={asset.checks[key]} onCheckedChange={(value) => save(setAssetCheck(asset, key, value === true), `Updated asset ${key} check`)} /><span>{label}</span></label>)}</div>
    {!!blockers.length && <div className={styles.blockers}><strong>{blockers.length} items before approval</strong><ul>{blockers.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
    {asset.review && <div className={styles.recorded}><strong>{asset.review.decision} · version {asset.review.version}</strong><span>{asset.review.reviewer} · {new Date(asset.review.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>{asset.review.note && <p>{asset.review.note}</p>}</div>}
    {!!asset.reviewHistory.length && <details className={styles.history}><summary><History size={16} /> Decision history <span>{asset.reviewHistory.length}</span><ChevronDown size={16} /></summary><ol>{asset.reviewHistory.map((entry, index) => <li key={`${entry.at}:${index}`}><div><strong>{entry.decision} · {entry.reviewer}</strong><span>Version {entry.version} · {new Date(entry.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>{entry.note && <p className={styles.decisionNote}>{entry.note}</p>}</div></li>)}</ol><p className={styles.fine}>The last 20 decisions for this version are retained. Earlier version decisions stay in version history.</p></details>}
    <div className={styles.formGrid}><label className={styles.field} htmlFor={`${asset.id}-reviewer`}><span>Reviewer name</span><Input id={`${asset.id}-reviewer`} value={reviewer} maxLength={100} onChange={(event) => setReviewer(event.target.value)} placeholder="Person recording this decision" /></label><label className={styles.field} htmlFor={`${asset.id}-feedback`}><span>Review feedback</span><Textarea id={`${asset.id}-feedback`} rows={2} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required changes, approval conditions or evidence reference" /></label></div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className="ws-actions"><Button type="button" disabled={!!blockers.length || !reviewer.trim()} onClick={() => record("Approved")}><CheckCheck /> Record approval</Button><Button type="button" variant="outline" disabled={!reviewer.trim() || !note.trim()} onClick={() => record("Changes requested")}>Request changes</Button></div>
    <p className={styles.fine}>Reviewer names are recorded declarations. Linked files can change externally; save a new asset version whenever the deliverable changes.</p>
  </div>;
}

function HandoffEditor({ initial, signature, onSave }: { initial: DeliveryHandoff; signature: string; onSave: (handoff: DeliveryHandoff) => void }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const change = (key: keyof DeliveryHandoff, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || initial.assetSignature !== signature;
  return <form onSubmit={(event) => { event.preventDefault(); const result = deliveryHandoffSchema.safeParse({ ...draft, assetSignature: signature }); if (!result.success) { setError(result.error.issues[0].message); return; } setError(""); onSave(result.data); }}>
    <div className={styles.formGrid}><label className={styles.field} htmlFor="release-owner"><span>Release owner</span><Input id="release-owner" value={draft.owner} maxLength={100} onChange={(event) => change("owner", event.target.value)} placeholder="Accountable release decision maker" /></label><label className={styles.field} htmlFor="release-date"><span>Planned handoff date</span><Input id="release-date" type="date" min="2000-01-01" max="2099-12-31" value={draft.deliveryDate} onChange={(event) => change("deliveryDate", event.target.value)} /></label><label className={styles.field} htmlFor="release-approval"><span>Client approval reference</span><Input id="release-approval" value={draft.approvalReference} maxLength={1000} onChange={(event) => change("approvalReference", event.target.value)} placeholder="Approval record, meeting note or reference" /></label><label className={styles.field} htmlFor="release-rollback"><span>Pause / rollback contact</span><Input id="release-rollback" value={draft.rollbackContact} maxLength={300} onChange={(event) => change("rollbackContact", event.target.value)} placeholder="Who to contact if the release needs to stop" /></label><label className={`${styles.field} ${styles.full}`} htmlFor="release-notes"><span>Delivery and acceptance notes</span><Textarea id="release-notes" rows={3} value={draft.notes} maxLength={3000} onChange={(event) => change("notes", event.target.value)} placeholder="Access instructions, recipient, acceptance criteria and first live checks" /></label></div>{error && <p role="alert" className={styles.error}>{error}</p>}<Button type="submit" disabled={!dirty}>Save release handoff</Button>
  </form>;
}

export function ProductionAssetDesk({ c, update, notify }: Props) {
  const state = c.delivery ?? emptyDelivery();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("All assets");
  const [search, setSearch] = useState("");
  const [removed, setRemoved] = useState<ProductionAsset | null>(null);
  const approved = state.assets.filter((asset) => assetState(asset, c) === "Approved").length;
  const refresh = state.assets.filter((asset) => assetState(asset, c) === "Needs refresh").length;
  const matching = state.assets.filter((asset) => (filter === "All assets" || assetState(asset, c) === filter) && `${asset.spec.title} ${asset.spec.owner} ${asset.spec.channel}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));
  const blockers = deliveryLaunchBlockers(c);
  const slug = c.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "campaign";
  const saveState = (delivery: DeliveryState, event: string) => update({ delivery }, event);
  const saveAsset = (asset: ProductionAsset, event: string) => saveState({ ...state, assets: state.assets.map((item) => item.id === asset.id ? asset : item) }, event);
  const importContent = () => {
    const existing = new Set(state.assets.map((asset) => `${asset.spec.title.trim().toLocaleLowerCase()}:${asset.spec.channel}`));
    const eligible = c.content.filter((item) => { const key = `${item.title.trim().toLocaleLowerCase()}:${item.channel}`; if (!item.title.trim() || !item.copy.trim() || existing.has(key)) return false; existing.add(key); return true; });
    const slots = 100 - state.assets.length;
    const additions = eligible.slice(0, slots).map((item) => createProductionAsset({ ...emptyAssetSpec(), type: "Copy", title: item.title, channel: item.channel, format: "Editable campaign copy · confirm destination and placement", content: item.copy, notes: `Imported from Content studio record ${item.id}. Content studio status at import: ${item.status}. Asset approval is separate.` }, item.revision));
    if (additions.length) saveState({ ...state, assets: [...state.assets, ...additions] }, `Created ${additions.length} assets from content drafts`);
    notify(additions.length ? `${additions.length} copy assets created for production review.${eligible.length > slots ? " The 100-asset limit was reached." : ""}` : "No new titled, non-empty content drafts to import. Existing matching assets are kept.");
  };
  return <section className={styles.desk} aria-labelledby="asset-desk-heading">
    <div className={styles.hero}><div><span className="ws-eyebrow">PRODUCTION / ASSET DESK</span><h3 id="asset-desk-heading">Every file. Every version. Ready to hand over.</h3><p>Bring the actual deliverables into your campaign. Keep the specification, source, review and release decision together.</p></div><div className={styles.heroStats}><div><strong>{String(state.assets.length).padStart(2, "0")}</strong><span>registered assets</span></div><div><strong>{String(approved).padStart(2, "0")}</strong><span>current approvals</span></div></div></div>
    <div className={styles.body}>
      <div className={styles.toolbar}><div className="ws-actions"><Button onClick={() => setCreating((value) => !value)} disabled={state.assets.length >= 100 && !creating}><Plus />{creating ? "Close new asset" : "Add production asset"}</Button><Button variant="outline" onClick={importContent} disabled={!c.content.length || state.assets.length >= 100}><Files /> From content drafts</Button></div><span>{refresh ? `${refresh} assets need a fresh brief review` : "Versions and review decisions stay with the campaign"}</span></div>
      {creating && <div className={styles.newAsset}><h4>Register a deliverable</h4><AssetEditor briefRevision={c.revision} onCancel={() => setCreating(false)} onSave={(spec) => { if (state.assets.length >= 100) throw new Error("This campaign already has 100 assets."); saveState({ ...state, assets: [...state.assets, createProductionAsset(spec, c.revision)] }, `Registered production asset ${spec.title}`); setCreating(false); notify("Production asset created. Add the final file and complete review when ready."); }} /></div>}
      {!!state.assets.length && <div className={styles.filters}><label className={styles.field} htmlFor="asset-search"><span>Find an asset</span><Input id="asset-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, owner or channel" /></label><label className={styles.field}><span>Review status</span><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Asset review status"><SelectValue /></SelectTrigger><SelectContent>{["All assets", "Needs review", "Changes requested", "Needs refresh", "Approved"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label><span aria-live="polite">{matching.length} of {state.assets.length} assets</span></div>}
      {removed && <div className={styles.undo}><span>Removed: {removed.spec.title}</span><Button size="sm" variant="outline" disabled={state.assets.length >= 100} onClick={() => { saveState({ ...state, assets: [...state.assets, removed] }, "Restored production asset"); setRemoved(null); }}><RotateCcw /> Undo removal</Button></div>}
      <div className={styles.assetList}>{matching.map((asset) => {
        const status = assetState(asset, c); const finalLink = assetUrl(asset.spec.finalUrl); const sourceLink = assetUrl(asset.spec.sourceUrl);
        return <article className={styles.asset} key={asset.id} aria-label={asset.spec.title}>
          <div className={styles.assetHead}><div className={styles.assetIdentity}><span>{asset.spec.type} / {asset.spec.channel} · v{asset.version}</span><h4>{asset.spec.title}</h4><p>{asset.spec.format || "Delivery format not yet specified"}</p></div><span className={`${styles.badge} ${status === "Approved" ? styles.approved : status === "Needs refresh" || status === "Changes requested" ? styles.attention : ""}`}>{status}</span></div>
          <div className={styles.assetMeta}><span>Owner: <strong>{asset.spec.owner || "Unassigned"}</strong></span><span>Brief v{asset.briefRevision}</span><span>{ASSET_CHECKS.filter(([key]) => asset.checks[key]).length}/{ASSET_CHECKS.length} checks recorded</span></div>
          <div className={styles.assetLinks}>{finalLink && <a href={finalLink} target="_blank" rel="noopener noreferrer">Open final file <ArrowUpRight size={16} /><span className="sr-only"> (opens in a new tab)</span></a>}{sourceLink && <a href={sourceLink} target="_blank" rel="noopener noreferrer">Open editable source <ArrowUpRight size={16} /><span className="sr-only"> (opens in a new tab)</span></a>}{!finalLink && <span>{asset.spec.type === "Copy" && asset.spec.content.trim() ? "Editable copy is included in the handoff." : "Final file not linked yet."}</span>}</div>
          <details className={styles.section}><summary><Files size={18} /> Edit asset &amp; version history <ChevronDown size={17} /></summary><AssetEditor key={asset.version} asset={asset} briefRevision={c.revision} onSave={(spec) => { saveAsset(reviseProductionAsset(asset, spec, c.revision), `Saved new version of ${spec.title}`); notify("New asset version saved. Review checks and approval have been reset."); }} /></details>
          <details className={styles.section}><summary><FileCheck2 size={18} /> Review &amp; approval <ChevronDown size={17} /></summary><AssetReview key={asset.version} asset={asset} c={c} save={saveAsset} notify={notify} /></details>
          <div className={styles.assetFoot}><span>Saved {new Date(asset.savedAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</span><Button variant="outline" size="sm" onClick={() => { setRemoved(asset); saveState({ ...state, assets: state.assets.filter((item) => item.id !== asset.id) }, `Removed asset ${asset.spec.title}`); notify("Asset removed from the register. Undo is available below the filters."); }} aria-label={`Remove asset ${asset.spec.title}`}><Trash2 /> Remove</Button></div>
        </article>;
      })}</div>
      {!matching.length && <div className={styles.empty}><Files /><h4>{state.assets.length ? "No assets match this view." : "The plan has a place. Give the finished work one, too."}</h4><p>{state.assets.length ? "Change the status filter or search to see more assets." : "Register your first film, design, website, copy or document. Importing content drafts creates editable copy assets for review."}</p>{!!state.assets.length && <Button variant="outline" onClick={() => { setSearch(""); setFilter("All assets"); }}>Clear asset filters</Button>}</div>}
      <details className={styles.handoff}><summary><div><span className="ws-eyebrow">RELEASE / THE FINAL HANDOVER</span><h4>Make the release accountable.</h4><p>{state.assets.length ? blockers.length ? `${blockers.length} asset or handoff items remain open.` : "Recorded asset and handoff requirements are complete." : "Save the release owner, client approval reference and delivery instructions."}</p></div><ChevronDown /></summary><HandoffEditor key={state.handoff.assetSignature ?? "unsaved"} initial={state.handoff} signature={deliveryAssetSignature(c)} onSave={(handoff) => { saveState({ ...state, handoff }, "Updated release handoff"); notify("Release handoff saved against the current asset versions and decisions."); }} /></details>
      <div className={styles.exports}><div><strong>A portable production record.</strong><p>Download file references, specifications, accessibility notes and recorded decisions. The JSON archive also includes full asset version history.</p></div><div className="ws-actions"><Button variant="outline" onClick={() => download(`avalon-${slug}-asset-handoff.md`, buildAssetHandoffMarkdown(c), "text/markdown;charset=utf-8")}><ArrowDownToLine /> Handoff</Button><Button variant="outline" disabled={!state.assets.length} onClick={() => download(`avalon-${slug}-asset-manifest.csv`, assetManifestCsv(c), "text/csv;charset=utf-8")}>CSV manifest</Button><Button variant="outline" onClick={() => download(`avalon-${slug}-asset-archive.json`, JSON.stringify({ version: 1, campaignId: c.id, campaign: c.name, briefRevision: c.revision, exportedAt: new Date().toISOString(), delivery: state }, null, 2), "application/json;charset=utf-8")}>Version archive</Button></div></div>
    </div>
  </section>;
}
