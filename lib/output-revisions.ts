import { campaignSchema, isRunCurrent, uid, type Campaign, type Run } from "./campaign.ts";

/** A human revision is a new reviewable edition. Earlier text and approvals remain historical. */
export function reviseOutput(campaign: Campaign, runId: string, title: string, text: string): Run {
  const source = campaign.runs.find((run) => run.id === runId);
  if (!source) throw new Error("This output no longer exists. Open a saved edition to continue.");
  if (!isRunCurrent(campaign, source)) throw new Error("Refresh this specialist against the current campaign before revising its output.");
  if (campaign.runs.length >= 100) throw new Error("The library holds 100 outputs. Export and remove an older edition before saving a revision; your source edition will be preserved.");
  if (!title.trim() || title.length > 200) throw new Error("Use an output title between 1 and 200 characters.");
  if (!text.trim() || text.length > 20000) throw new Error("Use output text between 1 and 20,000 characters.");
  if (title.trim() === source.title && text === source.text) throw new Error("Make a change to the title or text before saving a new edition.");
  const createdAt = new Date(Math.max(Date.now(), Date.parse(source.createdAt) + 1)).toISOString();
  const revised: Run = {
    ...source,
    id: uid(), title: title.trim(), text, createdAt, approved: false,
    editedByUser: true, sourceRunId: source.id,
    ...(source.inputRunIds ? { inputRunIds: [...source.inputRunIds] } : {}),
  };
  campaignSchema.parse({ ...campaign, runs: [revised, ...campaign.runs] });
  return revised;
}
