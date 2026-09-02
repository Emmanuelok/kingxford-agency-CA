import { NextRequest, NextResponse } from "next/server";
import { inquiryToText, validateInquiry, type InquiryPayload } from "../../../lib/inquiry";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 10;
const MAX_BODY_BYTES = 64 * 1_024;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "unknown"
  ).trim();
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (attempts.size > 5_000) {
    for (const [candidate, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(candidate);
    }
  }
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  existing.count += 1;
  return existing.count > MAX_ATTEMPTS;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!,
  );
}

async function sendWithResend(data: InquiryPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) throw new Error("Resend is not fully configured.");

  const plainText = inquiryToText(data);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject: `New KINGXFORD brief — ${data.organization}`,
      text: plainText,
      html: `<pre style="font:16px/1.55 system-ui;white-space:pre-wrap">${escapeHtml(plainText)}</pre>`,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`Resend returned ${response.status}.`);
}

async function sendToCrm(data: InquiryPayload): Promise<void> {
  const webhook = process.env.CRM_WEBHOOK_URL;
  if (!webhook) throw new Error("CRM webhook is not configured.");

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "kingxford.inquiry.created", submittedAt: new Date().toISOString(), data }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`CRM webhook returned ${response.status}.`);
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, message: "The submitted brief is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "The submitted brief could not be read." }, { status: 400 });
  }

  if (body && typeof body === "object" && !Array.isArray(body) && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true, message: "Thank you." }, { status: 202 });
  }

  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please wait 15 minutes and try again." },
      { status: 429, headers: { "Retry-After": String(WINDOW_MS / 1_000) } },
    );
  }

  const result = validateInquiry(body);
  if (!result.valid) {
    return NextResponse.json(
      { ok: false, message: "Review the highlighted information.", errors: result.errors },
      { status: 422 },
    );
  }

  const resendConfigured = Boolean(
    process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL,
  );
  const crmConfigured = Boolean(process.env.CRM_WEBHOOK_URL);

  if (!resendConfigured && !crmConfigured) {
    return NextResponse.json(
      {
        ok: false,
        code: "DELIVERY_UNCONFIGURED",
        message: "Online delivery is not configured yet. Download or copy your brief so no work is lost.",
        canExport: true,
      },
      { status: 503 },
    );
  }

  const deliveries = await Promise.allSettled([
    ...(resendConfigured ? [sendWithResend(result.data)] : []),
    ...(crmConfigured ? [sendToCrm(result.data)] : []),
  ]);
  const delivered = deliveries.some((delivery) => delivery.status === "fulfilled");

  if (!delivered) {
    return NextResponse.json(
      {
        ok: false,
        message: "We could not deliver the brief right now. Download a copy and try again shortly.",
        canExport: true,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: true, message: "Your brief is in. KINGXFORD will review it and reply using the contact details provided." },
    { status: 201 },
  );
}
