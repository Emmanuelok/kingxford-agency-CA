import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../app/api/inquiry/route";

const payload = {
  name: "Avery Smith",
  email: "avery@example.ca",
  organization: "North Atlantic Co.",
  projectSummary: "We need a national launch platform with a measurable acquisition path.",
  services: ["Integrated campaigns"],
  consent: true,
};

function request(body: unknown, ip: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://kingxford.example/api/inquiry", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip, ...headers },
    body: JSON.stringify(body),
  });
}

function clearDeliveryEnvironment() {
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_TO_EMAIL;
  delete process.env.CONTACT_FROM_EMAIL;
  delete process.env.CRM_WEBHOOK_URL;
}

test("rejects invalid submissions with field errors", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  const response = await POST(request({ ...payload, email: "invalid" }, "198.51.100.10"));
  assert.equal(response.status, 422);
  const result = await response.json();
  assert.equal(result.ok, false);
  assert.equal(typeof result.errors.email, "string");
});

test("fails safely when delivery credentials are absent", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  const response = await POST(request(payload, "198.51.100.11"));
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.equal(result.code, "DELIVERY_UNCONFIGURED");
  assert.equal(result.canExport, true);
});

test("accepts a honeypot submission without delivering it", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  const response = await POST(request({ website: "spam.example" }, "198.51.100.12"));
  assert.equal(response.status, 202);
});

test("delivers a valid inquiry to a configured CRM webhook", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  process.env.CRM_WEBHOOK_URL = "https://crm.example/inquiry";
  const originalFetch = globalThis.fetch;
  let deliveredBody = "";
  globalThis.fetch = async (_input, init) => {
    deliveredBody = String(init?.body ?? "");
    return new Response(null, { status: 202 });
  };

  try {
    const response = await POST(request(payload, "198.51.100.13"));
    assert.equal(response.status, 201);
    assert.match(deliveredBody, /kingxford\.inquiry\.created/);
    assert.match(deliveredBody, /avery@example\.ca/);
  } finally {
    globalThis.fetch = originalFetch;
    clearDeliveryEnvironment();
  }
});

test("reports a configured provider failure without claiming receipt", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  process.env.CRM_WEBHOOK_URL = "https://crm.example/inquiry";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });

  try {
    const response = await POST(request(payload, "198.51.100.14"));
    assert.equal(response.status, 502);
    const result = await response.json();
    assert.equal(result.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
    clearDeliveryEnvironment();
  }
});

test("rate limits repeated attempts and returns a retry window", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  let response: Response | undefined;
  for (let index = 0; index < 11; index += 1) {
    response = await POST(request(payload, "198.51.100.15"));
  }
  assert.equal(response?.status, 429);
  assert.equal(response?.headers.get("retry-after"), "900");
});

test("rejects declared oversized bodies before parsing", { concurrency: false }, async () => {
  clearDeliveryEnvironment();
  const response = await POST(request(payload, "198.51.100.16", { "content-length": "70000" }));
  assert.equal(response.status, 413);
});
