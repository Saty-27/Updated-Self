import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_SECTIONS, ROLE_LEVEL, SPECIALIZED_ACCESS, STAFF_ROLES, canAccessSection,
  computeUserPermissions, isFullAdmin, isStaff, roleLevel, sectionFor
} from "../src/core/auth/accessPolicy.js";

test("access policy exposes the complete staff hierarchy", () => {
  assert.equal(ROLE_LEVEL.main_admin, 100);
  assert.equal(roleLevel({ role: "attendance_operator" }), 25);
  assert.equal(isStaff({ role: "outreach_coordinator" }), true);
  assert.equal(isStaff({ role: "student" }), false);
  assert.ok(STAFF_ROLES.includes("attendance_operator"));
});

test("section aliases and granular permissions preserve route behavior", () => {
  assert.equal(sectionFor("/api/admin/pilgrimage-bookings/123/approve"), "trip-bookings");
  assert.equal(sectionFor("/api/admin/exam-question-banks"), "exams");
  const editor = { role: "editor", sectionAccess: [{ section: "blogs", view: true, create: true, edit: false, canDelete: false }] };
  assert.equal(canAccessSection(editor, "/api/admin/blogs", "view"), true);
  assert.equal(canAccessSection(editor, "blogs", "create"), true);
  assert.equal(canAccessSection(editor, "blogs", "edit"), false);
  assert.equal(canAccessSection(editor, "blogs", "delete"), false);
});

test("full administrators and specialized roles retain expected grants", () => {
  const admin = { role: "admin" };
  assert.equal(isFullAdmin(admin), true);
  assert.equal(canAccessSection(admin, "site-settings", "delete"), true);
  assert.ok(computeUserPermissions(admin).includes("outreach.create"));
  assert.ok(ADMIN_SECTIONS.includes("outreach"));
  assert.deepEqual(SPECIALIZED_ACCESS.attendance_operator, [
    { section: "outreach", view: true, create: true, edit: true, canDelete: false }
  ]);
});
