import test from "node:test";
import assert from "node:assert/strict";
import { contactCreateInput, followUpCreateInput, programCreateInput, sessionCreateInput } from "../src/outreachValidation.js";

test("contact DTO ignores server-owned and lifecycle fields", () => {
  const result = contactCreateInput({
    fullName: "  A participant  ", email: "PERSON@EXAMPLE.COM", primaryPhone: " 9000 ",
    sequenceNumber: 99, currentVolunteer: "attacker", strikeCount: 3, archivedAt: new Date()
  });
  assert.equal(result.fullName, "A participant");
  assert.equal(result.email, "person@example.com");
  assert.equal(result.primaryPhone, "9000");
  assert.equal("sequenceNumber" in result, false);
  assert.equal("currentVolunteer" in result, false);
  assert.equal("strikeCount" in result, false);
  assert.equal("archivedAt" in result, false);
});

test("follow-up DTO ignores analysis, ownership, and correction fields", () => {
  const result = followUpCreateInput({
    channel: "phone_call", remarks: "  Interested  ", sentiment: "not_interested",
    recordedBy: "attacker", strikeApplied: true, correctedBy: "attacker"
  });
  assert.equal(result.remarks, "Interested");
  assert.equal("sentiment" in result, false);
  assert.equal("recordedBy" in result, false);
  assert.equal("strikeApplied" in result, false);
  assert.equal("correctedBy" in result, false);
});

test("program and session DTOs retain only supported fields", () => {
  assert.deepEqual(Object.keys(programCreateInput({ name: "Youth", createdBy: "attacker" })), ["name", "description", "venue", "active"]);
  assert.deepEqual(Object.keys(sessionCreateInput({ program: "id", startsAt: "2026-10-31", finalizedBy: "attacker" })), ["program", "title", "startsAt", "venue", "seriesKey"]);
});
