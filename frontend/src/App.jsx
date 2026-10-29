import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import {
  AboutPage,
  AdminBannersPage,
  AdminChatPage,
  AdminCommentsPage,
  AdminContactPage,
  AdminCourseLessonsPage,
  AdminLessonContentPage,
  AdminQuestionBankPage,
  AdminLessonAnalyticsPage,
  AdminCoursesPage,
  AdminDashboard,
  AdminResetRequestsPage,
  AdminRolesPage,
  AdminRoutePage,
  AdminSettingsPage,
  AdminTrafficPage,
  AdminUsersPage,
  AuthPage,
  BlogDetailPage,
  BlogListPage,
  ContactPage,
  CourseDetailPage,
  CoursesPage,
  GalleryPage,
  ForgotPasswordPage,
  HomePage,
  LearnPage,
  LegalPage,
  VisionaryDetailPage,
  VisionariesPage,
  ReportsPage,
  RequestPasswordResetPage,
  SitemapPage,
  StudentCoursesPage,
  StudentBookingsPage,
  StudentDashboard,
  StudentNotesPage,
  TeacherBlogsPage,
  TeacherCoursesPage,
  TeacherDashboard,
  TeacherCommentsPage,
  TeacherChatPage,
  TeacherStudentProgressPage,
  AdminTeachersPage,
  VerifyOtpPage,
  NotificationsPage,
  AdminCourseRequestsPage,
  AdminPilgrimageBookingsPage,
  AdminExamDashboardPage,
  AdminExamBanksPage,
  AdminExamQuestionsPage,
  AdminExamsPage,
  AdminExamAssignmentsPage,
  AdminExamResultsPage,
  StudentExamsPage,
  StudentExamTakePage,
  StudentExamResultPage,
  AdminAssetsPage
} from "./pages";
import { BrandLogo, DashboardLayout, ProtectedRoute, PublicLayout, PageUnavailable } from "./components";
import { TripsPage } from "./trips";
import { ClassesRoute, ClassDetailRoute } from "./classRoute";
import { AdminTripsPage } from "./adminTrips";
import { AdminJourneysPage } from "./adminJourneys";
import { AdminClassesPage } from "./adminClasses";
import { AdminAccessPage } from "./adminAccess";
import { StudentTripsPage, StudentTripDetailPage } from "./myTrips";
import { TripDetailRoute } from "./tripRoute";
import { VideosPage } from "./videosPage";
import { BooksPage } from "./booksPage";
import { BookDetailPage } from "./bookDetailPage";
import { MyBookOrdersPage } from "./myBookOrders";
import { AdminBooksPage, AdminBookOrdersPage, AdminBookPaymentSettingsPage } from "./adminBooks";
import { AdminHomeSectionsPage } from "./adminHomeSections";
import { useHomepageSections } from "./useHomepageSections";
import { useAuth } from "./AuthContext";
import { useEffect } from "react";
import { apiFetch } from "./api";
import { StudentTestimonialsPage } from "./studentTestimonials";
import { AdminTestimonialsPage } from "./adminTestimonials";
import OutreachPage from "./outreach";

const PageDisabledGuard = ({ sectionKey, pageName, children }) => {
  const { isPageEnabled } = useHomepageSections();
  if (!isPageEnabled(sectionKey)) {
    return <PageUnavailable pageName={pageName} sectionKey={sectionKey} />;
  }
  return children;
};

const adminRoutes = [
  ["video-intro", "video-intro"],
  ["about-sections", "about-sections"],
  ["pages", "pages"],
  ["visionaries", "visionaries"],
  ["blogs", "blogs"],
  ["video-blogs", "video-blogs"],
  ["media/images", "media/images"],
  ["media/videos", "media/videos"],
  ["subscribers", "subscribers"],
  ["legal-pages", "legal-pages"],
  ["booking-taxes", "booking-taxes"]
];

/* Staff roles that may open the admin panel at all. What they can
   actually see inside is decided per section by sectionAccess. */
export const STAFF_ROLES = ["main_admin", "admin", "manager", "editor", "viewer", "outreach_coordinator", "attendance_operator"];
const isStaff = (user) => STAFF_ROLES.includes(user?.role);

const LoadingScreen = () => <div className="grid min-h-screen place-items-center text-sm font-semibold">Loading...</div>;

const PanelEntry = ({ type }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (type === "admin") {
    if (!isStaff(user)) return <AuthPage admin />;
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (!user || !["teacher", "main_admin"].includes(user.role)) return <AuthPage teacher />;
  return <Navigate to="/teacher/dashboard" replace />;
};

const AdminPanelGate = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isStaff(user)) return <AuthPage admin />;
  return <DashboardLayout role="main_admin" />;
};

const TeacherPanelGate = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !["teacher", "main_admin"].includes(user.role)) return <AuthPage teacher />;
  return <DashboardLayout role="teacher" />;
};

