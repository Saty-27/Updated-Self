import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Lock,
  AlertTriangle,
  Mail,
  MessageSquare,
  Plus,
  Save,
  Shield,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  Video,
  Star,
  X,
  Award,
  Check,
  Key,
  Activity,
  Unlock,
  Paperclip,
  ChevronLeft,
  Calendar,
  MapPin,
  Phone,
  RotateCcw,
  ExternalLink
} from "lucide-react";
import {
  BlogCard,
  BrandLogo,
  CourseCard,
  EmptyState,
  HeroSlider,
  LessonRow,
  PageBanner,
  PreacherCard,
  VisionaryCard,
  ProgressBar,
  ProgressChart,
  ResourceLink,
  SEO,
  SectionHeader,
  StatCard,
  UpcomingClassCard,
  VideoBlogCard,
  VideoPlayer,
  StudentSupportChat,
  QuizPlayer
} from "./components";
import { initScrollReveal } from "./scrollReveal";
import { ISKCONHero } from "./hero";
import { UpcomingClassesSection } from "./upcomingClasses";
import { PilgrimageSection, featuredJourney } from "./pilgrimage";
import { PilgrimageBookingModal } from "./bookingModal";
import { FeaturedTripsSection } from "./featuredTrips";
import { CoursesSection } from "./courses";
import { BooksSection } from "./booksSection";
import { WhyJoinSection } from "./whyJoin";
import { LatestVideoSection } from "./latestVideo";
import { GoogleSignIn } from "./googleSignIn";
import { LatestBlogsSection } from "./latestBlogs";
import { MediaReflectionsSection } from "./mediaReflections";
import { TeachersSection } from "./teachers";
import { BenefitsSection } from "./benefits";
import { BlogTile } from "./latestBlogs";
import { VideoBlogTile } from "./videoBlogs";
import { apiFetch, assetUrl, uploadFile, API_URL } from "./api";
import { useAuth } from "./AuthContext";
import { usePermissions } from "./usePermissions";
import { useHomepageSections } from "./useHomepageSections";
import {
  benefits as fallbackBenefits,
  blogs as fallbackBlogs,
  courses as fallbackCourses,
  footer as fallbackFooter,
  galleryImages as fallbackGalleryImages,
  galleryVideos as fallbackGalleryVideos,
  heroBanners as fallbackHeroBanners,
  homeSections as fallbackHomeSections,
  images,
  preachers as fallbackPreachers,
  upcoming as fallbackUpcoming,
  videoBlogs as fallbackVideoBlogs
} from "./fallback";

const emptyFallback = [];
const useList = (path, fallback = emptyFallback) => {
  const [items, setItems] = useState(fallback);
  const [loading, setLoading] = useState(true);
  
  // Use a stringified version for dependencies if fallback is an object/array to prevent infinite loops
  const fallbackStr = JSON.stringify(fallback);
  
  const fetchData = useCallback(() => {
    setLoading(true);
    let mounted = true;
    apiFetch(path)
      .then((data) => mounted && setItems(data.items || data.sections || fallback))
      .catch(() => mounted && setItems(fallback))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [path, fallbackStr]);

  useEffect(() => {
    return fetchData();
  }, [fetchData]);

  return { items, loading, setItems, refresh: fetchData };
};

const useSingle = (path, fallback = null, key = "item") => {
  const [item, setItem] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    apiFetch(path)
      .then((data) => mounted && setItem(key ? data[key] || fallback : data || fallback))
      .catch(() => mounted && setItem(fallback))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [path, key]);
  return { item, loading, setItem };
};

/* Staff roles all land in the admin panel; everyone else keeps the
   destination they had before. */
const STAFF_ROLES = ["main_admin", "admin", "manager", "editor", "viewer", "outreach_coordinator", "attendance_operator"];
const homeFor = (role) =>
  STAFF_ROLES.includes(role) ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

const sectionMap = (sections) => Object.fromEntries(sections.map((section) => [section.sectionKey, section]));
const active = (section) => section && section.status !== "inactive";

/* Section headings are two-tone: the last word carries the accent
   colour. Splitting an admin-supplied title the same way keeps that
   look whatever wording the CMS holds. */
const splitHeading = (title, lead, accent) => {
  if (!title) return [lead, accent];
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return ["", title.trim()];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
};

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSectionVisible } = useHomepageSections();
  const sections = useList("/page-sections/home", fallbackHomeSections).items;
  const map = sectionMap(sections);
  const bannersState = useList("/banners/active", []);
  const banners = bannersState.loading ? [] : bannersState.items;
  const coursesState = useList("/courses/active?homepage=true&limit=6", []);
  const courses = coursesState.items;
  const upcoming = useList("/upcoming-classes?limit=3", []).items;
  const preachers = useList("/visionaries?homepage=true&limit=6", []).items;
  const benefits = useList("/benefits?limit=6", []).items;
  const blogsState = useList("/blogs?homepage=true&limit=6", []);
  const blogs = blogsState.items;
  const videoBlogsState = useList("/video-blogs?homepage=true&limit=6", []);
  const videoBlogs = videoBlogsState.items;
  const galleryImages = useList("/gallery/images?highlight=true&limit=12", []).items;
  const galleryVideos = useList("/gallery/videos?highlight=true&limit=12", []).items;
  const testimonials = useList("/testimonials", []).items;
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  /* Featured pilgrimage comes from the CMS / Journey API; the hardcoded journey
     stays as the fallback so the band still reads correctly before
     an admin has published one. */
  const { item: dynamicFeaturedJourney, loading: journeyLoading } = useSingle("/journeys/featured", null, "item");
  const pilgrimages = useList("/pilgrimages?homepage=true&limit=1", []).items;
  const featuredPilgrimage = pilgrimages[0];
  const [bookingOpen, setBookingOpen] = useState(false);
  /* Featured trips for the homepage grid — same records as /trips. */
  const featuredTripsState = useList("/trips?homepage=true&limit=6", []);

  /* Fade each section up as it scrolls in. Re-runs as the lists land
     so sections that mount late are picked up too. */
  const sectionCount = sections.length + courses.length + upcoming.length + preachers.length
    + benefits.length + blogs.length + videoBlogs.length + galleryImages.length
    + galleryVideos.length + testimonials.length;
  useEffect(() => {
    const id = window.requestAnimationFrame(() => initScrollReveal());
    return () => window.cancelAnimationFrame(id);
  }, [sectionCount]);

  // Sunday Class modal registration states
  const [selectedClass, setSelectedClass] = useState(null);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [regNotice, setRegNotice] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const subscribe = async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/subscribers", { method: "POST", body: { email } });
      setNotice("Subscribed successfully.");
      setEmail("");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleRegisterClick = (item) => {
    setSelectedClass(item);
    setRegForm({ name: "", email: "", phone: "", message: "" });
    setRegNotice("");
    setRegSuccess(false);
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.phone) {
      setRegNotice("Name, Email and Phone Number are required.");
      return;
    }
    try {
      const payload = {
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        subject: `Sunday Class Registration: ${selectedClass.title}`,
        classTitle: selectedClass.title,
        message: regForm.message || `Devotee registered for upcoming class: ${selectedClass.title} at ${selectedClass.venue} conducted by ${selectedClass.speaker}.`
      };
      await apiFetch("/contact", { method: "POST", body: payload });
      setRegSuccess(true);
      setRegNotice("Registration Confirmed! We look forward to welcoming you on Sunday.");
    } catch (err) {
      setRegNotice(err.message);
    }
  };

  return (
    <>
      <SEO title="ISKCON Juhu Self-Excellence LMS" description="Spiritual learning, Self-Excellence courses, Sunday classes, and student LMS." />
      {isSectionVisible("hero") && <ISKCONHero />}

      {isSectionVisible("upcoming_classes") && active(map.upcoming_classes) && (
        <UpcomingClassesSection
          items={upcoming}
          onActionClick={handleRegisterClick}
          /* Heading comes from Admin -> Home Sections, falling back to
             the built-in wording when the CMS leaves it blank. */
          titleLead={map.upcoming_classes?.sectionTitle ? "" : "Upcoming"}
          titleAccent={map.upcoming_classes?.sectionTitle || "Sunday Classes"}
          subtitle={map.upcoming_classes?.sectionSubtitle || undefined}
        />
      )}

      {isSectionVisible("featured_journey") && (
        <>
          <PilgrimageSection
            journey={
              dynamicFeaturedJourney || (featuredPilgrimage
                ? {
                    ...featuredJourney,
                    badge: featuredPilgrimage.badge || featuredJourney.badge,
                    badgeText: featuredPilgrimage.badge || featuredJourney.badge,
                    title: featuredPilgrimage.title,
                    route: featuredPilgrimage.route || featuredJourney.route,
                    routeText: featuredPilgrimage.route || featuredJourney.route,
                    mainImage: featuredPilgrimage.image,
                    floatingImage1: featuredPilgrimage.image,
                    floatingImage2: featuredPilgrimage.gallery?.[0]?.imageUrl || featuredPilgrimage.image,
                    duration: featuredPilgrimage.days ? `${featuredPilgrimage.days} Days` : featuredJourney.duration,
                    nights: featuredPilgrimage.nights ? `${featuredPilgrimage.nights} Nights` : featuredJourney.nights,
                    routeDetail: featuredPilgrimage.routeDetail || featuredJourney.routeDetail,
                    visitDetail: featuredPilgrimage.visitDetail || featuredJourney.visitDetail,
                    guideDetail: featuredPilgrimage.guideDetail || featuredJourney.guideDetail,
                    ctaText: "Book Now"
                  }
                : featuredJourney)
            }
            loading={journeyLoading}
            onBook={() => {
              if (dynamicFeaturedJourney?.slug) {
                navigate(`/journeys/${dynamicFeaturedJourney.slug}`);
              } else if (featuredPilgrimage?.slug) {
                navigate(`/trips/${featuredPilgrimage.slug}`);
              } else if (featuredPilgrimage) {
                setBookingOpen(true);
              } else {
                navigate("/trips");
              }
            }}
            onViewAll={() => navigate("/trips")}
          />

          <PilgrimageBookingModal
            pilgrimage={featuredPilgrimage}
            open={bookingOpen && Boolean(featuredPilgrimage)}
            onClose={() => setBookingOpen(false)}
          />
        </>
      )}

      {isSectionVisible("trips") && (
        <FeaturedTripsSection trips={featuredTripsState.items} loading={featuredTripsState.loading} />
      )}

      {isSectionVisible("courses") && active(map.courses) && (
        <CoursesSection courses={courses} loading={coursesState.loading} />
      )}

      {isSectionVisible("books") && (
        <BooksSection />
      )}

      {isSectionVisible("why_join") && (
        <WhyJoinSection />
      )}

      {/* The old Video Blogs band was merged into this one, so it now
          answers to that section's CMS toggle. */}
      {isSectionVisible("video_blogs") && active(map.video_blogs) && (
        <LatestVideoSection
          videos={videoBlogs}
          /* Heading comes from Admin -> Home Sections, falling back to
             the built-in wording when the CMS leaves it blank. */
          titleLead={splitHeading(map.video_blogs?.sectionTitle, "Latest", "Videos")[0]}
          titleAccent={splitHeading(map.video_blogs?.sectionTitle, "Latest", "Videos")[1]}
          subtitle={map.video_blogs?.sectionSubtitle || undefined}
          viewAllLabel={map.video_blogs?.buttonText || undefined}
          viewAllLink={map.video_blogs?.buttonLink || undefined}
        />
      )}

      {isSectionVisible("preachers") && active(map.preachers) && (
        <TeachersSection teachers={preachers} />
      )}

      {isSectionVisible("benefits") && active(map.benefits) && (
        <BenefitsSection benefits={benefits} />
      )}

      {isSectionVisible("blogs") && active(map.blogs) && (
        <LatestBlogsSection blogs={blogs} loading={blogsState.loading} />
      )}

      {isSectionVisible("media_highlight") && active(map.media_highlight) && (
        <MediaReflectionsSection
          images={galleryImages}
          videos={galleryVideos}
          testimonials={testimonials}
          email={email}
          setEmail={setEmail}
          onSubscribe={subscribe}
          notice={notice}
        />
      )}

      {/* Sunday Class Registration Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-premium border border-black/5 animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedClass(null)}
              className="absolute top-5 right-5 text-muted hover:text-ink hover:scale-110 transition p-2 rounded-full hover:bg-soft"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <span className="inline-block text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3">
                Sunday Class Registration
              </span>
              <h2 className="text-2xl font-black text-ink leading-tight">{selectedClass.title}</h2>
              <p className="mt-2 text-sm text-muted">
                Complete your registration below to secure a seat. All fields are required.
              </p>
            </div>

            {regSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-ink">Registration Confirmed!</h3>
                <p className="mt-2 text-sm text-muted leading-6 px-4">{regNotice}</p>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="mt-6 rounded-full bg-ink hover:bg-ink/90 px-8 py-2.5 text-sm font-black text-white transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <form onSubmit={submitRegistration} className="grid gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-muted block mb-1">Full Name <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition bg-soft/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-muted block mb-1">Email Address <span className="text-primary">*</span></label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition bg-soft/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-muted block mb-1">Phone Number <span className="text-primary">*</span></label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition bg-soft/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-muted block mb-1">Any questions or remarks? (Optional)</label>
                  <textarea
                    value={regForm.message}
                    onChange={(e) => setRegForm({ ...regForm, message: e.target.value })}
                    placeholder="Optional message..."
                    rows="3"
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition resize-none bg-soft/50 focus:bg-white"
                  />
                </div>

                {regNotice && (
                  <p className="text-sm font-bold text-primary mt-1">{regNotice}</p>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 rounded-full bg-primary hover:bg-primary/95 py-3 text-center text-sm font-black text-white transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  Register Now
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Site-wide support desk: any signed-in visitor, no enrolment needed. */}
      {user && user.role !== "main_admin" && <StudentSupportChat general />}
    </>
  );
};

export const CoursesPage = () => {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const { items, loading } = useList(`/courses/active?${query}`, []);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  return (
    <>
      <SEO title="Courses - ISKCON Juhu Self-Excellence" />
      <PageBanner title="Explore Courses" subtitle="Dynamic spiritual learning courses designed by experienced devotees." image={images.books} />
      <section className="section-pad bg-soft"><div className="container-pad">
        {/* Two columns on a phone — search and the button span both, the
            two selects share a row — then a single row from md up. Every
            control is the same explicit height so they line up rather
            than each sizing itself from its own padding. */}
        <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
          <input value={params.get("search") || ""} onChange={(event) => update("search", event.target.value)} placeholder="Search courses" className="col-span-2 h-12 w-full min-w-0 rounded-xl border border-black/10 px-4 text-[16px] outline-none focus:border-primary md:col-span-1 md:text-sm" />
          <select value={params.get("category") || ""} onChange={(event) => update("category", event.target.value)} className="h-12 w-full min-w-0 truncate rounded-xl border border-black/10 bg-white pl-4 pr-9 text-[15px] outline-none focus:border-primary md:text-sm"><option value="">Category</option><option>Scripture</option><option>Self-Excellence</option></select>
          <select value={params.get("level") || ""} onChange={(event) => update("level", event.target.value)} className="h-12 w-full min-w-0 truncate rounded-xl border border-black/10 bg-white pl-4 pr-9 text-[15px] outline-none focus:border-primary md:text-sm"><option value="">Level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          <button className="col-span-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white transition-colors hover:bg-primary-dark md:col-span-1"><Search size={16} />Search</button>
        </div>
        {loading ? (
          <div className="py-20 text-center font-bold text-muted animate-pulse">Loading courses...</div>
        ) : items.length ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{items.map((course) => <CourseCard key={course._id} course={course} />)}</div>
        ) : (
          <EmptyState />
        )}
      </div></section>
    </>
  );
};

export const CourseDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { item: course, setItem, loading } = useSingle(`/courses/${slug}`, null, "course");
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [message, setMessage] = useState("");
  
  // Custom enrollment type state
  const [enrollStatus, setEnrollStatus] = useState({ enrolled: false, request: null });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ fullName: "", email: "", phone: "", message: "", documentUrl: "", paymentPhotoUrl: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const displayLessons = useMemo(() => Array.from(new Map(lessons.filter((lesson) => lesson?.title).map((lesson) => [lesson._id || lesson.slug || lesson.title, lesson])).values()), [lessons]);

  const loadStatus = () => {
    if (user && course?._id) {
      apiFetch(`/courses/${course._id}/enrollment-status`)
        .then((data) => setEnrollStatus(data))
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (!course?._id) return;
    apiFetch(`/courses/${course._id}/lessons`)
      .then((data) => {
        const ordered = data.items || data.lessons || [];
        setLessons(ordered);
      })
      .catch(() => {
        const fallbackLessons = course.lessons || [];
        setLessons(fallbackLessons);
      });
  }, [course?._id]);

  useEffect(() => {
    loadStatus();
  }, [user, course?._id]);

  useEffect(() => {
    if (user) {
      setUploadForm((old) => ({
        ...old,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      }));
    }
  }, [user, showUploadModal]);

  useEffect(() => {
    if (isLearnerRole(user?.role) && course?._id) {
      apiFetch(`/student/progress/${course._id}`).then((data) => {
        setProgress(data.summary);
        if (data.records) {
          setCompletedIds(new Set(data.records.filter(r => r.isCompleted || r.status === "completed").map(r => r.lesson?._id || r.lesson)));
        }
      }).catch(() => {});
    }
  }, [user, course?._id]);

  const isEnrolled = enrollStatus.enrolled || ["main_admin", "teacher"].includes(user?.role);
  
  const processedLessons = useMemo(() => {
    let foundUncompleted = false;
    return displayLessons.map((lesson) => {
      let locked = false;
      if (!isEnrolled && !lesson.isPreview) {
        locked = true;
      } else if (isEnrolled && !completedIds.has(lesson._id) && !lesson.isPreview) {
        if (foundUncompleted) locked = true;
        else foundUncompleted = true;
      }
      return { ...lesson, locked };
    });
  }, [displayLessons, completedIds, isEnrolled]);

  useEffect(() => {
    if (processedLessons.length > 0 && !activeLesson) {
      const firstUnlocked = processedLessons.find(l => !l.locked) || processedLessons[0];
      setActiveLesson(firstUnlocked);
    }
  }, [processedLessons, activeLesson]);

  const enrollFree = async () => {
    if (!user) return navigate("/login");
    if (!isLearnerRole(user.role)) return setMessage("Only learner accounts can enroll.");
    try {
      await apiFetch(`/courses/${course._id}/enroll`, { method: "POST" });
      setMessage("You have successfully enrolled in this course.");
      loadStatus();
      const first = displayLessons?.[0];
      if (first) navigate(`/learn/${course.slug}/${first.slug}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handlePaymentMock = async () => {
    try {
      await apiFetch(`/courses/${course._id}/enroll`, { method: "POST" });
      setMessage("Mock payment successful! You have successfully enrolled.");
      setShowPaymentModal(false);
      loadStatus();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const types = Array.isArray(course.enrollmentType) ? course.enrollmentType : [course.enrollmentType || "free"];
    const requiresDoc = types.includes("verification");
    const requiresPay = types.includes("paid");

    if (requiresDoc && !uploadForm.documentUrl) {
      setUploadError("Please upload a document to proceed.");
      return;
    }
    if (requiresPay && !uploadForm.paymentPhotoUrl) {
      setUploadError("Please upload a payment receipt / screenshot to proceed.");
      return;
    }
    try {
      await apiFetch(`/course-requests`, {
        method: "POST",
        body: {
          ...uploadForm,
          courseId: course._id
        }
      });
      setMessage("Your submission has been received successfully. Admin review is pending.");
      setShowUploadModal(false);
      loadStatus();
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const handleDocumentFile = async (file) => {
    if (!file) return;
    setUploadError("");
    
    // Check file size
    const limitMb = course.maxFileSize || 5;
    if (file.size > limitMb * 1024 * 1024) {
      setUploadError(`File is too large. Maximum size allowed is ${limitMb}MB.`);
      return;
    }

    // Check file type
    const allowed = course.allowedFileTypes || [];
    if (allowed.length > 0) {
      const extension = "." + file.name.split(".").pop().toLowerCase();
      if (!allowed.some(ext => ext.toLowerCase() === extension)) {
        setUploadError(`Invalid file format. Allowed formats: ${allowed.join(", ")}`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, "enrollment-requests");
      setUploadForm((old) => ({ ...old, documentUrl: uploaded.url }));
    } catch (err) {
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaymentFile = async (file) => {
    if (!file) return;
    setUploadError("");
    
    // Check file size
    const limitMb = course.maxFileSize || 5;
    if (file.size > limitMb * 1024 * 1024) {
      setUploadError(`File is too large. Maximum size allowed is ${limitMb}MB.`);
      return;
    }

    // Check file type (payment is typically an image)
    const extension = "." + file.name.split(".").pop().toLowerCase();
    const allowedImages = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedImages.includes(extension)) {
      setUploadError("Invalid file format for payment photo. Allowed formats: .jpg, .jpeg, .png, .webp");
      return;
    }

    setIsUploadingPayment(true);
    try {
      const uploaded = await uploadFile(file, "payment-receipts");
      setUploadForm((old) => ({ ...old, paymentPhotoUrl: uploaded.url }));
    } catch (err) {
      setUploadError("Failed to upload payment photo. Please try again.");
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const isLessonLocked = activeLesson?.locked;

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {loading ? (
          <div className="text-xl font-bold text-muted animate-pulse">Loading course details...</div>
        ) : (
          <div className="text-xl font-bold text-muted">Course not found</div>
        )}
      </div>
    );
  }

  return (
    <>
      <SEO title={course.seoTitle || `${course.title} Course`} description={course.seoDescription || course.shortDescription || course.description} />
      <PageBanner title={course.title} subtitle={course.shortDescription} image={course.bannerImage || course.thumbnail} />
      <section className="section-pad bg-soft"><div className="container-pad grid gap-8 w-full min-w-0 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl bg-white p-6 shadow-sm w-full min-w-0">
          <div className="mb-6 flex flex-wrap gap-3 text-sm font-bold text-muted"><span>{course.duration || "Self paced"}</span><span>{course.level}</span><span>{displayLessons.length} lessons</span><span>{course.priceType === "Paid" ? `₹${course.price || 0}` : "Free"}</span></div>
          {progress && <ProgressBar percent={progress.percent} label={`${progress.completedLessons} of ${progress.totalLessons} lessons completed`} />}
          <div className="prose mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
          {course.whatYouWillLearn?.length > 0 && <><h2 className="mt-10 text-2xl font-black">What you will learn</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{course.whatYouWillLearn.map((item) => <div key={item} className="flex gap-2 rounded-xl bg-soft p-3 text-sm font-bold"><CheckCircle2 className="text-primary" size={18} />{item}</div>)}</div></>}
          <div className="mt-10 grid gap-6 w-full min-w-0 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="w-full min-w-0">
              <h2 className="text-2xl font-black">Lessons & Chapters</h2>
              <div className="mt-4 grid gap-3 w-full min-w-0">
                {processedLessons.map((lesson, index) => (
                  <button key={lesson._id || lesson.slug} type="button" onClick={() => setActiveLesson(lesson)} className={`w-full min-w-0 rounded-2xl border p-4 text-left transition ${activeLesson?._id === lesson._id ? "border-primary bg-primary/10" : "border-black/10 bg-soft hover:border-primary/40"} ${lesson.locked ? "pointer-events-none opacity-55" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-primary">
                        {lesson.locked ? <Lock size={16} className="text-black/40" /> : index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-black text-ink truncate">{lesson.title}</h3>
                          {lesson.locked && <Lock size={14} className="text-muted shrink-0" />}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm leading-6 text-muted prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: lesson.description }} />
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black text-muted">
                          <span>{lesson.videoType === "upload" ? "Uploaded video" : "YouTube"}</span>
                          {lesson.pdfFile && <span>PDF available</span>}
                          {lesson.isPreview && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase text-emerald-600 tracking-wider">Preview Lesson</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 min-w-0">
              {activeLesson ? (
                isLessonLocked ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px] bg-soft/20 backdrop-blur-sm rounded-xl border border-black/5">
                    <div className="p-4 bg-primary/10 rounded-full text-primary mb-4 animate-pulse">
                      <Lock size={36} />
                    </div>
                    <h3 className="text-lg font-black text-ink">Lesson Locked</h3>
                    <p className="mt-2 text-sm text-muted max-w-sm leading-relaxed">
                      {(() => {
                        const types = Array.isArray(course.enrollmentType) ? course.enrollmentType : [course.enrollmentType || "free"];
                        const hasVerification = types.includes("verification");
                        const hasPaid = types.includes("paid");

                        if (hasVerification || hasPaid) {
                          if (enrollStatus.request?.status === "pending") {
                            return "Your verification is currently pending admin review. Lessons will be unlocked once approved.";
                          }
                          if (enrollStatus.request?.status === "rejected") {
                            return `Your verification was rejected. Reason: ${enrollStatus.request.rejectionReason || "Please review submission guidelines and re-submit."}`;
                          }
                          return "This lesson requires course enrollment. Please enroll and submit verification to unlock.";
                        }
                        return "This lesson is locked. Please enroll in the course to unlock all lessons.";
                      })()}
                    </p>
                    {(() => {
                      const types = Array.isArray(course.enrollmentType) ? course.enrollmentType : [course.enrollmentType || "free"];
                      const hasVerification = types.includes("verification");
                      const hasPaid = types.includes("paid");

                      if (hasVerification || hasPaid) {
                        if (!enrollStatus.request) {
                          let btnText = "Submit Document to Unlock";
                          if (hasVerification && hasPaid) {
                            btnText = "Submit Document & Payment to Unlock";
                          } else if (hasPaid) {
                            btnText = "Submit Payment to Unlock";
                          }
                          return (
                            <button
                              onClick={() => {
                                if (!user) return navigate("/login");
                                setShowUploadModal(true);
                              }}
                              className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-black text-white hover:opacity-90 transition"
                            >
                              {btnText}
                            </button>
                          );
                        }
                        if (enrollStatus.request?.status === "rejected") {
                          return (
                            <button
                              onClick={() => {
                                if (!user) return navigate("/login");
                                setShowUploadModal(true);
                              }}
                              className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-black text-white hover:opacity-90 transition"
                            >
                              Re-submit Verification
                            </button>
                          );
                        }
                      } else {
                        return (
                          <button
                            onClick={enrollFree}
                            className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-black text-white hover:opacity-90 transition"
                          >
                            Enroll Now to Unlock
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <>
                    <VideoPlayer url={activeLesson.videoUrl} youtubeUrl={activeLesson.youtubeUrl} uploadedVideo={activeLesson.uploadedVideo} videoType={activeLesson.videoType} title={activeLesson.title} />
                    <h3 className="mt-4 text-xl font-black">{activeLesson.title}</h3>
                    <div className="mt-2 text-sm leading-6 text-muted prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: activeLesson.description }} />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <ResourceLink href={activeLesson.pdfFile} label="View PDF" />
                      {activeLesson.pdfFile && <a href={assetUrl(activeLesson.pdfFile)} download className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Download PDF</a>}
                    </div>
                  </>
                )
              ) : <EmptyState title="No lessons added yet" subtitle="Lessons created from the admin panel will appear here." />}
            </div>
          </div>
        </div>
        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm border border-black/5 min-w-0">
          <img src={assetUrl(course.thumbnail || course.bannerImage)} alt={course.title} loading="lazy" className="mb-5 aspect-[4/3] w-full rounded-xl object-cover" />
          
          {isEnrolled ? (
            <button
              onClick={() => {
                let nextLesson = displayLessons?.[0];
                if (progress?.completedVideoIds) {
                  const completedSet = new Set(progress.completedVideoIds);
                  const firstUncompleted = displayLessons?.find(l => !completedSet.has(l._id));
                  if (firstUncompleted) nextLesson = firstUncompleted;
                }
                if (nextLesson) navigate(`/learn/${course.slug}/${nextLesson.slug}`);
              }}
              className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-black text-white transition flex items-center justify-center gap-2"
            >
              Continue Learning
            </button>
          ) : (
            <>
              {(() => {
                const types = Array.isArray(course.enrollmentType) ? course.enrollmentType : [course.enrollmentType || "free"];
                const hasVerification = types.includes("verification");
                const hasPaid = types.includes("paid");

                if (hasVerification || hasPaid) {
                  if (enrollStatus.request?.status === "pending") {
                    return (
                      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                        <Clock className="mx-auto text-amber-600 mb-2" size={24} />
                        <span className="text-sm font-black text-amber-800">Verification Pending</span>
                        <p className="mt-1 text-xs text-amber-700 leading-normal">
                          We are validating your document/payment. Access will open shortly.
                        </p>
                      </div>
                    );
                  }
                  if (enrollStatus.request?.status === "rejected") {
                    return (
                      <div className="w-full grid gap-3">
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center">
                          <AlertTriangle className="mx-auto text-rose-600 mb-2" size={24} />
                          <span className="text-sm font-black text-rose-800">Submission Rejected</span>
                          <p className="mt-1 text-xs text-rose-700 leading-normal">
                            Reason: {enrollStatus.request.rejectionReason}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!user) return navigate("/login");
                            setShowUploadModal(true);
                          }}
                          className="w-full rounded-full bg-primary hover:opacity-90 px-6 py-3 text-sm font-black text-white transition"
                        >
                          Re-submit Verification
                        </button>
                      </div>
                    );
                  }

                  let btnText = "Submit Document to Enroll";
                  if (hasVerification && hasPaid) {
                    btnText = "Submit Document & Payment";
                  } else if (hasPaid) {
                    btnText = `Buy Course (₹${course.price || 0})`;
                  }

                  return (
                    <button
                      onClick={() => {
                        if (!user) return navigate("/login");
                        setShowUploadModal(true);
                      }}
                      className="w-full rounded-full bg-primary hover:opacity-90 px-6 py-3 text-sm font-black text-white transition flex items-center justify-center gap-2"
                    >
                      {btnText}
                    </button>
                  );
                }

                return (
                  <button
                    onClick={enrollFree}
                    className="w-full rounded-full bg-primary hover:opacity-90 px-6 py-3 text-sm font-black text-white transition"
                  >
                    Enroll Now
                  </button>
                );
              })()}
            </>
          )}

          {message && <p className="mt-3 text-sm font-bold text-primary text-center">{message}</p>}
          <div className="mt-6 border-t border-black/10 pt-6"><h3 className="font-black">Course Details</h3><div className="mt-3 grid gap-2 text-sm text-muted"><p>Category: {course.category || "General"}</p><p>Level: {course.level || "Beginner"}</p><p>Duration: {course.duration || "Self paced"}</p><p>Lessons: {displayLessons.length}</p></div></div>
        </aside>
      </div></section>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-4">
              <h2 className="text-xl font-black text-ink">Submit Enrollment Document</h2>
              <button onClick={() => { setShowUploadModal(false); setUploadError(""); }} className="rounded-full bg-soft p-2 hover:bg-black/10 text-muted">×</button>
            </div>
            
            {course.verificationInstructions && (
              <div className="mb-5 rounded-2xl bg-primary/5 border border-primary/10 p-4 text-xs leading-relaxed text-ink">
                <span className="font-black block uppercase text-primary mb-1">Instructions:</span>
                {course.verificationInstructions}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-xs font-black uppercase text-muted">Full Name</span>
                <input
                  required
                  type="text"
                  value={uploadForm.fullName}
                  onChange={(e) => setUploadForm({ ...uploadForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-muted">Email Address</span>
                  <input
                    required
                    type="email"
                    value={uploadForm.email}
                    onChange={(e) => setUploadForm({ ...uploadForm, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    className="rounded-xl border border-black/10 px-4 py-3 text-sm"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-muted">Phone Number</span>
                  <input
                    required
                    type="text"
                    value={uploadForm.phone}
                    onChange={(e) => setUploadForm({ ...uploadForm, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="rounded-xl border border-black/10 px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-black uppercase text-muted">Short Note to Reviewer (Optional)</span>
                <textarea
                  value={uploadForm.message}
                  onChange={(e) => setUploadForm({ ...uploadForm, message: e.target.value })}
                  placeholder="Any details or remarks you want to send..."
                  rows="3"
                  className="rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </label>

              {(() => {
                const courseTypes = Array.isArray(course.enrollmentType) ? course.enrollmentType : [course.enrollmentType || "free"];
                const requiresDoc = courseTypes.includes("verification");
                const requiresPay = courseTypes.includes("paid");

                return (
                  <>
                    {requiresDoc && (
                      <div className="grid gap-1 border-t border-black/5 pt-4 mt-2">
                        <span className="text-xs font-black uppercase text-muted mb-2">
                          Upload Required Document: <strong className="text-primary">{course.requiredDocumentName || "Letter of Recommendation"}</strong>
                        </span>
                        
                        <div className="rounded-2xl border-2 border-dashed border-black/10 p-5 text-center bg-soft hover:bg-black/5 transition relative cursor-pointer">
                          <input
                            type="file"
                            accept={(course.allowedFileTypes || []).join(",")}
                            onChange={(e) => handleDocumentFile(e.target.files?.[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="text-xs text-muted">
                            <p className="font-bold text-ink mb-1">Drag and drop or click to upload file</p>
                            <p>Allowed formats: {(course.allowedFileTypes || [".pdf", ".jpg", ".png"]).join(", ")}</p>
                            <p>Maximum size: {course.maxFileSize || 5}MB</p>
                          </div>
                        </div>

                        {isUploading && (
                          <span className="mt-2 text-xs text-primary font-bold animate-pulse">Uploading file to secure server...</span>
                        )}

                        {uploadForm.documentUrl && (
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-800 text-xs font-bold">
                            <span>✓ Document uploaded successfully</span>
                            <a href={assetUrl(uploadForm.documentUrl)} target="_blank" rel="noreferrer" className="underline font-black">Preview</a>
                          </div>
                        )}
                      </div>
                    )}

                    {requiresPay && (
                      <div className="grid gap-1 border-t border-black/5 pt-4 mt-2">
                        {course.paymentQrCode && (
                          <div className="mb-4 flex flex-col items-center p-4 bg-soft/30 rounded-2xl border border-black/5">
                            <h4 className="text-xs font-black uppercase text-ink mb-2">Scan to Pay</h4>
                            <img src={assetUrl(course.paymentQrCode)} alt="Payment QR Code" className="max-w-[200px] rounded-xl shadow-sm object-contain" />
                          </div>
                        )}
                        <span className="text-xs font-black uppercase text-muted mb-2">
                          Upload Payment Photo: <strong className="text-primary">Receipt / Screenshot</strong>
                        </span>
                        
                        <div className="rounded-2xl border-2 border-dashed border-black/10 p-5 text-center bg-soft hover:bg-black/5 transition relative cursor-pointer">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={(e) => handlePaymentFile(e.target.files?.[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="text-xs text-muted">
                            <p className="font-bold text-ink mb-1">Drag and drop or click to upload file</p>
                            <p>Allowed formats: .jpg, .jpeg, .png, .webp</p>
                            <p>Maximum size: {course.maxFileSize || 5}MB</p>
                          </div>
                        </div>

                        {isUploadingPayment && (
                          <span className="mt-2 text-xs text-primary font-bold animate-pulse">Uploading payment receipt...</span>
                        )}

                        {uploadForm.paymentPhotoUrl && (
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-800 text-xs font-bold">
                            <span>✓ Payment photo uploaded successfully</span>
                            <a href={assetUrl(uploadForm.paymentPhotoUrl)} target="_blank" rel="noreferrer" className="underline font-black">Preview</a>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-xs font-bold text-rose-600">{uploadError}</p>
                    )}

                    <div className="mt-4 flex justify-end gap-2 border-t border-black/5 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowUploadModal(false); setUploadError(""); }}
                        className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-black hover:bg-soft transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUploading || isUploadingPayment || (requiresDoc && !uploadForm.documentUrl) || (requiresPay && !uploadForm.paymentPhotoUrl)}
                        className="rounded-xl bg-primary disabled:opacity-50 px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition"
                      >
                        Submit Details
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* Payment simulated Mock Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/10">
            <h2 className="text-xl font-black text-ink">Mock Payment Secure Gateway</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Paid course enrollment access control is fully configured on the server. Since payment service integration is kept ready for future implementation, you can simulate and test the paid transaction flow right now!
            </p>
            <div className="my-5 rounded-2xl bg-soft/50 border border-black/5 p-4 text-sm font-bold flex justify-between">
              <span className="text-muted">Total Payable Amount:</span>
              <span className="text-ink text-lg font-black">₹{course.price || 0}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-black hover:bg-soft transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentMock}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition"
              >
                Simulate Successful Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const formatTime = (seconds = 0) => {
  const safe = Math.max(Math.floor(Number(seconds) || 0), 0);
  const mins = Math.floor(safe / 60);
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

const isLearnerRole = (role) => ["student", "devotee", "user", "teacher", "main_admin"].includes(role);

export const LearnPage = () => {
  const { courseSlug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { item: course, loading: courseLoading } = useSingle(`/courses/${courseSlug}`, null, "course");
  const [progress, setProgress] = useState({ records: [], summary: { percent: 0, completedLessons: 0, totalLessons: course?.lessons?.length || 0 } });
  const [lessonProgress, setLessonProgress] = useState(null);
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState([]);
  const [chat, setChat] = useState([]);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [commentText, setCommentText] = useState("");
  const [chatText, setChatText] = useState("");
  const [notice, setNotice] = useState("");
  const videoRef = useRef(null);
  const saveTimer = useRef(0);
  const lesson = course?.lessons?.find((item) => item.slug === lessonSlug) || course?.lessons?.[0];
  const canTrack = Boolean(user && isLearnerRole(user.role) && course?._id && lesson?._id);

  const [noteSearch, setNoteSearch] = useState("");
  const [noteSort, setNoteSort] = useState("-createdAt");
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [watchPercents, setWatchPercents] = useState({});
  const localWatchPercent = watchPercents[lesson?._id] || 0;
  
  const setLocalWatchPercent = (updater) => {
    setWatchPercents(prev => {
      const old = prev[lesson?._id] || 0;
      const val = typeof updater === "function" ? updater(old) : updater;
      return { ...prev, [lesson?._id]: val };
    });
  };

  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);

  const watchedIntervalsRef = useRef([]);
  const lastTrackedTimeRef = useRef(null);
  const autoCompleting = useRef(false);

  const loadProgress = () => {
    if (canTrack) apiFetch(`/student/progress/${course._id}`).then(setProgress).catch(() => {});
  };

  const loadLessonData = () => {
    if (!lesson?._id) return;
    apiFetch(`/lessons/${lesson._id}/comments`).then((data) => setComments(data.items || [])).catch(() => {});
    if (lesson.quizSettings?.hasQuiz) {
      apiFetch(`/quiz/${lesson._id}`).then(data => setQuizAttempt(data.attempt)).catch(() => setQuizAttempt(null));
    }
    if (canTrack) {
      apiFetch(`/progress/${course._id}/${lesson._id}`).then((data) => {
        setLessonProgress(data.progress);
        if (data.progress) {
          setLocalWatchPercent(data.progress.watchPercent || 0);
          if (data.progress.lastPosition > 0) {
            setResumeTime(data.progress.lastPosition);
            setShowResumeBanner(true);
          } else {
            setShowResumeBanner(false);
          }
          watchedIntervalsRef.current = data.progress.watchedIntervals || [];
        } else {
          setShowResumeBanner(false);
          watchedIntervalsRef.current = [];
        }
      }).catch(() => {
        setLessonProgress(null);
        setShowResumeBanner(false);
        watchedIntervalsRef.current = [];
      });
      
      lastTrackedTimeRef.current = null;
      
      apiFetch(`/lessons/${lesson._id}/notes?sort=${noteSort}&q=${encodeURIComponent(noteSearch)}`).then((data) => setNotes(data.items || [])).catch(() => setNotes([]));
      apiFetch(`/courses/${course._id}/chat/messages`).then((data) => setChat(data.items || [])).catch(() => setChat([]));
    }
  };

  useEffect(() => {
    loadProgress();
  }, [canTrack, course?._id]);

  useEffect(() => {
    loadLessonData();
    setNotice("");
  }, [canTrack, course?._id, lesson?._id, noteSort, noteSearch]);

  const mergeLocalIntervals = (intervals) => {
    if (!intervals.length) return [];
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    return merged;
  };

  const completedIds = new Set(progress.records?.filter((item) => item.isCompleted).map((item) => item.lesson?._id || item.lesson));

  const isVideoComplete = (item) => {
    if (item.isCompleted) return true;
    const l = course?.lessons?.find(x => x._id === (item.lesson?._id || item.lesson));
    const hasVideo = !!(l?.videoUrl || l?.youtubeUrl || l?.uploadedVideo);
    if (!hasVideo) return item.isCompleted;
    const threshold = Number(l?.videoSettings?.completionThreshold || l?.completionThreshold || 80);
    return item.watchPercent >= threshold;
  };
  const videoCompletedIds = new Set(progress.records?.filter(isVideoComplete).map((item) => item.lesson?._id || item.lesson));
  
  const saveVideoProgress = ({ currentTime, duration, percent, force }) => {
    if (!canTrack || !duration) return;

    let forceSave = force || false;
    if (lastTrackedTimeRef.current !== null) {
      const diff = currentTime - lastTrackedTimeRef.current;
      if (diff > 0 && diff < 4) {
        watchedIntervalsRef.current.push({ start: lastTrackedTimeRef.current, end: currentTime });
        watchedIntervalsRef.current = mergeLocalIntervals(watchedIntervalsRef.current);
      } else if (Math.abs(diff) >= 4) {
        forceSave = true;
      }
    }
    lastTrackedTimeRef.current = currentTime;
    setLocalWatchPercent(old => Math.max(old, percent));

    const now = Date.now();
    if (!forceSave && now - saveTimer.current < 10000) return;
    saveTimer.current = now;

    const intervalsToSend = [...watchedIntervalsRef.current];
    apiFetch("/progress", {
      method: "POST",
      body: {
        courseId: course._id,
        lessonId: lesson._id,
        lastPosition: currentTime,
        duration,
        watchedIntervals: intervalsToSend
      }
    })
      .then((data) => {
        setLessonProgress(data.progress);
        if (data.summary) setProgress((old) => ({ ...old, summary: data.summary, records: old.records || [] }));
      })
      .catch(() => {});
  };

  useEffect(() => {
    const handleVisibilityOrUnload = () => {
      if (!canTrack || !videoRef.current) return;
      const currentTime = videoRef.current.currentTime || 0;
      const duration = videoRef.current.duration || 0;
      if (!duration) return;

      const intervalsToSend = [...watchedIntervalsRef.current];
      const payload = JSON.stringify({
        courseId: course._id,
        lessonId: lesson._id,
        lastPosition: currentTime,
        duration,
        watchedIntervals: intervalsToSend
      });
      
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${API_URL}/progress`, blob);
    };

    window.addEventListener("beforeunload", handleVisibilityOrUnload);
    const handleVis = () => {
      if (document.visibilityState === "hidden") {
        handleVisibilityOrUnload();
      }
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      window.removeEventListener("beforeunload", handleVisibilityOrUnload);
      document.removeEventListener("visibilitychange", handleVis);
    };
  }, [canTrack, course?._id, lesson?._id]);

  const markComplete = async () => {
    if (!canTrack) return setNotice("Please login and enroll as a student to save progress.");
    try {
      const data = await apiFetch("/progress/complete", { 
        method: "POST", 
        body: { 
          courseId: course._id, 
          lessonId: lesson._id,
          watchPercent: localWatchPercent // Pass the latest frontend percent so backend doesn't reject if out of sync
        } 
      });
      setProgress((old) => ({ ...old, summary: data.summary, records: [...(old.records || []).filter((item) => (item.lesson?._id || item.lesson) !== lesson._id), data.progress] }));
      setLessonProgress(data.progress);
    } catch(err) {
      alert("Failed to mark as complete. " + err.message);
      return;
    }
    
    if (!lesson?.quizSettings?.hasQuiz) {
      setNotice("Lesson completed! Redirecting to next lesson...");
      const currentIndex = course?.lessons?.findIndex(item => item._id === lesson._id);
      if (currentIndex !== -1 && currentIndex < course.lessons.length - 1) {
        const nextLesson = course.lessons[currentIndex + 1];
        setTimeout(() => navigate(`/learn/${course.slug}/${nextLesson.slug}`), 2000);
      } else {
        setNotice("Lesson marked as completed. You've reached the end of the course!");
      }
    } else {
      setNotice("Lesson marked as completed. Please complete the quiz below.");
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!canTrack) return setNotice("Login and enroll to save notes.");
    const timestamp = videoRef.current?.currentTime || lessonProgress?.lastPosition || 0;
    const data = await apiFetch("/notes", { method: "POST", body: { courseId: course._id, lessonId: lesson._id, ...noteForm, timestamp } });
    setNotes((old) => {
      const next = [...old, data.item];
      if (noteSort === "timestamp") {
        return next.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      } else if (noteSort === "newest") {
        return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        return next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
    });
    setNoteForm({ title: "", content: "" });
  };

  const deleteNote = async (id) => {
    await apiFetch(`/notes/${id}`, { method: "DELETE" });
    setNotes((old) => old.filter((item) => item._id !== id));
  };

  const jumpTo = (timestamp) => {
    if (videoRef.current) videoRef.current.currentTime = Number(timestamp || 0);
  };

  const addComment = async (event, parentComment = null) => {
    event.preventDefault();
    if (!user) return setNotice("Login to comment.");
    const text = parentComment ? event.currentTarget.elements.reply.value : commentText;
    const data = await apiFetch(`/lessons/${lesson._id}/comments`, { method: "POST", body: { courseId: course._id, text, parentComment } });
    setComments((old) => [data.item, ...old]);
    setCommentText("");
    if (parentComment) event.currentTarget.reset();
  };

  const rootComments = comments.filter((item) => !item.parentComment);
  const repliesFor = (id) => comments.filter((item) => String(item.parentComment) === String(id));

  const currentIndex = course?.lessons?.findIndex((item) => item._id === lesson?._id) ?? -1;
  const isCurrentLessonLocked = currentIndex > 0 && !completedIds.has(course?.lessons?.[currentIndex - 1]?._id);

  const hasVideo = !!(lesson?.videoUrl || lesson?.youtubeUrl || lesson?.uploadedVideo);
  const completionThreshold = hasVideo ? (lesson?.videoSettings?.completionThreshold || lesson?.completionThreshold || 80) : 0;
  const meetsThreshold = !hasVideo || localWatchPercent >= completionThreshold;
  const requiresManualCompletion = lesson?.videoSettings?.enableCompleteButton !== false;

  useEffect(() => {
    // Only auto-complete if manual completion is DISABLED (i.e., they didn't explicitly want a button)
    // Or if it's a text-only lesson and we want it to just automatically complete when opened? 
    // Actually, if requiresManualCompletion is true, they MUST click the button even for text lessons.
    if (meetsThreshold && !requiresManualCompletion && !videoCompletedIds.has(lesson?._id) && !autoCompleting.current) {
      autoCompleting.current = true;
      markComplete().finally(() => {
        autoCompleting.current = false;
      });
    }
  }, [meetsThreshold, requiresManualCompletion, videoCompletedIds, lesson?._id]);

  const handleQuizAnswer = (questionId, selectedOption, shortAnswerText) => {
    setQuizAnswers(prev => {
      const existing = prev.filter(a => a.questionId !== questionId);
      return [...existing, { questionId, selectedOption, shortAnswerText }];
    });
  };

  const submitQuiz = async () => {
    if (!quizAttempt) return;
    try {
      const res = await apiFetch(`/quiz/${lesson._id}/submit`, {
        method: "POST",
        body: { attemptId: quizAttempt._id, answers: quizAnswers }
      });
      setQuizAttempt(res.attempt);
      setNotice(res.attempt.status === "passed" ? "Quiz passed!" : "Quiz failed, please review and try again.");
      loadProgress();
    } catch (e) {
      setNotice(e.message || "Failed to submit quiz.");
    }
  };

  if (!course) {
    return courseLoading ? (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-xl font-bold text-muted animate-pulse">Loading lesson...</div>
      </div>
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-xl font-bold text-muted">Course not found</div>
      </div>
    );
  }

  return (
    <>
      <SEO title={`${lesson?.title || "Lesson"} - ISKCON LMS`} />
      <section className="bg-soft py-4 sm:py-6 lg:py-8">
        <div className="container-pad grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            {isCurrentLessonLocked ? (
              <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px] bg-soft/50 rounded-2xl border border-black/5">
                <div className="p-4 bg-primary/10 rounded-full text-primary mb-4 animate-bounce">
                  <Lock size={48} />
                </div>
                <h3 className="text-2xl font-black text-ink">Lesson Locked</h3>
                <p className="mt-2 text-sm text-muted max-w-md leading-relaxed">
                  This lesson is locked under sequential study guidelines. Please complete the previous lesson to unlock:
                  <strong className="block mt-2 text-ink text-base font-black">
                    {course?.lessons?.[currentIndex - 1]?.title}
                  </strong>
                </p>
                <Link
                  to={`/learn/${course.slug}/${course?.lessons?.[currentIndex - 1]?.slug}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-black text-white hover:opacity-90 transition shadow-lg shadow-primary/20"
                >
                  Go to Previous Lesson
                </Link>
              </div>
            ) : (
              <>
                {(lesson?.videoUrl || lesson?.youtubeUrl || lesson?.uploadedVideo) ? (
                  <>
                    <VideoPlayer 
                      videoRef={videoRef} 
                      url={lesson?.videoUrl} 
                      youtubeUrl={lesson?.youtubeUrl} 
                      uploadedVideo={lesson?.uploadedVideo} 
                      videoType={lesson?.videoType} 
                      title={lesson?.title} 
                      startAt={lessonProgress?.lastPosition || 0} 
                      onProgress={saveVideoProgress} 
                      disableSeeking={lesson?.videoSettings?.disableSeeking ?? true}
                      maxWatchedSeconds={lessonProgress?.maxWatchedSeconds || 0}
                    />
                    
                    {showResumeBanner && resumeTime > 0 && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/20 p-3 text-sm text-primary">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Resuming from {formatTime(resumeTime)}</span>
                          <span className="text-xs opacity-80">(Saved automatically)</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = 0;
                                setShowResumeBanner(false);
                                setNotice("Playback started from the beginning.");
                              }
                            }}
                            className="rounded-full bg-primary px-3 py-1 text-xs font-black text-white hover:bg-primary/95 transition"
                          >
                            Start from beginning
                          </button>
                          <button
                            onClick={() => setShowResumeBanner(false)}
                            className="text-xs font-bold text-muted underline hover:text-ink transition"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full rounded-2xl bg-soft/50 border border-black/10 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                    {((lesson?.contents || []).some(c => c.type === 'exam' && c.isActive) || lesson?.examPaper) ? (
                      <>
                        <div className="mb-4 bg-primary/10 text-primary p-4 rounded-full">
                          <FileText size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-ink mb-2">Exam Available</h2>
                        <p className="text-muted mb-6 max-w-md">Please take the assigned exam for this lesson to proceed.</p>
                        <div className="flex flex-col gap-3 w-full max-w-sm">
                          {lesson?.examPaper && (() => {
                            const hasVideo = !!(lesson?.videoUrl || lesson?.youtubeUrl || lesson?.uploadedVideo);
                            const isExamUnlocked = !hasVideo || videoCompletedIds.has(lesson?._id);
                            return isExamUnlocked ? (
                              <Link to={`/exam/${lesson.examPaper._id || lesson.examPaper}/start`} state={{ backUrl: location.pathname }} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-black hover:opacity-90 transition shadow-lg shadow-primary/20">
                                Start {lesson.examPaper.title || "Exam"} &rarr;
                              </Link>
                            ) : (
                              <button disabled className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-muted/20 text-muted font-black cursor-not-allowed border border-black/5">
                                <Lock size={16} /> Complete lesson to unlock
                              </button>
                            );
                          })()}
                          {(lesson?.contents || []).filter(c => c.type === 'exam' && c.isActive).map(content => {
                            const hasVideo = !!(lesson?.videoUrl || lesson?.youtubeUrl || lesson?.uploadedVideo);
                            const isExamUnlocked = !hasVideo || videoCompletedIds.has(lesson?._id);
                            return isExamUnlocked ? (
                              <Link key={content._id} to={`/exam/${content.examPaper}/start`} state={{ backUrl: location.pathname }} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-black hover:opacity-90 transition shadow-lg shadow-primary/20">
                                Start {content.title || "Exam"} &rarr;
                              </Link>
                            ) : (
                              <button key={content._id} disabled className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-muted/20 text-muted font-black cursor-not-allowed border border-black/5">
                                <Lock size={16} /> Complete lesson to unlock
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-black text-muted">No Video Available</h2>
                        <p className="text-sm text-muted mt-2">Please read the description and notes below.</p>
                      </>
                    )}
                  </div>
                )}

                {lessonProgress?.lastPosition > 0 && !showResumeBanner && (lesson?.videoUrl || lesson?.youtubeUrl || lesson?.uploadedVideo) && (
                  <p className="mt-3 text-sm font-bold text-primary">Continue watching from {formatTime(lessonProgress.lastPosition)}. Watched {lessonProgress.watchPercent || 0}%.</p>
                )}

                <h1 className="mt-5 break-words text-2xl font-black leading-tight sm:mt-6 sm:text-3xl lg:text-4xl">{lesson?.title}</h1>
                <p className="mt-3 text-sm leading-7 text-muted sm:text-base">{lesson?.description}</p>
                
                {lesson?.examPaper && (lesson?.videoUrl || lesson?.youtubeUrl || lesson?.uploadedVideo) && (
                  <div className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-primary flex items-center gap-2"><FileText size={20} /> {lesson.examPaper.title || "Lesson Exam"}</h3>
                      <p className="text-sm text-primary/80 mt-1">Ready to test your knowledge? Take the exam now.</p>
                    </div>
                    {videoCompletedIds.has(lesson?._id) ? (
                      <Link to={`/exam/${lesson.examPaper._id || lesson.examPaper}/start`} state={{ backUrl: location.pathname }} className="whitespace-nowrap px-6 py-3 bg-primary text-white font-black text-sm rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20">
                        Start Exam &rarr;
                      </Link>
                    ) : (
                      <button disabled className="whitespace-nowrap px-6 py-3 bg-primary/10 text-primary/60 font-black text-sm rounded-xl cursor-not-allowed flex items-center gap-2" title="Complete the lesson to unlock this exam">
                        <Lock size={14} /> Exam Locked
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <ResourceLink href={lesson?.pdfFile} label="View PDF" />
                  {lesson?.pdfFile && <a href={assetUrl(lesson.pdfFile)} download className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Download PDF</a>}
                  <ResourceLink href={lesson?.attachmentFile} label="Download Attachment" />
                </div>
                {notice && <p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm font-bold text-primary">{notice}</p>}

                {/* Premium Lesson Completion & Watch Requirement Card */}
                <div className="mt-6 rounded-2xl border border-black/10 bg-soft/30 p-5 backdrop-blur-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-ink flex items-center gap-2">
                        {videoCompletedIds.has(lesson?._id) ? (
                          <span className="text-green-600 flex items-center gap-1.5">
                            <CheckCircle2 className="w-5 h-5" /> Completed
                          </span>
                        ) : (
                          <span className="text-ink">Lesson Completion Status</span>
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {videoCompletedIds.has(lesson?._id) 
                          ? "You have successfully finished this lesson. Keep up the great work!" 
                          : "Mark this lesson as completed to track your progress."}
                      </p>
                    </div>
                    
                    <div>
                      {videoCompletedIds.has(lesson?._id) ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-xs font-black text-green-700 uppercase tracking-wider">
                            Completed
                          </div>
                          {(() => {
                            const currentIndex = course?.lessons?.findIndex(item => item._id === lesson._id);
                            if (currentIndex !== -1 && currentIndex < course?.lessons?.length - 1) {
                              const nextLesson = course.lessons[currentIndex + 1];
                              return (
                                <Link to={`/learn/${course.slug}/${nextLesson.slug}`} className="flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-black text-white bg-primary hover:bg-primary/95 transition shadow-md shadow-primary/20">
                                  Next Lesson &rarr;
                                </Link>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (() => {
                          const hasExam = !!lesson?.examPaper || (lesson?.contents || []).some(c => c.type === 'exam' && c.isActive);
                          if (hasExam) {
                            return (
                              <button disabled className="flex items-center gap-1.5 rounded-full px-6 py-2.5 text-xs font-black text-white bg-gray-400 cursor-not-allowed">
                                <Lock size={14} /> Pass Exam to Complete
                              </button>
                            );
                          }
                          return (
                            <button 
                              onClick={markComplete}
                              disabled={lesson?.videoSettings?.enableCompleteButton !== false && !meetsThreshold}
                              className={`flex items-center gap-1.5 rounded-full px-6 py-2.5 text-xs font-black text-white transition shadow-md shadow-primary/10 hover:shadow-primary/20 ${lesson?.videoSettings?.enableCompleteButton !== false && !meetsThreshold ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/95"}`}
                            >
                              <CheckCircle2 size={14} /> Mark as Completed
                            </button>
                          );
                        })()
                      }
                    </div>
                  </div>
                  
                  {videoCompletedIds.has(lesson?._id) && lesson?.quizSettings?.hasQuiz && (
                    <div className="mt-6 border-t border-black/10 pt-6">
                      {quizAttempt?.status === "passed" ? (
                        <div className="rounded-xl bg-green-500/10 p-4 text-center border border-green-500/20">
                          <p className="font-bold text-green-700">Quiz Passed! Score: {quizAttempt.score}%</p>
                        </div>
                      ) : quizAttempt?.status === "failed" ? (
                        <div className="rounded-xl bg-red-500/10 p-4 text-center border border-red-500/20 mb-4">
                          <p className="font-bold text-red-700">Quiz Failed. Score: {quizAttempt.score}%. Please try again.</p>
                          <button onClick={() => { setQuizAttempt(null); loadLessonData(); }} className="mt-2 text-sm text-red-700 underline">Retake Quiz</button>
                        </div>
                      ) : (
                        <QuizPlayer attempt={quizAttempt} onAnswerChange={handleQuizAnswer} onSubmit={submitQuiz} />
                      )}
                    </div>
                  )}

                  {/* Micro watch progress bar */}
                  {!videoCompletedIds.has(lesson?._id) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-muted mb-1.5">
                        <span>Video Watch Progress</span>
                        <span>{localWatchPercent || 0}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div 
                          className="h-full rounded-full transition-all duration-500 bg-amber-500" 
                          style={{ width: `${Math.min(localWatchPercent || 0, 100)}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                  <section className="rounded-2xl border border-black/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">
                      <h2 className="text-xl font-black">Notes</h2>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteSearch}
                          onChange={(e) => setNoteSearch(e.target.value)}
                          placeholder="Search notes..."
                          className="rounded-xl border border-black/10 px-3 py-1 text-xs outline-none focus:border-primary w-28 sm:w-36"
                        />
                        <select
                          value={noteSort}
                          onChange={(e) => setNoteSort(e.target.value)}
                          className="rounded-xl border border-black/10 px-2 py-1 text-xs bg-white outline-none focus:border-primary"
                        >
                          <option value="timestamp">Timestamp</option>
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </select>
                      </div>
                    </div>

                    <form onSubmit={addNote} className="mt-4 grid gap-3">
                      <input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} placeholder="Note title" className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary" />
                      <textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} required rows="3" placeholder="Write a private note" className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary" />
                      <button className="rounded-full bg-primary px-4 py-2 text-sm font-black text-white hover:bg-primary/95 transition">Save Note</button>
                    </form>

                    <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
                      {notes.map((note) => (
                        <div key={note._id} className="rounded-xl bg-soft p-3 text-sm border border-black/5 hover:border-primary/20 transition">
                          <button onClick={() => jumpTo(note.timestamp)} className="mb-1 inline-flex items-center gap-1 font-black text-primary hover:underline">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(note.timestamp)}
                          </button>
                          <h3 className="font-black">{note.title || "Lesson note"}</h3>
                          <p className="mt-1 whitespace-pre-line text-muted">{note.content}</p>
                          <button onClick={() => deleteNote(note._id)} className="mt-2 text-xs font-black text-primary hover:underline">Delete</button>
                        </div>
                      ))}
                      {notes.length === 0 && <p className="text-sm text-muted py-4 text-center">No notes found.</p>}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-black/10 p-4">
                    <h2 className="text-xl font-black border-b border-black/5 pb-2 mb-4">Comments</h2>
                    <form onSubmit={(event) => addComment(event)} className="grid gap-3">
                      <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} required rows="3" placeholder="Ask a question or share a reflection" className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary" />
                      <button className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white hover:bg-ink/90 transition">Post Comment</button>
                    </form>
                    <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
                      {rootComments.map((comment) => (
                        <div key={comment._id} className="rounded-xl bg-soft p-3 text-sm border border-black/5">
                          <div className="font-black">{comment.user?.name || "Student"} <span className="font-normal text-muted">· {new Date(comment.createdAt).toLocaleDateString()}</span></div>
                          <p className="mt-1 whitespace-pre-line text-muted">{comment.text}</p>
                          {comment.adminReply && (
                            <div className="mt-2.5 rounded-xl bg-primary/5 border border-primary/10 p-3 text-xs">
                              <div className="flex items-center gap-1.5 font-black text-primary mb-1">
                                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                  Teacher Reply
                                </span>
                                <span>
                                  {comment.adminReplyUser?.name || "Preacher / Admin"}
                                </span>
                              </div>
                              <p className="whitespace-pre-line text-ink leading-relaxed font-semibold">
                                {comment.adminReply}
                              </p>
                              {comment.adminReplyAt && (
                                <p className="text-[10px] text-muted mt-1.5">
                                  {new Date(comment.adminReplyAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                          <form onSubmit={(event) => addComment(event, comment._id)} className="mt-2 flex gap-2">
                            <input name="reply" placeholder="Reply" className="min-w-0 flex-1 rounded-full border border-black/10 px-3 py-2 text-xs outline-none focus:border-primary" />
                            <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-primary border border-black/5 hover:border-primary transition">Reply</button>
                          </form>
                          {repliesFor(comment._id).map((reply) => (
                            <div key={reply._id} className="mt-2 rounded-lg bg-white p-2 border border-black/5">
                              <strong>{reply.user?.name || "User"}</strong>
                              <p className="text-muted">{reply.text}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                      {rootComments.length === 0 && <p className="text-sm text-muted py-4 text-center">No comments yet.</p>}
                    </div>
                  </section>
                </div>
              </>
            )}
          </main>
          <aside className="min-w-0 h-fit overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24">
            <ProgressBar percent={progress.summary?.percent || 0} label={`${progress.summary?.completedLessons || 0} of ${progress.summary?.totalLessons || course?.lessons?.length || 0} lessons completed`} />
            <div className="mt-5 grid min-w-0 gap-3">
              {course?.lessons?.map((item, idx) => {
                const isLocked = false;
                return (
                  <div key={item._id || item.slug} className="grid gap-2">
                    <LessonRow lesson={item} active={item.slug === lessonSlug} completed={videoCompletedIds.has(item._id)} locked={isLocked} to={`/learn/${course.slug}/${item.slug}`} />
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
      {user?.role === "student" && <StudentSupportChat />}
    </>
  );
};

export const AboutPage = () => {
  const { items } = useList("/about-sections", []);
  const { item: page } = useSingle("/pages/about", {}, null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    apiFetch("/site-settings").then((data) => setSettings(data.settings)).catch(() => {});
  }, []);

  const sections = items.length ? items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [
    { sectionTitle: "Our Mission", sectionSubtitle: "Spiritual education for everyday excellence", description: "To empower students with timeless Vedic wisdom, devotional support, and practical tools.", image: images.temple },
    { sectionTitle: "Our Vision", sectionSubtitle: "Strong minds, soft hearts, purposeful lives", description: "We envision young people who combine excellence with character, compassion, and Krishna consciousness.", image: images.youth }
  ];

  const stats = settings?.aboutStats || { courses: "6+", teachers: "6+", lessons: "12+", sundayClasses: "Every Week" };

  return (
    <>
      <SEO title={page?.title || "About ISKCON Juhu Self-Excellence"} />
      <PageBanner title={page?.title || "About Us"} subtitle={page?.excerpt || "A spiritual education and personal excellence program for students."} image={page?.bannerImage || images.temple} />
      <section className="section-pad bg-white"><div className="container-pad grid gap-10">
        {sections.map((section, index) => <div key={section._id || section.sectionTitle} className={`grid items-center gap-10 ${index % 2 ? "lg:grid-cols-[0.95fr_1.05fr]" : "lg:grid-cols-[1.05fr_0.95fr]"}`}><div className={index % 2 ? "lg:order-2" : ""}><img src={assetUrl(section.image)} alt={section.sectionTitle} className="h-80 w-full rounded-2xl object-cover shadow-premium" /></div><div><SectionHeader centered={false} eyebrow={section.sectionSubtitle} title={section.sectionTitle} subtitle={section.description} />{section.buttonText && <Link to={section.buttonLink} className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">{section.buttonText}</Link>}</div></div>)}
        <div className="grid gap-6 rounded-2xl bg-soft p-8 md:grid-cols-4"><StatCard label="Courses" value={stats.courses} icon={BookOpen} /><StatCard label="Teachers" value={stats.teachers} icon={Users} /><StatCard label="Lessons" value={stats.lessons} icon={GraduationCap} /><StatCard label="Sunday Classes" value={stats.sundayClasses} icon={Clock} /></div>
      </div></section>
    </>
  );
};

export const normalizeMapEmbedUrl = (raw) => {
  if (!raw || !String(raw).trim()) {
    return "https://www.google.com/maps?q=ISKCON%20Juhu&output=embed";
  }
  const str = String(raw).trim();
  const iframeMatch = str.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }
  if (str.includes("output=embed") || str.includes("/maps/embed")) {
    return str;
  }
  if (str.startsWith("http://") || str.startsWith("https://")) {
    if (str.includes("google.com/maps")) {
      return `${str}${str.includes("?") ? "&" : "?"}output=embed`;
    }
    return str;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(str)}&output=embed`;
};

export const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState({
    title: "Contact Information",
    address: "ISKCON Juhu, Hare Krishna Land, Juhu, Mumbai",
    phone: "+91 22 2620 6860",
    email: "selfexcellence@iskconjuhu.in",
    whatsappNumber: "8928337055",
    whatsappMessage: "Hare Krishna! I would like to know more about ISKCON Self-Excellence courses.",
    mapUrl: "https://www.google.com/maps?q=ISKCON%20Juhu&output=embed",
    bannerTitle: "Contact Us",
    bannerSubtitle: "Questions about classes, courses, enrollment, or volunteering? Reach out."
  });

  useEffect(() => {
    apiFetch("/contact-settings")
      .then((res) => {
        if (res.settings) setSettings((prev) => ({ ...prev, ...res.settings }));
      })
      .catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/contact", { method: "POST", body: form });
      setNotice("Hare Krishna! Message sent successfully. Our devotees will contact you soon.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const mapSrc = normalizeMapEmbedUrl(settings.mapUrl);
  const cleanWaNum = (settings.whatsappNumber || "8928337055").replace(/[^0-9]/g, "");
  const waTarget = cleanWaNum.length === 10 ? `91${cleanWaNum}` : cleanWaNum;

  return (
    <>
      <SEO title={`${settings.bannerTitle || "Contact Us"} - ISKCON Juhu Self-Excellence`} />
      <PageBanner
        title={settings.bannerTitle || "Contact Us"}
        subtitle={settings.bannerSubtitle || "Questions about classes, courses, enrollment, or volunteering? Reach out."}
        image={images.temple}
      />
      <section className="section-pad bg-soft">
        <div className="container-pad grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Dynamic Contact Information & Map Card */}
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-ink">{settings.title || "Contact Information"}</h2>
            <div className="mt-6 grid gap-4 text-muted text-sm sm:text-base leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="whitespace-pre-line text-ink font-medium">{settings.address || "ISKCON Juhu, Hare Krishna Land, Juhu, Mumbai"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-primary shrink-0" />
                <a href={`tel:${settings.phone || "+912226206860"}`} className="text-ink font-bold hover:text-primary hover:underline transition">
                  {settings.phone || "+91 22 2620 6860"}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-primary shrink-0" />
                <a href={`mailto:${settings.email || "selfexcellence@iskconjuhu.in"}`} className="text-ink font-bold hover:text-primary hover:underline transition">
                  {settings.email || "selfexcellence@iskconjuhu.in"}
                </a>
              </div>
              {settings.whatsappNumber && (
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-white shrink-0">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.587 1.771.884 2.791.885h.005c3.181 0 5.767-2.586 5.767-5.767.001-3.18-2.585-5.77-5.766-5.77zm3.364 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.001-.482-1.637-.678-2.684-2.336-2.766-2.445-.081-.11-.663-.883-.663-1.684 0-.802.42-1.196.569-1.359.149-.163.325-.203.433-.203.11 0 .217.002.312.007.1.006.234-.038.366.279.136.326.463 1.13.504 1.212.041.082.068.177.014.284-.055.109-.082.177-.163.272-.082.096-.172.214-.246.287-.082.082-.167.172-.072.335.095.163.424.7.91 1.133.627.558 1.155.73 1.318.812.163.082.259.068.354-.041.096-.11.408-.476.517-.639.109-.163.218-.136.367-.082.149.055.952.449 1.115.531.163.082.272.122.312.19.041.068.041.394-.103.799zm-3.364-10.335c-5.514 0-10 4.486-10 10 0 1.956.564 3.784 1.542 5.335l-1.637 5.978 6.137-1.61c1.503.909 3.255 1.433 5.127 1.433h.005c5.514 0 10-4.486 10-10 0-5.514-4.486-10-10-10zm0 18.25c-1.696 0-3.313-.497-4.686-1.364l-.336-.212-3.468.91.925-3.379-.232-.37c-.958-1.528-1.467-3.298-1.467-5.115 0-4.549 3.701-8.25 8.25-8.25 4.549 0 8.25 3.701 8.25 8.25 0 4.549-3.701 8.25-8.25 8.25z" />
                    </svg>
                  </span>
                  <a
                    href={`https://wa.me/${waTarget}?text=${encodeURIComponent(settings.whatsappMessage || "Hare Krishna!")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#128C7E] font-bold hover:underline"
                  >
                    +{settings.whatsappNumber} (WhatsApp)
                  </a>
                </div>
              )}
            </div>
            {/* Dynamic Map */}
            <iframe
              title="ISKCON Juhu map"
              className="mt-8 h-64 w-full rounded-2xl border border-black/5 shadow-inner"
              loading="lazy"
              src={mapSrc}
            />
          </div>

          {/* Send Message Form */}
          <form onSubmit={submit} className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-ink">Send Message</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {["name", "email", "phone", "subject"].map((field) => (
                <input
                  key={field}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required={field === "name" || field === "email"}
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  placeholder={field === "phone" ? "Phone Number" : field[0].toUpperCase() + field.slice(1)}
                  className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary"
                />
              ))}
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                placeholder="Message"
                rows="6"
                className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary md:col-span-2"
              />
            </div>
            <button
              disabled={busy}
              className="mt-5 rounded-full bg-primary px-7 py-3 text-sm font-black text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "Sending..." : "Submit"}
            </button>
            {notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}
          </form>
        </div>
      </section>
    </>
  );
};

export const BlogListPage = ({ video = false }) => {
  const [params, setParams] = useSearchParams();
  const fallback = video ? fallbackVideoBlogs : fallbackBlogs;
  const { items } = useList(`/${video ? "video-blogs" : "blogs"}?${params.toString()}`, fallback);
  return (
    <>
      <SEO title={video ? "Video Blogs" : "Blog Articles"} />
      <PageBanner title={video ? "Video Blogs" : "Blog Articles"} subtitle={video ? "Watch short spiritual learning videos." : "Read reflections on spiritual learning and student excellence."} image={video ? images.class : images.books} />
      <section className="relative overflow-hidden bg-[#FBF8F1]">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-8 lg:px-10 lg:py-[72px]">
          <div className="mb-9 max-w-[520px]">
            <label className="sr-only" htmlFor="blog-search">Search</label>
            <input
              id="blog-search"
              value={params.get("search") || ""}
              onChange={(event) => setParams(event.target.value ? { search: event.target.value } : {})}
              placeholder={video ? "Search video blogs" : "Search articles"}
              className="h-12 w-full rounded-full border-[1.5px] border-[rgba(150,110,70,0.22)] bg-white px-5 font-ui text-[14px] text-[#171513] outline-none transition-colors placeholder:text-[#A29A91] focus:border-[#C84E2C]"
            />
          </div>

          {items.length === 0 ? (
            <p className="font-ui text-[15px] text-[#766D64]">Nothing found. Try a different search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-[1100px]:grid-cols-3 lg:gap-7">
              {items.map((item) => video ? <VideoBlogTile key={item._id} video={item} /> : <BlogTile key={item._id} blog={item} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export const BlogDetailPage = ({ video = false }) => {
  const { slug } = useParams();
  const fallback = (video ? fallbackVideoBlogs : fallbackBlogs).find((item) => item.slug === slug) || (video ? fallbackVideoBlogs[0] : fallbackBlogs[0]);
  const { item } = useSingle(`/${video ? "video-blogs" : "blogs"}/${slug}`, fallback, video ? "videoBlog" : "blog");

  return (
    <>
      <SEO title={item.seoTitle || item.title} description={item.seoDescription || item.shortDescription} />
      <PageBanner title={item.title} subtitle={item.shortDescription} image={video ? (item.posterUrl || item.thumbnail || images.class) : (item.image || images.books)} />
      
      <section className="bg-[#FFFDF8]">
        <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 lg:py-[72px]">
          {/* Back Navigation at the top */}
          <div className="mb-8">
            <Link
              to={video ? "/video-blogs" : "/blogs"}
              className="group inline-flex items-center gap-1.5 font-ui text-[13.5px] font-semibold text-[#766D64] transition-colors hover:text-[#C84E2C]"
            >
              <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-0.5" /> Back to {video ? "Video Blogs" : "Blog Articles"}
            </Link>
          </div>

          {/* Media / Video Player Wrapper */}
          {video ? (
            <div className="mb-8 overflow-hidden rounded-2xl bg-black shadow-premium">
              <VideoPlayer url={item.videoUrl} uploadedVideo={item.uploadedVideo} videoType={item.videoType} title={item.title} />
            </div>
          ) : (
            <img
              src={assetUrl(item.image)}
              alt={item.title}
              className="mb-9 h-[300px] w-full rounded-[14px] object-cover shadow-[0_10px_34px_rgba(70,45,25,0.10)] sm:h-96"
            />
          )}

          {/* Metadata Bar */}
          <div className="mb-9 flex flex-wrap items-center gap-4 border-b border-[rgba(150,110,70,0.16)] pb-5">
            <span className="rounded-md bg-[#C84E2C]/[0.08] px-2.5 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.08em] text-[#B94728]">
              {item.category || (video ? "Video Lecture" : "Wisdom")}
            </span>
            {item.createdAt && (
              <span className="flex items-center gap-1.5 font-ui text-[12.5px] font-semibold text-[#766D64]">
                <Calendar size={14} className="text-[#C99A5B]" />
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            )}
            {!video && item.readTime && (
              <span className="flex items-center gap-1.5 font-ui text-[12.5px] font-semibold text-[#766D64]">
                <Clock size={14} className="text-[#C99A5B]" />
                {item.readTime} min read
              </span>
            )}
            {video && item.duration && (
              <span className="flex items-center gap-1.5 font-ui text-[12.5px] font-semibold text-[#766D64]">
                <Clock size={14} className="text-[#C99A5B]" />
                {item.duration}
              </span>
            )}
          </div>

          {/* Description Content */}
          <div className="blog-prose font-ui text-[16.5px] leading-[1.75] text-[#4F4842]">
            <div dangerouslySetInnerHTML={{ __html: item.content || item.description }} />
          </div>

          {item.listItems?.length > 0 && (
            <ul className="mt-9 grid gap-3 rounded-[14px] border border-[rgba(150,110,70,0.14)] bg-[#FBF8F1] p-6">
              {item.listItems.map((li) => (
                <li key={li} className="flex gap-2.5 font-ui text-[15px] font-semibold text-[#2E2822]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#C99A5B]" size={18} />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Bottom Back Navigation */}
          <div className="mt-12 border-t border-[rgba(150,110,70,0.16)] pt-7">
            <Link
              to={video ? "/video-blogs" : "/blogs"}
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#C84E2C] px-6 py-2.5 font-ui text-[13.5px] font-semibold text-[#C84E2C] transition-colors duration-300 hover:bg-[#C84E2C]/[0.07]"
            >
              <ChevronLeft size={16} /> Back to {video ? "Video Blogs" : "Blog Articles"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export const VisionariesPage = () => {
  const { items } = useList("/visionaries", fallbackPreachers);
  return (
    <>
      <SEO title="Visionaries" />
      <PageBanner title="Temple Visionaries" subtitle="Distinguished founders and team members guiding the community with devotion." image={images.devotion} />
      <section className="section-pad bg-soft">
        <div className="container-pad grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((visionary) => (
            <VisionaryCard key={visionary._id} visionary={visionary} />
          ))}
        </div>
      </section>
    </>
  );
};

export const VisionaryDetailPage = () => {
  const { slug } = useParams();
  const { item, loading } = useSingle(`/visionaries/${slug}`, null, "visionary");

  if (!item) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {loading ? <div className="text-xl font-bold text-muted animate-pulse">Loading details...</div> : <div className="text-xl font-bold text-muted">Visionary not found</div>}
      </div>
    );
  }

  return (
    <>
      <SEO title={item.name} />
      <PageBanner title={item.name} subtitle={item.designation} image={item.image} />
      <section className="section-pad bg-white">
        <div className="container-pad grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm ${
                item.type === "Founder" ? "bg-primary" : "bg-ink"
              }`}>
                {item.type || "Team Member"}
              </span>
              {item.experience && (
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                  {item.experience} experience
                </span>
              )}
            </div>
            <div className="prose mt-6 max-w-none">
              <p>{item.fullBio}</p>
            </div>
            <h2 className="mt-8 text-2xl font-black">Specialization</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.specialization?.map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                  {tag}
                </span>
              ))}
            </div>
            {item.courses?.length > 0 && (
              <>
                <h2 className="mt-8 text-2xl font-black">Courses Taught</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {item.courses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <img src={assetUrl(item.image)} alt={item.name} className="h-[460px] w-full rounded-2xl object-cover shadow-premium" />
          </div>
        </div>
      </section>
    </>
  );
};

export const GalleryPage = ({ videos = false }) => {
  const { items } = useList(`/gallery/${videos ? "videos" : "images"}`, videos ? fallbackGalleryVideos : fallbackGalleryImages);
  return <><SEO title={videos ? "Video Gallery" : "Image Gallery"} /><PageBanner title={videos ? "Video Gallery" : "Image Gallery"} subtitle="Glimpses of temple, festivals, and Self-Excellence activities." image={images.festival} /><section className="section-pad bg-soft"><div className="container-pad grid gap-8 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => videos ? <div key={item._id} className="overflow-hidden rounded-2xl bg-white shadow-premium"><div className="relative"><img src={assetUrl(item.thumbnail)} alt={item.title} className="h-64 w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><Video size={42} /></span></div><div className="p-5"><h3 className="font-black">{item.title}</h3><p className="text-sm text-muted">{item.description}</p></div></div> : <div key={item._id} className="overflow-hidden rounded-2xl bg-white shadow-premium"><img src={assetUrl(item.image)} alt={item.title} className="h-64 w-full object-cover" /><div className="p-5"><h3 className="font-black">{item.title}</h3><p className="text-sm text-muted">{item.category}</p></div></div>)}</div></section></>;
};

export const LegalPage = ({ slug, title }) => {
  const { item } = useSingle(`/legal/${slug}`, { title, content: "<p>This legal page can be edited from the admin dashboard.</p>" }, "legalPage");
  return <><SEO title={item.title} /><PageBanner title={item.title} image={images.books} /><section className="section-pad bg-white"><div className="container-pad prose max-w-4xl" dangerouslySetInnerHTML={{ __html: item.content }} /></section></>;
};

export const SitemapPage = () => {
  const courseItems = useList("/courses?limit=100", []).items;
  const classItems = useList("/upcoming-classes?limit=100", []).items;
  const bookItems = useList("/books?limit=100", []).items;
  const journeyItems = useList("/journeys/upcoming?limit=100", []).items;
  const blogItems = useList("/blogs?limit=100", fallbackBlogs).items;
  const videoItems = useList("/video-blogs?limit=100", []).items;
  const visionaryItems = useList("/visionaries?limit=100", fallbackPreachers).items;

  const groups = [
    {
      title: "Core Hubs",
      links: [
        ["Home Page", "/"],
        ["About ISKCON Juhu", "/about"],
        ["All Courses", "/courses"],
        ["Sunday Classes", "/classes"],
        ["Book Store", "/books"],
        ["Sacred Journeys", "/trips"],
        ["Wisdom Blogs", "/blogs"],
        ["Video Lectures", "/video-blogs"],
        ["Preachers & Mentors", "/visionaries"],
        ["Contact Us", "/contact"]
      ]
    },
    {
      title: "Self-Excellence Courses",
      links: courseItems.filter((c) => c.slug).map((item) => [item.title, `/courses/${item.slug}`])
    },
    {
      title: "Sunday Youth Classes",
      links: classItems.filter((cl) => cl.slug).map((item) => [item.title, `/classes/${item.slug}`])
    },
    {
      title: "Spiritual Books",
      links: bookItems.filter((b) => b.slug).map((item) => [item.title, `/books/${item.slug}`])
    },
    {
      title: "Sacred Journeys & Yatras",
      links: journeyItems.filter((j) => j.slug).map((item) => [item.title, `/journeys/${item.slug}`])
    },
    {
      title: "Wisdom Blogs",
      links: blogItems.filter((b) => b.slug).map((item) => [item.title, `/blogs/${item.slug}`])
    },
    {
      title: "Video Discourses",
      links: videoItems.filter((v) => v.slug).map((item) => [item.title, `/video-blogs/${item.slug}`])
    },
    {
      title: "Preachers & Mentors",
      links: visionaryItems.filter((p) => p.slug).map((item) => [item.name || item.title, `/visionaries/${item.slug}`])
    },
    {
      title: "Media & Highlights",
      links: [
        ["Sacred Image Gallery", "/gallery/images"],
        ["Video Gallery", "/gallery/videos"]
      ]
    },
    {
      title: "Legal & Governance",
      links: [
        ["Privacy Policy", "/privacy-policy"],
        ["Terms and Conditions", "/terms-and-conditions"]
      ]
    }
  ];

  return (
    <>
      <SEO
        title="Sitemap & AI Index | ISKCON Juhu Self-Excellence"
        description="Dynamic directory and XML sitemap for search engines, ChatGPT, and seekers. Direct URLs for courses, Sunday classes, books, yatras, and blogs."
      />
      <PageBanner
        title="Sitemap & AI Directory"
        subtitle="Complete live directory of courses, Sunday classes, sacred journeys, publications, and wisdom blogs."
        image={images.learning}
      />

      <section className="section-pad bg-soft">
        <div className="container-pad space-y-8">
          {/* Machine & AI Discovery Bar */}
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                Real-Time Feeds
              </span>
              <h2 className="mt-1 text-lg font-black text-ink">Search Engine & AI Discovery Channels</h2>
              <p className="text-xs text-muted">
                Dynamically refreshed on every publish or delete. Fully compliant with Google XML Sitemap, robots.txt, and the Open LLMs Standard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#C1121F] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#9B0D18] transition"
              >
                <span>sitemap.xml</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-soft transition"
              >
                <span>robots.txt</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="/llms.txt"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-soft transition"
              >
                <span>llms.txt (AI Index)</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              if (!group.links || group.links.length === 0) return null;
              return (
                <div key={group.title} className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-black/5 pb-3 mb-3">
                      <h3 className="text-base font-black text-ink">{group.title}</h3>
                      <span className="text-[10px] font-bold text-muted bg-soft px-2 py-0.5 rounded-full">
                        {group.links.length} {group.links.length === 1 ? "page" : "pages"}
                      </span>
                    </div>
                    <ul className="grid gap-2">
                      {group.links.map(([label, url]) => (
                        <li key={url}>
                          <Link
                            to={url}
                            className="text-xs font-bold text-muted hover:text-primary transition inline-flex items-center gap-1.5"
                          >
                            <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                            <span className="truncate">{label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export const AuthPage = ({ register = false, admin = false, teacher = false }) => {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialEmail = searchParams.get("email") || "";
  const redirectUrl = searchParams.get("redirect") || "";

  const [form, setForm] = useState({ name: "", email: initialEmail, phone: "", role: "student", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialEmail && !form.email) {
      setForm((prev) => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (register) {
        const data = await registerUser(form);
        if (data.requiresVerification) {
          navigate(`/verify-otp?email=${encodeURIComponent(data.email || form.email)}${data.devOtp ? `&devOtp=${data.devOtp}` : ""}`);
          return;
        }
        const user = data.user;
        navigate(redirectUrl || homeFor(user.role));
        return;
      }
      const passwordToSend = (admin || teacher) ? form.password : "";
      const user = await login(form.email, passwordToSend);
      navigate(redirectUrl || homeFor(user.role));
    } catch (err) {
      if (!admin && !teacher && (err.notFound || err.status === 404 || err.message?.toLowerCase().includes("not registered") || err.message?.toLowerCase().includes("not found"))) {
        navigate(`/register?email=${encodeURIComponent(form.email)}`);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={register ? "Register" : admin ? "Admin Login" : teacher ? "Teacher Login" : "Login"} />
      <section className="grid min-h-screen place-items-center bg-soft px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-premium sm:p-8">
          <div className="mb-8">
            <BrandLogo />
          </div>
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-primary">
            {admin ? "Admin Panel" : teacher ? "Teacher Panel" : "Student LMS"}
          </p>
          <h1 className="text-3xl font-black">
            {register ? "Create Student Account" : admin ? "Admin Login" : teacher ? "Teacher Login" : "Login"}
          </h1>
          {admin && (
            <p className="mt-3 rounded-xl bg-soft border border-black/10 p-3 text-sm font-bold text-ink">
              Use admin email and password to open the admin panel.
            </p>
          )}
          <div className="mt-6 grid gap-4">
            {register && (
              <>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Full name" className="h-12 rounded-xl border border-black/10 px-4 text-[16px] outline-none focus:border-primary" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="Mobile number" className="h-12 rounded-xl border border-black/10 px-4 text-[16px] outline-none focus:border-primary" />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-12 rounded-xl border border-black/10 px-4 text-[15px] outline-none focus:border-primary">
                  <option value="student">Student</option>
                  <option value="devotee">Devotee</option>
                  <option value="user">User</option>
                </select>
              </>
            )}
            <input value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }} required type="email" autoComplete="email" placeholder="Email" className="h-12 rounded-xl border border-black/10 px-4 text-[16px] outline-none focus:border-primary" />
            
            {(admin || teacher || register) && (
              <div className="relative flex items-center">
                <input value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }} required={admin || teacher} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={register ? "Password (optional)" : "Password"} className="h-12 w-full rounded-xl border border-black/10 pl-4 pr-12 text-[16px] outline-none focus:border-primary" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-muted hover:text-primary transition" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {register && form.password && (
              <div className="relative flex items-center">
                <input value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required={Boolean(form.password)} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" className="h-12 w-full rounded-xl border border-black/10 pl-4 pr-12 text-[16px] outline-none focus:border-primary" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 text-muted hover:text-primary transition" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}
          </div>
          <button disabled={loading} className="mt-6 h-12 w-full rounded-full bg-primary px-6 text-sm font-black text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
            {loading ? "Signing in..." : register ? "Register" : admin ? "Open Admin Panel" : teacher ? "Open Teacher Panel" : "Login"}
          </button>
          {error && <p className="mt-4 text-sm font-bold text-primary">{error}</p>}

          {/* Students sign in with Google or email; the admin and
              teacher panels stay password-only. Renders nothing until a
              client id is configured on the server. */}
          {!admin && !teacher && (
            <GoogleSignIn
              label={register ? "signup_with" : "signin_with"}
              onSignedIn={(user) => navigate(homeFor(user.role))}
            />
          )}

          {/* The alternative account action reads as a sentence on its
              own line; the utility links sit below as one centred row.
              These were four links under justify-between, which at phone
              width split into a ragged two-then-one-then-one stack. */}
          <div className="mt-6 space-y-4 text-center">
            {!admin && !teacher && (
              <p className="font-ui text-sm text-muted">
                {register ? "Already have an account?" : "New here?"}{" "}
                <Link className="font-black text-primary hover:underline" to={register ? "/login" : "/register"}>
                  {register ? "Login" : "Create an account"}
                </Link>
              </p>
            )}

            {/* No separator characters: when the row wraps, one is left
                dangling at the end of the line. Spacing carries it. */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
              <Link className="font-bold text-primary hover:underline" to="/">Back to Website</Link>
              {!register && (admin || teacher) && (
                <>
                  <Link className="font-bold text-primary hover:underline" to="/forgot-password">Forgot password</Link>
                  <Link className="font-bold text-primary hover:underline" to="/request-password-reset">Admin reset</Link>
                </>
              )}
            </div>
          </div>
        </form>
      </section>
    </>
  );
};

export const VerifyOtpPage = () => {
  const [params] = useSearchParams();
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: params.get("email") || "", otp: params.get("devOtp") || "" });
  const [notice, setNotice] = useState(params.get("devOtp") ? `Development OTP filled: ${params.get("devOtp")}` : "");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const user = await verifyOtp({ ...form, purpose: "register" });
      navigate(homeFor(user.role));
    } catch (error) {
      setNotice(error.message);
    }
  };
  const resend = async () => {
    const data = await resendOtp({ email: form.email, purpose: "register" });
    setNotice(data.devOtp ? `OTP resent. Development OTP: ${data.devOtp}` : data.message);
  };
  return <AuthShell title="Verify Email OTP" subtitle="Enter the OTP sent to your email."><form onSubmit={submit} className="grid gap-4"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required placeholder="Email" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><input value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} required placeholder="6 digit OTP" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><button className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Verify Account</button><button type="button" onClick={resend} className="rounded-full border border-black/10 px-6 py-3 text-sm font-black text-ink">Resend OTP</button>{notice && <p className="text-sm font-bold text-primary">{notice}</p>}</form></AuthShell>;
};

export const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState("email");
  const [form, setForm] = useState({ email: "", otp: "", password: "", confirmPassword: "" });
  const [notice, setNotice] = useState("");
  const submitEmail = async (event) => {
    event.preventDefault();
    try {
      const data = await forgotPassword({ email: form.email });
      setNotice(data.devOtp ? `OTP sent. Development OTP: ${data.devOtp}` : data.message);
      if (data.devOtp) setForm((old) => ({ ...old, otp: data.devOtp }));
      setStep("reset");
    } catch (error) {
      setNotice(error.message);
    }
  };
  const submitReset = async (event) => {
    event.preventDefault();
    try {
      await resetPassword(form);
      setNotice("Password updated. You can login now.");
      setStep("done");
    } catch (error) {
      setNotice(error.message);
    }
  };
  return <AuthShell title="Forgot Password" subtitle="Reset by email OTP or request help from admin.">{step === "email" ? <form onSubmit={submitEmail} className="grid gap-4"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" placeholder="Registered email" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><button className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Send OTP</button><Link to="/request-password-reset" className="text-center text-sm font-black text-primary">Request admin to change password</Link></form> : step === "reset" ? <form onSubmit={submitReset} className="grid gap-4"><input value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} required placeholder="OTP" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required type="password" placeholder="New password" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><input value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required type="password" placeholder="Confirm new password" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><button className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Reset Password</button></form> : <Link to="/login" className="block rounded-full bg-primary px-6 py-3 text-center text-sm font-black text-white">Go to Login</Link>}{notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}</AuthShell>;
};

export const RequestPasswordResetPage = () => {
  const { requestAdminPasswordReset } = useAuth();
  const [form, setForm] = useState({ email: "", message: "" });
  const [notice, setNotice] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const data = await requestAdminPasswordReset(form);
      setNotice(data.message);
      setForm({ email: "", message: "" });
    } catch (error) {
      setNotice(error.message);
    }
  };
  return <AuthShell title="Admin Password Help" subtitle="Send a reset request to the admin panel."><form onSubmit={submit} className="grid gap-4"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" placeholder="Registered email" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows="4" placeholder="Reason or message" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" /><button className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Send Request</button>{notice && <p className="text-sm font-bold text-primary">{notice}</p>}</form></AuthShell>;
};

const AuthShell = ({ title, subtitle, children }) => (
  <><SEO title={title} /><section className="grid min-h-screen place-items-center bg-soft px-4 py-12"><div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-premium"><div className="mb-8"><BrandLogo /></div><p className="mb-2 text-sm font-black uppercase tracking-wide text-primary">Secure Account</p><h1 className="text-3xl font-black">{title}</h1>{subtitle && <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>}<div className="mt-6">{children}</div><div className="mt-5 flex flex-wrap justify-between gap-3 text-sm"><Link className="font-black text-primary" to="/login">Login</Link><Link className="font-black text-primary" to="/">Back to Website</Link></div></div></section></>
);

export const StudentDashboard = () => {
  const { item: dashboard } = useSingle("/student/dashboard", { totalEnrolledCourses: 0, completedCourses: 0, inProgressCourses: 0, certificatesEarned: 0, courses: [] }, "dashboard");
  const { item: analytics } = useSingle("/student/dashboard/analytics", { weeklyActivity: [], weeklyMinutes: 0 }, "analytics");
  const [params] = useSearchParams();

  return (
    <>
      <SEO title="Student Dashboard" />
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Enrolled" value={dashboard.totalEnrolledCourses} icon={BookOpen} />
        <StatCard label="Completed" value={dashboard.completedCourses} icon={CheckCircle2} />
        <StatCard label="In Progress" value={dashboard.inProgressCourses} icon={Clock} />
        <StatCard label="Certificates" value={dashboard.certificatesEarned} icon={FileText} />
      </div>

      {params.get("profile") ? (
        <ProfilePasswordPanel />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-black/5">
            <div className="border-b border-black/5 pb-4 mb-4">
              <h2 className="text-2xl font-black text-ink">Continue Learning</h2>
              <p className="text-sm text-muted">Pick up exactly where you left off</p>
            </div>
            
            <div className="grid gap-5">
              {dashboard.courses?.map((item) => (
                <CourseProgressCard key={item._id} item={item} />
              ))}
              {dashboard.courses?.length === 0 && (
                <EmptyState title="No learning activity yet" subtitle="Enroll in a course to see your progress here." />
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-ink">Study Time</h2>
              <p className="text-sm text-muted mb-4">Your active learning minutes this week</p>
              
              <div className="mt-2 bg-soft rounded-xl p-3 border border-black/5">
                <ProgressChart data={analytics.weeklyActivity} />
              </div>
            </div>
            
            <div className="mt-6 border-t border-black/5 pt-4 flex items-center justify-between">
              <span className="text-sm font-bold text-muted">Weekly Goal Progress</span>
              <span className="text-sm font-black text-primary">{Math.min(100, Math.round((analytics.weeklyMinutes / 120) * 100))}%</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ============================================================
   My Bookings — devotee view of their pilgrimage bookings
   ------------------------------------------------------------
   Read-only. The amounts shown are the snapshot stored on the
   booking, so a later price or tax change never rewrites what
   somebody was quoted.
   ============================================================ */

const BOOKING_BADGE = {
  pending: { label: "Awaiting confirmation", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Declined", cls: "bg-rose-100 text-rose-800" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-700" }
};

export const StudentBookingsPage = () => {
  const { items: bookings, loading } = useList("/pilgrimage-bookings/my-bookings", []);
  const [open, setOpen] = useState(null);

  return (
    <>
      <SEO title="My Bookings" />
      <div className="mb-6 border-b border-black/5 pb-4">
        <h1 className="text-3xl font-black">My Bookings</h1>
        <p className="mt-1 text-sm text-muted">Your pilgrimage bookings and their confirmation status.</p>
      </div>

      {loading && <p className="text-sm text-muted">Loading your bookings...</p>}

      {!loading && bookings.length === 0 && (
        <EmptyState
          title="No bookings yet"
          subtitle="When you book a pilgrimage from the homepage it will appear here with its confirmation status."
        />
      )}

      <div className="grid gap-4">
        {bookings.map((b) => {
          const badge = BOOKING_BADGE[b.status] || BOOKING_BADGE.pending;
          const expanded = open === b._id;
          return (
            <div key={b._id} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  {b.pilgrimage?.image ? (
                    <img src={assetUrl(b.pilgrimage.image)} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-soft text-primary">
                      <ImageIcon size={20} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-ink">{b.pilgrimage?.title || "Pilgrimage"}</h2>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-primary">{b.bookingRef}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {b.travellerCount} traveller{b.travellerCount > 1 ? "s" : ""} &middot; booked {new Date(b.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-black text-ink">{money(b.totalAmount)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setOpen(expanded ? null : b._id)}
                    className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-black text-ink transition hover:border-primary hover:text-primary"
                  >
                    {expanded ? "Hide" : "Details"}
                  </button>
                </div>
              </div>

              {b.status === "rejected" && b.rejectionReason && (
                <p className="border-t border-black/5 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-800">
                  Declined: {b.rejectionReason}
                </p>
              )}

              {expanded && (
                <div className="grid gap-5 border-t border-black/5 bg-soft/20 p-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-muted">Travellers</p>
                    <ul className="grid gap-1.5">
                      {(b.travellers || []).map((t, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                          <span className="font-bold text-ink">{i + 1}. {t.name}</span>
                          <span className="text-xs text-muted">{t.age ? `${t.age} yrs` : ""}{t.gender ? ` \u00b7 ${t.gender}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-muted">Amount</p>
                    <dl className="grid gap-1.5 rounded-lg bg-white px-3 py-2.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted">{money(b.pricePerPerson)} &times; {b.travellerCount}</dt>
                        <dd className="font-bold text-ink">{money(b.subtotal)}</dd>
                      </div>
                      {(b.taxBreakdown || []).map((t, i) => (
                        <div key={i} className="flex justify-between">
                          <dt className="text-muted">{t.label}{t.type === "percent" ? ` (${t.value}%)` : ""}</dt>
                          <dd className="font-bold text-ink">{money(t.amount)}</dd>
                        </div>
                      ))}
                      <div className="mt-0.5 flex justify-between border-t border-black/10 pt-2">
                        <dt className="font-black text-ink">Total</dt>
                        <dd className="font-black text-primary">{money(b.totalAmount)}</dd>
                      </div>
                    </dl>

                    {b.paymentPhotoUrl && (
                      <a
                        href={assetUrl(b.paymentPhotoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-primary underline"
                      >
                        <FileText size={13} /> View payment receipt
                      </a>
                    )}
                  </div>

                  {b.message && (
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-muted">Your note</p>
                      <p className="whitespace-pre-line rounded-lg bg-white px-3 py-2.5 text-sm text-ink">{b.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export const StudentCoursesPage = () => {
  const { items: enrolledCourses } = useList("/student/my-courses", []);
  const { items: requests } = useList("/course-requests/my-requests", []);
  const [activeTab, setActiveTab] = useState("enrolled");

  return (
    <>
      <SEO title="My Learning Space" />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-4">
        <div>
          <h1 className="text-3xl font-black">My Learning Space</h1>
          <p className="mt-1 text-sm text-muted">Access your enrolled courses and check status of verification submissions.</p>
        </div>
        <div className="flex rounded-full bg-soft p-1 self-start">
          <button
            onClick={() => setActiveTab("enrolled")}
            className={`rounded-full px-5 py-2 text-xs font-black transition ${
              activeTab === "enrolled" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Active Courses ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`rounded-full px-5 py-2 text-xs font-black transition ${
              activeTab === "requests" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Verification Requests ({requests.length})
          </button>
        </div>
      </div>

      {activeTab === "enrolled" ? (
        <div className="grid gap-5">
          {enrolledCourses.map((item) => (
            <CourseProgressCard key={item._id} item={item} />
          ))}
          {enrolledCourses.length === 0 && (
            <EmptyState
              title="No enrolled courses yet"
              subtitle="Browse courses on our catalog and enroll to start your learning journey."
            />
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req._id} className="rounded-2xl bg-white p-5 shadow-sm border border-black/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:border-black/10 transition">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {req.course?.category || "Course Request"}
                </span>
                <h3 className="text-lg font-black text-ink mt-1">{req.course?.title || "Unknown Course"}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-bold">
                  <span>Submitted: {new Date(req.submittedAt || req.createdAt).toLocaleDateString()}</span>
                  <span>Document: {req.requiredDocumentName || "Attachment"}</span>
                </div>
                {req.status === "rejected" && req.rejectionReason && (
                  <div className="mt-3 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800 leading-normal">
                    <strong className="block uppercase tracking-wider text-[10px] mb-0.5">Rejection Feedback:</strong>
                    {req.rejectionReason}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                  req.status === "approved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  req.status === "rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                  "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {req.status === "pending" && <Clock size={12} className="animate-spin-slow" />}
                  {req.status}
                </span>
                <Link
                  to={`/courses/${req.course?.slug}`}
                  className="rounded-full bg-soft hover:bg-black/10 px-4 py-2 text-xs font-black text-ink transition"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <EmptyState
              title="No verification requests"
              subtitle="You haven't submitted any document verification requests yet."
            />
          )}
        </div>
      )}
    </>
  );
};

export const StudentNotesPage = () => {
  const { items } = useList("/me/notes", []);
  return <><SEO title="My Notes" /><div className="mb-6"><h1 className="text-3xl font-black">My Notes</h1><p className="mt-1 text-sm text-muted">All private notes saved lesson-wise with video timestamps.</p></div><div className="grid gap-4">{items.map((note) => <Link key={note._id} to={`/learn/${note.course?.slug}/${note.lesson?.slug}`} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-primary">{note.course?.title} · {formatTime(note.timestamp)}</p><h2 className="mt-2 text-xl font-black">{note.title || note.lesson?.title || "Lesson note"}</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{note.content}</p></Link>)}{items.length === 0 && <EmptyState title="No notes yet" subtitle="Notes created from lesson pages will appear here." />}</div></>;
};

export const NotificationsPage = () => {
  const { items, setItems } = useList("/notifications", []);

  useEffect(() => {
    apiFetch("/notifications/mark-all-read", { method: "PATCH" })
      .then(() => {
        window.dispatchEvent(new Event("notifications_read"));
      })
      .catch(() => {});
  }, []);

  const markRead = async (id) => {
    const data = await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
    setItems((old) => old.map((item) => item._id === id ? data.item : item));
    window.dispatchEvent(new Event("notifications_read"));
  };

  return (
    <>
      <SEO title="Notifications" />
      <div className="mb-6">
        <h1 className="text-3xl font-black">Notifications</h1>
        <p className="mt-1 text-sm text-muted">
          Account, course, password, comment, and announcement updates.
        </p>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item._id}
            className={`rounded-2xl p-5 shadow-sm transition-all duration-300 ${
              item.read
                ? "bg-white opacity-75 border border-black/5"
                : "bg-primary/5 border border-primary/20"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={`text-xs font-black uppercase tracking-wide ${item.read ? "text-muted" : "text-primary"}`}>
                  {item.type}
                </p>
                <h2 className={`mt-1 text-lg font-black ${item.read ? "text-ink/80" : "text-ink"}`}>
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{item.message}</p>
              </div>
              {!item.read && (
                <button
                  onClick={() => markRead(item._id)}
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-black hover:bg-soft transition shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
            {item.link && (
              <Link
                to={item.link}
                className="mt-3 inline-flex text-sm font-black text-primary hover:underline"
              >
                Open
              </Link>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <EmptyState title="No notifications" subtitle="You are all caught up." />
        )}
      </div>
    </>
  );
};

const ProfilePasswordPanel = () => {
  const { user, changePassword, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", mobile: user?.mobile || user?.phone || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassMap, setShowPassMap] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [notice, setNotice] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(profile);
      setNotice("Profile updated.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    try {
      await changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice("Password changed successfully.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Profile</h2>
        <div className="mt-5 grid gap-4">
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3" placeholder="Full name" />
          <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3" placeholder="Email address" />
          <input value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3" placeholder="Mobile number" />
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Save Profile</button>
        </div>
      </form>
      
      <form onSubmit={savePassword} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Change Password</h2>
        <div className="mt-5 grid gap-4">
          {["currentPassword", "newPassword", "confirmPassword"].map((field) => (
            <div key={field} className="relative flex items-center">
              <input
                value={passwords[field]}
                onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                type={showPassMap[field] ? "text" : "password"}
                required
                className="w-full rounded-xl border border-black/10 pl-4 pr-12 py-3 outline-none"
                placeholder={fieldLabel(field)}
              />
              <button
                type="button"
                onClick={() => setShowPassMap((prev) => ({ ...prev, [field]: !prev[field] }))}
                className="absolute right-4 text-muted hover:text-primary transition"
                aria-label={showPassMap[field] ? "Hide password" : "Show password"}
              >
                {showPassMap[field] ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          ))}
          <button className="rounded-full bg-ink px-6 py-3 text-sm font-black text-white">Update Password</button>
        </div>
      </form>
      
      {notice && <p className="lg:col-span-2 rounded-xl bg-primary/10 p-3 text-sm font-bold text-primary">{notice}</p>}
    </div>
  );
};

const CourseProgressCard = ({ item }) => {
  const course = item.course || item;
  return <div className="grid gap-5 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-[180px_1fr_auto] md:items-center"><img src={assetUrl(course.thumbnail)} alt={course.title} className="h-36 w-full rounded-xl object-cover" /><div><h3 className="text-xl font-black">{course.title}</h3><p className="mt-1 text-sm text-muted">{course.teacher?.name}</p><div className="mt-4"><ProgressBar percent={item.progress?.percent || 0} label={`${item.progress?.completedLessons || 0} of ${item.progress?.totalLessons || 0} lessons completed`} /></div></div><Link to={`/courses/${course.slug}`} className="rounded-full bg-primary px-5 py-2 text-center text-sm font-black text-white">Continue</Link></div>;
};

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: {
      totalCourses: 0,
      totalStudents: 0,
      pendingChats: 0,
      pendingComments: 0,
      averageReplyTime: 12,
      studentRating: 4.8
    }
  });

  useEffect(() => {
    apiFetch("/teacher/dashboard").then(res => {
      if (res.success) setData(res);
    });
  }, []);

  const stats = data.stats || {};

  return (
    <>
      <SEO title="Teacher Dashboard" />
      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between border border-black/5">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-primary">Preacher Workspace</p>
          <h1 className="mt-1 text-3xl font-black text-ink">Spiritual Mentorship Dashboard</h1>
        </div>
        {user?.role === "main_admin" && (
          <Link to="/admin" className="rounded-full bg-ink px-6 py-2.5 text-center text-sm font-black text-white hover:opacity-90">
            Back to Admin Control
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Assigned Courses" value={stats.totalCourses} icon={BookOpen} />
        <StatCard label="Total Devotees Enrolled" value={stats.totalStudents} icon={Users} />
        <StatCard label="Pending Live Chats" value={stats.pendingChats} icon={MessageSquare} />
        <StatCard label="Unanswered Doubts" value={stats.pendingComments} icon={Shield} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Performance Insights</h2>
            <p className="text-xs text-muted mt-1">Real-time devotee assistance analytics</p>
            
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center p-4 bg-soft/50 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-ink">Response Time Speed</h4>
                  <p className="text-xs text-muted mt-0.5">Average wait duration</p>
                </div>
                <span className="text-lg font-black text-primary">{stats.averageReplyTime} mins</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-soft/50 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-ink">Student Doubts Rating</h4>
                  <p className="text-xs text-muted mt-0.5">Sourced from weekly reviews</p>
                </div>
                <span className="text-lg font-black text-green-600">★ {stats.studentRating} / 5</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/teacher/chat" className="rounded-full bg-primary px-5 py-2 text-xs font-black text-white shadow-lg shadow-primary/20 hover:opacity-95">
              Launch Live Chat
            </Link>
            <Link to="/teacher/comments" className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft">
              Open Doubt Box
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/5">
          <h2 className="text-xl font-black text-ink">Quick Access Utilities</h2>
          <p className="text-xs text-muted mt-1">Useful mentorship tools and shortcuts</p>
          <div className="mt-6 grid gap-3">
            <Link to="/teacher/courses" className="flex items-center gap-3 p-4 rounded-xl border border-black/5 hover:bg-primary/5 transition">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><BookOpen size={20} /></div>
              <div>
                <h4 className="text-sm font-bold text-ink">View Assigned Courses</h4>
                <p className="text-xs text-muted mt-0.5">Browse lessons, outlines, and curriculum details</p>
              </div>
            </Link>
            <Link to="/teacher/student-progress" className="flex items-center gap-3 p-4 rounded-xl border border-black/5 hover:bg-primary/5 transition">
              <div className="p-2.5 rounded-lg bg-green-100 text-green-600"><Users size={20} /></div>
              <div>
                <h4 className="text-sm font-bold text-ink">Student Activity Tracking</h4>
                <p className="text-xs text-muted mt-0.5">Monitor progress, watch time & send study reminders</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export const TeacherCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/teacher/assigned-courses").then(res => {
      if (res.success) setCourses(res.items || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-sm font-bold">Loading courses...</div>;

  return (
    <>
      <SEO title="My Assigned Courses" />
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/5">
        <h2 className="text-2xl font-black text-ink">Assigned Courses</h2>
        <p className="text-sm text-muted mt-1 mb-6">Browse and manage learning outcomes for your assigned devotional courses</p>
        
        {courses.length === 0 ? (
          <div className="p-12 text-center text-muted font-bold">No courses currently assigned.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => (
              <div key={course._id} className="border border-black/5 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between">
                <img src={assetUrl(course.thumbnail)} alt={course.title} className="h-44 w-full object-cover" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-ink">{course.title}</h3>
                    <p className="text-xs text-muted mt-1.5 line-clamp-2">{course.description?.replace(/<[^>]*>/g, "")}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-black/5 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-primary px-3 py-1 bg-primary/10 rounded-full">
                      {course.category || "Gita Gyan"}
                    </span>
                    <Link to={`/courses/${course.slug}`} className="text-xs font-black text-ink hover:text-primary flex items-center gap-1">
                      Preview Course Outlines →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export const TeacherBlogsPage = () => <AdminCrud resource="blogs" title="Teacher Blogs" teacherMode />;

export const TeacherCommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = () => {
    apiFetch("/teacher/comments").then(res => {
      if (res.success) {
        setComments(res.items || []);
        if (res.items?.length > 0 && !selectedComment) {
          setSelectedComment(res.items[0]);
        }
      }
    });
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedComment) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/teacher/comments/${selectedComment._id}/reply`, {
        method: "POST",
        body: { replyText }
      });
      if (res.success) {
        setReplyText("");
        setSelectedComment(null);
        loadComments();
        alert("Doubt reply posted successfully!");
      }
    } catch (err) {
      alert("Failed to submit reply: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Teacher Doubt Box" />
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-3xl bg-white shadow-sm border border-black/5">
        {/* Left Side: Pending Comments */}
        <div className="w-80 flex flex-col border-r border-black/5 bg-soft/10">
          <div className="p-5 border-b border-black/5 bg-white">
            <h2 className="text-xl font-black text-ink">Devotee Doubt Box</h2>
            <p className="text-xs text-muted mt-1">Lesson specific questions & doubts</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-black/5">
            {comments.map((c) => {
              const isActive = selectedComment?._id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelectedComment(c)}
                  className={`p-4 cursor-pointer transition ${isActive ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-soft/20"}`}
                >
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xs font-black text-ink">{c.user?.name || "Devotee"}</h4>
                    <span className="text-[9px] text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{c.text}</p>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${c.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {c.status}
                    </span>
                    <span className="text-[8px] font-semibold text-muted truncate max-w-[150px]">
                      {c.lesson?.title}
                    </span>
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && (
              <div className="text-center py-12 text-muted text-xs">No pending doubts found!</div>
            )}
          </div>
        </div>

        {/* Right Side: Active Comment Resolution Panel */}
        <div className="flex flex-1 flex-col bg-white overflow-y-auto p-6 justify-between">
          {selectedComment ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="border-b border-black/5 pb-4 mb-6">
                  <span className="text-xs font-black uppercase text-primary">Contextual Doubt Reference</span>
                  <h3 className="text-lg font-black text-ink mt-1">Course: {selectedComment.course?.title}</h3>
                  <p className="text-xs text-muted mt-0.5">Lesson: <span className="font-bold">{selectedComment.lesson?.title}</span></p>
                </div>

                <div className="p-5 rounded-2xl bg-soft/30 border border-black/5">
                  <div className="flex items-center gap-3">
                    {selectedComment.user?.profileImage ? (
                      <img src={assetUrl(selectedComment.user.profileImage)} className="h-10 w-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary uppercase">
                        {selectedComment.user?.name?.charAt(0) || "D"}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-black text-ink">{selectedComment.user?.name}</h4>
                      <p className="text-[10px] text-muted">Devotee Learner · {selectedComment.user?.email}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink bg-white p-4 rounded-xl border border-black/5 italic">
                    "{selectedComment.text}"
                  </p>
                </div>

                {selectedComment.adminReply && (
                  <div className="mt-6 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                    <h5 className="text-xs font-black text-primary uppercase">Your Reply</h5>
                    <p className="mt-2 text-sm text-ink">{selectedComment.adminReply}</p>
                    <span className="text-[9px] text-muted block mt-2">Replied on {new Date(selectedComment.adminReplyAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedComment.status === "pending" && (
                <form onSubmit={handleReplySubmit} className="mt-8 border-t border-black/5 pt-6 bg-white">
                  <h4 className="text-sm font-black text-ink mb-3">Post Resolution Reply</h4>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 p-4 text-sm focus:border-primary focus:outline-none"
                    placeholder="Write your spiritual explanation and doubt resolution..."
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-primary px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? "Posting..." : "Send Doubt Answer"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-24 text-muted">
              Select a devotee doubt from the sidebar to view detail and send resolution.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const TeacherChatPage = () => {
  const { user, socket } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = () => {
    apiFetch("/teacher/chats").then((data) => setConversations(data.items || []));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadMessages = (convoId) => {
    apiFetch(`/chats/${convoId}/messages`).then((data) => {
      setMessages(data.items || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      loadConversations();
    });
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (data) => {
      const roomId = data.room?._id || data.room;
      if (roomId === activeConversation?._id) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        apiFetch(`/chats/${roomId}/messages`).catch(() => {});
      } else {
        loadConversations();
      }
    };
    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [socket, activeConversation]);

  const handleSend = async (text, fileUrl = null, fileName = null, fileType = null) => {
    if (!text.trim() && !fileUrl) return;
    if (!activeConversation) return;
    try {
      const payload = {
        text,
        fileUrl,
        fileName,
        fileType
      };
      const tempMsg = {
        _id: Date.now().toString(),
        text,
        fileUrl,
        fileName,
        fileType,
        sender: user,
        createdAt: new Date(),
        status: "sent"
      };
      setMessages((prev) => [...prev, tempMsg]);
      setInputText("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      
      await apiFetch(`/teacher/chats/${activeConversation._id}/reply`, { method: "POST", body: payload });
      loadConversations();
    } catch (e) {
      alert("Failed to send message: " + e.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadRes = await uploadFile(file, "chat");
      const url = uploadRes?.url || uploadRes;
      await handleSend("", url, file.name, file.type);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerEscalation = async () => {
    if (!escalateReason.trim() || !activeConversation) return;
    try {
      const res = await apiFetch(`/teacher/escalate/${activeConversation._id}`, {
        method: "POST",
        body: { reason: escalateReason }
      });
      if (res.success) {
        alert("This doubt has been successfully escalated to Admin Support!");
        setShowEscalate(false);
        setEscalateReason("");
        setActiveConversation(null);
        loadConversations();
      }
    } catch (err) {
      alert("Failed to escalate: " + err.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-3xl bg-white shadow-sm border border-black/5 relative">
      {/* Left Sidebar */}
      <div className="w-80 flex flex-col border-r border-black/5 bg-soft/10">
        <div className="p-5 border-b border-black/5 bg-white">
          <h2 className="text-xl font-black text-ink">Devotee Chats</h2>
          <p className="text-xs text-muted mt-1">Spiritual counseling channels</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {conversations.map((c) => {
            const otherUser = c.participants.find((p) => p._id !== user._id) || c.participants[0] || {};
            const unread = c.unreadCounts?.[user._id] || 0;
            const isActive = activeConversation?._id === c._id;
            return (
              <div
                key={c._id}
                onClick={() => setActiveConversation(c)}
                className={`flex cursor-pointer items-center gap-3 p-4 transition ${isActive ? "bg-primary/5" : "hover:bg-soft/20"}`}
              >
                <div className="relative">
                  {otherUser.profileImage ? (
                    <img src={assetUrl(otherUser.profileImage)} className="h-10 w-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary uppercase">
                      {otherUser.name?.charAt(0) || "D"}
                    </div>
                  )}
                  {otherUser.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h3 className="truncate text-sm font-bold text-ink">{otherUser.name || "Devotee"}</h3>
                    <span className="text-[9px] text-muted">{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="truncate text-xs text-muted flex-1 pr-2">{c.lastMessage || "No messages yet"}</p>
                    {unread > 0 && <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white">{unread}</span>}
                  </div>
                  <p className="text-[10px] text-primary/70 font-semibold truncate mt-1">{c.course?.title ? `Course: ${c.course.title}` : "General question"}</p>
                </div>
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div className="text-center py-12 text-muted text-xs">No active counseling chats.</div>
          )}
        </div>
      </div>

      {/* Right Chat Panel */}
      <div className="flex flex-1 flex-col bg-white">
        {activeConversation ? (
          <>
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 shadow-sm z-10 bg-white">
              <div>
                <h3 className="font-black text-ink">{activeConversation.participants.find(p => p._id !== user._id)?.name || "Devotee"}</h3>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                  Assigned Topic: <span className="font-bold text-primary">{activeConversation.course?.title || "General question"}</span>
                </p>
              </div>
              <button
                onClick={() => setShowEscalate(true)}
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 transition shadow-md shadow-amber-500/20"
              >
                Escalate doubt to Admin
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-soft/5">
              {messages.map((m) => {
                const isMe = m.sender?._id === user?._id;
                const isSystem = m.messageType === "system";
                if (isSystem) {
                  return (
                    <div key={m._id} className="flex justify-center my-2">
                      <span className="bg-amber-100/70 border border-amber-200/50 rounded-full px-4 py-1 text-[10px] font-semibold text-amber-800">
                        {m.text}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-white rounded-br-sm shadow-sm" : "bg-white text-ink border border-black/5 rounded-bl-sm shadow-sm"}`}>
                      {m.fileUrl ? (
                        m.fileType?.startsWith("image/") ? (
                          <a href={assetUrl(m.fileUrl)} target="_blank" rel="noreferrer">
                            <img src={assetUrl(m.fileUrl)} alt="Attachment" className="mb-2 max-h-48 rounded-lg object-cover" />
                          </a>
                        ) : (
                          <a href={assetUrl(m.fileUrl)} download className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg text-xs font-bold underline">
                            <Paperclip size={14} /> Download File
                          </a>
                        )
                      ) : null}
                      <p className="text-sm leading-relaxed">{m.text}</p>
                      <span className={`text-[8px] block mt-1 text-right ${isMe ? "text-white/70" : "text-muted"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-black/5 p-4 bg-white flex items-center gap-3">
              <label className="cursor-pointer p-2.5 rounded-full hover:bg-soft transition text-muted hover:text-primary">
                <input type="file" onChange={handleFileUpload} className="hidden" />
                <Paperclip size={20} />
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                placeholder={uploading ? "Uploading attachment..." : "Type guidance here..."}
                disabled={uploading}
                className="flex-1 rounded-full border border-black/10 px-5 py-3 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleSend(inputText)}
                className="p-3 bg-primary text-white rounded-full hover:opacity-90 transition shadow-lg shadow-primary/20"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-muted">
            Select a counseling chat from the sidebar to connect with devotee.
          </div>
        )}
      </div>

      {/* Escalation Overlay Modal */}
      {showEscalate && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 animate-fade-in">
            <h3 className="text-lg font-black text-ink">Escalate doubt to Admin Support</h3>
            <p className="text-xs text-muted mt-1.5">This conversation will be transferred directly to our central admin support team.</p>
            <textarea
              required
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Provide context/reason (e.g. Payment doubt, course access lock issue, technical bug)..."
              className="w-full border border-black/10 rounded-2xl p-4 text-xs focus:border-primary focus:outline-none mt-4"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowEscalate(false)}
                className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft"
              >
                Cancel
              </button>
              <button
                onClick={triggerEscalation}
                disabled={!escalateReason.trim()}
                className="rounded-full bg-amber-500 px-5 py-2 text-xs font-black text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                Transfer to Support Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TeacherStudentProgressPage = () => {
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderModal, setReminderModal] = useState(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [msgModalStudent, setMsgModalStudent] = useState(null);
  const [msgModalCourse, setMsgModalCourse] = useState(null);
  const [personalMsgText, setPersonalMsgText] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success"); // 'success' or 'error'

  const showNotice = (msg, type = "success") => {
    setNotice(msg);
    setNoticeType(type);
    setTimeout(() => setNotice(""), 5000);
  };

  const loadProgress = () => {
    apiFetch("/admin/student-progress").then((res) => {
      if (res.success) {
        setProgressList(res.progressList || res.items || []);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const sendReminderSubmit = async () => {
    if (!reminderModal) return;
    try {
      const res = await apiFetch(`/admin/students/${reminderModal._id}/reminder`, {
        method: "POST",
        body: { message: reminderMessage }
      });
      if (res.success) {
        showNotice("Encouraging study reminder sent successfully!", "success");
        setReminderModal(null);
        setReminderMessage("");
      }
    } catch (err) {
      showNotice("Failed to send reminder: " + err.message, "error");
    }
  };

  const sendPersonalMsgSubmit = async () => {
    if (!msgModalStudent || !msgModalCourse || !personalMsgText.trim()) return;
    try {
      const res = await apiFetch("/chats/personal-message", {
        method: "POST",
        body: {
          courseId: msgModalCourse._id,
          studentId: msgModalStudent._id,
          messageText: personalMsgText
        }
      });
      if (res.success) {
        showNotice("Personal message sent successfully!", "success");
        setMsgModalStudent(null);
        setMsgModalCourse(null);
        setPersonalMsgText("");
      }
    } catch (err) {
      showNotice("Failed to send message: " + err.message, "error");
    }
  };

  if (loading) return <div className="p-6 text-sm font-bold">Loading devotee records...</div>;

  return (
    <>
      <SEO title="Devotee Student Progress" />
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/5">
        <h2 className="text-2xl font-black text-ink">Devotee Progress Tracker</h2>
        <p className="text-sm text-muted mt-1 mb-6">Track consistency, daily learning cycles and watch times for your students</p>

        {notice && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-black border animate-fadeIn transition-all ${
            noticeType === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-md shadow-emerald-500/5" 
              : "bg-red-50 border-red-200 text-red-600 shadow-md shadow-red-500/5"
          }`}>
            {notice}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 text-[10px] uppercase tracking-wider font-black text-muted">
                <th className="pb-4">Devotee Student</th>
                <th className="pb-4">Course</th>
                <th className="pb-4">Progress Speed</th>
                <th className="pb-4">Last Active</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {progressList.map((item) => {
                if (!item.student) return null;
                const lastSeenStr = item.lastActive ? new Date(item.lastActive).toLocaleDateString() : "Never";
                return (
                  <tr key={item.enrollmentId || item._id} className="text-sm">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {item.student.profileImage ? (
                          <img src={assetUrl(item.student.profileImage)} className="h-9 w-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary uppercase">
                            {item.student.name?.charAt(0) || "D"}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-ink">{item.student.name}</h4>
                          <p className="text-[10px] text-muted">{item.student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-ink text-xs">{item.course?.title}</td>
                    <td className="py-4">
                      <div className="w-36">
                        <ProgressBar percent={item.progress?.percent || 0} label={`${item.progress?.percent || 0}% Complete`} />
                      </div>
                    </td>
                    <td className="py-4 text-xs font-bold text-muted">{lastSeenStr}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => {
                          setReminderModal(item.student);
                          setReminderMessage(`Hare Krishna ${item.student.name}! Please take out 15 minutes today to continue your study of "${item.course?.title}". Continuous hearing leads to deep realization!`);
                        }}
                        className="rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-white transition"
                      >
                        Encourage Study
                      </button>
                      <button
                        onClick={() => {
                          setMsgModalStudent(item.student);
                          setMsgModalCourse(item.course);
                          setPersonalMsgText(`Hare Krishna ${item.student.name}! How is your study of "${item.course?.title}" going? Let me know if you have any questions or need guidance!`);
                        }}
                        className="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-black text-emerald-600 hover:bg-emerald-600 hover:text-white transition ml-2"
                      >
                        Personal Message
                      </button>
                    </td>
                  </tr>
                );
              })}
              {progressList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted font-bold">No students currently enrolled in your courses.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reminderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 animate-scale-up">
            <h3 className="text-lg font-black text-ink">Spiritual Encouragement Reminder</h3>
            <p className="text-xs text-muted mt-1">Send a direct in-app notification prompt encouraging {reminderModal.name} to continue reading.</p>
            <textarea
              required
              rows={4}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              className="w-full border border-black/10 rounded-2xl p-4 text-xs focus:border-primary focus:outline-none mt-4 font-semibold text-ink"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setReminderModal(null)}
                className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft"
              >
                Cancel
              </button>
              <button
                onClick={sendReminderSubmit}
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-black text-white hover:opacity-90 shadow-lg shadow-primary/20"
              >
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {msgModalStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 animate-scale-up">
            <h3 className="text-lg font-black text-ink">Send Personal Message</h3>
            <p className="text-xs text-muted mt-1 font-medium">This message will appear in {msgModalStudent.name}'s chatbot support chat and send them an in-app notification.</p>
            <textarea
              required
              rows={4}
              value={personalMsgText}
              onChange={(e) => setPersonalMsgText(e.target.value)}
              className="w-full border border-black/10 rounded-2xl p-4 text-xs focus:border-primary focus:outline-none mt-4 font-semibold text-ink"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMsgModalStudent(null);
                  setMsgModalCourse(null);
                  setPersonalMsgText("");
                }}
                className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft"
              >
                Cancel
              </button>
              <button
                onClick={sendPersonalMsgSubmit}
                disabled={!personalMsgText.trim()}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const AdminTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [showPasswordReset, setShowPasswordReset] = useState(null);
  
  // Reassignment confirm modal state
  const [pendingReassign, setPendingReassign] = useState(null);
  
  // Dropdown search & toggles
  const [courseSearch, setCourseSearch] = useState("");
  const [showDraftCourses, setShowDraftCourses] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [resetPassWordInput, setResetPassWordInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    mobile: "",
    password: "",
    profileImage: "",
    bio: "",
    specialization: "",
    assignedCourses: [],
    teacherType: "primary",
    status: "active",
    permissions: {
      canReplyToComments: true,
      canReplyToChats: true,
      canUploadResources: true,
      canViewStudentProgress: true,
      canSendReminders: true,
      canMarkDoubtsResolved: true,
      canEscalateToAdmin: true
    }
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const teachRes = await apiFetch("/admin/teachers");
      const courRes = await apiFetch("/admin/courses/assignable");
      if (teachRes.success) setTeachers(teachRes.items || []);
      if (courRes.success) setCourses(courRes.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleBlock = async (teacher) => {
    const isBlocked = teacher.status === "blocked";
    const action = isBlocked ? "unblock" : "block";
    const reason = !isBlocked ? window.prompt("Reason for blocking this teacher:") : "";
    if (!isBlocked && reason === null) return; // cancelled
    
    try {
      const res = await apiFetch(`/admin/teachers/${teacher._id}/${action}`, {
        method: "PATCH",
        body: !isBlocked ? { reason } : {}
      });
      if (res.success) {
        alert(`Teacher successfully ${isBlocked ? "unblocked" : "blocked"}!`);
        loadAll();
      }
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassWordInput || resetPassWordInput.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      const res = await apiFetch(`/admin/teachers/${showPasswordReset._id}/reset-password`, {
        method: "PATCH",
        body: { password: resetPassWordInput }
      });
      if (res.success) {
        alert("Password reset successfully!");
        setShowPasswordReset(null);
        setResetPassWordInput("");
      }
    } catch (err) {
      alert("Password reset failed: " + err.message);
    }
  };

  const toggleCourseSelect = (courseId) => {
    const targetCourse = courses.find(c => c._id === courseId);
    const isSelected = formData.assignedCourses?.includes(courseId);

    if (!isSelected && targetCourse && targetCourse.primaryTeacher && formData.teacherType === "primary") {
      // Course already has a primary teacher, show confirm overlay
      setPendingReassign({
        courseId,
        courseTitle: targetCourse.title,
        oldTeacherName: targetCourse.primaryTeacher.name
      });
      return;
    }

    setFormData(prev => {
      const current = prev.assignedCourses || [];
      const updated = isSelected
        ? current.filter(id => id !== courseId)
        : [...current, courseId];
      return { ...prev, assignedCourses: updated };
    });
  };

  const confirmReassignment = () => {
    if (!pendingReassign) return;
    const { courseId } = pendingReassign;
    setFormData(prev => ({
      ...prev,
      assignedCourses: [...(prev.assignedCourses || []), courseId]
    }));
    setPendingReassign(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingTeacher) {
        res = await apiFetch(`/admin/teachers/${editingTeacher._id}`, {
          method: "PATCH",
          body: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || formData.mobile,
            mobile: formData.mobile || formData.phone,
            profileImage: formData.profileImage,
            bio: formData.bio,
            specialization: formData.specialization,
            assignedCourses: formData.assignedCourses,
            teacherType: formData.teacherType,
            permissions: formData.permissions,
            status: formData.status
          }
        });
      } else {
        res = await apiFetch("/admin/teachers", {
          method: "POST",
          body: formData
        });
      }

      if (res.success) {
        alert(editingTeacher ? "Teacher updated successfully!" : "Teacher created successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          mobile: "",
          password: "",
          profileImage: "",
          bio: "",
          specialization: "",
          assignedCourses: [],
          teacherType: "primary",
          status: "active",
          permissions: {
            canReplyToComments: true,
            canReplyToChats: true,
            canUploadResources: true,
            canViewStudentProgress: true,
            canSendReminders: true,
            canMarkDoubtsResolved: true,
            canEscalateToAdmin: true
          }
        });
        setEditingTeacher(null);
        setShowForm(false);
        loadAll();
      }
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  const handleEditClick = (t) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name || "",
      email: t.email || "",
      phone: t.phone || "",
      mobile: t.mobile || "",
      password: "",
      profileImage: t.profileImage || "",
      bio: t.bio || "",
      specialization: Array.isArray(t.specialization) ? t.specialization.join(", ") : (t.specialization || ""),
      assignedCourses: t.assignedCourses || [],
      teacherType: t.teacherType || "primary",
      status: t.status || "active",
      permissions: t.permissions || {
        canReplyToComments: true,
        canReplyToChats: true,
        canUploadResources: true,
        canViewStudentProgress: true,
        canSendReminders: true,
        canMarkDoubtsResolved: true,
        canEscalateToAdmin: true
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher account?")) return;
    try {
      const res = await apiFetch(`/admin/teachers/${teacherId}`, { method: "DELETE" });
      if (res.success) {
        alert("Teacher account deleted successfully!");
        loadAll();
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleOpenReport = async (teacher) => {
    try {
      const res = await apiFetch(`/admin/teacher-performance/${teacher._id}`);
      if (res.success) {
        setShowReport(res);
      }
    } catch (err) {
      alert("Failed to load performance report: " + err.message);
    }
  };

  // Filter courses for assignment select
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(courseSearch.toLowerCase());
    const isPublished = c.status === "published";
    return matchesSearch && (showDraftCourses ? true : isPublished);
  });

  if (loading) return <div className="p-6 text-sm font-bold text-center text-primary animate-pulse">Loading Devotional Preacher management...</div>;

  return (
    <>
      <SEO title="Preacher Management" />
      <div className="rounded-3xl bg-white p-6 shadow-xl border border-black/5 relative overflow-hidden">
        {/* Background glow decorator */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-ink tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" /> Preachers & Acharyas
            </h2>
            <p className="text-sm font-semibold text-muted mt-1">
              Admin spiritual command center to register preachers, override authorizations, and inspect performance analytics.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setFormData({
                name: "",
                email: "",
                phone: "",
                mobile: "",
                password: "",
                profileImage: "",
                bio: "",
                specialization: "",
                assignedCourses: [],
                teacherType: "primary",
                status: "active",
                permissions: {
                  canReplyToComments: true,
                  canReplyToChats: true,
                  canUploadResources: true,
                  canViewStudentProgress: true,
                  canSendReminders: true,
                  canMarkDoubtsResolved: true,
                  canEscalateToAdmin: true
                }
              });
              setShowForm(true);
            }}
            className="rounded-full bg-gradient-to-r from-primary to-primary-hover px-6 py-3 text-xs font-black text-white hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 self-start sm:self-center"
          >
            + Register New Preacher
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-soft/70 border-b border-black/5 text-[10px] uppercase tracking-wider font-black text-muted">
                <th className="p-4">Preacher / Teacher</th>
                <th className="p-4">Role & Status</th>
                <th className="p-4">Assigned Courses</th>
                <th className="p-4 text-center">Students</th>
                <th className="p-4 text-center">Pending Doubts</th>
                <th className="p-4 text-center">Avg Reply</th>
                <th className="p-4 text-center">Rating</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {teachers.map((t) => (
                <tr key={t._id} className="hover:bg-soft/40 transition text-sm">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {t.profileImage ? (
                          <img src={t.profileImage} alt={t.name} className="h-10 w-10 rounded-full object-cover border border-primary/20" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-xs font-black text-primary uppercase">
                            {t.name?.charAt(0) || "T"}
                          </div>
                        )}
                        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${t.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-ink hover:text-primary cursor-pointer" onClick={() => handleOpenReport(t)}>{t.name}</h4>
                        <span className="text-muted text-xs block font-medium">{t.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.teacherType === "primary" ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-100 text-gray-700"}`}>
                        {t.teacherType || "primary"} preacher
                      </span>
                      <div className="block">
                        <span className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${t.status === "active" ? "bg-green-100 text-green-700" : t.status === "blocked" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold max-w-xs truncate text-muted">
                    {t.assignedCourses?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.assignedCourses.map(cid => {
                          const cDoc = courses.find(c => c._id === cid);
                          return cDoc ? (
                            <span key={cid} className="bg-soft px-2 py-0.5 rounded text-[10px] border border-black/5 font-semibold text-ink">
                              {cDoc.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No courses authorized</span>
                    )}
                  </td>
                  <td className="p-4 text-center font-extrabold text-ink text-xs">{t.totalStudents || 0}</td>
                  <td className="p-4 text-center font-extrabold text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${t.pendingComments > 0 ? "bg-red-50 text-red-600 font-black animate-pulse" : "text-gray-400 font-semibold"}`}>
                      {t.pendingComments || 0}
                    </span>
                  </td>
                  <td className="p-4 text-center font-extrabold text-muted text-xs">{t.avgReplyTime || 12} hrs</td>
                  <td className="p-4 text-center text-xs">
                    <div className="flex items-center justify-center gap-1 font-black text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{t.rating || "5.0"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(t)}
                        title="Edit Preacher"
                        className="p-1.5 hover:bg-soft rounded-full transition text-muted hover:text-ink"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordReset(t);
                          setResetPassWordInput("");
                        }}
                        title="Reset Password"
                        className="p-1.5 hover:bg-soft rounded-full transition text-muted hover:text-ink"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleBlock(t)}
                        title={t.status === "blocked" ? "Unblock Preacher" : "Block Preacher"}
                        className={`p-1.5 hover:bg-soft rounded-full transition ${t.status === "blocked" ? "text-green-600" : "text-red-500"}`}
                      >
                        {t.status === "blocked" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        title="Delete Preacher"
                        className="p-1.5 hover:bg-red-50 rounded-full transition text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted font-bold">No spiritual teachers registered yet. Create one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT REGISTER MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-black/5 animate-scale-up max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-ink hover:bg-soft rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-2xl font-black text-ink">{editingTeacher ? "Edit Preacher Profile" : "Register Devotional Preacher"}</h3>
            <p className="text-xs text-muted mt-1">Configure credentials, course authorities, and visual properties for this acharya account.</p>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black text-ink uppercase">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Satyam Gupta"
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-ink uppercase">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. satyam.gupta@iskcon.com"
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black text-ink uppercase">Phone / Mobile</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, mobile: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-black text-ink uppercase">Profile Image URL / Upload</label>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-200/70">
                      📐 Recommended: 600 × 600 px (1:1 square) or 800 × 800 px
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.profileImage}
                      onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                      placeholder="Paste link or upload..."
                      className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                    />
                    <label className="shrink-0 cursor-pointer bg-soft hover:bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-xs font-bold text-ink transition flex items-center justify-center">
                      Upload
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const res = await uploadFile(file, "preachers");
                            setFormData(prev => ({ ...prev, profileImage: res.url || res }));
                          } catch (err) {
                            alert("Failed to upload image: " + err.message);
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black text-ink uppercase">Bio Summary</label>
                  <input
                    type="text"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="e.g. Trained in Bhakti Shastri and Gita Upadesh"
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-ink uppercase">Specialization / Expertise</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Bhagavad Gita, Upanishads, Srimad Bhagavatam"
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                  />
                </div>
              </div>

              {!editingTeacher && (
                <div>
                  <label className="text-xs font-black text-ink uppercase">Set Account Password</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set minimum 6 characters password"
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black text-ink uppercase">Teacher Role Type</label>
                  <select
                    value={formData.teacherType}
                    onChange={(e) => setFormData({ ...formData, teacherType: e.target.value })}
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none bg-white font-semibold text-ink"
                  >
                    <option value="primary">Primary Teacher</option>
                    <option value="support">Support Teacher</option>
                    <option value="guest">Guest Preacher</option>
                    <option value="mentor">Course Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-ink uppercase">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none bg-white font-semibold text-ink"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {/* PERMISSIONS CRITERIA CHECKLIST */}
              <div>
                <label className="text-xs font-black text-ink uppercase block mb-2">Granular Authority & Permission Levels</label>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 bg-soft p-4 rounded-2xl border border-black/5">
                  {Object.keys(formData.permissions).map((permKey) => (
                    <label key={permKey} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={formData.permissions[permKey]}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [permKey]: e.target.checked
                          }
                        })}
                        className="h-4 w-4 rounded text-primary focus:ring-primary border-black/10 cursor-pointer"
                      />
                      <span>{permKey.replace("can", "").replace(/([A-Z])/g, " $1")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* MULTI-SELECT SEARCHABLE COURSE DROPDOWN */}
              <div className="relative">
                <label className="text-xs font-black text-ink uppercase block mb-1">Assign Devotional Course Authority</label>
                
                {/* Selected Course Badges */}
                {formData.assignedCourses?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-soft rounded-xl border border-black/5">
                    {formData.assignedCourses.map(cid => {
                      const c = courses.find(item => item._id === cid);
                      return c ? (
                        <span key={cid} className="flex items-center gap-1 bg-white border border-primary/20 px-2.5 py-1 rounded-full text-xs font-bold text-primary">
                          {c.title}
                          <button
                            type="button"
                            onClick={() => toggleCourseSelect(cid)}
                            className="hover:bg-red-50 rounded-full p-0.5 text-muted hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                <div
                  onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                  className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:border-primary bg-white cursor-pointer flex items-center justify-between font-semibold text-ink"
                >
                  <span>Select and assign devotional courses...</span>
                  <Search className="h-4 w-4 text-muted" />
                </div>

                {courseDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-black/10 p-4 z-50 max-h-64 overflow-y-auto space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2 border-b border-black/5 pb-2">
                      <input
                        type="text"
                        placeholder="Search courses by name..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full bg-soft border border-transparent rounded-lg px-3 py-1.5 text-xs focus:border-primary focus:outline-none font-semibold text-ink"
                      />
                      <label className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-wider cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={showDraftCourses}
                          onChange={(e) => setShowDraftCourses(e.target.checked)}
                          className="h-3.5 w-3.5 rounded text-primary border-black/10"
                        />
                        <span>Show Drafts</span>
                      </label>
                    </div>

                    {filteredCourses.map(course => {
                      const isSelected = formData.assignedCourses?.includes(course._id);
                      return (
                        <div
                          key={course._id}
                          onClick={() => toggleCourseSelect(course._id)}
                          className={`flex flex-col gap-1 p-2.5 rounded-xl cursor-pointer transition border ${isSelected ? "bg-primary/5 text-primary border-primary/20" : "hover:bg-soft border-transparent"}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-ink">{course.title}</span>
                            <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                              {isSelected ? "✓ Assigned" : "+ Assign"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted font-bold">
                            <span>Category: {course.category || "General"}</span>
                            <span>•</span>
                            <span className={course.status === "published" ? "text-green-600" : "text-amber-600"}>
                              {course.status || "draft"}
                            </span>
                            <span>•</span>
                            <span>{course.enrolledCount || 0} students</span>
                            {course.primaryTeacher && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 italic">Primary: {course.primaryTeacher.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {filteredCourses.length === 0 && (
                      <div className="text-center py-4 text-xs font-bold text-muted">No assignable courses found matching criteria.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-black/5 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-black/10 px-6 py-2.5 text-xs font-black text-ink hover:bg-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-primary to-primary-hover px-6 py-2.5 text-xs font-black text-white hover:opacity-90 shadow-lg shadow-primary/20"
                >
                  {editingTeacher ? "Save Profile Changes" : "Register Preacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGNMENT CONFIRMATION OVERLAY */}
      {pendingReassign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-black text-ink">Override Primary Preacher Authority?</h4>
            <p className="text-xs text-muted mt-2">
              The course <strong className="text-ink">"{pendingReassign.courseTitle}"</strong> is already primary assigned to <strong className="text-ink">{pendingReassign.oldTeacherName}</strong>.
            </p>
            <p className="text-xs text-muted mt-1 font-semibold">
              Reassigning this course as Primary Preacher will override their access boundaries. Are you absolutely sure?
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setPendingReassign(null)}
                className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmReassignment}
                className="rounded-full bg-amber-500 px-6 py-2.5 text-xs font-black text-white hover:opacity-90 shadow-lg shadow-amber-500/20"
              >
                Yes, Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET DIALOG */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-black/5 animate-scale-up">
            <h3 className="text-lg font-black text-ink flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Reset Preacher Password
            </h3>
            <p className="text-xs text-muted mt-1">Update login password credentials for spiritual teacher <strong className="text-ink">{showPasswordReset.name}</strong>.</p>
            
            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-black text-ink uppercase">New Password</label>
                <input
                  required
                  type="password"
                  value={resetPassWordInput}
                  onChange={(e) => setResetPassWordInput(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-xs mt-1.5 focus:border-primary focus:outline-none font-semibold text-ink"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(null)}
                  className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2 text-xs font-black text-white hover:opacity-90 shadow-lg shadow-primary/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERFORMANCE REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-black/5 animate-scale-up max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowReport(null)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-ink hover:bg-soft rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-black/5 pb-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary uppercase">
                {showReport.teacher.name?.charAt(0) || "P"}
              </div>
              <div>
                <h3 className="text-xl font-black text-ink">{showReport.teacher.name}</h3>
                <p className="text-xs font-bold text-muted uppercase tracking-wider">
                  {showReport.teacher.teacherType || "Primary"} Preacher • {showReport.teacher.specialization?.join(", ") || "General Philosophy"}
                </p>
              </div>
            </div>

            {/* Overall grade and scores */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">Bhakti Performance Grade</span>
                <div className="text-2xl font-black text-primary mt-1 flex items-center justify-center gap-1">
                  <Award className="h-6 w-6" /> {showReport.performance.grade}
                </div>
              </div>
              <div className="bg-soft border border-black/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider">Devotee Rating Average</span>
                <div className="text-2xl font-black text-ink mt-1 flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 text-amber-500 fill-current" /> {showReport.performance.averageRating || "5.0"}
                </div>
              </div>
              <div className="bg-soft border border-black/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider">Helpful Reply Ratio</span>
                <div className="text-2xl font-black text-ink mt-1">
                  {showReport.performance.helpfulReplyPercentage}%
                </div>
              </div>
            </div>

            {/* Numeric Indicators */}
            <h4 className="text-xs font-black text-ink uppercase tracking-wider mb-3">Service Statistics</h4>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <div className="flex justify-between items-center bg-soft p-3 rounded-xl border border-black/5 text-xs font-bold">
                <span className="text-muted">Total Doubt Comments Answered</span>
                <span className="text-ink text-sm font-extrabold">{showReport.performance.totalCommentsReplied || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-soft p-3 rounded-xl border border-black/5 text-xs font-bold">
                <span className="text-muted">Direct Student Chats Handled</span>
                <span className="text-ink text-sm font-extrabold">{showReport.performance.totalChatsHandled || 0}</span>
              </div>
            </div>

            {/* Ratings and reviews */}
            <h4 className="text-xs font-black text-ink uppercase tracking-wider mb-3">Student Rating Feedback</h4>
            <div className="space-y-3">
              {showReport.ratings && showReport.ratings.map((r, i) => (
                <div key={i} className="bg-soft/55 border border-black/5 p-3 rounded-xl">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink">{r.student?.name || "Devotee student"}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-black">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{r.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted font-medium italic">"{r.feedbackText || "No comment left"}"</p>
                  <div className="flex items-center justify-between text-[10px] text-muted font-bold mt-2">
                    <span>Course: {r.course?.title}</span>
                    <span className={r.helpful ? "text-green-600 font-black" : "text-red-500 font-black"}>
                      {r.helpful ? "✓ Helpful Reply" : "✗ Not Helpful"}
                    </span>
                  </div>
                </div>
              ))}
              {(!showReport.ratings || showReport.ratings.length === 0) && (
                <p className="text-xs italic text-center py-4 text-gray-400 font-bold">No student feedback reviews posted yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const AdminDashboard = () => {
  const { item: data } = useSingle("/admin/dashboard/stats", { stats: {}, charts: {}, recentActivity: { users: [], contacts: [] } }, null);
  const [params] = useSearchParams();
  const stats = data.stats || {};
  if (params.get("profile")) {
    return <><SEO title="Admin Profile" /><div className="mb-6"><p className="text-sm font-black uppercase tracking-wide text-primary">Main Admin</p><h1 className="mt-1 text-3xl font-black">Profile & Password</h1></div><ProfilePasswordPanel /></>;
  }

  const statsMapping = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, to: "/admin/users" },
    { label: "Active Users", value: stats.activeUsers, icon: Users, to: "/admin/users" },
    { label: "Blocked Users", value: stats.blockedUsers, icon: Users, to: "/admin/users" },
    { label: "Pending OTP", value: stats.pendingUsers, icon: Mail, to: "/admin/users" },
    { label: "Students", value: stats.totalStudents, icon: GraduationCap, to: "/admin/users" },
    { label: "Teachers", value: stats.totalTeachers, icon: Users, to: "/admin/users" },
    { label: "Courses", value: stats.totalCourses, icon: BookOpen, to: "/admin/courses" },
    { label: "Lessons", value: stats.totalLessons, icon: FileText, to: "/admin/courses" },
    { label: "Completed Lessons", value: stats.completedLessons, icon: CheckCircle2, to: "/admin/courses" },
    { label: "Notes", value: stats.totalNotes, icon: FileText, to: "/admin/courses" },
    { label: "Comments", value: stats.totalComments, icon: MessageSquare, to: "/admin/comments" },
    { label: "Chat Messages", value: stats.totalChatMessages, icon: MessageSquare, to: "/admin/chat" },
    { label: "Reset Requests", value: stats.pendingResetRequests, icon: Bell, to: "/admin/password-reset-requests" },
    { label: "Subscribers", value: stats.totalSubscribers, icon: Mail, to: "/admin/subscribers" },
    { label: "Home Sections", value: stats.totalHomeSections, icon: Home, to: "/admin/home-sections" }
  ];

  return (
    <>
      <SEO title="Admin Panel" />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Link to="/admin" className="rounded-2xl bg-ink p-6 text-white shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-primary">Main Admin</p>
          <h1 className="mt-2 text-3xl font-black">Admin Panel</h1>
          <p className="mt-2 text-sm text-white/70">
            Manage users, courses, learning activity, moderation, reset requests, and analytics.
          </p>
        </Link>
        <Link to="/teacher" className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-primary">Teacher Access</p>
          <h2 className="mt-2 text-3xl font-black">Teacher Panel</h2>
          <p className="mt-2 text-sm text-muted">Open assigned-course workflows, lessons, students, and blogs.</p>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
        {statsMapping.map(({ label, value, icon, to }) => (
          <StatCard key={label} label={label} value={value} icon={icon} to={to} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Recent Users</h2>
          <div className="mt-4 grid gap-3">
            {data.recentActivity?.users?.map((item) => (
              <div key={item._id} className="rounded-xl bg-soft p-3 text-sm font-bold">
                {item.name} · {item.role}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Recent Messages</h2>
          <div className="mt-4 grid gap-3">
            {data.recentActivity?.contacts?.map((item) => (
              <div key={item._id} className="rounded-xl bg-soft p-3 text-sm font-bold">
                {item.name} · {item.subject}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export const AdminUsersPage = () => {
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [tempPasswords, setTempPasswords] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "", password: "", status: "" });
  const [msgModalStudent, setMsgModalStudent] = useState(null);
  const [personalMsgText, setPersonalMsgText] = useState("");

  const [learningModalUser, setLearningModalUser] = useState(null);
  const [learningDetails, setLearningDetails] = useState(null);
  const [loadingLearning, setLoadingLearning] = useState(false);
  const [selectedCourseForMonitoring, setSelectedCourseForMonitoring] = useState(null);
  const [monitoringDetails, setMonitoringDetails] = useState(null);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [activeMonitoringTab, setActiveMonitoringTab] = useState("progress");

  const openLearningModal = async (userItem) => {
    setLearningModalUser(userItem);
    setLoadingLearning(true);
    setLearningDetails(null);
    setSelectedCourseForMonitoring(null);
    setMonitoringDetails(null);
    try {
      const data = await apiFetch(`/admin/users/${userItem._id}`);
      if (data.success) {
        setLearningDetails(data.user);
      }
    } catch (err) {
      console.error("Failed to load user learning details", err);
    } finally {
      setLoadingLearning(false);
    }
  };

  const loadCourseMonitoring = async (courseItem) => {
    setSelectedCourseForMonitoring(courseItem);
    setLoadingMonitoring(true);
    setMonitoringDetails(null);
    setActiveMonitoringTab("progress");
    try {
      const data = await apiFetch(`/admin/student-progress/${learningModalUser._id}/${courseItem._id}/details`);
      if (data.success) {
        setMonitoringDetails(data);
      }
    } catch (err) {
      console.error("Failed to load course details", err);
    } finally {
      setLoadingMonitoring(false);
    }
  };

  const load = () => apiFetch(`/admin/users?search=${encodeURIComponent(filters.search)}&status=${filters.status}`).then((data) => setItems(data.items || [])).catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, []);

  const sendPersonalMsgSubmit = async () => {
    if (!msgModalStudent || !personalMsgText.trim()) return;
    try {
      const res = await apiFetch("/chats/personal-message", {
        method: "POST",
        body: {
          studentId: msgModalStudent._id,
          messageText: personalMsgText
        }
      });
      if (res.success) {
        setNotice("Personal message sent successfully!");
        setMsgModalStudent(null);
        setPersonalMsgText("");
        setTimeout(() => setNotice(""), 5000);
      }
    } catch (err) {
      setNotice("Failed to send message: " + err.message);
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const action = async (id, type) => {
    try {
      if (type === "delete" && !confirm("Delete this user and their learning data?")) return;
      if (type === "delete") await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      if (type === "block") await apiFetch(`/admin/users/${id}/block`, { method: "PUT" });
      if (type === "unblock") await apiFetch(`/admin/users/${id}/unblock`, { method: "PUT" });
      setNotice("User updated.");
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const changePassword = async (id) => {
    try {
      await apiFetch(`/admin/users/${id}/password`, { method: "PUT", body: { password: tempPasswords[id] } });
      setNotice("Temporary password set.");
      setTempPasswords((old) => ({ ...old, [id]: "" }));
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || user.mobile || "",
      role: user.role || "student",
      password: "",
      status: user.status || "active"
    });
  };

  const handleSaveUser = async () => {
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await apiFetch(`/admin/users/${editingUser._id}`, {
        method: "PUT",
        body: payload
      });
      setNotice("User profile updated successfully.");
      setEditingUser(null);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <div>
      <SEO title="User Management" />
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black">User Management</h1>
          <p className="mt-1 text-sm text-muted">Search, block, unblock, delete users, and set temporary passwords.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search name/email/mobile" className="rounded-xl border border-black/10 px-4 py-2" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-xl border border-black/10 px-4 py-2">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
          <button onClick={load} className="rounded-xl bg-ink px-4 py-2 text-sm font-black text-white">Search</button>
        </div>
      </div>
      
      {notice && <p className="mb-4 rounded-xl bg-primary/10 p-3 text-sm font-bold text-primary">{notice}</p>}
      
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Learning</th>
              <th className="px-4 py-3">Temporary Password</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  <div className="font-black">{item.name}</div>
                  <div className="text-xs text-muted">{item.email} · {item.mobile || item.phone || ""}</div>
                </td>
                <td className="px-4 py-3">{item.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${item.status === "blocked" ? "bg-red-50 text-red-600" : item.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-primary/10 text-primary"}`}>{item.status}</span>
                </td>
                <td className="px-4 py-3">
                  {item.enrolledCourses > 0 ? (
                    <button
                      onClick={() => openLearningModal(item)}
                      className="text-primary hover:underline font-bold text-left flex items-center gap-1.5"
                      title="Click to view detailed devotee progress"
                    >
                      <span>{item.enrolledCourses} courses · {item.lessonsCompleted || 0} lessons</span>
                    </button>
                  ) : (
                    <span className="text-muted">{item.enrolledCourses || 0} courses · {item.lessonsCompleted || 0} lessons</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input value={tempPasswords[item._id] || ""} onChange={(e) => setTempPasswords({ ...tempPasswords, [item._id]: e.target.value })} placeholder="Temp password" className="w-36 rounded-lg border border-black/10 px-3 py-2" />
                    <button onClick={() => changePassword(item._id)} className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-white">Set</button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {item.role === "student" && (
                    <button
                      onClick={() => {
                        setMsgModalStudent(item);
                        setPersonalMsgText(`Hare Krishna ${item.name}! How is your study progress going? Please let me know if you have any questions or need guidance.`);
                      }}
                      className="mr-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 p-2 text-emerald-600 hover:text-white inline-flex items-center justify-center transition"
                      title="Send Personal Message"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                  <button onClick={() => handleOpenEdit(item)} className="mr-2 rounded-lg bg-soft hover:bg-black/5 p-2 text-ink inline-flex items-center justify-center" title="Edit Profile">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => action(item._id, item.status === "blocked" ? "unblock" : "block")} className="mr-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-black">{item.status === "blocked" ? "Unblock" : "Block"}</button>
                  <button onClick={() => action(item._id, "delete")} className="rounded-lg border border-red-200 p-2 text-primary inline-flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-black/5">
            <div className="flex items-center justify-between border-b border-black/5 pb-3 mb-4">
              <h2 className="text-xl font-black text-ink">Edit Devotee Profile</h2>
              <button onClick={() => setEditingUser(null)} className="rounded-full hover:bg-soft p-1.5 transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted mb-1">System Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="student">Student/Devotee</option>
                    <option value="preacher">Preacher</option>
                    <option value="teacher">Teacher</option>
                    <option value="main_admin">Main Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted mb-1">Change Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-black/5 pt-4">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-ink hover:bg-soft"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/95 shadow-md shadow-primary/10"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {msgModalStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 animate-scale-up">
            <h3 className="text-lg font-black text-ink">Send Personal Message</h3>
            <p className="text-xs text-muted mt-1 font-medium">This message will appear in {msgModalStudent.name}'s chatbot support chat and send them an in-app notification.</p>
            <textarea
              required
              rows={4}
              value={personalMsgText}
              onChange={(e) => setPersonalMsgText(e.target.value)}
              className="w-full border border-black/10 rounded-2xl p-4 text-xs focus:border-primary focus:outline-none mt-4 font-semibold text-ink"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMsgModalStudent(null);
                  setPersonalMsgText("");
                }}
                className="rounded-full border border-black/10 px-5 py-2 text-xs font-black text-ink hover:bg-soft"
              >
                Cancel
              </button>
              <button
                onClick={sendPersonalMsgSubmit}
                disabled={!personalMsgText.trim()}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {learningModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-ink">Devotee Learning Profile</h2>
                <p className="text-xs text-muted mt-0.5">
                  Student: <strong className="text-ink">{learningModalUser.name} ({learningModalUser.email})</strong>
                </p>
              </div>
              <button onClick={() => { setLearningModalUser(null); setLearningDetails(null); setSelectedCourseForMonitoring(null); setMonitoringDetails(null); }} className="rounded-full bg-soft p-2 hover:bg-black/10 text-muted">×</button>
            </div>

            {loadingLearning ? (
              <div className="py-12 text-center text-sm font-semibold text-muted">Loading learning profile...</div>
            ) : learningDetails ? (
              <div className="grid gap-6">
                {/* Enrolled Courses List */}
                <div>
                  <h3 className="text-sm font-black text-ink uppercase tracking-wider text-muted mb-3">Enrolled Courses</h3>
                  {learningDetails.enrollments?.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {learningDetails.enrollments.map((enr) => {
                        const courseItem = enr.course || {};
                        const isSelected = selectedCourseForMonitoring?._id === courseItem._id;
                        
                        // Calculate completion percent
                        const progressList = learningDetails.progress?.filter((p) => p.course?._id === courseItem._id) || [];
                        const completedList = progressList.filter((p) => p.isCompleted);
                        const percent = progressList.length > 0 ? Math.round((completedList.length / Math.max(progressList.length, 1)) * 100) : 0;
                        const watchSecs = progressList.reduce((sum, p) => sum + (p.watchSeconds || 0), 0);
                        const mins = Math.round(watchSecs / 60);

                        return (
                          <div
                            key={enr._id}
                            onClick={() => loadCourseMonitoring(courseItem)}
                            className={`rounded-2xl border p-4 cursor-pointer transition ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-black/5 bg-soft/20 hover:border-black/10"
                            }`}
                          >
                            <h4 className="font-bold text-ink text-sm mb-1">{courseItem.title || "Unknown Course"}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded">
                                {percent}% Completed
                              </span>
                              <span className="text-[10px] text-muted font-bold">
                                {mins} mins watched
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                              <div style={{ width: `${percent}%` }} className="h-full bg-primary rounded-full" />
                            </div>
                            <span className="mt-3 block text-[10px] font-black text-primary text-right">
                              {isSelected ? "Selected · View details below" : "Click to view detailed activity"} &rarr;
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-black/10 py-6 text-center text-xs text-muted">
                      This user is not enrolled in any courses yet.
                    </div>
                  )}
                </div>

                {/* Detailed Monitoring for selected course */}
                {selectedCourseForMonitoring && (
                  <div className="border-t border-black/5 pt-5 mt-2">
                    <div className="mb-4">
                      <h3 className="text-sm font-black text-ink uppercase tracking-wider text-muted">
                        Course Detail: <span className="text-primary">{selectedCourseForMonitoring.title}</span>
                      </h3>
                    </div>

                    {loadingMonitoring ? (
                      <div className="py-6 text-center text-xs font-semibold text-muted">Loading activity logs...</div>
                    ) : monitoringDetails ? (
                      <div>
                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-black/10 pb-px mb-5">
                          <button
                            onClick={() => setActiveMonitoringTab("progress")}
                            className={`pb-3 text-xs font-black transition ${activeMonitoringTab === "progress" ? "border-b border-primary text-primary" : "text-muted hover:text-ink"}`}
                          >
                            Lesson Progress
                          </button>
                          <button
                            onClick={() => setActiveMonitoringTab("notes")}
                            className={`pb-3 text-xs font-black transition ${activeMonitoringTab === "notes" ? "border-b border-primary text-primary" : "text-muted hover:text-ink"}`}
                          >
                            Taken Notes ({monitoringDetails.notes?.length || 0})
                          </button>
                          <button
                            onClick={() => setActiveMonitoringTab("comments")}
                            className={`pb-3 text-xs font-black transition ${activeMonitoringTab === "comments" ? "border-b border-primary text-primary" : "text-muted hover:text-ink"}`}
                          >
                            Posted Comments ({monitoringDetails.comments?.length || 0})
                          </button>
                        </div>

                        {/* Tab content */}
                        {activeMonitoringTab === "progress" && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-black/10 overflow-x-auto custom-scrollbar text-xs">
                              <table className="w-full text-left">
                                <thead className="bg-soft border-b border-black/5 text-muted uppercase font-black">
                                  <tr>
                                    <th className="px-4 py-2.5">Lesson Title</th>
                                    <th className="px-4 py-2.5">Completed</th>
                                    <th className="px-4 py-2.5">Watch Time</th>
                                    <th className="px-4 py-2.5">Last Watched</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 font-semibold text-ink">
                                  {monitoringDetails.progress?.map((p) => (
                                    <tr key={p._id} className="hover:bg-soft/20">
                                      <td className="px-4 py-2.5 font-bold">{p.lesson?.title || "Unknown Lesson"}</td>
                                      <td className="px-4 py-2.5">
                                        {p.isCompleted ? (
                                          <span className="text-green-600 font-bold">✓ Yes</span>
                                        ) : (
                                          <span className="text-amber-600 font-bold">In Progress</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5">{Math.round((p.watchSeconds || 0) / 60)} min</td>
                                      <td className="px-4 py-2.5 text-muted">{p.lastWatchedAt ? new Date(p.lastWatchedAt).toLocaleDateString() : "N/A"}</td>
                                    </tr>
                                  ))}
                                  {(!monitoringDetails.progress || monitoringDetails.progress.length === 0) && (
                                    <tr>
                                      <td colSpan="4" className="px-4 py-6 text-center text-muted">No lesson progress logs recorded yet.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {activeMonitoringTab === "notes" && (
                          <div className="space-y-3">
                            {monitoringDetails.notes?.map((n) => (
                              <div key={n._id} className="rounded-2xl border border-black/5 p-4 bg-soft/20 text-ink">
                                <div className="flex justify-between items-center text-xs font-black text-muted mb-2">
                                  <span>Lesson: <strong className="text-ink">{n.lesson?.title || "General"}</strong></span>
                                  <span>Timestamp: {Math.floor((n.timestamp || 0) / 60)}m</span>
                                </div>
                                {n.title && <h4 className="font-bold text-ink mb-1 text-sm">{n.title}</h4>}
                                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{n.content}</p>
                                <span className="block mt-2 text-[10px] text-muted text-right font-semibold">Created: {new Date(n.createdAt).toLocaleString()}</span>
                              </div>
                            ))}
                            {(!monitoringDetails.notes || monitoringDetails.notes.length === 0) && (
                              <div className="py-12 text-center text-xs text-muted">No notes taken by this student in this course yet.</div>
                            )}
                          </div>
                        )}

                        {activeMonitoringTab === "comments" && (
                          <div className="space-y-3 text-ink">
                            {monitoringDetails.comments?.map((c) => (
                              <div key={c._id} className="rounded-2xl border border-black/5 p-4 bg-soft/20 text-ink">
                                <div className="text-xs font-black text-muted mb-2">
                                  Lesson: <strong className="text-ink">{c.lesson?.title || "General"}</strong> · Status: <span className="text-primary font-black uppercase">{c.status}</span>
                                </div>
                                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                {c.adminReply && (
                                  <div className="mt-3 bg-white rounded-xl border border-black/5 p-3 text-xs text-ink">
                                    <span className="font-bold text-primary block mb-1">Reply:</span>
                                    <p className="text-muted leading-relaxed">{c.adminReply}</p>
                                  </div>
                                )}
                                <span className="block mt-2 text-[10px] text-muted text-right font-semibold">Posted: {new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                            ))}
                            {(!monitoringDetails.comments || monitoringDetails.comments.length === 0) && (
                              <div className="py-12 text-center text-xs text-muted">No comments posted by this student in this course yet.</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-rose-500 font-semibold">Failed to load course monitoring data.</div>
                    )}
                  </div>
                )}

                {/* Book Orders */}
                <div className="border-t border-black/5 pt-5">
                  <h3 className="text-sm font-black text-ink uppercase tracking-wider text-muted mb-3">Book Orders</h3>
                  {learningDetails.bookOrders?.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-black/5 bg-soft/20">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-black/5 text-muted">
                            <th className="p-3">Order #</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Book</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {learningDetails.bookOrders.map((o) => (
                            <tr key={o._id} className="border-b border-black/5 last:border-none">
                              <td className="p-3 font-mono font-bold text-ink">{o.orderNumber}</td>
                              <td className="p-3 capitalize">{(o.orderType || o.type || "").toLowerCase()}</td>
                              <td className="p-3 font-medium">{o.bookTitleSnapshot || o.book?.title || o.bookId?.title || "Book"}</td>
                              <td className="p-3">{o.quantity}</td>
                              <td className="p-3 font-bold text-primary">₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</td>
                              <td className="p-3">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                  o.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                                  o.status === "confirmed" ? "bg-blue-50 text-blue-700" :
                                  o.status === "rejected" ? "bg-rose-50 text-rose-700" :
                                  "bg-amber-50 text-amber-700"
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-black/10 py-4 text-center text-xs text-muted">
                      No book orders placed by this user yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm font-semibold text-rose-500">Failed to load learning profile details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminResetRequestsPage = () => {
  const { items, setItems } = useList("/admin/password-reset-requests", []);
  const [passwords, setPasswords] = useState({});
  const [notice, setNotice] = useState("");
  const resolve = async (item, status) => {
    try {
      const data = await apiFetch(`/admin/password-reset-requests/${item._id}`, { method: "PUT", body: { status, temporaryPassword: passwords[item._id] } });
      setItems((old) => old.map((row) => row._id === item._id ? data.item : row));
      setNotice(data.message);
    } catch (error) {
      setNotice(error.message);
    }
  };
  return <div><SEO title="Password Reset Requests" /><h1 className="mb-2 text-3xl font-black">Password Reset Requests</h1><p className="mb-6 text-sm text-muted">Approve requests by setting a temporary password, or reject the request.</p>{notice && <p className="mb-4 rounded-xl bg-primary/10 p-3 text-sm font-bold text-primary">{notice}</p>}<div className="grid gap-4">{items.map((item) => <div key={item._id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><span className="rounded-full bg-soft px-3 py-1 text-xs font-black">{item.status}</span><h2 className="mt-2 text-xl font-black">{item.user?.name || item.email}</h2><p className="mt-1 text-sm text-muted">{item.email}</p><p className="mt-2 text-sm">{item.message || "No reason provided."}</p></div><div className="flex flex-wrap gap-2"><input value={passwords[item._id] || ""} onChange={(e) => setPasswords({ ...passwords, [item._id]: e.target.value })} placeholder="Temporary password" className="rounded-xl border border-black/10 px-4 py-2" /><button onClick={() => resolve(item, "approved")} className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white">Approve</button><button onClick={() => resolve(item, "rejected")} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-black">Reject</button></div></div></div>)}{items.length === 0 && <EmptyState title="No reset requests" subtitle="Requests sent by users will appear here." />}</div></div>;
};

export const AdminCommentsPage = () => {
  const { items, setItems } = useList("/admin/comments", []);
  const [replyTexts, setReplyTexts] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  const update = async (id, status) => {
    const data = await apiFetch(`/admin/comments/${id}`, { method: "PUT", body: { status } });
    setItems((old) => old.map((item) => item._id === id ? data.item : item));
  };

  const handleReplySubmit = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;

    setSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
    try {
      const data = await apiFetch(`/comments/${commentId}/reply`, {
        method: "POST",
        body: { replyText: text }
      });
      if (data.success) {
        setItems((old) => old.map((item) => item._id === commentId ? {
          ...item,
          status: "replied",
          adminReply: text,
          adminReplyAt: new Date()
        } : item));
        setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
      }
    } catch (e) {
      alert("Failed to submit reply: " + e.message);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  return (
    <div>
      <SEO title="Comments Moderation" />
      <h1 className="mb-6 text-3xl font-black">Comments Moderation</h1>
      <p className="mb-6 text-sm text-muted">Moderate devotee doubt comments, assign priorities, and submit replies to clear their doubts.</p>
      
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item._id} className="rounded-2xl bg-white p-6 shadow-sm border border-black/5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-soft px-3 py-1 text-xs font-black uppercase text-primary">
                      {item.user?.name || "Student"}
                    </span>
                    <span className="text-xs text-muted">
                      {item.course?.title} · {item.lesson?.title}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.priority === "urgent" ? "bg-red-100 text-red-700" :
                      item.priority === "high" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {item.priority || "medium"}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink font-semibold">
                    {item.text}
                  </p>
                  
                  {item.fileUrl && (
                    <div className="mt-3">
                      <a
                        href={assetUrl(item.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-soft px-3 py-1.5 text-xs font-bold text-ink border border-black/5 hover:bg-black/5 transition"
                      >
                        <FileText size={14} /> Attachment
                      </a>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-muted">
                    Posted on: {new Date(item.createdAt).toLocaleString()} · Status: <span className="font-bold">{item.status || "visible"}</span>
                  </p>
                </div>
                
                {/* Actions: Show/Hide */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => update(item._id, "hidden")}
                    className={`rounded-xl border px-4 py-2 text-xs font-black transition ${
                      item.status === "hidden" ? "bg-black text-white border-black" : "border-black/10 hover:bg-soft"
                    }`}
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => update(item._id, "visible")}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                      item.status !== "hidden" ? "bg-primary text-white" : "border border-black/10 hover:bg-soft"
                    }`}
                  >
                    Show
                  </button>
                </div>
              </div>

              {/* Admin reply section */}
              <div className="border-t border-black/5 pt-4 mt-2">
                {item.adminReply ? (
                  <div className="bg-soft/40 p-4 rounded-xl border border-black/5">
                    <p className="text-xs font-bold text-primary mb-1">Your reply:</p>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{item.adminReply}</p>
                    <p className="text-[10px] text-muted mt-2">
                      Replied on: {item.adminReplyAt ? new Date(item.adminReplyAt).toLocaleString() : "just now"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-muted">Write a Reply / Doubt Resolution:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyTexts[item._id] || ""}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        placeholder="Write reply text to student..."
                        className="flex-1 rounded-xl border border-black/10 bg-soft px-4 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                      <button
                        onClick={() => handleReplySubmit(item._id)}
                        disabled={submittingReply[item._id] || !(replyTexts[item._id] || "").trim()}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-white hover:bg-primary/95 disabled:opacity-50 transition shrink-0"
                      >
                        {submittingReply[item._id] ? "Submitting..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <EmptyState title="No comments found" subtitle="Devotee lesson comments will appear here." />
        )}
      </div>
    </div>
  );
};

export const AdminChatPage = () => {
  const { user, socket } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = () => {
    apiFetch("/chats").then((data) => setConversations(data.items || []));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadMessages = (convoId) => {
    apiFetch(`/chats/${convoId}/messages`).then((data) => {
      setMessages(data.items || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      loadConversations(); // refresh unread counts
    });
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (data) => {
      const roomId = data.room?._id || data.room;
      if (roomId === activeConversation?._id) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        // Mark as read
        apiFetch(`/chats/${roomId}/messages`).catch(() => {});
      } else {
        loadConversations();
      }
    };
    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [socket, activeConversation]);

  const handleSend = async (text, fileUrl = null, fileName = null, fileType = null) => {
    if (!text.trim() && !fileUrl) return;
    if (!activeConversation) return;
    try {
      const payload = {
        conversationId: activeConversation._id,
        courseId: activeConversation.course?._id,
        text,
        fileUrl,
        fileName,
        fileType
      };
      const tempMsg = {
        _id: Date.now().toString(),
        text,
        fileUrl,
        fileName,
        fileType,
        sender: user,
        createdAt: new Date(),
        status: "sent"
      };
      setMessages((prev) => [...prev, tempMsg]);
      setInputText("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      
      await apiFetch("/chats/send-message", { method: "POST", body: payload });
      loadConversations();
    } catch (e) {
      alert("Failed to send message: " + e.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadRes = await uploadFile(file, "chat");
      const url = uploadRes?.url || uploadRes;
      await handleSend("", url, file.name, file.type);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-3xl bg-white shadow-sm border border-black/5">
      {/* Left Sidebar: Conversations */}
      <div className="w-80 flex flex-col border-r border-black/5 bg-soft/10">
        <div className="p-5 border-b border-black/5 bg-white">
          <h2 className="text-xl font-black text-ink">Devotee Chats</h2>
          <p className="text-xs text-muted mt-1">Direct support query channels</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {conversations.map((c) => {
            const otherUser = c.participants.find((p) => p._id !== user._id) || c.participants[0] || {};
            const unread = c.unreadCounts?.[user._id] || 0;
            const isActive = activeConversation?._id === c._id;
            return (
              <div
                key={c._id}
                onClick={() => setActiveConversation(c)}
                className={`flex cursor-pointer items-center gap-3 p-4 transition ${isActive ? "bg-primary/5" : "hover:bg-soft/20"}`}
              >
                <div className="relative">
                  {otherUser.profileImage ? (
                    <img src={assetUrl(otherUser.profileImage)} className="h-10 w-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary uppercase">
                      {otherUser.name?.charAt(0) || "D"}
                    </div>
                  )}
                  {otherUser.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h3 className="truncate text-sm font-bold text-ink">{otherUser.name || "Devotee"}</h3>
                    <span className="text-[9px] text-muted">{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="truncate text-xs text-muted flex-1 pr-2">{c.lastMessage || "No messages yet"}</p>
                    {unread > 0 && <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white">{unread}</span>}
                  </div>
                  <p className="text-[10px] text-primary/70 font-semibold truncate mt-1">{c.course?.title ? `Course: ${c.course.title}` : "General question"}</p>
                </div>
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div className="text-center py-12 text-muted text-xs">No support chats found yet.</div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex flex-1 flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 shadow-sm z-10 bg-white">
              <div>
                <h3 className="font-black text-ink">{activeConversation.participants.find(p => p._id !== user._id)?.name || "Devotee"}</h3>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                  Context: <span className="font-bold text-primary">{activeConversation.course?.title}</span>
                </p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-soft/5">
              {messages.map((m) => {
                const isMe = m.sender?._id === user?._id;
                return (
                  <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-white rounded-br-sm shadow-sm" : "bg-white text-ink border border-black/5 rounded-bl-sm shadow-sm"}`}>
                      {m.fileUrl ? (
                        m.fileType?.startsWith("image/") ? (
                          <a href={assetUrl(m.fileUrl)} target="_blank" rel="noreferrer">
                            <img src={assetUrl(m.fileUrl)} alt="Attachment" className="mb-2 max-h-48 rounded-lg object-cover" />
                          </a>
                        ) : (
                          <a href={assetUrl(m.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline mb-2 text-xs font-black">
                            <FileText size={16} /> {m.fileName}
                          </a>
                        )
                      ) : null}
                      {m.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                      <div className={`mt-1 text-[9px] text-right ${isMe ? "text-white/70" : "text-muted"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {isMe && <span className="ml-1 font-bold">{m.status === "read" ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-black/5 bg-white p-4">
              <div className="flex items-center gap-2 relative">
                <label className={`cursor-pointer rounded-full p-2.5 text-muted hover:bg-soft transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                  <ImageIcon size={20} />
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                  placeholder={uploading ? "Uploading attachment..." : "Reply to devotee student..."}
                  disabled={uploading}
                  className="flex-1 rounded-full border border-black/10 bg-soft px-5 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => handleSend(inputText)}
                  disabled={!inputText.trim() && !uploading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted p-6 text-center">
            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-lg font-black text-ink">Devotee Support Chat Desk</h3>
            <p className="text-xs text-muted max-w-sm mt-1">Select a student conversation from the left channel list to read and respond to direct questions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminModerationList = ({ title, items, update, renderText, meta, actionLabel = "Hide" }) => (
  <div><SEO title={title} /><h1 className="mb-6 text-3xl font-black">{title}</h1><div className="grid gap-4">{items.map((item) => <div key={item._id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-black uppercase tracking-wide text-primary">{meta(item)}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{renderText(item)}</p><p className="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString()} · {item.status || (item.deletedAt ? "deleted" : "visible")}</p></div><div className="flex gap-2"><button onClick={() => update(item._id, "hidden")} className="rounded-xl border border-black/10 px-4 py-2 text-xs font-black">{actionLabel}</button>{actionLabel !== "Delete" && <button onClick={() => update(item._id, "visible")} className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-white">Show</button>}</div></div></div>)}{items.length === 0 && <EmptyState title="Nothing to moderate" subtitle="New comments or chat messages will appear here." />}</div></div>
);

const adminConfig = {
  users: { title: "Users", fields: ["name", "email", "phone", "role", "password", "status"] },
  "home-sections": { title: "Home Sections", fields: ["pageName", "sectionKey", "sectionTitle", "sectionSubtitle", "content", "image", "videoUrl", "buttonText", "buttonLink", "sortOrder", "status"] },
  "video-intro": { title: "Video Intro", fields: ["sectionTitle", "sectionSubtitle", "videoUrl", "image"] },
  "about-sections": { title: "About Sections", fields: ["sectionTitle", "sectionSubtitle", "description", "image", "buttonText", "buttonLink", "sortOrder", "status"] },
  pages: { title: "Pages", fields: ["title", "slug", "bannerImage", "excerpt", "content", "status"] },
  courses: { title: "Courses", fields: ["title", "slug", "thumbnail", "bannerImage", "shortDescription", "description", "category", "level", "teacher", "duration", "priceType", "price", "enrollmentType", "verificationInstructions", "requiredDocumentName", "allowedFileTypes", "maxFileSize", "featured", "showOnHomepage", "status", "seoTitle", "seoDescription", "seoKeywords"] },
  lessons: { title: "Lessons", fields: ["course", "title", "slug", "description", "videoType", "videoUrl", "uploadedVideo", "thumbnail", "pdfFile", "attachmentFile", "duration", "sortOrder", "isPreview", "status"] },
  "upcoming-classes": { title: "Upcoming Classes", fields: ["title", "slug", "image", "date", "time", "venue", "speaker", "shortDescription", "fullDescription", "status", "buttonText", "buttonLink", "sortOrder"] },
  preachers: { title: "Preachers", fields: ["name", "slug", "image", "designation", "shortBio", "fullBio", "experience", "specialization", "email", "phone", "status", "showOnHomepage", "sortOrder"] },
  visionaries: { title: "Visionaries", fields: ["name", "slug", "type", "image", "designation", "shortBio", "fullBio", "experience", "specialization", "email", "phone", "status", "showOnHomepage", "sortOrder"] },
  blogs: { title: "Blogs", fields: ["title", "slug", "image", "shortDescription", "content", "listItems", "category", "tags", "status", "featured", "showOnHomepage", "seoTitle", "seoDescription", "seoKeywords"] },
  "video-blogs": { title: "Video Blogs", fields: ["title", "slug", "videoType", "videoUrl", "uploadedVideo", "thumbnail", "duration", "speaker", "shortDescription", "description", "category", "tags", "status", "featured", "showOnHomepage", "sortOrder", "seoTitle", "seoDescription"] },
  "media/images": { title: "Image Gallery", fields: ["title", "image", "category", "description", "status", "showInMediaHighlight", "sortOrder"] },
  "media/videos": { title: "Video Gallery", fields: ["title", "thumbnail", "videoUrl", "description", "category", "status", "showInMediaHighlight", "sortOrder"] },
  subscribers: { title: "Subscribers", fields: ["email", "status"] },
  "contact-messages": { title: "Contact Messages", fields: ["name", "email", "phone", "subject", "classTitle", "message", "status"] },
  "legal-pages": { title: "Legal Pages", fields: ["title", "slug", "content", "status", "seoTitle", "seoDescription"] },
  pilgrimages: { title: "Pilgrimages", fields: ["title", "slug", "badge", "image", "bannerImage", "route", "routeDetail", "days", "nights", "visitDetail", "guideDetail", "pricePerPerson", "maxTravellers", "startDate", "endDate", "shortDescription", "description", "paymentInstructions", "featured", "showOnHomepage", "status", "sortOrder"] },
  "booking-taxes": { title: "Booking Taxes & Charges", fields: ["label", "type", "value", "appliesTo", "note", "status", "sortOrder"] }
};

const fieldType = (field) => {
  if (["content", "description", "fullDescription", "shortDescription", "bio", "fullBio", "message", "excerpt", "verificationInstructions", "paymentInstructions", "visitDetail", "note"].includes(field)) return "textarea";
  if (["featured", "showOnHomepage", "isPreview", "showInMediaHighlight"].includes(field)) return "checkbox";
  if (["thumbnail", "bannerImage", "image", "uploadedVideo", "pdfFile", "attachmentFile"].includes(field)) return "file";
  if (["price", "sortOrder", "maxFileSize", "pricePerPerson", "maxTravellers", "days", "nights", "value"].includes(field)) return "number";
  if (["date", "startDate", "endDate"].includes(field)) return "date";
  return "text";
};

const normalizeForm = (form, fields) => {
  const data = { ...form };
  fields.forEach((field) => {
    if (["tags", "seoKeywords", "listItems", "specialization", "expertise", "allowedFileTypes"].includes(field) && typeof data[field] === "string") data[field] = data[field].split(",").map((item) => item.trim()).filter(Boolean);
    if (["featured", "showOnHomepage", "isPreview", "showInMediaHighlight"].includes(field)) data[field] = Boolean(data[field]);
    if (["price", "sortOrder", "maxFileSize", "pricePerPerson", "maxTravellers", "days", "nights", "value"].includes(field) && data[field] !== "" && data[field] !== undefined) data[field] = Number(data[field]);
  });
  return data;
};

const textValue = (value) => value ?? "";
const numberValue = (value) => (value === undefined || value === null ? "" : value);
const boolValue = (value, fallback = true) => (value === undefined || value === null ? fallback : Boolean(value));
const fieldLabel = (field) => field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

export const getMediaSizeRecommendation = (folder = "", label = "") => {
  const f = (folder || "").toLowerCase();
  const l = (label || "").toLowerCase();

  // Banners
  if (f.includes("banner") || l.includes("banner")) {
    if (l.includes("desktop") || l.includes("laptop")) return "Recommended: 1920 × 1080 px (16:9 ratio) or 1920 × 800 px";
    if (l.includes("tablet")) return "Recommended: 1200 × 800 px (3:2 ratio) or 1024 × 768 px (4:3 ratio)";
    if (l.includes("mobile")) return "Recommended: 800 × 1000 px (4:5 ratio) or 750 × 1000 px (3:4 ratio)";
    return "Recommended: 1920 × 1080 px (16:9 widescreen)";
  }

  // QR Codes
  if (f.includes("qr") || l.includes("qr")) {
    return "Recommended: 500 × 500 px (1:1 square ratio) • High contrast JPG or PNG";
  }

  // Courses
  if (f.includes("courses")) {
    if (l.includes("qr")) return "Recommended: 500 × 500 px (1:1 square ratio) • High contrast JPG or PNG";
    if (l.includes("banner")) return "Recommended: 1920 × 800 px (hero course banner)";
    return "Recommended: 1280 × 720 px (16:9 widescreen) or 800 × 450 px";
  }

  // Videos
  if (f.includes("video") || l.includes("video")) {
    if (l.includes("thumbnail") || l.includes("poster")) return "Recommended: 1280 × 720 px (16:9 widescreen)";
    return "Recommended: 1080p (1920 × 1080) or 720p • MP4, WebM (Max 30MB)";
  }

  // PDFs & Handouts
  if (f.includes("pdf") || l.includes("pdf") || l.includes("attachment") || l.includes("handout") || l.includes("guide")) {
    return "Recommended: Standard PDF Document (Max 15MB)";
  }

  // Teachers / Preachers / Visionaries / Speakers
  if (f.includes("preacher") || f.includes("teacher") || f.includes("visionar") || l.includes("teacher") || l.includes("speaker") || l.includes("profile") || l.includes("preacher")) {
    return "Recommended: 600 × 600 px (1:1 square ratio) or 800 × 800 px";
  }

  // Books
  if (f.includes("book") || l.includes("book") || l.includes("cover")) {
    return "Recommended: 600 × 900 px (2:3 portrait book ratio) or 800 × 1200 px";
  }

  // Blogs
  if (f.includes("blog") || l.includes("blog")) {
    return "Recommended: 1200 × 630 px (landscape ratio) • JPG, WebP";
  }

  // Classes / Trips / Pilgrimages
  if (f.includes("trip") || f.includes("pilgrim") || f.includes("class")) {
    if (l.includes("banner")) return "Recommended: 1920 × 800 px (panoramic hero)";
    if (l.includes("day")) return "Recommended: 600 × 400 px (3:2 ratio)";
    if (l.includes("gallery")) return "Recommended: 1200 × 900 px (4:3 ratio) or 1200 × 800 px (3:2 ratio)";
    return "Recommended: 1200 × 800 px (3:2 ratio) or 1920 × 1080 px (16:9)";
  }

  // Thumbnails generic
  if (l.includes("thumbnail")) {
    return "Recommended: 1280 × 720 px (16:9 widescreen)";
  }

  return "";
};

const FileField = ({ label, value, folder, accept, onChange, hint }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const sizeHint = hint || getMediaSizeRecommendation(folder, label);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadFile(file, folder);
      onChange(uploaded.url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <label className="grid gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span>{label}</span>
        {sizeHint && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200/70">
            📐 {sizeHint}
          </span>
        )}
      </div>
      <input type="file" accept={accept} onChange={(event) => upload(event.target.files?.[0])} className="text-sm font-normal" />
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Uploaded URL" className="rounded-lg border border-black/10 px-3 py-2 text-sm font-normal" />
      {uploading && <span className="text-xs text-primary">Uploading...</span>}
      {error && <span className="text-xs text-rose-600">{error}</span>}
      {value && <a href={assetUrl(value)} target="_blank" rel="noreferrer" className="text-xs font-black text-primary">Preview uploaded file</a>}
    </label>
  );
};

export const AdminBannersPage = () => {
  const empty = { title: "", subtitle: "", buttonText: "", buttonLink: "", desktopImage: "", tabletImage: "", mobileImage: "", order: 0, isActive: true };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  const load = () => apiFetch("/banners").then((data) => setItems(data.items || [])).catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditing(null);
    setForm(empty);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const body = { ...form, order: Number(form.order || 0), isActive: Boolean(form.isActive) };
      await apiFetch(editing ? `/banners/${editing}` : "/banners", { method: editing ? "PUT" : "POST", body });
      setNotice(editing ? "Banner updated successfully." : "Banner created successfully.");
      reset();
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const edit = (item) => {
    setEditing(item._id);
    setForm({ ...empty, ...item, isActive: boolValue(item.isActive) });
  };

  const remove = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await apiFetch(`/banners/${id}`, { method: "DELETE" });
    load();
  };

  const toggle = async (item) => {
    await apiFetch(`/banners/${item._id}`, { method: "PUT", body: { isActive: !item.isActive } });
    load();
  };

  return (
    <div>
      <SEO title="Hero Banners - Admin" />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-3xl font-black">Hero Banners</h1><p className="mt-1 text-sm text-muted">Upload separate desktop, tablet, and mobile slides for the homepage hero.</p></div><button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-black text-white"><Plus size={16} />New Banner</button></div>
      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{editing ? "Edit Banner" : "Create Banner"}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-black text-primary">Cancel</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <input value={textValue(form.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Optional title" className="rounded-xl border border-black/10 px-4 py-3" />
          <input value={textValue(form.subtitle)} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Optional subtitle" className="rounded-xl border border-black/10 px-4 py-3" />
          <input value={textValue(form.buttonText)} onChange={(event) => setForm({ ...form, buttonText: event.target.value })} placeholder="Optional button text" className="rounded-xl border border-black/10 px-4 py-3" />
          <input value={textValue(form.buttonLink)} onChange={(event) => setForm({ ...form, buttonLink: event.target.value })} placeholder="Optional button link" className="rounded-xl border border-black/10 px-4 py-3" />
          <FileField label="Desktop / Laptop image" value={form.desktopImage} folder="banners" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(value) => setForm({ ...form, desktopImage: value })} />
          <FileField label="Tablet image" value={form.tabletImage} folder="banners" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(value) => setForm({ ...form, tabletImage: value })} />
          <FileField label="Mobile image" value={form.mobileImage} folder="banners" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(value) => setForm({ ...form, mobileImage: value })} />
          <div className="grid gap-4">
            <input type="number" value={numberValue(form.order)} onChange={(event) => setForm({ ...form, order: event.target.value })} placeholder="Order number" className="rounded-xl border border-black/10 px-4 py-3" />
            <label className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold"><input type="checkbox" checked={boolValue(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
          </div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white"><Save size={16} />Save Banner</button>{notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}
      </form>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item._id} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-[180px_1fr_auto] lg:items-center">
            <img src={assetUrl(item.desktopImage)} alt={item.title || "Hero banner"} className="aspect-[16/9] w-full rounded-xl object-cover" />
            <div><div className="flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-soft px-3 py-1">Order {item.order || 0}</span><span className={`rounded-full px-3 py-1 ${item.isActive ? "bg-primary/10 text-primary" : "bg-black/5 text-muted"}`}>{item.isActive ? "Active" : "Inactive"}</span></div><h3 className="mt-2 text-xl font-black">{item.title || "Image only banner"}</h3><p className="mt-1 text-sm text-muted">{item.subtitle}</p></div>
            <div className="flex gap-2 lg:justify-end"><button onClick={() => toggle(item)} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-black">{item.isActive ? "Disable" : "Enable"}</button><button onClick={() => edit(item)} className="rounded-lg border border-black/10 p-2"><Edit size={16} /></button><button onClick={() => remove(item._id)} className="rounded-lg border border-red-200 p-2 text-primary"><Trash2 size={16} /></button></div>
          </div>
        ))}
        {items.length === 0 && <EmptyState title="No banners yet" subtitle="Create a banner to show it on the homepage slider." />}
      </div>
    </div>
  );
};

export const AdminCoursesPage = () => {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const empty = {
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    thumbnail: "",
    category: "",
    duration: "",
    level: "Beginner",
    price: 0,
    isFree: true,
    isActive: true,
    order: 0,
    showOnHomepage: true,
    featured: false,
    enrollmentType: ["free"],
    verificationInstructions: "",
    requiredDocumentName: "",
    allowedFileTypes: ".pdf, .jpg, .jpeg, .png",
    maxFileSize: 5,
    paymentQrCode: ""
  };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  const [teachers, setTeachers] = useState([]);
  const [assigningTeacherFor, setAssigningTeacherFor] = useState(null);

  const load = () => {
    apiFetch("/courses").then((data) => setItems(data.items || [])).catch((error) => setNotice(error.message));
    apiFetch("/admin/teachers").then((data) => setTeachers(data.items || [])).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditing(null);
    setForm(empty);
  };

  const handleEnrollmentTypeChange = (type, checked) => {
    let current = Array.isArray(form.enrollmentType)
      ? form.enrollmentType
      : [form.enrollmentType || "free"];
    
    if (checked) {
      if (!current.includes(type)) {
        current = [...current, type];
      }
    } else {
      current = current.filter((t) => t !== type);
    }
    
    if (current.length === 0) {
      current = ["free"];
    }

    setForm({
      ...form,
      enrollmentType: current,
      isFree: !current.includes("paid"),
      price: current.includes("paid") ? form.price : 0
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editing && !canEdit("courses")) {
      setNotice("You do not have permission to edit courses.");
      return;
    }
    if (!editing && !canCreate("courses")) {
      setNotice("You do not have permission to create courses.");
      return;
    }
    try {
      const enrollmentTypes = Array.isArray(form.enrollmentType)
        ? form.enrollmentType
        : [form.enrollmentType || "free"];
      const body = {
        ...form,
        enrollmentType: enrollmentTypes,
        price: Number(form.price || 0),
        order: Number(form.order || 0),
        isFree: !enrollmentTypes.includes("paid"),
        isActive: Boolean(form.isActive),
        showOnHomepage: Boolean(form.showOnHomepage),
        featured: Boolean(form.featured),
        allowedFileTypes: typeof form.allowedFileTypes === "string"
          ? form.allowedFileTypes.split(",").map((t) => t.trim()).filter(Boolean)
          : form.allowedFileTypes,
        maxFileSize: Number(form.maxFileSize || 5)
      };
      await apiFetch(editing ? `/courses/${editing}` : "/courses", { method: editing ? "PUT" : "POST", body });
      setNotice(editing ? "Course updated successfully." : "Course created successfully.");
      reset();
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const edit = (item) => {
    setEditing(item._id);
    const itemEnrollmentTypes = Array.isArray(item.enrollmentType)
      ? item.enrollmentType
      : [item.enrollmentType || "free"];
    setForm({
      ...empty,
      ...item,
      allowedFileTypes: Array.isArray(item.allowedFileTypes) ? item.allowedFileTypes.join(", ") : (item.allowedFileTypes || ".pdf, .jpg, .jpeg, .png"),
      enrollmentType: itemEnrollmentTypes,
      isFree: item.isFree ?? !itemEnrollmentTypes.includes("paid"),
      isActive: boolValue(item.isActive),
      showOnHomepage: Boolean(item.showOnHomepage),
      featured: Boolean(item.featured)
    });
  };

  const remove = async (id) => {
    if (!canDelete("courses")) {
      setNotice("You do not have permission to delete courses.");
      return;
    }
    if (!confirm("Delete this course and all of its lessons?")) return;
    await apiFetch(`/courses/${id}`, { method: "DELETE" });
    load();
  };

  const toggle = async (item) => {
    if (!canEdit("courses")) {
      setNotice("You do not have permission to edit courses.");
      return;
    }
    await apiFetch(`/courses/${item._id}`, { method: "PUT", body: { isActive: !item.isActive } });
    load();
  };

  return (
    <div>
      <SEO title="Courses - Admin" />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-3xl font-black">Courses</h1><p className="mt-1 text-sm text-muted">Create course shells, then manage unlimited lessons inside each course.</p></div>{canCreate("courses") && <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-black text-white"><Plus size={16} />New Course</button>}</div>
      {(editing ? canEdit("courses") : canCreate("courses")) && (
      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{editing ? "Edit Course" : "Create Course"}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-black text-primary">Cancel</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <input value={textValue(form.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="Course title" className="rounded-xl border border-black/10 px-4 py-3" />
          <input value={textValue(form.slug)} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Course slug" className="rounded-xl border border-black/10 px-4 py-3" />
          <textarea value={textValue(form.shortDescription)} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder="Short description" rows="3" className="rounded-xl border border-black/10 px-4 py-3 md:col-span-2" />
          <div className="md:col-span-2">
            <textarea rows="8" value={textValue(form.description)} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Full course description" className="w-full rounded-xl border border-slate-200 bg-white p-3" />
          </div>
          
          <div className="grid gap-1 md:col-span-2">
            <span className="text-xs font-black uppercase text-muted block mb-1">Enrollment Type(s)</span>
            <div className="flex flex-wrap gap-5 mt-1 rounded-xl border border-black/10 px-4 py-3 bg-soft/10">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-ink">
                <input
                  type="checkbox"
                  checked={(() => {
                    const types = Array.isArray(form.enrollmentType) ? form.enrollmentType : [form.enrollmentType || "free"];
                    return types.includes("free");
                  })()}
                  onChange={(e) => handleEnrollmentTypeChange("free", e.target.checked)}
                  className="rounded border-black/15 text-primary focus:ring-primary w-4 h-4"
                />
                Free Course (Direct Enroll)
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-ink">
                <input
                  type="checkbox"
                  checked={(() => {
                    const types = Array.isArray(form.enrollmentType) ? form.enrollmentType : [form.enrollmentType || "free"];
                    return types.includes("verification");
                  })()}
                  onChange={(e) => handleEnrollmentTypeChange("verification", e.target.checked)}
                  className="rounded border-black/15 text-primary focus:ring-primary w-4 h-4"
                />
                Document Verification Required
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-ink">
                <input
                  type="checkbox"
                  checked={(() => {
                    const types = Array.isArray(form.enrollmentType) ? form.enrollmentType : [form.enrollmentType || "free"];
                    return types.includes("paid");
                  })()}
                  onChange={(e) => handleEnrollmentTypeChange("paid", e.target.checked)}
                  className="rounded border-black/15 text-primary focus:ring-primary w-4 h-4"
                />
                Paid Course (Future Payment Ready)
              </label>
            </div>
          </div>

          {((Array.isArray(form.enrollmentType) ? form.enrollmentType : [form.enrollmentType || "free"]).includes("verification")) && (
            <div className="grid gap-4 md:grid-cols-2 md:col-span-2 border-t border-black/5 pt-4 mt-2">
              <h4 className="text-sm font-black text-ink md:col-span-2">Verification Configuration</h4>
              
              <label className="grid gap-1 md:col-span-2">
                <span className="text-xs font-black uppercase text-muted">Required Document Name / Label</span>
                <input
                  value={textValue(form.requiredDocumentName)}
                  onChange={(event) => setForm({ ...form, requiredDocumentName: event.target.value })}
                  placeholder="e.g. Letter of Recommendation"
                  className="rounded-xl border border-black/10 px-4 py-3"
                />
              </label>

              <label className="grid gap-1 md:col-span-2">
                <span className="text-xs font-black uppercase text-muted">Verification Instructions for Student</span>
                <textarea
                  value={textValue(form.verificationInstructions)}
                  onChange={(event) => setForm({ ...form, verificationInstructions: event.target.value })}
                  placeholder="Instructions explaining what document is required and how admin will verify it..."
                  rows="3"
                  className="rounded-xl border border-black/10 px-4 py-3"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-black uppercase text-muted">Allowed File Extensions (Comma-separated)</span>
                <input
                  value={textValue(form.allowedFileTypes)}
                  onChange={(event) => setForm({ ...form, allowedFileTypes: event.target.value })}
                  placeholder="e.g. .pdf, .jpg, .jpeg, .png"
                  className="rounded-xl border border-black/10 px-4 py-3"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-black uppercase text-muted">Maximum File Size (MB)</span>
                <input
                  type="number"
                  value={numberValue(form.maxFileSize)}
                  onChange={(event) => setForm({ ...form, maxFileSize: event.target.value })}
                  placeholder="e.g. 5"
                  className="rounded-xl border border-black/10 px-4 py-3"
                />
              </label>
            </div>
          )}

          {((Array.isArray(form.enrollmentType) ? form.enrollmentType : [form.enrollmentType || "free"]).includes("paid")) && (
            <div className="grid gap-4 md:grid-cols-2 md:col-span-2 border-t border-black/5 pt-4 mt-2">
              <h4 className="text-sm font-black text-ink md:col-span-2">Payment Configuration</h4>
              <div className="md:col-span-2">
                <FileField 
                  label="Payment QR Code / Bank Details Image (Optional)" 
                  value={form.paymentQrCode} 
                  folder="courses/qrcodes" 
                  accept=".jpg,.jpeg,.png,.webp" 
                  onChange={(value) => setForm({ ...form, paymentQrCode: value })} 
                />
              </div>
            </div>
          )}

          <FileField label="Course thumbnail" value={form.thumbnail} folder="courses" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(value) => setForm({ ...form, thumbnail: value, bannerImage: value })} />
          <div className="grid gap-4">
            <input value={textValue(form.category)} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" className="rounded-xl border border-black/10 px-4 py-3" />
            <input value={textValue(form.duration)} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="Duration" className="rounded-xl border border-black/10 px-4 py-3" />
          </div>
          <select value={form.level || "Beginner"} onChange={(event) => setForm({ ...form, level: event.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          <input type="number" value={numberValue(form.order)} onChange={(event) => setForm({ ...form, order: event.target.value })} placeholder="Order number" className="rounded-xl border border-black/10 px-4 py-3" />
          <input type="number" value={numberValue(form.price)} onChange={(event) => setForm({ ...form, price: event.target.value })} disabled={!((Array.isArray(form.enrollmentType) ? form.enrollmentType : [form.enrollmentType || "free"]).includes("paid"))} placeholder="Price" className="rounded-xl border border-black/10 px-4 py-3 disabled:bg-soft" />
          <div className="grid gap-3 rounded-xl border border-black/10 p-4 text-sm font-bold">
            <label className="flex items-center gap-3"><input type="checkbox" checked={boolValue(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(form.showOnHomepage)} onChange={(event) => setForm({ ...form, showOnHomepage: event.target.checked })} />Show on homepage</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />Featured</label>
          </div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white"><Save size={16} />Save Course</button>{notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}
      </form>
      )}
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item._id} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-[150px_1fr_auto] lg:items-center">
            <img src={assetUrl(item.thumbnail || item.bannerImage)} alt={item.title} className="aspect-[4/3] w-full rounded-xl object-cover" />
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full bg-soft px-3 py-1">Order {item.order || 0}</span>
                <span className={`rounded-full px-3 py-1 ${item.isActive ? "bg-primary/10 text-primary" : "bg-black/5 text-muted"}`}>{item.isActive ? "Active" : "Inactive"}</span>
                {(() => {
                  const types = Array.isArray(item.enrollmentType) ? item.enrollmentType : [item.enrollmentType || "free"];
                  return types.map((t) => {
                    if (t === "verification") {
                      return <span key={t} className="rounded-full px-3 py-1 bg-amber-100 text-amber-800">Verification Required</span>;
                    }
                    if (t === "paid") {
                      return <span key={t} className="rounded-full px-3 py-1 bg-blue-100 text-blue-800">Paid (₹{item.price || 0})</span>;
                    }
                    return <span key={t} className="rounded-full px-3 py-1 bg-emerald-100 text-emerald-800">Free</span>;
                  });
                })()}
              </div>
              <h3 className="mt-2 text-xl font-black">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.shortDescription || item.category}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {canEdit("teachers") && (
                <button onClick={() => setAssigningTeacherFor(item)} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-black text-primary hover:bg-primary/5">Assign Teacher</button>
              )}
              <Link to={`/admin/courses/${item._id}/lessons`} className="rounded-lg bg-primary px-3 py-2 text-sm font-black text-white hover:bg-primary/90">Manage Lessons</Link>
              {canEdit("courses") && (
                <button onClick={() => toggle(item)} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-black hover:bg-black/5">{item.isActive ? "Disable" : "Enable"}</button>
              )}
              {canEdit("courses") && (
                <button onClick={() => edit(item)} className="rounded-lg border border-black/10 p-2 hover:bg-black/5"><Edit size={16} /></button>
              )}
              {canDelete("courses") && (
                <button onClick={() => remove(item._id)} className="rounded-lg border border-red-200 p-2 text-primary hover:bg-red-50"><Trash2 size={16} /></button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState title="No courses yet" subtitle="Create your first course, then add lessons inside it." />}
      </div>

      {assigningTeacherFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black mb-1">Assign Preacher</h3>
            <p className="mb-4 text-sm text-muted">Course: {assigningTeacherFor.title}</p>
            
            <label className="block text-xs font-black uppercase text-muted mb-1">Primary Teacher</label>
            <select 
              value={assigningTeacherFor.primaryTeacherId || ""}
              onChange={(e) => setAssigningTeacherFor({ ...assigningTeacherFor, primaryTeacherId: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-4 py-3 mb-6 font-semibold"
            >
              <option value="">-- No Teacher Assigned --</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
            </select>

            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
              <button onClick={() => setAssigningTeacherFor(null)} className="rounded-lg px-4 py-2 text-sm font-black text-muted hover:bg-black/5 transition">Cancel</button>
              <button onClick={async () => {
                 try {
                   await apiFetch(`/admin/courses/${assigningTeacherFor._id}/assign-teacher`, {
                     method: "POST",
                     body: { primaryTeacherId: assigningTeacherFor.primaryTeacherId || null }
                   });
                   setAssigningTeacherFor(null);
                   load();
                 } catch(err) {
                   alert(err.message);
                 }
              }} className="rounded-lg bg-primary px-5 py-2 text-sm font-black text-white hover:bg-primary/90 transition">Save Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminCourseLessonsPage = () => {
  const { courseId } = useParams();
  const empty = { title: "", description: "", videoType: "youtube", youtubeUrl: "", uploadedVideo: "", pdfFile: "", duration: "", order: 0, isActive: true, commentsEnabled: true, notesEnabled: true, chatEnabled: true, completionThreshold: 80, videoSettings: { disableSeeking: true, enableCompleteButton: true, completionThreshold: 80 }, quizSettings: { hasQuiz: false, passPercentage: 80, questionsPerAttempt: 5 } };
  const [course, setCourse] = useState(null);
  const [items, setItems] = useState([]);
  const [examPapers, setExamPapers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  const load = () => {
    apiFetch(`/courses/${courseId}`).then((data) => setCourse(data.course)).catch((error) => setNotice(error.message));
    apiFetch(`/courses/${courseId}/lessons`).then((data) => setItems(data.items || data.lessons || [])).catch((error) => setNotice(error.message));
    apiFetch("/admin/exam-papers").then(data => setExamPapers(data.items || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [courseId]);

  const reset = () => {
    setEditing(null);
    setForm(empty);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const body = { ...form, order: Number(form.order || 0), completionThreshold: Number(form.completionThreshold || 80), isActive: Boolean(form.isActive), commentsEnabled: Boolean(form.commentsEnabled), notesEnabled: Boolean(form.notesEnabled), chatEnabled: Boolean(form.chatEnabled) };
      if (!body.examPaper || body.examPaper === "") {
        body.examPaper = null;
      }
      await apiFetch(editing ? `/lessons/${editing}` : `/courses/${courseId}/lessons`, { method: editing ? "PUT" : "POST", body });
      setNotice(editing ? "Lesson updated successfully." : "Lesson created successfully.");
      reset();
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const edit = (item) => {
    setEditing(item._id);
    setForm({ ...empty, ...item, examPaper: item.examPaper || "", videoType: item.videoType === "uploaded" ? "upload" : item.videoType || "youtube", youtubeUrl: item.youtubeUrl || item.videoUrl || "", isActive: boolValue(item.isActive), order: item.order ?? item.sortOrder ?? 0, commentsEnabled: boolValue(item.commentsEnabled), notesEnabled: boolValue(item.notesEnabled), chatEnabled: boolValue(item.chatEnabled), completionThreshold: item.completionThreshold || 80, videoSettings: item.videoSettings || empty.videoSettings, quizSettings: item.quizSettings || empty.quizSettings });
  };

  const remove = async (id) => {
    if (!confirm("Delete this lesson?")) return;
    await apiFetch(`/lessons/${id}`, { method: "DELETE" });
    load();
  };

  const toggle = async (item) => {
    await apiFetch(`/lessons/${item._id}`, { method: "PUT", body: { isActive: !item.isActive } });
    load();
  };

  return (
    <div>
      <SEO title="Course Lessons - Admin" />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><Link to="/admin/courses" className="text-sm font-black text-primary">Back to courses</Link><h1 className="mt-2 text-3xl font-black">Manage Lessons</h1><p className="mt-1 text-sm text-muted">{course?.title || "Course"} lessons and downloadable files.</p></div><button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-black text-white"><Plus size={16} />New Lesson</button></div>
      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{editing ? "Edit Lesson" : "Create Lesson"}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-black text-primary">Cancel</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <input value={textValue(form.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="Lesson title" className="rounded-xl border border-black/10 px-4 py-3" />
          <input type="number" value={numberValue(form.order)} onChange={(event) => setForm({ ...form, order: event.target.value })} placeholder="Order number" className="rounded-xl border border-black/10 px-4 py-3" />
          <input value={textValue(form.duration)} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="Lesson duration" className="rounded-xl border border-black/10 px-4 py-3" />
          <input type="number" value={numberValue(form.completionThreshold)} onChange={(event) => setForm({ ...form, completionThreshold: event.target.value })} placeholder="Completion threshold %" className="rounded-xl border border-black/10 px-4 py-3" />
          <div className="md:col-span-2">
            <textarea rows="8" value={textValue(form.description)} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Lesson description" className="w-full rounded-xl border border-slate-200 bg-white p-3" />
          </div>
          <select value={form.videoType || "youtube"} onChange={(event) => setForm({ ...form, videoType: event.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option value="youtube">YouTube URL</option><option value="upload">Upload video</option></select>
          <label className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold"><input type="checkbox" checked={boolValue(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
          {form.videoType === "youtube" ? <input value={textValue(form.youtubeUrl)} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value, videoUrl: event.target.value })} placeholder="YouTube video URL" className="rounded-xl border border-black/10 px-4 py-3 md:col-span-2" /> : <FileField label="Uploaded video" value={form.uploadedVideo} folder="lessons/videos" accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime" onChange={(value) => setForm({ ...form, uploadedVideo: value })} />}
          <FileField label="PDF attachment" value={form.pdfFile} folder="lessons/pdfs" accept=".pdf,application/pdf" onChange={(value) => setForm({ ...form, pdfFile: value })} />
          
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-muted mb-1 block">Attach Exam Paper (Optional)</label>
            <select value={form.examPaper || ""} onChange={(e) => setForm({ ...form, examPaper: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary">
              <option value="">-- No Exam Attached --</option>
              {examPapers.map(ep => (
                <option key={ep._id} value={ep._id}>{ep.title}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 rounded-xl border border-black/10 p-4 text-sm font-bold">
            <label className="flex items-center gap-3"><input type="checkbox" checked={boolValue(form.commentsEnabled)} onChange={(event) => setForm({ ...form, commentsEnabled: event.target.checked })} />Enable comments</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={boolValue(form.notesEnabled)} onChange={(event) => setForm({ ...form, notesEnabled: event.target.checked })} />Enable notes</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={boolValue(form.chatEnabled)} onChange={(event) => setForm({ ...form, chatEnabled: event.target.checked })} />Enable chat</label>
          </div>
          
          {/* LMS Settings */}
          <div className="md:col-span-2 grid md:grid-cols-2 gap-4 border-t border-black/10 pt-4 mt-2">
            <div className="rounded-xl border border-black/10 p-4 bg-soft/30">
              <h3 className="font-black mb-3">Video Player Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm font-bold">
                  <input type="checkbox" checked={form.videoSettings?.disableSeeking !== false} onChange={(e) => setForm({ ...form, videoSettings: { ...form.videoSettings, disableSeeking: e.target.checked } })} />
                  Disable Seeking (Enforce Watch Time)
                </label>
                <label className="flex items-center gap-3 text-sm font-bold">
                  <input type="checkbox" checked={form.videoSettings?.enableCompleteButton !== false} onChange={(e) => setForm({ ...form, videoSettings: { ...form.videoSettings, enableCompleteButton: e.target.checked } })} />
                  Show "Mark as Complete" Button
                </label>
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">Completion Threshold (%)</label>
                  <input type="number" min="1" max="100" value={form.videoSettings?.completionThreshold || form.completionThreshold || 80} onChange={(e) => setForm({ ...form, videoSettings: { ...form.videoSettings, completionThreshold: Number(e.target.value) } })} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-black/10 p-4 bg-soft/30">
              <h3 className="font-black mb-3">Quiz Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm font-bold mb-3">
                  <input type="checkbox" checked={boolValue(form.quizSettings?.hasQuiz)} onChange={(e) => setForm({ ...form, quizSettings: { ...form.quizSettings, hasQuiz: e.target.checked } })} />
                  Enable End-of-Lesson Quiz
                </label>
                {form.quizSettings?.hasQuiz && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted mb-1 block">Questions / Attempt</label>
                      <input type="number" min="1" value={form.quizSettings?.questionsPerAttempt || 5} onChange={(e) => setForm({ ...form, quizSettings: { ...form.quizSettings, questionsPerAttempt: Number(e.target.value) } })} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted mb-1 block">Pass Threshold (%)</label>
                      <input type="number" min="1" max="100" value={form.quizSettings?.passPercentage || 80} onChange={(e) => setForm({ ...form, quizSettings: { ...form.quizSettings, passPercentage: Number(e.target.value) } })} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                    </div>
                    <div className="col-span-2 pt-2 flex gap-2">
                      {editing ? (
                        <>
                          <Link to={`/admin/courses/${courseId}/lessons/${editing}/questions`} className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-white hover:bg-primary/90">
                            Question Bank
                          </Link>
                          <Link to={`/admin/courses/${courseId}/lessons/${editing}/analytics`} className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white hover:bg-ink/90">
                            Analytics
                          </Link>
                        </>
                      ) : (
                        <span className="text-xs text-muted">Save lesson first to manage questions or view analytics.</span>
                      )}
                    </div>
                  </div>
                )}
                {!form.quizSettings?.hasQuiz && editing && (
                   <div className="pt-2">
                     <Link to={`/admin/courses/${courseId}/lessons/${editing}/analytics`} className="inline-flex justify-center items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white hover:bg-ink/90">
                        Lesson Analytics
                     </Link>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white"><Save size={16} />Save Lesson</button>{notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}
      </form>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-ink text-white"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Lesson</th><th className="px-4 py-3">Video</th><th className="px-4 py-3">PDF</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item._id} className="border-t border-black/5"><td className="px-4 py-3 font-black">{item.order ?? item.sortOrder ?? 0}</td><td className="px-4 py-3"><div className="font-black">{item.title}</div><p className="line-clamp-2 text-xs text-muted">{item.description}</p></td><td className="px-4 py-3">{item.videoType === "upload" ? "Uploaded" : "YouTube"}{(item.uploadedVideo || item.youtubeUrl || item.videoUrl) && <a href={assetUrl(item.uploadedVideo || item.youtubeUrl || item.videoUrl)} target="_blank" rel="noreferrer" className="ml-2 text-primary"><Eye size={14} className="inline" /></a>}</td><td className="px-4 py-3">{item.pdfFile ? <a href={assetUrl(item.pdfFile)} target="_blank" rel="noreferrer" className="font-black text-primary">View PDF</a> : "Optional"}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${item.isActive ? "bg-primary/10 text-primary" : "bg-black/5 text-muted"}`}>{item.isActive ? "Active" : "Inactive"}</span></td><td className="px-4 py-3 text-right">
            <Link to={`/admin/courses/${courseId}/lessons/${item._id}/content`} className="mr-2 inline-flex items-center rounded-lg bg-soft px-3 py-2 text-xs font-black hover:bg-black/10">Manage Content</Link>
            <button onClick={() => toggle(item)} className="mr-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-black">{item.isActive ? "Disable" : "Enable"}</button><button onClick={() => edit(item)} className="mr-2 rounded-lg border border-black/10 p-2"><Edit size={16} /></button><button onClick={() => remove(item._id)} className="rounded-lg border border-red-200 p-2 text-primary"><Trash2 size={16} /></button></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminLessonContentPage = () => {
  const { courseId, lessonId } = useParams();
  const empty = { type: "video", title: "", description: "", order: 0, isRequired: true, isActive: true, videoType: "youtube", youtubeUrl: "", uploadedVideo: "", pdfFile: "", examPaper: "", textContent: "", videoSettings: { disableSeeking: true, enableCompleteButton: true, completionThreshold: 80 } };
  
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [exams, setExams] = useState([]);

  const load = () => {
    apiFetch(`/courses/${courseId}`).then((data) => setCourse(data.course)).catch((error) => setNotice(error.message));
    apiFetch(`/lessons/${lessonId}`).then((data) => setLesson(data.item || data.lesson)).catch((error) => setNotice(error.message));
    apiFetch(`/admin/lessons/${lessonId}/content`).then((data) => setItems(data.items || [])).catch((error) => setNotice(error.message));
    apiFetch(`/admin/exam-papers`).then(data => setExams(data.items || []));
  };
  useEffect(() => { load(); }, [lessonId]);

  const reset = () => {
    setEditing(null);
    setForm(empty);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, order: Number(form.order || 0), isRequired: Boolean(form.isRequired), isActive: Boolean(form.isActive) };
      await apiFetch(editing ? `/content/${editing}` : `/lessons/${lessonId}/content`, { method: editing ? "PUT" : "POST", body: payload });
      setNotice(editing ? "Content updated successfully." : "Content added successfully.");
      reset();
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const edit = (item) => {
    setEditing(item._id);
    setForm({ ...empty, ...item, examPaper: item.examPaper?._id || item.examPaper || "" });
  };

  const remove = async (id) => {
    if (!confirm("Delete this content?")) return;
    await apiFetch(`/content/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <SEO title="Lesson Content - Admin" />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to={`/admin/courses/${courseId}/lessons`} className="text-sm font-black text-primary">&larr; Back to {course?.title || "Course"} Lessons</Link>
          <h1 className="mt-2 text-3xl font-black">Manage Content</h1>
          <p className="mt-1 text-sm text-muted">Items inside '{lesson?.title || "Lesson"}'</p>
        </div>
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-black text-white"><Plus size={16} />New Content</button>
      </div>

      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-6 shadow-sm border border-black/5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{editing ? "Edit Content" : "Add Content"}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-black text-primary">Cancel</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="rounded-xl border border-black/10 px-4 py-3 font-bold bg-soft/50">
            <option value="video">Video</option>
            <option value="pdf">PDF Document</option>
            <option value="exam">Exam Paper</option>
            <option value="text">Text/Article</option>
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Content title" className="rounded-xl border border-black/10 px-4 py-3" />
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} placeholder="Order number" className="rounded-xl border border-black/10 px-4 py-3" />
          
          <div className="md:col-span-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />Active</label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />Required for completion</label>
          </div>

          <div className="md:col-span-2">
            <textarea rows="8" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description (Optional)" className="w-full rounded-xl border border-slate-200 bg-white p-3" />
          </div>

          {form.type === "video" && (
            <>
              <select value={form.videoType} onChange={(e) => setForm({ ...form, videoType: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option value="youtube">YouTube URL</option><option value="upload">Upload video</option></select>
              {form.videoType === "youtube" ? <input value={form.youtubeUrl || ""} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value, videoUrl: e.target.value })} placeholder="YouTube video URL" className="rounded-xl border border-black/10 px-4 py-3" /> : <FileField label="Uploaded video" value={form.uploadedVideo} folder="content/videos" accept="video/*" onChange={(value) => setForm({ ...form, uploadedVideo: value })} />}
              <input value={form.duration || ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration (e.g. 10:30)" className="rounded-xl border border-black/10 px-4 py-3" />
              
              <div className="md:col-span-2 rounded-xl border border-black/10 p-4 bg-soft/30">
                <h3 className="font-black mb-3">Video Player Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm font-bold">
                    <input type="checkbox" checked={form.videoSettings?.disableSeeking !== false} onChange={(e) => setForm({ ...form, videoSettings: { ...form.videoSettings, disableSeeking: e.target.checked } })} />
                    Disable Seeking (Enforce Watch Time)
                  </label>
                  <label className="flex items-center gap-3 text-sm font-bold">
                    <input type="checkbox" checked={form.videoSettings?.enableCompleteButton !== false} onChange={(e) => setForm({ ...form, videoSettings: { ...form.videoSettings, enableCompleteButton: e.target.checked } })} />
                    Show "Mark as Complete" Button
                  </label>
                  <div>
                    <label className="text-xs font-bold text-muted mb-1 block">Completion Threshold (%)</label>
                    <input type="number" min="1" max="100" value={form.videoSettings?.completionThreshold || 80} onChange={(e) => setForm({ ...form, videoSettings: { ...form.videoSettings, completionThreshold: Number(e.target.value) } })} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </>
          )}

          {form.type === "pdf" && (
            <div className="md:col-span-2">
              <FileField label="PDF Document" value={form.pdfFile} folder="content/pdfs" accept=".pdf,application/pdf" onChange={(value) => setForm({ ...form, pdfFile: value })} />
            </div>
          )}

          {form.type === "exam" && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-ink">Select Exam Paper</label>
              <select required value={form.examPaper} onChange={e => setForm({ ...form, examPaper: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none">
                <option value="">Select an Exam...</option>
                {exams.map(b => <option key={b._id} value={b._id}>{b.title} (Marks: {b.totalMarks})</option>)}
              </select>
            </div>
          )}
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white"><Save size={16} />Save Content</button>{notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-white"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Required</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-black/5">
            {items.map((item) => (
              <tr key={item._id} className="transition hover:bg-soft/50">
                <td className="px-4 py-3 font-black">{item.order}</td>
                <td className="px-4 py-3 font-bold">{item.title}</td>
                <td className="px-4 py-3 uppercase text-xs font-black tracking-wider text-muted">{item.type}</td>
                <td className="px-4 py-3">{item.isRequired ? "Yes" : "No"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-black ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(item)} className="mr-3 font-bold text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(item._id)} className="font-bold text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-muted">No content found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminCrud = ({ resource, title, teacherMode = false }) => {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const config = adminConfig[resource] || { title: title || resource, fields: ["title", "status"] };
  const endpoint = teacherMode ? `/teacher/${resource}` : `/admin/${resource}`;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => apiFetch(`${endpoint}${search ? `?search=${encodeURIComponent(search)}` : ""}`).then((data) => setItems(data.items || [])).catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, [resource]);

  const submit = async (event) => {
    event.preventDefault();
    if (!teacherMode) {
      if (editing && !canEdit(resource)) {
        setNotice("You do not have permission to edit here.");
        return;
      }
      if (!editing && !canCreate(resource)) {
        setNotice("You do not have permission to create here.");
        return;
      }
    }
    try {
      const body = normalizeForm(form, config.fields);
      await apiFetch(editing ? `${endpoint}/${editing}` : endpoint, { method: editing ? "PUT" : "POST", body });
      setNotice(editing ? "Updated successfully." : "Created successfully.");
      setForm({});
      setEditing(null);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const edit = (item) => {
    setEditing(item._id);
    setForm(Object.fromEntries(config.fields.map((field) => [field, Array.isArray(item[field]) ? item[field].join(", ") : item[field] ?? ""])));
  };

  const remove = async (id) => {
    if (!teacherMode && !canDelete(resource)) {
      setNotice("You do not have permission to delete here.");
      return;
    }
    if (!confirm("Delete this item?")) return;
    await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
    load();
  };

  const handleFile = async (field, file) => {
    if (!file) return;
    const base = resource.replace("/", "-");
    /* Video files go to their own folder, which is the one the upload
       rules allow video types in; images stay in the resource folder. */
    const folder = field === "uploadedVideo" ? `${base}/videos` : base;
    const uploaded = await uploadFile(file, folder);
    setForm((old) => ({ ...old, [field]: uploaded.url }));
  };

  return (
    <div>
      <SEO title={`${config.title} - Admin`} />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><h1 className="text-3xl font-black">{title || config.title}</h1><div className="flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="rounded-xl border border-black/10 px-4 py-2" /><button onClick={load} className="rounded-xl bg-ink px-4 py-2 text-sm font-black text-white"><Search size={16} /></button></div></div>
      {(teacherMode || (editing ? canEdit(resource) : canCreate(resource))) && (
      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{editing ? "Edit" : "Create"} {config.title}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm({}); }} className="text-sm font-black text-primary">Cancel</button>}</div>
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => {
            const showField = !["verificationInstructions", "requiredDocumentName", "allowedFileTypes", "maxFileSize"].includes(field) || form.enrollmentType === "verification";
            if (!showField) return null;

            /* Only one of the two video sources is relevant at a time. */
            const videoMode = form.videoType || "youtube";
            if (field === "videoUrl" && resource === "video-blogs" && videoMode === "upload") return null;
            if (field === "uploadedVideo" && videoMode !== "upload") return null;

            const type = fieldType(field);
            const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
            if (field === "status") return <select key={field} value={form[field] || "active"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option><option value="pending">Pending</option><option value="published">Published</option><option value="draft">Draft</option></select>;
            if (field === "role") return <select key={field} value={form[field] || "student"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option value="student">Student</option><option value="devotee">Devotee</option><option value="user">User</option><option value="teacher">Teacher</option><option value="main_admin">Main Admin</option></select>;

            if (field === "level") return <select key={field} value={form[field] || "Beginner"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>;
            if (field === "priceType") return <select key={field} value={form[field] || "Free"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option>Free</option><option>Paid</option></select>;
            if (field === "enrollmentType") return <select key={field} value={form[field] || "free"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3"><option value="free">Free Course</option><option value="verification">Document Verification Required</option><option value="paid">Paid Course (Future Ready)</option></select>;
            if (field === "type" && resource === "booking-taxes") return <label key={field} className="grid gap-1 text-xs font-black uppercase tracking-wide text-muted">Charge type<select value={form[field] || "percent"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm font-normal normal-case text-ink"><option value="percent">Percentage of subtotal (%)</option><option value="flat">Flat amount (₹)</option></select></label>;
            if (field === "appliesTo") return <label key={field} className="grid gap-1 text-xs font-black uppercase tracking-wide text-muted">Flat amount applies<select value={form[field] || "booking"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm font-normal normal-case text-ink"><option value="booking">Once per booking</option><option value="person">Per traveller</option></select></label>;
            if (field === "videoType") return <label key={field} className="grid gap-1 text-xs font-black uppercase tracking-wide text-muted">Video source<select value={form[field] || "youtube"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm font-normal normal-case text-ink"><option value="youtube">Paste a YouTube or Vimeo link</option><option value="upload">Upload a video file</option></select></label>;
            /* The poster is optional: left blank it is taken from the video. */
            if (field === "thumbnail" && resource === "video-blogs") return (
              <label key={field} className="grid gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span>Thumbnail <span className="font-normal normal-case text-muted">— optional. Leave blank for video still.</span></span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200/70">
                    📐 Recommended: 1280 × 720 px (16:9 widescreen)
                  </span>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFile(field, e.target.files?.[0])} />
                <input value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder="Auto from video" className="rounded-lg border border-black/10 px-3 py-2 text-sm font-normal" />
                {form.thumbnail ? <button type="button" onClick={() => setForm({ ...form, thumbnail: "" })} className="justify-self-start rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold">Clear and use the video still</button> : null}
              </label>
            );
            if (type === "checkbox") return <label key={field} className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold"><input type="checkbox" checked={Boolean(form[field])} onChange={(e) => setForm({ ...form, [field]: e.target.checked })} />{label}</label>;
            if (type === "file") {
              const sizeHint = getMediaSizeRecommendation(resource, field);
              return (
                <label key={field} className="grid gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span>{label}</span>
                    {sizeHint && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200/70">
                        📐 {sizeHint}
                      </span>
                    )}
                  </div>
                  <input type="file" onChange={(e) => handleFile(field, e.target.files?.[0])} />
                  <input value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder="URL" className="rounded-lg border border-black/10 px-3 py-2 text-sm font-normal" />
                </label>
              );
            }
            if (type === "textarea") return <textarea key={field} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={label} rows="4" className="rounded-xl border border-black/10 px-4 py-3 md:col-span-2" />;
            return <input key={field} type={type} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={label} className="rounded-xl border border-black/10 px-4 py-3" />;
          })}
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white"><Save size={16} />Save</button>{notice && <p className="mt-4 text-sm font-bold text-primary">{notice}</p>}
      </form>
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-black/5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-4 py-3">{resource === "contact-messages" ? "Sender / Contact Details" : "Title/Name"}</th>
              {resource === "contact-messages" && <th className="px-4 py-3">Inquiry Details (Class / Subject)</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t border-black/5 hover:bg-soft/20 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-ink">{item.title || item.name || item.label || item.email || item.sectionTitle || item.pageName}</span>
                    {resource === "home-sections" && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary uppercase tracking-wide">
                        {item.sectionKey === "video_intro" ? "Video Intro" : item.sectionKey?.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  {resource === "contact-messages" && (
                    <div className="text-xs text-muted mt-0.5">
                      {item.email} {item.phone && `· ${item.phone}`}
                    </div>
                  )}
                </td>
                {resource === "contact-messages" && (
                  <td className="px-4 py-3">
                    {item.classTitle ? (
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary mb-1">
                        Class: {item.classTitle}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-soft px-2.5 py-0.5 text-xs font-bold text-muted mb-1">
                        General Inquiry
                      </span>
                    )}
                    <div className="text-xs font-bold text-ink truncate max-w-xs">{item.subject}</div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{item.status || item.role || "active"}</span>
                </td>
                <td className="px-4 py-3 text-muted">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</td>
                <td className="px-4 py-3 text-right">
                  {(teacherMode || canEdit(resource)) && (
                    <button onClick={() => edit(item)} className="mr-2 rounded-lg border border-black/10 p-2 hover:bg-soft transition"><Edit size={16} /></button>
                  )}
                  {(teacherMode || canDelete(resource)) && (
                    <button onClick={() => remove(item._id)} className="rounded-lg border border-red-200 p-2 text-primary hover:bg-red-50 transition"><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminSettingsPage = ({ type }) => {
  const endpoint = type === "footer" ? "/admin/footer" : "/admin/site-settings";
  const key = type === "footer" ? "footer" : "settings";
  const fallback = type === "footer" ? fallbackFooter : {};
  const { item, setItem } = useSingle(endpoint, fallback, key);
  const [json, setJson] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("form");

  useEffect(() => {
    setJson(JSON.stringify(item || {}, null, 2));
  }, [item]);

  const save = async (customData) => {
    try {
      const payload = customData || JSON.parse(json);
      const data = await apiFetch(endpoint, { method: "PUT", body: payload });
      setItem(data[key]);
      setNotice("Saved successfully.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleFormFieldChange = (field, value) => {
    const updated = { ...item, [field]: value };
    setItem(updated);
    setJson(JSON.stringify(updated, null, 2));
  };

  const handleFormSave = () => {
    save(item);
  };

  return (
    <div>
      <SEO title={type === "footer" ? "Footer Settings" : "Site Settings"} />
      <h1 className="mb-6 text-3xl font-black">{type === "footer" ? "Footer Settings" : "Site Settings"}</h1>
      
      {type === "site" && (
        <div className="mb-6 flex gap-6 border-b border-black/10 pb-px">
          <button onClick={() => setActiveTab("form")} className={`pb-3 text-sm font-black transition ${activeTab === "form" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}>Form Editor</button>
          <button onClick={() => setActiveTab("json")} className={`pb-3 text-sm font-black transition ${activeTab === "json" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}>Advanced JSON</button>
        </div>
      )}

      {activeTab === "form" && type === "site" ? (
        <div className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">Site Name</label>
              <input type="text" value={item.siteName || ""} onChange={(e) => handleFormFieldChange("siteName", e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">Logo URL</label>
              <input type="text" value={item.logo || ""} onChange={(e) => handleFormFieldChange("logo", e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">Default SEO Title</label>
              <input type="text" value={item.defaultSeoTitle || ""} onChange={(e) => handleFormFieldChange("defaultSeoTitle", e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">Primary Color (Hex)</label>
              <div className="flex gap-3">
                <input type="color" value={item.primaryColor || "#f52246"} onChange={(e) => handleFormFieldChange("primaryColor", e.target.value)} className="h-12 w-12 cursor-pointer rounded-xl border border-black/10 p-1" />
                <input type="text" value={item.primaryColor || ""} onChange={(e) => handleFormFieldChange("primaryColor", e.target.value)} className="flex-1 rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase text-muted">Default SEO Description</label>
            <textarea rows="3" value={item.defaultSeoDescription || ""} onChange={(e) => handleFormFieldChange("defaultSeoDescription", e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
          </div>
          
          <div className="grid gap-6 rounded-2xl bg-soft p-5 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">About Stats: Courses</label>
              <input type="text" value={item.aboutStats?.courses || ""} placeholder="6+" onChange={(e) => handleFormFieldChange("aboutStats", { ...(item.aboutStats || {}), courses: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">About Stats: Teachers</label>
              <input type="text" value={item.aboutStats?.teachers || ""} placeholder="6+" onChange={(e) => handleFormFieldChange("aboutStats", { ...(item.aboutStats || {}), teachers: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">About Stats: Lessons</label>
              <input type="text" value={item.aboutStats?.lessons || ""} placeholder="12+" onChange={(e) => handleFormFieldChange("aboutStats", { ...(item.aboutStats || {}), lessons: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-muted">About Stats: Classes</label>
              <input type="text" value={item.aboutStats?.sundayClasses || ""} placeholder="Every Week" onChange={(e) => handleFormFieldChange("aboutStats", { ...(item.aboutStats || {}), sundayClasses: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-primary" />
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-black uppercase text-muted">Google Search Console Tag (Meta Tag)</label>
            <textarea rows="2" value={item.googleSearchConsoleTag || ""} onChange={(e) => handleFormFieldChange("googleSearchConsoleTag", e.target.value)} placeholder='e.g., <meta name="google-site-verification" content="XYZ..." />' className="w-full rounded-xl border border-black/10 px-4 py-3 font-mono text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase text-muted">Custom Header Script / Third Party Tags (Bing, Yahoo, Google Analytics)</label>
            <textarea rows="4" value={item.customHeaderHtml || ""} onChange={(e) => handleFormFieldChange("customHeaderHtml", e.target.value)} placeholder="e.g., <script>...</script> or <meta name='msvalidate.01' content='...' />" className="w-full rounded-xl border border-black/10 px-4 py-3 font-mono text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <button onClick={handleFormSave} className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Save Site Settings</button>
          </div>
        </div>
      ) : (
        <div>
          <textarea value={json} onChange={(e) => setJson(e.target.value)} rows="22" className="w-full rounded-2xl border border-black/10 bg-white p-5 font-mono text-sm shadow-sm" />
          <button onClick={() => save()} className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Save Settings</button>
        </div>
      )}
      {notice && <p className="mt-3 text-sm font-bold text-primary">{notice}</p>}
    </div>
  );
};

export const AdminContactPage = () => {
  const [activeTab, setActiveTab] = useState("info");
  const [settings, setSettings] = useState({
    title: "Contact Information",
    address: "ISKCON Juhu, Hare Krishna Land, Juhu, Mumbai",
    phone: "+91 22 2620 6860",
    email: "selfexcellence@iskconjuhu.in",
    whatsappNumber: "8928337055",
    whatsappMessage: "Hare Krishna! I would like to know more about ISKCON Self-Excellence courses.",
    mapUrl: "https://www.google.com/maps?q=ISKCON%20Juhu&output=embed",
    bannerTitle: "Contact Us",
    bannerSubtitle: "Questions about classes, courses, enrollment, or volunteering? Reach out."
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [viewingMessage, setViewingMessage] = useState(null);

  const loadSettings = async () => {
    try {
      const res = await apiFetch("/admin/contact-settings");
      if (res.settings) setSettings(res.settings);
    } catch (err) {
      setNotice(err.message);
    }
  };

  const loadMessages = async () => {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await apiFetch(`/admin/contact-messages${q}`);
      setMessages(res.items || []);
    } catch (err) {
      setNotice(err.message);
    }
  };

  useEffect(() => {
    loadSettings();
    loadMessages();
  }, []);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch("/admin/contact-settings", {
        method: "PUT",
        body: settings
      });
      if (res.settings) setSettings(res.settings);
      setNotice("Contact details and map updated successfully!");
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResetMap = () => {
    setSettings((prev) => ({
      ...prev,
      mapUrl: "https://www.google.com/maps?q=ISKCON%20Juhu&output=embed"
    }));
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm("Delete this inquiry?")) return;
    try {
      await apiFetch(`/admin/contact-messages/${id}`, { method: "DELETE" });
      loadMessages();
    } catch (err) {
      setNotice(err.message);
    }
  };

  const liveMapSrc = normalizeMapEmbedUrl(settings.mapUrl);

  return (
    <div>
      <SEO title="Contact & Inquiries - Admin" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Contact & Inquiries</h1>
          <p className="mt-1 text-xs text-muted">
            Manage contact information, interactive Google map, and visitor inquiries.
          </p>
        </div>
        <a
          href="/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:border-primary hover:text-primary"
        >
          View Live Contact Page ↗
        </a>
      </div>

      {notice && (
        <div className="mb-6 rounded-2xl bg-primary/10 px-5 py-3.5 text-sm font-bold text-primary flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}><X size={16} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-full bg-soft p-1 w-fit">
        <button
          onClick={() => setActiveTab("info")}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition ${
            activeTab === "info" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <MapPin size={14} /> Contact Details & Map
        </button>
        <button
          onClick={() => {
            setActiveTab("messages");
            loadMessages();
          }}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition ${
            activeTab === "messages" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <MessageSquare size={14} /> Inquiries Inbox ({messages.length})
        </button>
      </div>

      {activeTab === "info" ? (
        <form onSubmit={handleSaveSettings} className="grid gap-6">
          {/* Section 1: Contact Information (Context Section) */}
          <div className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-black text-ink mb-1">Contact Information (Context Section)</h2>
            <p className="text-xs text-muted mb-5">
              These details are displayed in the Contact Information box on the public contact page and synced to the footer.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Box Title</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="Contact Information"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Temple / Office Address</label>
                <textarea
                  rows={2}
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="e.g. ISKCON Juhu, Hare Krishna Land, Juhu, Mumbai"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Official Phone Number</label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+91 22 2620 6860"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Official Email Address</label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="selfexcellence@iskconjuhu.in"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">WhatsApp Business Number</label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="8928337055"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <span className="text-[11px] text-muted">Used by the Floating WhatsApp button and public contact card.</span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">WhatsApp Pre-filled Message</label>
                <input
                  type="text"
                  value={settings.whatsappMessage || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappMessage: e.target.value })}
                  placeholder="Hare Krishna! I would like to know more about ISKCON Self-Excellence courses."
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Content Data / Google Map */}
          <div className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
              <h2 className="text-lg font-black text-ink">Content Data: Google Map Location</h2>
              <button
                type="button"
                onClick={handleResetMap}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold text-muted hover:text-ink hover:bg-soft"
              >
                <RotateCcw size={13} /> Reset to Default ISKCON Juhu Map
              </button>
            </div>
            <p className="text-xs text-muted mb-5">
              Paste any Google Maps embed link, location search query, or full &lt;iframe&gt; embed code. The system will automatically parse and embed it.
            </p>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Map URL or &lt;iframe&gt; Embed Tag</label>
                <textarea
                  rows={5}
                  value={settings.mapUrl || ""}
                  onChange={(e) => setSettings({ ...settings, mapUrl: e.target.value })}
                  placeholder="https://www.google.com/maps?q=ISKCON%20Juhu&output=embed or <iframe src='...'></iframe>"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 font-mono text-xs outline-none focus:border-primary"
                />
                <div className="mt-2 text-[11px] text-muted space-y-1">
                  <p>💡 <b>Quick Option 1:</b> Just type location name (e.g. <code className="bg-soft px-1 rounded">ISKCON Juhu, Mumbai</code>).</p>
                  <p>💡 <b>Quick Option 2:</b> In Google Maps, click <b>Share &gt; Embed a map</b>, copy the HTML, and paste here.</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Live Map Preview</label>
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-soft shadow-inner">
                  <iframe
                    title="Map Preview"
                    src={liveMapSrc}
                    className="h-48 w-full rounded-2xl"
                    loading="lazy"
                  />
                </div>
                <span className="mt-1 block text-right text-[11px] text-muted">Preview updates as you type.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Page Banner / Header */}
          <div className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-black text-ink mb-1">Page Header & Subtitle</h2>
            <p className="text-xs text-muted mb-5">Customize the public title and intro paragraph on the /contact page.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Banner Title</label>
                <input
                  type="text"
                  value={settings.bannerTitle || ""}
                  onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })}
                  placeholder="Contact Us"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-muted">Banner Subtitle</label>
                <input
                  type="text"
                  value={settings.bannerSubtitle || ""}
                  onChange={(e) => setSettings({ ...settings, bannerSubtitle: e.target.value })}
                  placeholder="Questions about classes, courses, enrollment, or volunteering? Reach out."
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Save size={16} /> {busy ? "Saving..." : "Save Contact & Map Settings"}
            </button>
          </div>
        </form>
      ) : (
        /* Section: Inquiries Inbox */
        <div className="grid gap-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-black/5">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages by name or email..."
                className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={loadMessages}
              className="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white transition hover:bg-ink/90"
            >
              Filter
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="px-4 py-3">Sender Details</th>
                  <th className="px-4 py-3">Inquiry Details</th>
                  <th className="px-4 py-3">Message Excerpt</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-muted">
                      No contact inquiries received yet.
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr key={m._id} className="border-t border-black/5 transition hover:bg-soft/30">
                      <td className="px-4 py-3">
                        <span className="block font-black text-ink">{m.name}</span>
                        <span className="block text-xs text-muted">{m.email}</span>
                        {m.phone && <span className="block text-xs font-semibold text-primary">{m.phone}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.classTitle ? (
                          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary">
                            Class: {m.classTitle}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-soft px-2.5 py-0.5 text-[10px] font-bold text-muted">
                            General Inquiry
                          </span>
                        )}
                        <div className="text-xs font-bold text-ink mt-1 truncate max-w-xs">{m.subject || "No subject"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted line-clamp-2 max-w-sm">{m.message}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingMessage(m)}
                            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-ink hover:bg-soft"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(m._id)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Message Modal */}
      {viewingMessage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setViewingMessage(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-ink">{viewingMessage.name}</h3>
                <p className="text-xs text-muted">{viewingMessage.email} {viewingMessage.phone ? `· ${viewingMessage.phone}` : ""}</p>
              </div>
              <button onClick={() => setViewingMessage(null)} className="rounded-full p-2 text-muted hover:bg-soft">
                <X size={18} />
              </button>
            </div>
            <div className="mb-4 rounded-xl bg-soft p-4">
              <span className="block text-[10px] font-black uppercase text-muted mb-1">Subject</span>
              <p className="text-xs font-bold text-ink">{viewingMessage.subject || "General Inquiry"}</p>
              {viewingMessage.classTitle && (
                <p className="mt-1 text-xs text-primary font-bold">Interested in: {viewingMessage.classTitle}</p>
              )}
            </div>
            <div className="rounded-xl border border-black/10 p-4 mb-5">
              <span className="block text-[10px] font-black uppercase text-muted mb-1">Message Content</span>
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{viewingMessage.message}</p>
            </div>
            <div className="flex justify-between items-center">
              <a
                href={`mailto:${viewingMessage.email}?subject=${encodeURIComponent(`Re: ${viewingMessage.subject || "Your ISKCON Enquiry"}`)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-black text-white hover:bg-primary/90"
              >
                <Mail size={14} /> Reply via Email
              </a>
              {viewingMessage.phone && (
                <a
                  href={`https://wa.me/${viewingMessage.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-black text-white hover:bg-[#20ba5a]"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminRolesPage = () => {
  const { item } = useSingle("/admin/roles", { roles: [], permissions: [] }, null);
  return <div><SEO title="Roles" /><h1 className="mb-6 text-3xl font-black">Roles & Teacher Permissions</h1><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Roles</h2><div className="mt-4 grid gap-3">{item.roles?.map((role) => <div key={role} className="rounded-xl bg-soft p-4 font-bold">{role}</div>)}</div></div><div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Teacher Permissions</h2><div className="mt-4 grid gap-3">{item.permissions?.map((permission) => <div key={permission} className="rounded-xl bg-soft p-4 font-bold">{permission}</div>)}</div></div></div></div>;
};

export const AdminTrafficPage = () => {
  const { items } = useList("/admin/traffic", []);
  return <div><SEO title="Traffic" /><h1 className="mb-6 text-3xl font-black">Traffic Tracking</h1><div className="rounded-2xl bg-white p-6 shadow-sm"><div className="grid gap-3">{items.map((item) => <div key={item._id} className="grid gap-2 rounded-xl bg-soft p-4 text-sm md:grid-cols-4"><span className="font-black">{item.pageUrl}</span><span>{item.deviceType}</span><span>{item.referrer || "Direct"}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div>)}</div></div></div>;
};

export const ReportsPage = () => {
  const [filters, setFilters] = useState({ search: "", courseId: "", status: "all" });
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notice, setNotice] = useState("");

  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [monitoringDetails, setMonitoringDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState("progress"); // "progress", "notes", "comments"

  const loadData = async () => {
    try {
      const url = `/admin/student-progress?search=${encodeURIComponent(filters.search)}&courseId=${filters.courseId}&status=${filters.status}`;
      const data = await apiFetch(url);
      setItems(data.items || []);
    } catch (err) {
      setNotice(err.message);
    }
  };

  useEffect(() => {
    apiFetch("/admin/courses")
      .then((data) => setCourses(data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const formatDuration = (seconds = 0) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const openMonitoringModal = async (record) => {
    setSelectedStudentProgress(record);
    setLoadingDetails(true);
    setMonitoringDetails(null);
    setActiveDetailsTab("progress");
    try {
      const data = await apiFetch(`/admin/student-progress/${record.student._id}/${record.course._id}/details`);
      if (data.success) {
        setMonitoringDetails(data);
      }
    } catch (err) {
      console.error("Failed to load details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div>
      <SEO title="Reports - Student Progress" />
      <div className="mb-6">
        <h1 className="text-3xl font-black">Student Progress Reports</h1>
        <p className="mt-1 text-sm text-muted">Track student course enrollments, watch times, and progress indicators across the platform.</p>
      </div>

      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-black/5">
          <div className="min-w-0 flex-1 sm:flex-[2]">
            <label className="text-xs font-black uppercase text-muted block mb-1">Search Students</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by student name or email..."
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="min-w-[180px] flex-1">
            <label className="text-xs font-black uppercase text-muted block mb-1">Filter by Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white outline-none focus:border-primary"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px] flex-1">
            <label className="text-xs font-black uppercase text-muted block mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm bg-white outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed Only</option>
              <option value="active">Active/In Progress</option>
            </select>
          </div>
        </div>

        {notice && (
          <div className="rounded-xl bg-primary/10 p-4 text-sm font-bold text-primary">
            {notice}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-black/5">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left border-collapse">
              <thead>
                <tr className="bg-soft border-b border-black/5 text-xs font-black uppercase tracking-wider text-muted font-black">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course Enrolled</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Watch Duration</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Monitoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-sm font-medium">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-soft/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-black text-ink">{item.student?.name || "Devotee / Student"}</div>
                      <div className="text-xs text-muted">{item.student?.email || "No email"}</div>
                      {item.student?.role && (
                        <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                          {item.student.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      <div className="font-bold text-ink">{item.course?.title || "Unknown Course"}</div>
                      <div className="text-xs text-muted">Category: {item.course?.category || "General"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-ink">{Math.round(item.percent || 0)}%</span>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-soft">
                          <div
                            style={{ width: `${Math.min(100, item.percent || 0)}%` }}
                            className="h-full bg-primary rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        Completed lessons: {item.completedLessons || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1 text-xs font-bold text-ink border border-black/5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {formatDuration(item.totalWatchTime || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted font-bold">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-black text-green-600 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-600 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openMonitoringModal(item)}
                        className="rounded-xl border border-black/10 hover:bg-soft px-3 py-1.5 text-xs font-black text-primary transition"
                      >
                        Monitor
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-muted">
                      No student progress records found matching your active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedStudentProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-ink">Student Monitoring Details</h2>
                <p className="text-xs text-muted mt-0.5">
                  Student: <strong className="text-ink">{selectedStudentProgress.student?.name}</strong> · Course: <strong className="text-ink">{selectedStudentProgress.course?.title}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedStudentProgress(null)} className="rounded-full bg-soft p-2 hover:bg-black/10 text-muted">×</button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-sm font-semibold text-muted">Loading monitoring records...</div>
            ) : monitoringDetails ? (
              <div>
                {/* Tabs */}
                <div className="flex gap-4 border-b border-black/10 pb-px mb-5">
                  <button
                    onClick={() => setActiveDetailsTab("progress")}
                    className={`pb-3 text-sm font-black transition ${activeDetailsTab === "progress" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
                  >
                    Lesson Progress
                  </button>
                  <button
                    onClick={() => setActiveDetailsTab("notes")}
                    className={`pb-3 text-sm font-black transition ${activeDetailsTab === "notes" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
                  >
                    Taken Notes ({monitoringDetails.notes?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveDetailsTab("comments")}
                    className={`pb-3 text-sm font-black transition ${activeDetailsTab === "comments" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
                  >
                    Posted Comments ({monitoringDetails.comments?.length || 0})
                  </button>
                </div>

                {/* Tab content */}
                {activeDetailsTab === "progress" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 bg-soft/50 rounded-2xl p-4 border border-black/5 mb-4 text-xs font-bold text-ink">
                      <div>Total Watch Time: <span className="text-primary font-black">{formatDuration(selectedStudentProgress.totalWatchTime || 0)}</span></div>
                      <div>Completed Lessons: <span className="text-primary font-black">{selectedStudentProgress.completedLessons || 0}</span></div>
                    </div>
                    <div className="rounded-xl border border-black/10 overflow-x-auto custom-scrollbar text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-soft border-b border-black/5 text-muted uppercase font-black">
                          <tr>
                            <th className="px-4 py-2.5">Lesson Title</th>
                            <th className="px-4 py-2.5">Completed</th>
                            <th className="px-4 py-2.5">Watch Time</th>
                            <th className="px-4 py-2.5">Last Watched</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 font-semibold text-ink">
                          {monitoringDetails.progress?.map((p) => (
                            <tr key={p._id} className="hover:bg-soft/20">
                              <td className="px-4 py-2.5 font-bold">{p.lesson?.title || "Unknown Lesson"}</td>
                              <td className="px-4 py-2.5">
                                {p.isCompleted ? (
                                  <span className="text-green-600 font-bold">✓ Yes</span>
                                ) : (
                                  <span className="text-amber-600 font-bold">In Progress</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5">{Math.round((p.watchSeconds || 0) / 60)} min</td>
                              <td className="px-4 py-2.5 text-muted">{p.lastWatchedAt ? new Date(p.lastWatchedAt).toLocaleDateString() : "N/A"}</td>
                            </tr>
                          ))}
                          {(!monitoringDetails.progress || monitoringDetails.progress.length === 0) && (
                            <tr>
                              <td colSpan="4" className="px-4 py-6 text-center text-muted">No lesson progress logs recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeDetailsTab === "notes" && (
                  <div className="space-y-3">
                    {monitoringDetails.notes?.map((n) => (
                      <div key={n._id} className="rounded-2xl border border-black/5 p-4 bg-soft/20 text-ink">
                        <div className="flex justify-between items-center text-xs font-black text-muted mb-2">
                          <span>Lesson: <strong className="text-ink">{n.lesson?.title || "General"}</strong></span>
                          <span>Timestamp: {formatDuration(n.timestamp || 0)}</span>
                        </div>
                        {n.title && <h4 className="font-bold text-ink mb-1 text-sm">{n.title}</h4>}
                        <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{n.content}</p>
                        <span className="block mt-2 text-[10px] text-muted text-right font-semibold">Created: {new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                    {(!monitoringDetails.notes || monitoringDetails.notes.length === 0) && (
                      <div className="py-12 text-center text-xs text-muted">No notes taken by this student in this course yet.</div>
                    )}
                  </div>
                )}

                {activeDetailsTab === "comments" && (
                  <div className="space-y-3 text-ink">
                    {monitoringDetails.comments?.map((c) => (
                      <div key={c._id} className="rounded-2xl border border-black/5 p-4 bg-soft/20 text-ink">
                        <div className="text-xs font-black text-muted mb-2">
                          Lesson: <strong className="text-ink">{c.lesson?.title || "General"}</strong> · Status: <span className="text-primary font-black uppercase">{c.status}</span>
                        </div>
                        <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{c.text}</p>
                        {c.adminReply && (
                          <div className="mt-3 bg-white rounded-xl border border-black/5 p-3 text-xs text-ink">
                            <span className="font-bold text-primary block mb-1">Reply:</span>
                            <p className="text-muted leading-relaxed">{c.adminReply}</p>
                          </div>
                        )}
                        <span className="block mt-2 text-[10px] text-muted text-right font-semibold">Posted: {new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                    {(!monitoringDetails.comments || monitoringDetails.comments.length === 0) && (
                      <div className="py-12 text-center text-xs text-muted">No comments posted by this student in this course yet.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-sm font-semibold text-rose-500">Failed to load monitoring details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminRoutePage = ({ resource }) => <AdminCrud resource={resource} />;

/* ============================================================
   Pilgrimage bookings — admin review
   ------------------------------------------------------------
   Same shape as the course enrollment queue: a list of pending
   requests, the payment screenshot to check against, and
   approve / reject with a reason. The money shown is the
   snapshot stored on the booking, not a fresh calculation.
   ============================================================ */

const BOOKING_STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  cancelled: "bg-gray-100 text-gray-700"
};

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

export const AdminPilgrimageBookingsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await apiFetch(`/admin/pilgrimage-bookings${params.toString() ? `?${params}` : ""}`);
      setItems(data.items || []);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  const approve = async (id) => {
    setBusy(true);
    try {
      await apiFetch(`/admin/pilgrimage-bookings/${id}/approve`, { method: "PUT" });
      setNotice("Booking confirmed. The devotee has been notified.");
      setSelected(null);
      load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/pilgrimage-bookings/${rejecting._id}/reject`, { method: "PUT", body: { reason } });
      setNotice("Booking rejected. The devotee has been notified.");
      setRejecting(null);
      setReason("");
      setSelected(null);
      load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = items.filter((b) => b.status === "pending").length;

  return (
    <div>
      <SEO title="Pilgrimage Bookings - Admin" />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Pilgrimage Bookings</h1>
          <p className="mt-1 text-sm text-muted">
            {pendingCount > 0 ? `${pendingCount} booking${pendingCount > 1 ? "s" : ""} awaiting review` : "No bookings awaiting review"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, ref" className="rounded-xl border border-black/10 px-4 py-2 text-sm" />
        </div>
      </div>

      {notice && <p className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">{notice}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Journey</th>
              <th className="px-4 py-3">Travellers</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-muted">Loading bookings...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-muted">No bookings yet.</td></tr>
            )}
            {!loading && items.map((b) => (
              <tr key={b._id} className="border-t border-black/5 transition hover:bg-soft/20">
                <td className="px-4 py-3">
                  <span className="block font-black text-ink">{b.fullName}</span>
                  <span className="block text-xs text-muted">{b.email} · {b.phone}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-primary">{b.bookingRef}</span>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-ink">{b.pilgrimage?.title || "\u2014"}</td>
                <td className="px-4 py-3 text-xs">
                  <span className="font-black text-ink">{b.travellerCount}</span>
                  <span className="block text-muted">{(b.travellers || []).map((t) => t.name).join(", ")}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-black text-ink">{money(b.totalAmount)}</span>
                  <span className="block text-[10px] text-muted">incl. {money(b.taxTotal)} tax</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${BOOKING_STATUS_STYLE[b.status] || ""}`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelected(b)} className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-black text-ink transition hover:border-primary hover:text-primary">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review drawer */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-ink">{selected.pilgrimage?.title}</h2>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-primary">{selected.bookingRef}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-2 text-muted transition hover:bg-soft hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-soft/40 p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted">Booked by</p>
                <p className="mt-1 font-black text-ink">{selected.fullName}</p>
                <p className="text-xs text-muted">{selected.email}</p>
                <p className="text-xs text-muted">{selected.phone}</p>
              </div>
              <div className="rounded-2xl bg-soft/40 p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted">Submitted</p>
                <p className="mt-1 font-black text-ink">{new Date(selected.submittedAt).toLocaleString("en-IN")}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${BOOKING_STATUS_STYLE[selected.status] || ""}`}>{selected.status}</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/5 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-muted">Travellers ({selected.travellerCount})</p>
              <ul className="grid gap-2">
                {(selected.travellers || []).map((t, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl bg-soft/40 px-3 py-2 text-sm">
                    <span className="font-bold text-ink">{i + 1}. {t.name}</span>
                    <span className="text-xs text-muted">{t.age ? `${t.age} yrs` : ""}{t.gender ? ` \u00b7 ${t.gender}` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-2xl border border-black/5 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-muted">Amount (as quoted at booking)</p>
              <dl className="grid gap-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">{money(selected.pricePerPerson)} × {selected.travellerCount}</dt><dd className="font-bold text-ink">{money(selected.subtotal)}</dd></div>
                {(selected.taxBreakdown || []).map((t, i) => (
                  <div key={i} className="flex justify-between"><dt className="text-muted">{t.label}{t.type === "percent" ? ` (${t.value}%)` : ""}</dt><dd className="font-bold text-ink">{money(t.amount)}</dd></div>
                ))}
                <div className="mt-1 flex justify-between border-t border-black/10 pt-2"><dt className="font-black text-ink">Total</dt><dd className="text-lg font-black text-primary">{money(selected.totalAmount)}</dd></div>
              </dl>
            </div>

            {selected.message && (
              <div className="mt-5 rounded-2xl border border-black/5 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-muted">Message</p>
                <p className="whitespace-pre-line text-sm text-ink">{selected.message}</p>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-black/5 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-muted">Payment receipt</p>
              {selected.paymentPhotoUrl ? (
                <a href={assetUrl(selected.paymentPhotoUrl)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-black/10">
                  <img src={assetUrl(selected.paymentPhotoUrl)} alt="Payment receipt" className="max-h-80 w-full object-contain bg-soft/40" />
                </a>
              ) : (
                <p className="text-sm text-muted">No receipt uploaded.</p>
              )}
            </div>

            {selected.rejectionReason && (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">Rejected: {selected.rejectionReason}</p>
            )}

            {selected.status === "pending" && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button disabled={busy} onClick={() => approve(selected._id)} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  <CheckCircle2 size={16} /> Confirm booking
                </button>
                <button disabled={busy} onClick={() => setRejecting(selected)} className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-rose-300 px-6 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject reason */}
      {rejecting && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-black text-ink">Reject this booking?</h3>
            <p className="mt-1 text-sm text-muted">The devotee sees this reason in their notification.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="4" placeholder="Reason for rejection" className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-primary" />
            <div className="mt-5 flex gap-3">
              <button disabled={!reason.trim() || busy} onClick={reject} className="flex-1 rounded-full bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-50">
                Reject booking
              </button>
              <button onClick={() => { setRejecting(null); setReason(""); }} className="rounded-full border border-black/10 px-5 py-3 text-sm font-black text-ink">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminCourseRequestsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // Custom premium modal confirmation & success states
  const [confirmApproveId, setConfirmApproveId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(null);

  // States for revoking/disapproving approved enrollments
  const [disapprovingRequest, setDisapprovingRequest] = useState(null);
  const [disapproveReason, setDisapproveReason] = useState("");

  // States for multi-select bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirmApproveOpen, setBulkConfirmApproveOpen] = useState(false);
  const [bulkConfirmDisapproveOpen, setBulkConfirmDisapproveOpen] = useState(false);
  const [bulkDisapproveReason, setBulkDisapproveReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/course-requests${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setItems(data.items || []);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleApprove = (id) => {
    setConfirmApproveId(id);
  };

  const executeApprove = async () => {
    if (!confirmApproveId) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/admin/course-requests/${confirmApproveId}/approve`, { method: "PUT" });
      setConfirmApproveId(null);
      setSuccessState({
        title: "Enrollment Approved!",
        message: "The devotee has been successfully verified and registered into the course. All locked lessons have been released."
      });
      load();
    } catch (err) {
      setNotice(err.message);
      setConfirmApproveId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeBulkApprove = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(selectedIds.map(id => apiFetch(`/admin/course-requests/${id}/approve`, { method: "PUT" })));
      setSelectedIds([]);
      setBulkConfirmApproveOpen(false);
      setSuccessState({
        title: "Bulk Approval Successful!",
        message: "Successfully approved enrollment access for all selected devotee requests."
      });
      load();
    } catch (err) {
      setNotice(err.message);
      setBulkConfirmApproveOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();
    if (!rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/admin/course-requests/${rejectingRequest._id}/reject`, {
        method: "PUT",
        body: { reason: rejectionReason }
      });
      setRejectingRequest(null);
      setRejectionReason("");
      setSuccessState({
        title: "Submission Rejected",
        message: "The devotee's request has been rejected. Rejection reason details have been sent to their student dashboard."
      });
      load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeBulkDisapprove = async (event) => {
    event.preventDefault();
    if (!bulkDisapproveReason.trim()) return;
    setIsSubmitting(true);
    try {
      await Promise.all(selectedIds.map(id => apiFetch(`/admin/course-requests/${id}/disapprove`, {
        method: "PUT",
        body: { reason: bulkDisapproveReason }
      })));
      setSelectedIds([]);
      setBulkConfirmDisapproveOpen(false);
      setBulkDisapproveReason("");
      setSuccessState({
        title: "Bulk Disapproval Successful!",
        message: "Successfully disapproved/revoked enrollment access for all selected devotee requests."
      });
      load();
    } catch (err) {
      setNotice(err.message);
      setBulkConfirmDisapproveOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessState(null);
    setSelectedRequest(null);
  };

  const handleDisapprove = async (event) => {
    event.preventDefault();
    if (!disapproveReason.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/admin/course-requests/${disapprovingRequest._id}/disapprove`, {
        method: "PUT",
        body: { reason: disapproveReason }
      });
      setDisapprovingRequest(null);
      setDisapproveReason("");
      setSuccessState({
        title: "Enrollment Disapproved!",
        message: "The enrollment access has been suspended/disapproved. Devotee access to locked lessons has been successfully revoked."
      });
      load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(items.map((item) => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  return (
    <div>
      <SEO title="Enrollment Verification Requests - Admin" />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Enrollment Requests</h1>
          <p className="mt-1 text-sm text-muted">Review, approve, or reject student document submissions for locked courses.</p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or course..."
            className="rounded-xl border border-black/10 px-4 py-2 text-sm"
          />
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl bg-primary/10 border border-primary/20 p-4 text-sm font-bold text-primary flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-black">×</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Loading requests...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-black/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.length === items.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-black/15 text-primary focus:ring-primary h-4 w-4"
                    />
                  </th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Submitted Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-soft/10 transition">
                    <td className="px-5 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={(e) => handleToggleSelectRow(item._id, e.target.checked)}
                        className="rounded border-black/15 text-primary focus:ring-primary h-4 w-4"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-black text-ink">{item.fullName}</div>
                      <div className="text-xs text-muted">{item.email} • {item.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-ink">{item.course?.title || "Unknown Course"}</span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {new Date(item.submittedAt || item.createdAt).toLocaleDateString()} at {new Date(item.submittedAt || item.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                        item.status === "approved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                        item.status === "rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                        "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedRequest(item)}
                          className="rounded-xl border border-black/10 px-4 py-2 text-xs font-black hover:bg-soft transition"
                        >
                          View Details
                        </button>
                        {item.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(item._id)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black text-white transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingRequest(item)}
                              className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-black text-white transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {item.status === "approved" && (
                          <button
                            onClick={() => setDisapprovingRequest(item)}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-black text-white transition"
                          >
                            Disapprove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-muted">
                      No enrollment requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Footer */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-ink px-6 py-4 text-white shadow-2xl animate-fadeIn">
          <span className="text-xs font-black font-mono text-primary">
            {selectedIds.length} request(s) selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={() => setBulkConfirmApproveOpen(true)}
            disabled={isSubmitting}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black text-white transition disabled:opacity-50"
          >
            Bulk Approve
          </button>
          <button
            onClick={() => setBulkConfirmDisapproveOpen(true)}
            disabled={isSubmitting}
            className="rounded-full bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-black text-white transition disabled:opacity-50"
          >
            Bulk Disapprove
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-white/70 hover:text-white underline font-bold"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Bulk Approve Confirmation Dialog */}
      {bulkConfirmApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/5">
            <h2 className="text-xl font-black text-ink mb-2">Approve {selectedIds.length} Requests?</h2>
            <p className="text-xs text-muted mb-4">This will approve verification and release course access for all selected devotee requests at once.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBulkConfirmApproveOpen(false)}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-ink hover:bg-soft transition"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkApprove}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-black text-white transition disabled:opacity-50"
              >
                {isSubmitting ? "Approving..." : "Yes, Approve All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Disapprove Reason Dialog */}
      {bulkConfirmDisapproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={executeBulkDisapprove} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/5">
            <h2 className="text-xl font-black text-ink mb-2">Disapprove {selectedIds.length} Requests?</h2>
            <p className="text-xs text-muted mb-4">Please specify the administrative reason to revoke/disapprove all selected enrollments.</p>
            <textarea
              required
              value={bulkDisapproveReason}
              onChange={(e) => setBulkDisapproveReason(e.target.value)}
              placeholder="e.g. Invalid document upload or submission rejected."
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-primary focus:outline-none mb-4 h-24"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkConfirmDisapproveOpen(false)}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-ink hover:bg-soft transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !bulkDisapproveReason.trim()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-sm font-black text-white transition disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Disapprove Selected"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Details Dialog Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full md:max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl transition-all flex flex-col">
            {successState ? (
              <div className="p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-black text-ink">{successState.title}</h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {successState.message}
                </p>
                <button
                  onClick={handleSuccessOk}
                  className="mt-6 w-full rounded-full bg-primary hover:opacity-90 px-6 py-3 text-sm font-black text-white transition shadow-lg"
                >
                  OK, Understood
                </button>
              </div>
            ) : (
              <>
                <div className="border-b border-black/5 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-ink">Verification Request Details</h2>
                    <p className="text-xs text-muted">Submitted by {selectedRequest.fullName}</p>
                  </div>
                  <button onClick={() => setSelectedRequest(null)} className="rounded-full bg-soft p-2 hover:bg-black/10 text-muted">×</button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-3">Student Profile Details</h3>
                    <div className="grid gap-3 rounded-2xl bg-soft/30 p-4 border border-black/5 text-sm">
                      <div>
                        <span className="font-bold text-muted block text-xs">Full Name</span>
                        <span className="font-black text-ink">{selectedRequest.fullName}</span>
                      </div>
                      <div>
                        <span className="font-bold text-muted block text-xs">Email Address</span>
                        <span className="font-bold text-ink">{selectedRequest.email}</span>
                      </div>
                      <div>
                        <span className="font-bold text-muted block text-xs">Phone Number</span>
                        <span className="font-bold text-ink">{selectedRequest.phone}</span>
                      </div>
                      {selectedRequest.message && (
                        <div>
                          <span className="font-bold text-muted block text-xs">Message / Notes</span>
                          <p className="text-muted leading-relaxed mt-1">{selectedRequest.message}</p>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xs font-black uppercase tracking-wider text-primary mt-6 mb-3">Submission Status</h3>
                    <div className="rounded-2xl border border-black/5 p-4 bg-white text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Current Status:</span>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase border ${
                          selectedRequest.status === "approved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                          selectedRequest.status === "rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                          "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {selectedRequest.status}
                        </span>
                      </div>
                      {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                        <div className="mt-3 rounded-xl bg-rose-50/50 p-3 border border-rose-100 text-rose-900">
                          <span className="font-bold text-xs block uppercase">Rejection Reason</span>
                          <p className="mt-1 leading-relaxed text-xs">{selectedRequest.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col h-full min-h-[300px]">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-3">Verification Document</h3>
                    <div className="flex-1 rounded-2xl border border-black/10 overflow-hidden bg-soft relative flex flex-col justify-between p-3">
                      {selectedRequest.documentUrl ? (
                        selectedRequest.documentUrl.toLowerCase().endsWith(".pdf") ? (
                          <embed src={assetUrl(selectedRequest.documentUrl)} type="application/pdf" className="w-full h-full min-h-[220px] rounded-xl" />
                        ) : (
                          <img src={assetUrl(selectedRequest.documentUrl)} alt="Uploaded document" className="w-full h-full max-h-[260px] object-contain rounded-xl" />
                        )
                      ) : (
                        <div className="text-center py-12 text-muted">No document uploaded.</div>
                      )}
                      {selectedRequest.documentUrl && (
                        <a
                          href={assetUrl(selectedRequest.documentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-ink hover:bg-black/90 text-white rounded-xl text-xs font-black text-center transition"
                        >
                          Open Document in New Tab
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col h-full min-h-[300px]">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-3">Payment Receipt / Photo</h3>
                    <div className="flex-1 rounded-2xl border border-black/10 overflow-hidden bg-soft relative flex flex-col justify-between p-3">
                      {selectedRequest.paymentPhotoUrl ? (
                        selectedRequest.paymentPhotoUrl.toLowerCase().endsWith(".pdf") ? (
                          <embed src={assetUrl(selectedRequest.paymentPhotoUrl)} type="application/pdf" className="w-full h-full min-h-[220px] rounded-xl" />
                        ) : (
                          <img src={assetUrl(selectedRequest.paymentPhotoUrl)} alt="Uploaded payment receipt" className="w-full h-full max-h-[260px] object-contain rounded-xl" />
                        )
                      ) : (
                        <div className="text-center py-12 text-muted">No payment receipt uploaded.</div>
                      )}
                      {selectedRequest.paymentPhotoUrl && (
                        <a
                          href={assetUrl(selectedRequest.paymentPhotoUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-ink hover:bg-black/90 text-white rounded-xl text-xs font-black text-center transition"
                        >
                          Open Receipt in New Tab
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRequest.status === "pending" && (
                  <div className="border-t border-black/5 bg-soft/20 px-6 py-4 flex justify-end gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={isSubmitting}
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-black text-white transition disabled:opacity-50"
                    >
                      {isSubmitting ? "Approving..." : "Approve Verification"}
                    </button>
                    <button
                      onClick={() => setRejectingRequest(selectedRequest)}
                      disabled={isSubmitting}
                      className="rounded-full bg-rose-600 hover:bg-rose-700 px-6 py-3 text-sm font-black text-white transition disabled:opacity-50"
                    >
                      Reject Verification
                    </button>
                  </div>
                )}
                {selectedRequest.status === "approved" && (
                  <div className="border-t border-black/5 bg-soft/20 px-6 py-4 flex justify-end gap-3">
                    <button
                      onClick={() => setDisapprovingRequest(selectedRequest)}
                      disabled={isSubmitting}
                      className="rounded-full bg-rose-600 hover:bg-rose-700 px-6 py-3 text-sm font-black text-white transition disabled:opacity-50"
                    >
                      Disapprove / Revoke Access
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Dialog Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleReject} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/10">
            <h2 className="text-xl font-black text-ink">Reject Verification</h2>
            <p className="mt-1 text-sm text-muted">Please specify a clear, helpful reason so the student knows what to correct and upload again.</p>
            <textarea
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., The document image is blurry. Please scan the verification form clearly and re-upload."
              rows="4"
              className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setRejectingRequest(null); setRejectionReason(""); }}
                disabled={isSubmitting}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-black hover:bg-soft transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-black text-white transition disabled:opacity-50"
              >
                {isSubmitting ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disapprove Reason Dialog Modal */}
      {disapprovingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleDisapprove} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/10">
            <h2 className="text-xl font-black text-ink">Disapprove / Revoke Access</h2>
            <p className="mt-1 text-sm text-muted">Please specify a clear reason explaining why this enrollment request is being disapproved and suspended.</p>
            <textarea
              required
              value={disapproveReason}
              onChange={(e) => setDisapproveReason(e.target.value)}
              placeholder="e.g., The document uploaded does not match course pre-requisites. Please upload your student ID form."
              rows="4"
              className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDisapprovingRequest(null); setDisapproveReason(""); }}
                disabled={isSubmitting}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-black hover:bg-soft transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-black text-white transition disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Disapprove Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom premium Confirmation Dialog Modal */}
      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-6 border border-black/10 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4 mx-auto animate-pulse">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-black text-ink">Confirm Enrollment Approval</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Are you sure you want to approve this enrollment request? This will instantly verify the student and grant access to all unlocked course materials.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmApproveId(null)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm font-black hover:bg-soft transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeApprove}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-black text-white transition disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? "Approving..." : "Yes, Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Success Confirmation Modal (for table action shortcuts) */}
      {successState && !selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-8 flex flex-col items-center justify-center text-center border border-black/10">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-black text-ink">{successState.title}</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {successState.message}
            </p>
            <button
              onClick={() => setSuccessState(null)}
              className="mt-6 w-full rounded-full bg-primary hover:opacity-90 px-6 py-3 text-sm font-black text-white transition shadow-lg"
            >
              OK, Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminQuestionBankPage = () => {
  const { courseId, lessonId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ text: "", type: "mcq", options: [{ text: "", isCorrect: true }], explanation: "" });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  const load = () => {
    apiFetch(`/admin/lessons/${lessonId}/questions`).then(data => setQuestions(data.items)).catch(e => setNotice(e.message));
  };
  useEffect(() => { load(); }, [lessonId]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (body.type === "short_answer") delete body.options;
      await apiFetch(editing ? `/admin/questions/${editing}` : `/admin/lessons/${lessonId}/questions`, {
        method: editing ? "PUT" : "POST",
        body
      });
      setForm({ text: "", type: "mcq", options: [{ text: "", isCorrect: true }], explanation: "" });
      setEditing(null);
      setNotice(editing ? "Updated successfully" : "Added successfully");
      load();
    } catch (err) {
      setNotice(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete question?")) return;
    await apiFetch(`/admin/questions/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <SEO title="Question Bank - Admin" />
      <div className="mb-6">
        <Link to={`/admin/courses/${courseId}/lessons`} className="text-sm font-black text-primary">Back to Lessons</Link>
        <h1 className="mt-2 text-3xl font-black">Question Bank</h1>
      </div>
      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black mb-4">{editing ? "Edit Question" : "New Question"}</h2>
        <div className="grid gap-4">
          <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} placeholder="Question text" required rows="2" className="rounded-xl border border-black/10 px-4 py-3" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="rounded-xl border border-black/10 px-4 py-3 w-48">
            <option value="mcq">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
          </select>
          {form.type === "mcq" && (
            <div className="space-y-3 bg-soft/20 p-4 rounded-xl border border-black/10">
              <h3 className="font-bold text-sm">Options</h3>
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input type="radio" name="correctOpt" checked={opt.isCorrect} onChange={() => setForm({...form, options: form.options.map((o, i) => ({...o, isCorrect: i === idx}))})} className="h-4 w-4 text-primary" />
                  <input value={opt.text} onChange={e => setForm({...form, options: form.options.map((o, i) => i === idx ? {...o, text: e.target.value} : o)})} placeholder="Option text" required className="flex-1 rounded-xl border border-black/10 px-4 py-2 text-sm" />
                  {form.options.length > 1 && (
                    <button type="button" onClick={() => setForm({...form, options: form.options.filter((_, i) => i !== idx)})} className="text-red-500 font-bold text-xs hover:underline">Remove</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setForm({...form, options: [...form.options, { text: "", isCorrect: false }]})} className="text-primary font-bold text-xs mt-2 hover:underline">+ Add Option</button>
            </div>
          )}
          <textarea value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} placeholder="Explanation (optional, shown after answering)" rows="2" className="rounded-xl border border-black/10 px-4 py-3" />
        </div>
        <div className="mt-5 flex gap-3">
          <button type="submit" className="rounded-full bg-primary px-6 py-2 text-sm font-black text-white">Save Question</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ text: "", type: "mcq", options: [{ text: "", isCorrect: true }], explanation: "" }); }} className="text-sm font-bold text-muted hover:text-ink">Cancel</button>}
        </div>
        {notice && <p className="mt-3 text-sm font-bold text-primary">{notice}</p>}
      </form>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q._id} className="rounded-2xl bg-white p-5 shadow-sm flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-ink"><span className="text-muted mr-2">Q{idx + 1}.</span> {q.text}</p>
              <div className="mt-2 text-sm text-muted">Type: {q.type === "mcq" ? "Multiple Choice" : "Short Answer"}</div>
              {q.type === "mcq" && (
                <ul className="mt-3 space-y-1">
                  {q.options.map((o, i) => (
                    <li key={i} className={`text-sm ${o.isCorrect ? "font-bold text-green-600" : "text-muted"}`}>• {o.text} {o.isCorrect && "(Correct)"}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(q._id); setForm({ text: q.text, type: q.type, options: q.options?.length ? q.options : [{ text: "", isCorrect: true }], explanation: q.explanation || "" }); }} className="text-primary hover:bg-primary/10 p-2 rounded-lg"><Edit size={16}/></button>
              <button onClick={() => remove(q._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminLessonAnalyticsPage = () => {
  const { courseId, lessonId } = useParams();
  const [progresses, setProgresses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [tab, setTab] = useState("watch"); // watch, quizzes

  const load = () => {
    apiFetch(`/admin/lessons/${lessonId}/analytics`).then(data => {
      setProgresses(data.progresses || []);
      setAttempts(data.attempts || []);
    }).catch(console.error);
  };
  useEffect(() => { load(); }, [lessonId]);

  return (
    <div>
      <SEO title="Lesson Analytics - Admin" />
      <div className="mb-6">
        <Link to={`/admin/courses/${courseId}/lessons`} className="text-sm font-black text-primary">Back to Lessons</Link>
        <h1 className="mt-2 text-3xl font-black">Lesson Analytics</h1>
      </div>

      <div className="flex gap-4 border-b border-black/10 mb-6">
        <button onClick={() => setTab("watch")} className={`pb-2 font-black text-sm transition ${tab === "watch" ? "border-b-2 border-primary text-primary" : "text-muted"}`}>Watch Progress</button>
        <button onClick={() => setTab("quizzes")} className={`pb-2 font-black text-sm transition ${tab === "quizzes" ? "border-b-2 border-primary text-primary" : "text-muted"}`}>Quiz Attempts</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {tab === "watch" && (
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-ink text-white">
              <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Watch %</th><th className="px-4 py-3">Last Position</th></tr>
            </thead>
            <tbody>
              {progresses.map(p => (
                <tr key={p._id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-bold">{p.user?.name || "Unknown"} <br/><span className="text-xs text-muted font-normal">{p.user?.email}</span></td>
                  <td className="px-4 py-3">{p.isCompleted ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-amber-500">No</span>}</td>
                  <td className="px-4 py-3">{p.watchPercent || 0}%</td>
                  <td className="px-4 py-3">{formatTime(p.lastPosition || 0)}</td>
                </tr>
              ))}
              {progresses.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-muted">No progress recorded yet.</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "quizzes" && (
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-ink text-white">
              <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Answers</th></tr>
            </thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a._id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-bold">{a.user?.name || "Unknown"} <br/><span className="text-xs text-muted font-normal">{a.user?.email}</span></td>
                  <td className="px-4 py-3 font-black">{a.score || 0}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${a.status === "passed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-primary font-bold">View Answers</summary>
                      <div className="mt-2 space-y-2 bg-soft p-2 rounded max-h-32 overflow-y-auto">
                        {a.answers?.map(ans => (
                          <div key={ans._id} className="border-b border-black/5 pb-1">
                            <p className="font-bold">{ans.question?.text}</p>
                            <p className={`${ans.isCorrect ? "text-green-600" : "text-red-600"}`}>Given: {ans.selectedOption?.text || ans.shortAnswerText}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-muted">No quiz attempts yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// --- EXAM SYSTEM PAGES ---

export const AdminExamDashboardPage = () => {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-ink">Question Paper Maker</h1>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/question-paper-maker/banks" className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium transition hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-bold text-ink">Question Banks</h2>
          <p className="mt-2 text-sm text-muted">Manage pools of MCQ and Objective questions.</p>
        </Link>
        <Link to="/admin/question-paper-maker/exams" className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium transition hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-bold text-ink">Exams & Papers</h2>
          <p className="mt-2 text-sm text-muted">Create exams with random picking rules.</p>
        </Link>
        <Link to="/admin/question-paper-maker/assignments" className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium transition hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-bold text-ink">Assignments</h2>
          <p className="mt-2 text-sm text-muted">Assign exams to courses with date windows.</p>
        </Link>
        <Link to="/admin/question-paper-maker/results" className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium transition hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-bold text-ink">Results & Analytics</h2>
          <p className="mt-2 text-sm text-muted">Evaluate subjective answers and view scores.</p>
        </Link>
      </div>
    </div>
  );
};

export const AdminExamBanksPage = () => {
  const { items, loading, refresh } = useList("/admin/exam-question-banks");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", isActive: true });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/admin/exam-question-banks/${editingId}`, { method: "PUT", body: form });
    } else {
      await apiFetch("/admin/exam-question-banks", { method: "POST", body: form });
    }
    setShowModal(false);
    refresh();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this bank?")) {
      await apiFetch(`/admin/exam-question-banks/${id}`, { method: "DELETE" });
      refresh();
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <Link to="/admin/question-paper-maker" className="text-primary hover:underline text-sm font-bold block mb-2">&larr; Back to Dashboard</Link>
           <h1 className="text-3xl font-black text-ink">Question Banks</h1>
        </div>
        <button onClick={() => { setForm({ title: "", description: "", isActive: true }); setEditingId(null); setShowModal(true); }} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90">
          Create New Bank
        </button>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium">
        {loading ? <p>Loading...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-soft text-muted">
              <tr>
                <th className="p-4 font-black">Title</th>
                <th className="p-4 font-black">Description</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map(item => (
                <tr key={item._id} className="transition hover:bg-soft/50">
                  <td className="p-4 font-bold text-ink">{item.title}</td>
                  <td className="p-4 text-muted">{item.description}</td>
                  <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="p-4 text-right">
                    <Link to={`/admin/question-paper-maker/banks/${item._id}/questions`} className="mr-3 font-bold text-primary hover:underline">Manage Questions</Link>
                    <button onClick={() => handleEdit(item)} className="mr-3 font-bold text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item._id)} className="font-bold text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-muted">No banks found. Create one to get started.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/10">
            <h2 className="mb-4 text-xl font-black">{editingId ? "Edit Bank" : "Create Bank"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Title</label>
                <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Description</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none"></textarea>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-black hover:bg-soft">Cancel</button>
                <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminExamQuestionsPage = () => {
  const { id: bankId } = useParams();
  const { item: bank } = useSingle(`/admin/exam-question-banks/${bankId}`, null, "item");
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "MCQ", questionText: "", marks: 1, difficulty: "medium", options: [{ text: "", isCorrect: true }], expectedKeywords: [], fullModelAnswer: "", autoEvaluate: true });
  const [editingId, setEditingId] = useState(null);

  const loadQuestions = () => {
    apiFetch(`/admin/exam-questions?questionBank=${bankId}&limit=1000`).then(data => setQuestions(data.items || []));
  };

  useEffect(() => {
    if (bankId) loadQuestions();
  }, [bankId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, questionBank: bankId };
    if (editingId) {
      await apiFetch(`/admin/exam-questions/${editingId}`, { method: "PUT", body: payload });
    } else {
      await apiFetch("/admin/exam-questions", { method: "POST", body: payload });
    }
    setShowModal(false);
    loadQuestions();
  };

  const handleEdit = (item) => {
    setForm({
      type: item.type,
      questionText: item.questionText,
      marks: item.marks,
      difficulty: item.difficulty,
      options: item.options || [{ text: "", isCorrect: true }],
      expectedKeywords: item.expectedKeywords || [],
      fullModelAnswer: item.fullModelAnswer || "",
      autoEvaluate: item.autoEvaluate ?? true
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this question?")) {
      await apiFetch(`/admin/exam-questions/${id}`, { method: "DELETE" });
      loadQuestions();
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <Link to="/admin/question-paper-maker/banks" className="text-primary hover:underline text-sm font-bold block mb-2">&larr; Back to Banks</Link>
           <h1 className="text-3xl font-black text-ink">Questions for "{bank?.title}"</h1>
        </div>
        <button onClick={() => { setForm({ type: "MCQ", questionText: "", marks: 1, difficulty: "medium", options: [{ text: "", isCorrect: true }], expectedKeywords: [], fullModelAnswer: "", autoEvaluate: true }); setEditingId(null); setShowModal(true); }} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90">
          Add Question
        </button>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium">
        <table className="w-full text-left text-sm">
          <thead className="bg-soft text-muted">
            <tr>
              <th className="p-4 font-black">Type</th>
              <th className="p-4 font-black">Question</th>
              <th className="p-4 font-black">Marks</th>
              <th className="p-4 font-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {questions.map(q => (
              <tr key={q._id} className="transition hover:bg-soft/50">
                <td className="p-4"><span className="px-2 py-1 bg-soft rounded-md font-black text-xs uppercase">{q.type}</span></td>
                <td className="p-4 font-bold text-ink max-w-md truncate">{q.questionText}</td>
                <td className="p-4 font-black">{q.marks}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(q)} className="mr-3 font-bold text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(q._id)} className="font-bold text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {questions.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-muted">No questions added yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-black/10 my-8">
            <h2 className="mb-4 text-xl font-black">{editingId ? "Edit Question" : "Add Question"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none">
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="OBJECTIVE">Descriptive / Objective</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Marks</label>
                  <input type="number" required min="1" value={form.marks} onChange={e => setForm({ ...form, marks: Number(e.target.value) })} className="w-24 rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Question Text</label>
                <textarea required rows="3" value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none"></textarea>
              </div>

              {form.type === "MCQ" && (
                <div className="bg-soft p-4 rounded-xl space-y-3">
                  <label className="block text-sm font-bold text-ink">Options</label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="radio" name="correctOption" checked={opt.isCorrect} onChange={() => {
                        const newOpts = form.options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                        setForm({ ...form, options: newOpts });
                      }} />
                      <input required type="text" value={opt.text} onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[i].text = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }} className="flex-1 rounded-xl border border-black/10 bg-white p-2 text-sm font-medium focus:border-primary focus:outline-none" placeholder={`Option ${i+1}`} />
                      {form.options.length > 1 && (
                        <button type="button" onClick={() => {
                          const newOpts = form.options.filter((_, idx) => idx !== i);
                          if(opt.isCorrect && newOpts.length > 0) newOpts[0].isCorrect = true;
                          setForm({ ...form, options: newOpts });
                        }} className="text-red-500 font-bold px-2">&times;</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, options: [...form.options, { text: "", isCorrect: false }] })} className="text-primary text-sm font-bold hover:underline">+ Add Option</button>
                </div>
              )}

              {form.type === "OBJECTIVE" && (
                <div className="bg-soft p-4 rounded-xl space-y-3">
                  <div>
                     <label className="block text-sm font-bold text-ink mb-1">Expected Keywords (Comma Separated)</label>
                     <input type="text" value={form.expectedKeywords.join(", ")} onChange={e => setForm({ ...form, expectedKeywords: e.target.value.split(",").map(k => k.trim()).filter(k => k) })} className="w-full rounded-xl border border-black/10 bg-white p-3 text-sm font-medium focus:border-primary focus:outline-none" placeholder="e.g. inheritance, encapsulation, polymorphism" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-ink mb-1">Full Model Answer (For Admin Reference)</label>
                     <textarea rows="3" value={form.fullModelAnswer} onChange={e => setForm({ ...form, fullModelAnswer: e.target.value })} className="w-full rounded-xl border border-black/10 bg-white p-3 text-sm font-medium focus:border-primary focus:outline-none"></textarea>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" checked={form.autoEvaluate} onChange={e => setForm({ ...form, autoEvaluate: e.target.checked })} />
                    Enable Auto-Evaluation (Based on Keywords Match %)
                  </label>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-black hover:bg-white transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminExamsPage = () => {
  const { items, loading, refresh } = useList("/admin/exam-papers", { populate: "questionBank" });
  const [banks, setBanks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", durationMinutes: 60, numMcqsToPick: 10, numObjectiveToPick: 5, questionBank: "", totalMarks: 10, passingMarks: 5, instructions: "", isPublished: false });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    apiFetch("/admin/exam-question-banks").then(data => setBanks(data.items || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/admin/exam-papers/${editingId}`, { method: "PUT", body: form });
    } else {
      await apiFetch("/admin/exam-papers", { method: "POST", body: form });
    }
    setShowModal(false);
    refresh();
  };

  const handleEdit = (item) => {
    setForm({
      title: item.title, description: item.description || "", durationMinutes: item.durationMinutes, numMcqsToPick: item.numMcqsToPick, numObjectiveToPick: item.numObjectiveToPick, questionBank: item.questionBank?._id || item.questionBank, totalMarks: item.totalMarks, passingMarks: item.passingMarks, instructions: item.instructions || "", isPublished: item.isPublished
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this exam?")) {
      await apiFetch(`/admin/exam-papers/${id}`, { method: "DELETE" });
      refresh();
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <Link to="/admin/question-paper-maker" className="text-primary hover:underline text-sm font-bold block mb-2">&larr; Back to Dashboard</Link>
           <h1 className="text-3xl font-black text-ink">Exams & Papers</h1>
        </div>
        <button onClick={() => { setForm({ title: "", description: "", durationMinutes: 60, numMcqsToPick: 10, numObjectiveToPick: 5, questionBank: banks[0]?._id || "", totalMarks: 10, passingMarks: 5, instructions: "", isPublished: false }); setEditingId(null); setShowModal(true); }} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90">
          Create Exam
        </button>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium">
        {loading ? <p>Loading...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-soft text-muted">
              <tr>
                <th className="p-4 font-black">Title</th>
                <th className="p-4 font-black">Bank Used</th>
                <th className="p-4 font-black">Settings</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map(item => (
                <tr key={item._id} className="transition hover:bg-soft/50">
                  <td className="p-4 font-bold text-ink">{item.title}</td>
                  <td className="p-4 text-muted">{item.questionBank?.title || "Unknown"}</td>
                  <td className="p-4 text-xs">
                    {item.durationMinutes}m | {item.numMcqsToPick} MCQ | {item.numObjectiveToPick} Obj
                  </td>
                  <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${item.isPublished ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{item.isPublished ? "Published" : "Draft"}</span></td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(item)} className="mr-3 font-bold text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item._id)} className="font-bold text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-muted">No exams found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-black/10 my-8">
            <h2 className="mb-4 text-xl font-black">{editingId ? "Edit Exam" : "Create Exam"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">Title</label>
                  <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">Source Question Bank</label>
                  <select required value={form.questionBank} onChange={e => setForm({ ...form, questionBank: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none">
                    <option value="">Select a Bank...</option>
                    {banks.map(b => <option key={b._id} value={b._id}>{b.title}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Duration (mins)</label>
                  <input type="number" required min="1" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">MCQs to Pick</label>
                  <input type="number" required min="0" value={form.numMcqsToPick} onChange={e => setForm({ ...form, numMcqsToPick: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Objective to Pick</label>
                  <input type="number" required min="0" value={form.numObjectiveToPick} onChange={e => setForm({ ...form, numObjectiveToPick: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Total Marks</label>
                  <input type="number" required min="1" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Passing Marks</label>
                  <input type="number" required min="0" value={form.passingMarks} onChange={e => setForm({ ...form, passingMarks: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Instructions</label>
                <textarea rows="3" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none"></textarea>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                Publish Exam
              </label>

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-black hover:bg-white transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition">Save Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminExamAssignmentsPage = () => {
  const { items, loading, refresh } = useList("/admin/exam-assignments", { populate: ["exam", "course", "lesson"] });
  const { items: exams } = useList("/admin/exam-papers");
  const { items: courses } = useList("/admin/courses");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ exam: "", course: "", lesson: "", maxAttempts: 1, isActive: true, startDate: "", endDate: "" });
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    if (form.course) {
      apiFetch(`/courses/${form.course}/lessons`).then(data => setLessons(data.items || data.lessons || [])).catch(() => setLessons([]));
    } else {
      setLessons([]);
    }
  }, [form.course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.startDate) payload.startDate = null;
    if (!payload.endDate) payload.endDate = null;

    if (editingId) {
      await apiFetch(`/admin/exam-assignments/${editingId}`, { method: "PUT", body: payload });
    } else {
      await apiFetch("/admin/exam-assignments", { method: "POST", body: payload });
    }
    setShowModal(false);
    refresh();
  };

  const handleEdit = (item) => {
    setForm({
      exam: item.exam?._id || item.exam,
      course: item.course?._id || item.course,
      lesson: item.lesson?._id || item.lesson,
      maxAttempts: item.maxAttempts,
      isActive: item.isActive,
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "",
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : ""
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this assignment?")) {
      await apiFetch(`/admin/exam-assignments/${id}`, { method: "DELETE" });
      refresh();
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <Link to="/admin/question-paper-maker" className="text-primary hover:underline text-sm font-bold block mb-2">&larr; Back to Dashboard</Link>
           <h1 className="text-3xl font-black text-ink">Exam Assignments</h1>
        </div>
        <button onClick={() => { setForm({ exam: exams[0]?._id || "", course: courses[0]?._id || "", lesson: "", maxAttempts: 1, isActive: true, startDate: "", endDate: "" }); setEditingId(null); setShowModal(true); }} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90">
          New Assignment
        </button>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium">
        {loading ? <p>Loading...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-soft text-muted">
              <tr>
                <th className="p-4 font-black">Exam</th>
                <th className="p-4 font-black">Course</th>
                <th className="p-4 font-black">Lesson</th>
                <th className="p-4 font-black">Availability</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map(item => (
                <tr key={item._id} className="transition hover:bg-soft/50">
                  <td className="p-4 font-bold text-ink">{item.exam?.title}</td>
                  <td className="p-4 font-bold text-ink">{item.course?.title}</td>
                  <td className="p-4 font-bold text-ink">{item.lesson?.title || "N/A"}</td>
                  <td className="p-4 text-muted text-xs">
                    {item.startDate ? new Date(item.startDate).toLocaleString() : "Now"} - {item.endDate ? new Date(item.endDate).toLocaleString() : "Forever"}
                  </td>
                  <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(item)} className="mr-3 font-bold text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item._id)} className="font-bold text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-muted">No assignments found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-black/10 my-8">
            <h2 className="mb-4 text-xl font-black">{editingId ? "Edit Assignment" : "New Assignment"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Select Exam</label>
                <select required value={form.exam} onChange={e => setForm({ ...form, exam: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none">
                  <option value="">Select an Exam...</option>
                  {exams.map(b => <option key={b._id} value={b._id}>{b.title}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">Select Course</label>
                  <select required value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none">
                    <option value="">Select a Course...</option>
                    {courses.map(b => <option key={b._id} value={b._id}>{b.title}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">Select Lesson / Module</label>
                  <select required value={form.lesson} onChange={e => setForm({ ...form, lesson: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" disabled={!form.course || lessons.length === 0}>
                    <option value="">{lessons.length === 0 ? "No lessons" : "Select a Lesson..."}</option>
                    {lessons.map(b => <option key={b._id} value={b._id}>{b.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">Start Date</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-bold text-ink">End Date</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Max Attempts</label>
                <input type="number" required min="1" value={form.maxAttempts} onChange={e => setForm({ ...form, maxAttempts: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-soft/50 p-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Active (Available to Students)
              </label>

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-black hover:bg-white transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:opacity-90 transition">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminExamResultsPage = () => {
  const { items, loading, refresh } = useList("/admin/exam-attempts?status=submitted,evaluated");

  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === items.length ? [] : items.map(item => item._id));

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} submission(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id => apiFetch(`/admin/exam-attempts/${id}`, { method: "DELETE" })));
      setSelectedIds([]);
      refresh();
    } catch (e) {
      alert("Error deleting some attempts: " + e.message);
    }
  };

  const viewAttempt = async (attempt) => {
    const data = await apiFetch(`/admin/exam-attempts/${attempt._id}`);
    setSelectedAttempt(data);
  };

  const handleManualEvaluation = async (e, responseId) => {
    e.preventDefault();
    const marksAwarded = Number(e.target.marks.value);
    const evaluationNote = e.target.feedback.value;
    await apiFetch(`/admin/exams/evaluate/${responseId}`, { method: "POST", body: { marksAwarded, evaluationNote } });
    alert("Saved");
    // Reload attempt
    const data = await apiFetch(`/admin/exam-attempts/${selectedAttempt._id}`);
    setSelectedAttempt(data);
    refresh();
  };

  const deleteAttempt = async (attempt) => {
    if (!window.confirm("Are you sure you want to delete this submission? This cannot be undone.")) return;
    try {
      await apiFetch(`/admin/exam-attempts/${attempt._id}`, { method: "DELETE" });
      refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <Link to="/admin/question-paper-maker" className="text-primary hover:underline text-sm font-bold block mb-2">&larr; Back to Dashboard</Link>
           <div className="flex items-center gap-4">
             <h1 className="text-3xl font-black text-ink">Exam Results & Evaluation</h1>
             {selectedIds.length > 0 && (
               <button onClick={bulkDelete} className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Delete Selected ({selectedIds.length})</button>
             )}
           </div>
        </div>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium">
        {loading ? <p>Loading...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-soft text-muted">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" checked={items.length > 0 && selectedIds.length === items.length} onChange={toggleAll} /></th>
                <th className="p-4 font-black">Student</th>
                <th className="p-4 font-black">Exam & Course</th>
                <th className="p-4 font-black">Attempt #</th>
                <th className="p-4 font-black">Submitted At</th>
                <th className="p-4 font-black">Score</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map(item => (
                <tr key={item._id} className="transition hover:bg-soft/50">
                  <td className="p-4"><input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleSelect(item._id)} /></td>
                  <td className="p-4 font-bold text-ink">{item.user?.name} <br/><span className="font-normal text-muted text-xs">{item.user?.email}</span></td>
                  <td className="p-4 font-bold text-ink">{item.exam?.title} <br/><span className="font-normal text-primary text-[10px] uppercase">{item.assignment?.course?.title || "Direct Exam"}</span></td>
                  <td className="p-4 font-bold text-ink text-center">{item.attemptNumber || 1}</td>
                  <td className="p-4 text-xs text-muted">{new Date(item.submittedAt || item.updatedAt).toLocaleString()}</td>
                  <td className="p-4 font-black">{item.score || 0}</td>
                  <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black uppercase ${item.status === "evaluated" ? "bg-green-100 text-green-700" : item.status === "submitted" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{item.status}</span></td>
                  <td className="p-4 text-right">
                    <button onClick={() => viewAttempt(item)} className="mr-3 font-bold text-blue-600 hover:underline">View / Evaluate</button>
                    <button onClick={() => deleteAttempt(item)} className="font-bold text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-muted">No completed attempts found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 md:p-10 shadow-2xl border border-black/10 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Evaluate Attempt: {selectedAttempt.user?.name}</h2>
              <button onClick={() => setSelectedAttempt(null)} className="text-xl font-bold">&times;</button>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4 bg-soft p-4 rounded-xl">
               <div><p className="text-xs font-bold text-muted uppercase">Total Score</p><p className="text-lg font-black">{selectedAttempt.score}</p></div>
               <div><p className="text-xs font-bold text-muted uppercase">Status</p><p className="text-lg font-black uppercase">{selectedAttempt.status}</p></div>
               <div><p className="text-xs font-bold text-muted uppercase">Completed At</p><p className="text-sm font-bold">{new Date(selectedAttempt.endTime || selectedAttempt.updatedAt).toLocaleString()}</p></div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black">Responses</h3>
               {selectedAttempt.responses?.map((r, i) => (
                 <div key={r._id} className="border border-black/10 rounded-xl p-4">
                    <p className="font-bold mb-2">Q{i+1}: {r.question?.questionText}</p>
                    <div className="flex gap-4 mb-4">
                       <span className="bg-soft px-2 py-1 text-xs font-black uppercase rounded">{r.question?.type}</span>
                       <span className="bg-soft px-2 py-1 text-xs font-black rounded">Max Marks: {r.question?.marks}</span>
                    </div>

                    <div className="mb-4">
                       <p className="text-sm font-bold text-muted mb-1">Student Answer:</p>
                       {r.question?.type === "MCQ" ? (
                          <p className={`p-3 rounded-lg text-sm font-bold ${r.marksAwarded > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                             {r.question.options?.find(o => String(o._id) === String(r.mcqSelectedOptionId))?.text || "(No option selected)"}
                          </p>
                       ) : (
                          <p className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">{r.objectiveAnswerText || "(No answer provided)"}</p>
                       )}
                    </div>

                    {r.question?.type === "OBJECTIVE" && (
                       <div className="mb-4">
                          <p className="text-sm font-bold text-muted mb-1">Model Answer:</p>
                          <p className="bg-green-50 p-3 rounded-lg text-sm border border-green-100">{r.question?.fullModelAnswer || "(No model answer)"}</p>
                          {r.question?.expectedKeywords?.length > 0 && (
                            <p className="mt-2 text-xs font-bold text-muted">Keywords: {r.question.expectedKeywords.join(", ")}</p>
                          )}
                       </div>
                    )}

                    {r.question?.type === "MCQ" && (
                       <div className="mb-4">
                          <p className="text-sm font-bold text-muted mb-1">Correct Answer:</p>
                          <p className="bg-green-50 p-3 rounded-lg text-sm border border-green-100">{r.question.options?.find(o => o.isCorrect)?.text}</p>
                       </div>
                    )}

                    <form onSubmit={(e) => handleManualEvaluation(e, r._id)} className="border-t border-black/10 pt-4 mt-4 flex flex-wrap gap-4 items-end bg-soft/50 p-4 rounded-xl">
                       <div className="flex-1">
                          <label className="block text-xs font-bold mb-1">Evaluation Note (Optional)</label>
                          <input name="feedback" defaultValue={r.evaluationNote || ""} className="w-full text-sm p-2 rounded border border-black/10" placeholder="Great job..." />
                       </div>
                       <div>
                          <label className="block text-xs font-bold mb-1">Awarded Marks</label>
                          <input type="number" name="marks" defaultValue={r.marksAwarded} max={r.question?.marks} min="0" step="0.5" className="w-24 text-sm p-2 rounded border border-black/10" />
                       </div>
                       <button type="submit" className="bg-primary text-white font-bold text-sm px-4 py-2 rounded hover:opacity-90 shadow-sm">Save Marks</button>
                    </form>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentExamsPage = () => {
  const { item: data, loading } = useSingle("/student/exams/my-exams");
  const assignments = data?.assignments || [];
  const attempts = data?.attempts || [];

  const getAttempt = (examId) => attempts.find(a => a.exam?._id === examId);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <SEO title="My Exams" />
      <h1 className="text-3xl font-black text-ink mb-8">My Exams</h1>
      {loading ? <p>Loading exams...</p> : (
        <div className="grid gap-6">
          {assignments.map(assign => {
            const exam = assign.exam;
            const attempt = getAttempt(exam._id);
            const canStart = !attempt || attempt.status === "in_progress";
            const isCompleted = attempt && ["submitted", "passed", "failed", "evaluated"].includes(attempt.status);

            return (
              <div key={assign._id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="bg-soft px-2 py-1 rounded text-[10px] font-black uppercase text-primary">{assign.course?.title}</span>
                    {isCompleted && <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${attempt.status === "passed" || attempt.status === "evaluated" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{attempt.status}</span>}
                  </div>
                  <h2 className="text-xl font-black text-ink">{exam.title}</h2>
                  <p className="mt-1 text-sm text-muted">{exam.durationMinutes} minutes | {exam.totalMarks} Marks</p>
                  {isCompleted && <p className="mt-2 text-sm font-bold">Your Score: {attempt.score} / {exam.totalMarks}</p>}
                </div>
                <div>
                  {isCompleted ? (
                    <Link to={`/exam/result/${attempt._id}`} className="rounded-full bg-soft px-5 py-2.5 text-sm font-black hover:bg-black/10 transition">View Result</Link>
                  ) : canStart ? (
                    <Link to={attempt ? `/exam/attempt/${attempt._id}` : `/exam/${exam._id}/start?assignment=${assign._id}`} className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition">{attempt ? "Resume Exam" : "Start Exam"}</Link>
                  ) : (
                    <span className="text-sm font-bold text-muted">Max attempts reached</span>
                  )}
                </div>
              </div>
            );
          })}
          {attempts.filter(a => !assignments.find(ass => ass.exam?._id === a.exam?._id)).map(attempt => {
            const exam = attempt.exam;
            const isCompleted = ["submitted", "passed", "failed", "evaluated"].includes(attempt.status);
            
            return (
              <div key={attempt._id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="bg-soft px-2 py-1 rounded text-[10px] font-black uppercase text-primary">Direct Exam</span>
                    {isCompleted && <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${attempt.status === "passed" || attempt.status === "evaluated" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{attempt.status}</span>}
                  </div>
                  <h2 className="text-xl font-black text-ink">{exam?.title || 'Unknown Exam'}</h2>
                  {isCompleted && <p className="mt-2 text-sm font-bold">Your Score: {attempt.score} / {exam?.totalMarks || 0}</p>}
                </div>
                <div>
                  {isCompleted ? (
                    <Link to={`/exam/result/${attempt._id}`} className="rounded-full bg-soft px-5 py-2.5 text-sm font-black hover:bg-black/10 transition">View Result</Link>
                  ) : (
                    <Link to={`/exam/attempt/${attempt._id}`} className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition">Resume Exam</Link>
                  )}
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && attempts.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-black/10 rounded-3xl">
              <p className="text-muted font-bold">No exams assigned to you at the moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const StudentExamTakePage = () => {
  const { examId, attemptId } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const assignmentId = params.get("assignment");
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const startCalled = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (examId && !attemptId) {
          if (startCalled.current) return;
          startCalled.current = true;
          // Start new attempt
          const res = await apiFetch(`/student/exams/${examId}/start`, { method: "POST", body: { assignmentId } });
          navigate(`/exam/attempt/${res.attempt._id}`, { replace: true, state: location.state });
        } else if (attemptId) {
          // Load attempt
          const res = await apiFetch(`/student/exams/attempt/${attemptId}`);
          if (res.attempt.status !== "in_progress") {
             setSubmitted(true);
             setTimeout(() => {
                const backUrl = location.state?.backUrl || `/exam/result/${attemptId}`;
                navigate(backUrl, { replace: true });
             }, 3000);
             return;
          }
          setAttempt(res.attempt);
          setResponses(res.responses);
          const initialAnswers = {};
          res.responses.forEach(r => {
             if(r.mcqSelectedOptionId) initialAnswers[r.question._id] = r.mcqSelectedOptionId;
             else if(r.objectiveAnswerText) initialAnswers[r.question._id] = r.objectiveAnswerText;
          });
          setAnswers(initialAnswers);
          setLoading(false);
        }
      } catch (err) {
        alert(err.message || "Failed to start exam");
        navigate("/student/dashboard");
      }
    };
    init();
  }, [examId, attemptId]);

  useEffect(() => {
    if (!attempt || submitted) return;
    
    const durationMs = (attempt.exam?.durationMinutes || 60) * 60000;
    const endTime = new Date(attempt.startedAt || attempt.createdAt).getTime() + durationMs;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, submitted]);

  const handleAutoSubmit = async () => {
     alert("Time is up! Your exam will be auto-submitted.");
     try {
       await saveProgress();
       await apiFetch(`/student/exams/attempt/${attemptId}/submit`, { method: "POST" });
       setSubmitted(true);
       setTimeout(() => {
         const backUrl = location.state?.backUrl || `/exam/result/${attemptId}`;
         navigate(backUrl, { replace: true });
       }, 3000);
     } catch (err) {
       alert(err.message || "Failed to auto-submit exam.");
     }
  };

  const saveProgress = async () => {
    const updates = Object.keys(answers).map(qId => {
      const q = attempt.selectedQuestions.find(sq => sq._id === qId);
      if(q.type === "MCQ") return { questionId: qId, selectedOption: answers[qId] };
      return { questionId: qId, answerText: answers[qId] };
    });
    await apiFetch(`/student/exams/attempt/${attemptId}/save`, { method: "PUT", body: { responses: updates } });
  };

  const handleNext = async () => {
    try {
      await saveProgress();
    } catch (err) {
      console.error("Save progress error:", err);
    }
    if (currentIdx < attempt.selectedQuestions.length - 1) setCurrentIdx(c => c + 1);
  };

  const handleSubmit = async () => {
    if(!confirm("Are you sure you want to submit? You cannot change your answers after this.")) return;
    try {
      await saveProgress();
      await apiFetch(`/student/exams/attempt/${attemptId}/submit`, { method: "POST" });
      setSubmitted(true);
      setTimeout(() => {
        const backUrl = location.state?.backUrl || `/exam/result/${attemptId}`;
        navigate(backUrl, { replace: true });
      }, 3000);
    } catch(err) {
      alert(err.message || "Failed to submit exam.");
    }
  };

  const formatTime = (ms) => {
    if (ms === null) return "Loading...";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-soft/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-premium text-center max-w-lg w-full">
           <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
           </div>
           <h2 className="text-3xl font-black text-ink mb-4">Thank You!</h2>
           <p className="text-muted font-medium mb-8 text-lg">Your exam has been submitted successfully.</p>
           <p className="text-sm font-bold text-primary animate-pulse">Redirecting back to your lesson...</p>
        </div>
      </div>
    );
  }

  if (loading || !attempt) return <div className="p-12 text-center font-bold">Loading Exam...</div>;

  const currentQ = attempt.selectedQuestions[currentIdx];

  return (
    <div className="min-h-screen bg-soft/30 pb-12">
      <div className="bg-white shadow-sm border-b border-black/5 relative z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-black text-lg">{attempt.exam?.title}</h1>
          <div className={`font-bold ${timeLeft !== null && timeLeft < 300000 ? "text-red-600 animate-pulse" : "text-primary"}`}>
            Time Remaining: {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex gap-8 items-start">
           <div className="w-64 shrink-0 bg-white rounded-3xl p-6 shadow-premium hidden md:block">
              <h3 className="font-black text-sm mb-4">Questions</h3>
              <div className="grid grid-cols-4 gap-2">
                 {attempt.selectedQuestions.map((q, i) => (
                    <button key={q._id} onClick={() => { saveProgress(); setCurrentIdx(i); }} className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition ${i === currentIdx ? "bg-primary text-white shadow-lg" : answers[q._id] ? "bg-green-100 text-green-700" : "bg-soft hover:bg-black/5"}`}>
                      {i+1}
                    </button>
                 ))}
              </div>
           </div>

           <div className="flex-1 bg-white rounded-3xl p-6 md:p-10 shadow-premium min-h-[400px] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                 <span className="text-sm font-bold text-muted uppercase tracking-wider">Question {currentIdx + 1} of {attempt.selectedQuestions.length}</span>
                 <span className="px-2 py-1 bg-soft rounded text-xs font-black">{currentQ.marks} Marks</span>
              </div>
              
              <p className="text-lg font-medium leading-relaxed text-ink mb-8">{currentQ.questionText}</p>

              <div className="flex-1">
                 {currentQ.type === "MCQ" ? (
                   <div className="space-y-3">
                     {currentQ.options.map((opt, i) => (
                        <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${answers[currentQ._id] === opt._id ? "border-primary bg-primary/5" : "border-black/5 hover:border-black/20"}`}>
                           <input type="radio" name={`q_${currentQ._id}`} checked={answers[currentQ._id] === opt._id} onChange={() => setAnswers(prev => ({ ...prev, [currentQ._id]: opt._id }))} className="w-4 h-4 text-primary" />
                           <span className="font-medium">{opt.text}</span>
                        </label>
                     ))}
                   </div>
                 ) : (
                   <textarea rows="8" placeholder="Type your answer here..." value={answers[currentQ._id] || ""} onChange={e => setAnswers(prev => ({ ...prev, [currentQ._id]: e.target.value }))} className="w-full border-2 border-black/10 rounded-xl p-4 font-medium focus:border-primary focus:outline-none resize-y"></textarea>
                 )}
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-10 pt-6 border-t border-black/5">
                 <button onClick={() => setCurrentIdx(c => Math.max(0, c - 1))} disabled={currentIdx === 0} className="w-full md:w-auto font-bold text-muted hover:text-ink disabled:opacity-30 py-3">Previous</button>
                 {currentIdx === attempt.selectedQuestions.length - 1 ? (
                   <button onClick={handleSubmit} className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-full font-black hover:opacity-80 transition">Submit Exam</button>
                 ) : (
                   <button onClick={handleNext} className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-full font-black shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition">Next Question &rarr;</button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export const StudentExamResultPage = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const backUrl = location.state?.backUrl || "/student/dashboard";
  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/student/exams/attempt/${attemptId}`).then(data => {
       setAttempt(data.attempt);
       setResponses(data.responses);
       setLoading(false);
    });
  }, [attemptId]);

  if (loading) return <div className="p-12 text-center font-bold">Loading...</div>;
  if (!attempt || attempt.status === "in_progress") return <div className="p-12 text-center font-bold">Exam is not completed yet.</div>;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <SEO title="Exam Result" />
      <div className="mb-8">
         <Link to={backUrl} className="text-primary hover:underline text-sm font-bold block mb-4">&larr; Back to {backUrl === "/student/dashboard" ? "Dashboard" : "Lesson"}</Link>
         <h1 className="text-3xl font-black text-ink">Exam Result: {attempt.exam?.title}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-white p-6 rounded-3xl shadow-premium border border-black/5 text-center">
            <p className="text-xs font-bold text-muted uppercase mb-1">Status</p>
            <p className={`text-xl font-black uppercase ${attempt.status === "passed" ? "text-green-600" : attempt.status === "failed" ? "text-red-600" : "text-orange-600"}`}>{attempt.status}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-premium border border-black/5 text-center">
            <p className="text-xs font-bold text-muted uppercase mb-1">Your Score</p>
            <p className="text-3xl font-black text-ink">{attempt.score}<span className="text-lg text-muted">/{attempt.exam?.totalMarks}</span></p>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-premium border border-black/5 text-center">
            <p className="text-xs font-bold text-muted uppercase mb-1">Passing</p>
            <p className="text-xl font-black text-ink">{attempt.exam?.passingMarks}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-premium border border-black/5 text-center">
            <p className="text-xs font-bold text-muted uppercase mb-1">Completed</p>
            <p className="text-sm font-bold text-ink">{new Date(attempt.endTime || attempt.updatedAt).toLocaleDateString()}</p>
         </div>
      </div>

      <div className="space-y-6">
         <h2 className="text-xl font-black mb-4">Detailed Answers</h2>
         {responses.map((r, i) => (
            <div key={r._id} className="bg-white rounded-3xl p-6 shadow-premium border border-black/5">
               <div className="flex justify-between items-start mb-4">
                  <p className="font-bold text-lg"><span className="text-muted mr-2">Q{i+1}.</span>{r.question?.questionText}</p>
                  <span className="shrink-0 bg-soft px-3 py-1 rounded-full text-xs font-black">{r.awardedMarks || 0} / {r.question?.marks} Marks</span>
               </div>
               
               <div className="mb-4">
                  <p className="text-xs font-bold text-muted uppercase mb-1">Your Answer:</p>
                  <p className={`p-3 rounded-xl font-medium ${r.isCorrect ? "bg-green-50 border border-green-200 text-green-900" : "bg-red-50 border border-red-200 text-red-900"}`}>
                     {r.question?.type === "MCQ" ? (r.question.options?.find(o => String(o._id) === String(r.mcqSelectedOptionId))?.text || "(No answer)") : (r.objectiveAnswerText || "(No answer)")}
                  </p>
               </div>

               {r.question?.type === "MCQ" && !r.isCorrect && (
                  <div>
                     <p className="text-xs font-bold text-muted uppercase mb-1">Correct Answer:</p>
                     <p className="p-3 rounded-xl font-medium bg-green-50 border border-green-200 text-green-900">
                        {r.question.options?.find(o => o.isCorrect)?.text}
                     </p>
                  </div>
               )}

               {r.question?.type === "OBJECTIVE" && r.evaluatorFeedback && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                     <p className="text-xs font-bold text-primary uppercase mb-1">Evaluator Feedback:</p>
                     <p className="font-medium italic text-ink">{r.evaluatorFeedback}</p>
                  </div>
               )}
            </div>
         ))}
      </div>
    </div>
  );
};

export const AdminAssetsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [filterType, setFilterType] = useState("all");
  
  const [errorMsg, setErrorMsg] = useState("");
  
  const load = () => {
    setLoading(true);
    setErrorMsg("");
    apiFetch("/admin/assets").then(data => {
      setItems(data.items || []);
    }).catch(err => {
      setErrorMsg(err.message || "Failed to load assets. Did you restart the backend server?");
    }).finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, []);

  const filteredItems = items.filter(item => filterType === "all" || item.type === filterType);

  const toggleSelect = (path) => setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  const toggleAll = () => setSelectedPaths(selectedPaths.length === filteredItems.length ? [] : filteredItems.map(item => item.path));

  const bulkDelete = async () => {
    if (!selectedPaths.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedPaths.length} file(s)? This will permanently remove them from the server and might break links.`)) return;
    try {
      await apiFetch(`/admin/assets`, { method: "DELETE", body: { paths: selectedPaths } });
      setSelectedPaths([]);
      load();
    } catch (e) {
      alert("Error deleting files: " + e.message);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-ink">Asset Manager</h1>
           <p className="text-muted mt-2">Manage all uploaded images, videos, and PDFs.</p>
        </div>
        <div className="flex items-center gap-4">
           <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-full border border-black/10 px-4 py-2 outline-none">
             <option value="all">All Files</option>
             <option value="image">Images</option>
             <option value="video">Videos</option>
             <option value="pdf">PDFs</option>
             <option value="document">Other Docs</option>
           </select>
           {selectedPaths.length > 0 && (
             <button onClick={bulkDelete} className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700">Delete Selected ({selectedPaths.length})</button>
           )}
        </div>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-premium">
        {loading ? <p>Loading assets...</p> : errorMsg ? (
          <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl">{errorMsg}</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-soft text-muted">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" checked={filteredItems.length > 0 && selectedPaths.length === filteredItems.length} onChange={toggleAll} /></th>
                <th className="p-4 font-black w-24">Preview</th>
                <th className="p-4 font-black">File Info</th>
                <th className="p-4 font-black">Size</th>
                <th className="p-4 font-black">Uploaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredItems.map(item => (
                <tr key={item.path} className="transition hover:bg-soft/50">
                  <td className="p-4"><input type="checkbox" checked={selectedPaths.includes(item.path)} onChange={() => toggleSelect(item.path)} /></td>
                  <td className="p-4">
                     {item.type === "image" ? (
                       <img src={assetUrl(item.path)} className="w-16 h-12 object-cover rounded-lg border border-black/10" alt="Preview" loading="lazy" />
                     ) : item.type === "video" ? (
                       <div className="w-16 h-12 bg-black/5 rounded-lg flex items-center justify-center text-muted"><Video size={20} /></div>
                     ) : (
                       <div className="w-16 h-12 bg-black/5 rounded-lg flex items-center justify-center text-muted"><FileText size={20} /></div>
                     )}
                  </td>
                  <td className="p-4 font-bold text-ink">
                     {item.name}
                     <br/><a href={assetUrl(item.path)} target="_blank" rel="noreferrer" className="font-normal text-blue-600 text-[10px] hover:underline break-all">{item.path}</a>
                  </td>
                  <td className="p-4 text-muted font-bold">{formatSize(item.size)}</td>
                  <td className="p-4 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {filteredItems.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-muted">No files found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
