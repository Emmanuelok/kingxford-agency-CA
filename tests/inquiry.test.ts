import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEstimate,
  formatCad,
  inquiryToText,
  validateInquiry,
  type InquiryPayload,
} from "../lib/inquiry";

const validInquiry: InquiryPayload = {
  name: "Avery Smith",
  email: "avery@example.ca",
  organization: "North Atlantic Co.",
  projectSummary: "We need a national launch platform with a measurable acquisition path.",
  services: ["Integrated campaigns"],
  consent: true,
};

test("validates and normalizes a complete inquiry", () => {
  const result = validateInquiry({ ...validInquiry, email: " AVERY@EXAMPLE.CA " });
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.data.email, "avery@example.ca");
});

test("rejects missing identity, context and consent", () => {
  const result = validateInquiry({ name: "", email: "bad", organization: "", projectSummary: "short", consent: false });
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.deepEqual(Object.keys(result.errors).sort(), ["consent", "email", "name", "organization", "projectSummary"]);
  }
});

test("calculates a stable estimator range from trusted service prices", () => {
  const estimate = calculateEstimate(["brand", "campaign"], "standard", "standard");
  assert.equal(estimate.low, 23_000);
  assert.equal(estimate.high, 85_000);
  assert.equal(formatCad(estimate.low), "$23,000");
});

test("exports a portable plain-text brief", () => {
  const text = inquiryToText(validInquiry);
  assert.match(text, /KINGXFORD project brief/);
  assert.match(text, /North Atlantic Co\./);
  assert.match(text, /Integrated campaigns/);
});