const NotFoundPage = () => (
  <section className="grid min-h-screen place-items-center bg-soft px-4 text-center">
    <div className="max-w-md rounded-2xl bg-white p-8 shadow-premium">
      <div className="mb-6 flex justify-center"><BrandLogo /></div>
      <p className="mb-2 text-sm font-black uppercase tracking-wide text-primary">Page not found</p>
      <h1 className="text-3xl font-black text-ink">This route is not available.</h1>
      <a href="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Back to Website</a>
    </div>
  </section>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  useEffect(() => {
    apiFetch("/site-settings")
      .then((data) => {
        const settings = data.settings || {};
        const tags = [];
        if (settings.googleSearchConsoleTag) {
          tags.push(settings.googleSearchConsoleTag);
        }
        if (settings.customHeaderHtml) {
          tags.push(settings.customHeaderHtml);
        }

        if (tags.length > 0) {
          let container = document.getElementById("custom-header-scripts");
          if (!container) {
            container = document.createElement("div");
            container.id = "custom-header-scripts";
            container.style.display = "none";
            document.head.appendChild(container);
          }
          container.innerHTML = tags.join("\n");

          const parser = new DOMParser();
          const doc = parser.parseFromString(container.innerHTML, "text/html");
          const scripts = doc.querySelectorAll("script");
          scripts.forEach((s) => {
            const newScript = document.createElement("script");
            Array.from(s.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            newScript.innerHTML = s.innerHTML;
            document.head.appendChild(newScript);
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/courses" element={<PageDisabledGuard sectionKey="courses" pageName="Courses"><CoursesPage /></PageDisabledGuard>} />
        <Route path="/books" element={<PageDisabledGuard sectionKey="books" pageName="Books & Literature"><BooksPage /></PageDisabledGuard>} />
        <Route path="/books/:slug" element={<PageDisabledGuard sectionKey="books" pageName="Book Details"><BookDetailPage /></PageDisabledGuard>} />
        <Route path="/trips" element={<PageDisabledGuard sectionKey="trips" pageName="Pilgrimage Trips"><TripsPage /></PageDisabledGuard>} />
        <Route path="/classes" element={<PageDisabledGuard sectionKey="upcoming_classes" pageName="Sunday Classes"><ClassesRoute /></PageDisabledGuard>} />
        <Route path="/classes/:slug" element={<PageDisabledGuard sectionKey="upcoming_classes" pageName="Sunday Class Details"><ClassDetailRoute /></PageDisabledGuard>} />
        <Route path="/trips/:slug" element={<PageDisabledGuard sectionKey="trips" pageName="Trip Details"><TripDetailRoute /></PageDisabledGuard>} />
        <Route path="/journeys/:slug" element={<PageDisabledGuard sectionKey="featured_journey" pageName="Pilgrimage Journey"><TripDetailRoute /></PageDisabledGuard>} />
        <Route path="/courses/:slug" element={<PageDisabledGuard sectionKey="courses" pageName="Course Details"><CourseDetailPage /></PageDisabledGuard>} />
        <Route path="/learn/:courseSlug/:lessonSlug" element={<LearnPage />} />
        <Route path="/blogs" element={<PageDisabledGuard sectionKey="blogs" pageName="Blogs"><BlogListPage /></PageDisabledGuard>} />
        <Route path="/blogs/:slug" element={<PageDisabledGuard sectionKey="blogs" pageName="Blog Details"><BlogDetailPage /></PageDisabledGuard>} />
        <Route path="/video-blogs" element={<PageDisabledGuard sectionKey="video_blogs" pageName="Video Blogs"><VideosPage /></PageDisabledGuard>} />
        {/* Kept so older links and the footer still resolve. */}
        <Route path="/videos" element={<PageDisabledGuard sectionKey="video_blogs" pageName="Video Blogs"><VideosPage /></PageDisabledGuard>} />
        <Route path="/video-blogs/:slug" element={<PageDisabledGuard sectionKey="video_blogs" pageName="Video Blog Details"><BlogDetailPage video /></PageDisabledGuard>} />
        <Route path="/visionaries" element={<PageDisabledGuard sectionKey="preachers" pageName="Visionaries"><VisionariesPage /></PageDisabledGuard>} />
        <Route path="/visionaries/:slug" element={<PageDisabledGuard sectionKey="preachers" pageName="Visionary Details"><VisionaryDetailPage /></PageDisabledGuard>} />
        <Route path="/gallery/images" element={<PageDisabledGuard sectionKey="media_highlight" pageName="Media Gallery"><GalleryPage /></PageDisabledGuard>} />
        <Route path="/gallery/videos" element={<PageDisabledGuard sectionKey="media_highlight" pageName="Media Gallery"><GalleryPage videos /></PageDisabledGuard>} />
        <Route path="/media-highlight" element={<PageDisabledGuard sectionKey="media_highlight" pageName="Media Highlight"><GalleryPage /></PageDisabledGuard>} />
        <Route path="/privacy-policy" element={<LegalPage slug="privacy-policy" title="Privacy Policy" />} />
        <Route path="/terms-and-conditions" element={<LegalPage slug="terms-and-conditions" title="Terms and Conditions" />} />
        <Route path="/sitemap" element={<SitemapPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
        <Route path="/admin/login" element={<AuthPage admin />} />
        <Route path="/teacher/login" element={<AuthPage teacher />} />
      </Route>

      <Route element={<ProtectedRoute roles={["student"]}><DashboardLayout role="student" /></ProtectedRoute>}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/my-courses" element={<StudentCoursesPage />} />
        <Route path="/student/my-book-orders" element={<MyBookOrdersPage />} />
        <Route path="/student/my-bookings" element={<StudentBookingsPage />} />
        <Route path="/student/my-trips" element={<StudentTripsPage />} />
        <Route path="/student/my-trips/:slug" element={<StudentTripDetailPage />} />
        <Route path="/student/notes" element={<StudentNotesPage />} />
        <Route path="/student/testimonials" element={<StudentTestimonialsPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/course/:slug" element={<CourseDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["student", "devotee", "user"]} />}>
        <Route path="/exam/:examId/start" element={<StudentExamTakePage />} />
        <Route path="/exam/attempt/:attemptId" element={<StudentExamTakePage />} />
        <Route path="/exam/result/:attemptId" element={<StudentExamResultPage />} />
      </Route>
      <Route path="/my-follow-ups" element={<ProtectedRoute roles={["main_admin", "admin", "manager", "editor", "viewer", "teacher", "devotee"]}><OutreachPage volunteerMode /></ProtectedRoute>} />

      <Route path="/teacher" element={<TeacherPanelGate />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="courses" element={<TeacherCoursesPage />} />
        <Route path="comments" element={<TeacherCommentsPage />} />
        <Route path="chat" element={<TeacherChatPage />} />
        <Route path="student-progress" element={<TeacherStudentProgressPage />} />
        <Route path="blogs" element={<TeacherBlogsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="/admin" element={<AdminPanelGate />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="outreach" element={<OutreachPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="courses/:courseId/lessons" element={<AdminCourseLessonsPage />} />
        <Route path="courses/:courseId/lessons/:lessonId/content" element={<AdminLessonContentPage />} />
        <Route path="courses/:courseId/lessons/:lessonId/questions" element={<AdminQuestionBankPage />} />
        <Route path="courses/:courseId/lessons/:lessonId/analytics" element={<AdminLessonAnalyticsPage />} />
        <Route path="courses/:courseId/requests" element={<AdminCourseRequestsPage />} />
        <Route path="books" element={<AdminBooksPage />} />
        <Route path="book-orders" element={<AdminBookOrdersPage />} />
        <Route path="book-payment-settings" element={<AdminBookPaymentSettingsPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="password-reset-requests" element={<AdminResetRequestsPage />} />
        <Route path="comments" element={<AdminCommentsPage />} />
        <Route path="chat" element={<AdminChatPage />} />
        <Route path="contact" element={<AdminContactPage />} />
        <Route path="contact-messages" element={<AdminContactPage />} />
        <Route path="contact-settings" element={<AdminContactPage />} />
        <Route path="testimonials" element={<AdminTestimonialsPage />} />
        <Route path="course-requests" element={<AdminCourseRequestsPage />} />
        <Route path="upcoming-classes" element={<AdminClassesPage />} />
        <Route path="journeys" element={<AdminJourneysPage />} />
        <Route path="pilgrimages" element={<AdminTripsPage />} />
        <Route path="trips" element={<AdminTripsPage />} />
        <Route path="pilgrimage-bookings" element={<AdminPilgrimageBookingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="question-paper-maker" element={<AdminExamDashboardPage />} />
        <Route path="question-paper-maker/banks" element={<AdminExamBanksPage />} />
        <Route path="question-paper-maker/banks/:id/questions" element={<AdminExamQuestionsPage />} />
        <Route path="question-paper-maker/exams" element={<AdminExamsPage />} />
        <Route path="question-paper-maker/assignments" element={<AdminExamAssignmentsPage />} />
        <Route path="question-paper-maker/results" element={<AdminExamResultsPage />} />
        <Route path="home-sections" element={<AdminHomeSectionsPage />} />
        <Route path="homepage" element={<AdminHomeSectionsPage />} />
        {adminRoutes.map(([path, resource]) => (
          <Route key={path} path={path} element={<AdminRoutePage resource={resource} />} />
        ))}
        <Route path="roles" element={<AdminAccessPage />} />
        <Route path="activity-log" element={<AdminAccessPage tab="activity" />} />
        <Route path="sessions" element={<AdminAccessPage tab="sessions" />} />
        <Route path="footer" element={<AdminSettingsPage type="footer" />} />
        <Route path="site-settings" element={<AdminSettingsPage type="site" />} />
        <Route path="traffic" element={<AdminTrafficPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="assets" element={<AdminAssetsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
};

export default App;
