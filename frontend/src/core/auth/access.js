export const STAFF_ROLES = Object.freeze([
  "main_admin",
  "admin",
  "manager",
  "editor",
  "viewer",
  "outreach_coordinator",
  "attendance_operator"
]);

export const LEARNER_ROLES = Object.freeze(["student", "devotee", "user"]);
export const TEACHING_ROLES = Object.freeze(["teacher", "main_admin"]);

export const isStaffRole = (role) => STAFF_ROLES.includes(role);
export const isAttendanceOnlyRole = (role) => role === "attendance_operator";

export const homeForRole = (role) => {
  if (isStaffRole(role)) return "/admin/dashboard";
  if (role === "teacher") return "/teacher/dashboard";
  return "/student/dashboard";
};
