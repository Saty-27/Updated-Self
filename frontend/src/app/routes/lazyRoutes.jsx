import { lazy } from "react";

const lazyNamed = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })));
const loadPages = () => import("../../pages");

const pageExports = [
  "AboutPage", "AdminBannersPage", "AdminChatPage", "AdminCommentsPage", "AdminContactPage",
  "AdminCourseLessonsPage", "AdminLessonContentPage", "AdminQuestionBankPage", "AdminLessonAnalyticsPage",
  "AdminCoursesPage", "AdminDashboard", "AdminResetRequestsPage", "AdminRolesPage", "AdminRoutePage",
  "AdminSettingsPage", "AdminTrafficPage", "AdminUsersPage", "AuthPage", "BlogDetailPage", "BlogListPage",
  "ContactPage", "CourseDetailPage", "CoursesPage", "GalleryPage", "ForgotPasswordPage", "HomePage",
  "LearnPage", "LegalPage", "VisionaryDetailPage", "VisionariesPage", "ReportsPage", "RequestPasswordResetPage",
  "SitemapPage", "StudentCoursesPage", "StudentBookingsPage", "StudentDashboard", "StudentNotesPage",
  "TeacherBlogsPage", "TeacherCoursesPage", "TeacherDashboard", "TeacherCommentsPage", "TeacherChatPage",
  "TeacherStudentProgressPage", "AdminTeachersPage", "VerifyOtpPage", "NotificationsPage", "AdminCourseRequestsPage",
  "AdminPilgrimageBookingsPage", "AdminExamDashboardPage", "AdminExamBanksPage", "AdminExamQuestionsPage",
  "AdminExamsPage", "AdminExamAssignmentsPage", "AdminExamResultsPage", "StudentExamsPage", "StudentExamTakePage",
  "StudentExamResultPage", "AdminAssetsPage"
];

export const lazyPages = Object.fromEntries(pageExports.map((name) => [name, lazyNamed(loadPages, name)]));
export const AdminTripsPage = lazyNamed(() => import("../../adminTrips"), "AdminTripsPage");
export const AdminJourneysPage = lazyNamed(() => import("../../adminJourneys"), "AdminJourneysPage");
export const AdminClassesPage = lazyNamed(() => import("../../adminClasses"), "AdminClassesPage");
export const AdminAccessPage = lazyNamed(() => import("../../adminAccess"), "AdminAccessPage");
export const StudentTripsPage = lazyNamed(() => import("../../myTrips"), "StudentTripsPage");
export const StudentTripDetailPage = lazyNamed(() => import("../../myTrips"), "StudentTripDetailPage");
export const OutreachPage = lazy(() => import("../../features/outreach"));
