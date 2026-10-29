import test from "node:test";
import assert from "node:assert/strict";
import { ATTENDANCE_STATUSES, INTEREST_STATUSES } from "../src/outreachModels.js";
import { analyzeRemark, participationLabel } from "../src/outreachRoutes.js";

test("Outreach uses exactly the three approved interest classifications", () => {
  assert.deepEqual(INTEREST_STATUSES, ["interested", "not_interested", "follow_up_required"]);
  assert.equal(INTEREST_STATUSES.includes("unanswered"), false);
});

test("Attendance distinguishes verified states from unmarked", () => {
  assert.deepEqual(ATTENDANCE_STATUSES, ["present", "absent", "excused", "unmarked"]);
});

test("Participation labels are transparent and configurable", () => {
  const settings = { regularMinimumAttendances: 3, regularWindowDays: 60, inactiveAfterDays: 90 };
  const now = new Date("2026-10-29T00:00:00Z");
  assert.equal(participationLabel({ attended: 0, recent: 0, now, settings }), "never_attended");
  assert.equal(participationLabel({ attended: 1, recent: 1, lastAttendance: "2026-10-20", now, settings }), "first_time");
  assert.equal(participationLabel({ attended: 2, recent: 2, lastAttendance: "2026-10-20", now, settings }), "returning");
  assert.equal(participationLabel({ attended: 4, recent: 3, lastAttendance: "2026-10-20", now, settings }), "regular");
  assert.equal(participationLabel({ attended: 4, recent: 0, lastAttendance: "2026-01-01", now, settings }), "inactive");
});

test("Remarks are analyzed without treating an unanswered attempt as not interested", () => {
  assert.equal(analyzeRemark("Interested and will attend the evening class").sentiment, "interested");
  assert.equal(analyzeRemark("Please do not call, I am not interested").sentiment, "not_interested");
  assert.equal(analyzeRemark("No answer, try again tomorrow").sentiment, "unclear");
  assert.equal(analyzeRemark("No answer, try again tomorrow").interestStatus, "follow_up_required");
});
