export const ROLE_LEVEL = Object.freeze({
  main_admin: 100,
  admin: 80,
  manager: 60,
  editor: 40,
  viewer: 20,
  outreach_coordinator: 30,
  attendance_operator: 25,
  teacher: 10,
  student: 0,
  devotee: 0,
  user: 0
});

export const STAFF_ROLES = Object.freeze([
  "main_admin", "admin", "manager", "editor", "viewer", "outreach_coordinator", "attendance_operator"
]);

export const SPECIALIZED_ACCESS = Object.freeze({
  outreach_coordinator: [{ section: "outreach", view: true, create: true, edit: true, canDelete: false }],
  attendance_operator: [{ section: "outreach", view: true, create: true, edit: true, canDelete: false }]
});

export const ADMIN_SECTIONS = Object.freeze([
  "dashboard", "users", "roles", "activity-log", "sessions",
  "banners", "home-sections", "about-sections", "pages",
  "courses", "lessons", "course-requests", "exams",
  "journeys", "trips", "trip-bookings", "booking-taxes", "upcoming-classes",
  "visionaries", "teachers", "blogs", "video-blogs", "media",
  "subscribers", "contact-messages", "comments", "chat",
  "footer", "site-settings", "traffic", "reports", "assets",
  "books", "book-orders", "book-payment-settings",
  "testimonials", "notifications", "outreach"
]);

export const SECTION_ALIASES = Object.freeze({
  journeys: "journeys", pilgrimages: "trips", trips: "trips",
  "pilgrimage-bookings": "trip-bookings", "trip-bookings": "trip-bookings",
  "booking-taxes": "booking-taxes", "upcoming-classes": "upcoming-classes",
  "media/images": "media", "media/videos": "media", "gallery-images": "media", "gallery-videos": "media",
  preachers: "visionaries", visionaries: "visionaries", teachers: "teachers",
  "video-intro": "home-sections", "home-sections": "home-sections", "about-sections": "about-sections",
  "trips-overview": "trips", "trip-stats": "trips", "book-orders": "book-orders",
  "book-payment-settings": "book-payment-settings", books: "books",
  "contact-settings": "contact-messages", contact: "contact-messages", "contact-messages": "contact-messages",
  testimonials: "testimonials", staff: "roles", roles: "roles", banners: "banners", courses: "courses",
  lessons: "lessons", assets: "assets", "course-requests": "course-requests", "activity-log": "activity-log",
  sessions: "sessions", users: "users", dashboard: "dashboard", subscribers: "subscribers",
  comments: "comments", chat: "chat", footer: "footer", "site-settings": "site-settings",
  traffic: "traffic", reports: "reports", notifications: "notifications", exams: "exams",
  "exam-assignments": "exams", "exam-papers": "exams", "exam-questions": "exams",
  "exam-question-banks": "exams", outreach: "outreach"
});

export const ACTION_FOR_METHOD = Object.freeze({
  GET: "view", POST: "create", PUT: "edit", PATCH: "edit", DELETE: "canDelete"
});

export const isStaff = (user) => STAFF_ROLES.includes(user?.role);
export const roleLevel = (user) => ROLE_LEVEL[user?.role] ?? 0;
export const isFullAdmin = (user) => Boolean(user && (user.role === "main_admin" || user.role === "admin"));

export const sectionFor = (resource = "") => {
  const head = String(resource).split("?")[0].replace(/^\/api\/admin\//, "").replace(/^\/api\//, "").replace(/^\//, "");
  if (SECTION_ALIASES[head]) return SECTION_ALIASES[head];
  const first = head.split("/")[0];
  return SECTION_ALIASES[first] || first;
};

export const canAccessSection = (user, section, action = "view") => {
  if (!user || !isStaff(user)) return false;
  if (isFullAdmin(user)) return true;
  const normalizedSection = sectionFor(section);
  const normalizedAction = action === "delete" || action === "canDelete"
    ? "canDelete"
    : action === "edit" || action === "update"
      ? "edit"
      : action === "create" ? "create" : "view";
  const grant = (user.sectionAccess || []).find((item) => item.section === normalizedSection);
  if (!grant) return false;
  return normalizedAction === "view" ? grant.view !== false : Boolean(grant[normalizedAction]);
};

export const computeUserPermissions = (user) => {
  if (!user || !isStaff(user)) return [];
  if (isFullAdmin(user)) {
    return ADMIN_SECTIONS.flatMap((section) => [
      `${section}.view`, `${section}.read`, `${section}.create`, `${section}.edit`,
      `${section}.update`, `${section}.delete`, `${section}.canDelete`
    ]);
  }
  const permissions = [];
  for (const grant of user.sectionAccess || []) {
    if (!grant?.section) continue;
    if (grant.view !== false) permissions.push(`${grant.section}.view`, `${grant.section}.read`);
    if (grant.create) permissions.push(`${grant.section}.create`);
    if (grant.edit || grant.update) permissions.push(`${grant.section}.edit`, `${grant.section}.update`);
    if (grant.canDelete || grant.delete) permissions.push(`${grant.section}.delete`, `${grant.section}.canDelete`);
  }
  return permissions;
};
