import { CHANNELS, csv, uid, validDate, type Campaign } from "./campaign.ts";

export type EditorialItem = Campaign["content"][number];
export const EDITORIAL_HEADERS = ["date", "channel", "title", "copy"] as const;

/** Strict, bounded CSV reader. Imports never inherit approvals from another system. */
export function parseEditorialCsv(input: string, revision: number): EditorialItem[] {
  if (new TextEncoder().encode(input).length > 1_000_000) throw new Error("Keep the calendar below 1 MB.");
  const records: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === '"') {
      if (cell || closed) throw new Error("Unexpected quotation mark in the calendar CSV.");
      quoted = true;
    } else if (ch === ",") { row.push(cell); cell = ""; closed = false; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); if (row.some((v) => v.trim())) records.push(row);
      row = []; cell = ""; closed = false;
    } else { if (closed) throw new Error("Unexpected text after a quoted field."); cell += ch; }
  }
  if (quoted) throw new Error("Close the quoted field before importing.");
  row.push(cell); if (row.some((v) => v.trim())) records.push(row);
  const headers = records.shift()?.map((v) => v.replace(/^\uFEFF/, "").trim().toLowerCase());
  const allowed = [...EDITORIAL_HEADERS, "status", "brief revision"];
  if (!headers || new Set(headers).size !== headers.length || EDITORIAL_HEADERS.some((h) => !headers.includes(h)) || headers.some((h) => !allowed.includes(h as typeof allowed[number]))) throw new Error("Required CSV columns: date, channel, title, copy. Status and brief revision are optional and reset on import.");
  if (!records.length || records.length > 200) throw new Error("Import between 1 and 200 calendar items.");
  return records.map((cells, i) => {
    if (cells.length !== headers.length) throw new Error(`Row ${i + 2}: column count does not match the header.`);
    const get = (key: string) => cells[headers.indexOf(key)].trim();
    const date = get("date"), title = get("title"), copy = get("copy");
    const channel = CHANNELS.find((c) => c.toLowerCase() === get("channel").toLowerCase());
    if (date && (!validDate(date) || date < "2000-01-01" || date > "2099-12-31")) throw new Error(`Row ${i + 2}: use a real date from 2000–2099 or leave it blank.`);
    if (!channel) throw new Error(`Row ${i + 2}: channel must be ${CHANNELS.join(", ")}.`);
    if (!title || title.length > 180 || !copy || copy.length > 5000) throw new Error(`Row ${i + 2}: provide a title (up to 180 characters) and copy (up to 5,000).`);
    return { id: uid(), date, channel, title, copy, revision, status: "Draft" };
  });
}

export function mergeEditorial(existing: EditorialItem[], incoming: EditorialItem[]) {
  const key = (x: EditorialItem) => JSON.stringify([x.date, x.channel, x.title.trim().toLowerCase(), x.copy.trim()]);
  const seen = new Set(existing.map(key));
  const additions = incoming.filter((item) => { const k = key(item); if (seen.has(k)) return false; seen.add(k); return true; });
  if (existing.length + additions.length > 200) throw new Error("This import would exceed the 200-item calendar limit. Export and remove old work first.");
  return { items: [...existing, ...additions], added: additions.length, skipped: incoming.length - additions.length };
}

export function shiftEditorial(items: EditorialItem[], ids: string[], days: number) {
  if (!Number.isInteger(days) || Math.abs(days) > 365) throw new Error("Choose a whole-day shift between −365 and 365.");
  return items.map((item) => {
    if (!ids.includes(item.id) || !item.date) return item;
    const d = new Date(`${item.date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days);
    const date = d.toISOString().slice(0, 10);
    if (!validDate(date) || date < "2000-01-01" || date > "2099-12-31") throw new Error("The shifted calendar would fall outside 2000–2099.");
    return { ...item, date, status: "Draft" as const };
  });
}

function icalText(value: string) { return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
function foldIcal(line: string) {
  const encoder = new TextEncoder(); let current = "", width = 0; const lines: string[] = [];
  for (const char of line) { const length = encoder.encode(char).length; if (width + length > 75) { lines.push(current); current = " "; width = 1; } current += char; width += length; }
  lines.push(current); return lines.join("\r\n");
}
export function editorialIcs(c: Pick<Campaign, "id" | "name" | "content">, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Avalon//Editorial Planning//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icalText(c.name)} · editorial plan`];
  for (const item of c.content.filter((x) => validDate(x.date))) {
    const end = new Date(`${item.date}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 1);
    lines.push("BEGIN:VEVENT", `UID:${c.id}-${item.id}@avalon.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${item.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replace(/-/g, "")}`, `SUMMARY:${icalText(`${item.channel}: ${item.title}`)}`, `DESCRIPTION:${icalText(`${item.copy}\n\nPlanning date only. Status: ${item.status}. Nothing is published automatically.`)}`, "STATUS:TENTATIVE", "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR"); return lines.map(foldIcal).join("\r\n") + "\r\n";
}

export function editorialTemplate() { return csv([[...EDITORIAL_HEADERS], ["", "Organic", "A useful answer", "Replace this example with your reviewed copy."]]); }

export function webInsight(web: Campaign["web"], keyword: string) {
  const words = web.body.match(/[\p{L}\p{N}’'-]+/gu) ?? [];
  const sentences = web.body.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim()).length;
  const term = keyword.trim().toLocaleLowerCase();
  const inField = (value: string) => !!term && value.toLocaleLowerCase().includes(term);
  const locations = ["title", "description", "heading", "body"] as const;
  return { words: words.length, sentences, readingMinutes: Math.max(1, Math.ceil(words.length / 200)), averageSentence: sentences ? Math.round(words.length / sentences) : 0, placements: locations.map((field) => ({ field, present: inField(web[field]) })), paragraphs: web.body.split(/\n\s*\n/).filter((p) => p.trim()).length };
}

export function pageHandoff(c: Campaign) {
  const escape = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(c.web.title)}</title><meta name="description" content="${escape(c.web.description)}"><meta name="robots" content="noindex,nofollow"><style>body{font:18px/1.65 system-ui;max-width:760px;margin:64px auto;padding:24px;color:#19251f}h1{font-size:48px;line-height:1.1}p{white-space:pre-wrap}.note{font-size:14px;color:#666;border-top:1px solid #ccc;padding-top:20px}</style></head><body><main><p>${escape(c.brief.brand)}</p><h1>${escape(c.web.heading)}</h1><p>${escape(c.web.body)}</p><strong>${escape(c.web.cta)}</strong><p class="note">Editorial handoff · brief revision ${c.revision}. The call to action is supplied copy; no live form or tracking is connected. Intended alt text: ${escape(c.web.alt)}</p></main></body></html>`;
}
