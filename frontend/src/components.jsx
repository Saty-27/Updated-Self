import { useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";
import { Helmet } from "react-helmet-async";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileText,
  GraduationCap,
  Home,
  Image,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  PlayCircle,
  Settings,
  Shield,
  User,
  UserCheck,
  Users,
  X,
  Send,
  Paperclip,
  ChevronDown,
  Search,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Globe,
  AlertTriangle
} from "lucide-react";
import { apiFetch, assetUrl, trackPage, uploadFile } from "./api";
import { footer as fallbackFooter } from "./fallback";
import { useAuth } from "./AuthContext";
import { useHomepageSections } from "./useHomepageSections";

export const PageUnavailable = ({ pageName = "Page", sectionKey }) => {
  const { user } = useAuth();
  const isStaffUser = ["main_admin", "admin", "manager", "editor"].includes(user?.role);

  return (
    <section className="grid min-h-[65vh] place-items-center bg-soft/40 px-4 py-16 text-center">
      <div className="max-w-md rounded-3xl bg-white p-8 shadow-premium border border-black/5 animate-scale-up">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle size={32} />
        </div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-amber-600">
          Notice: Page Unavailable
        </p>
        <h1 className="text-2xl font-black text-ink">
          {pageName} is Currently Inactive
        </h1>
        <p className="mt-3 text-xs font-semibold leading-relaxed text-muted">
          This section has been temporarily disabled by the website administrator. Please check back later or explore other sections of our website.
        </p>

        {isStaffUser && sectionKey && (
          <div className="mt-5 rounded-2xl bg-amber-50 p-3.5 text-left border border-amber-200/80">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Staff Notice
            </div>
            <p className="mt-1 text-[11px] font-medium text-amber-800">
              This page is disabled on the entire website via Homepage Sections (<code className="font-mono font-bold">{sectionKey}</code>).
            </p>
            <Link
              to="/admin/home-sections"
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
            >
              Configure in Admin Panel &rarr;
            </Link>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-primary px-6 py-2.5 text-xs font-black text-white hover:bg-primary/90 transition shadow-sm"
          >
            Back to Website
          </Link>
        </div>
      </div>
    </section>
  );
};

export const SEO = ({ title = "ISKCON Juhu Self-Excellence", description = "A premium spiritual LMS for students and seekers." }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
);

export const SectionHeader = ({ eyebrow, title, subtitle, centered = true, light = false }) => (
  <div className={centered ? "mx-auto mb-10 max-w-3xl text-center" : "mb-8 max-w-3xl"}>
    {eyebrow && <p className={`mb-3 font-ui text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-saffron/90" : "text-saffronDark"}`}>{eyebrow}</p>}
    <h2 className={`font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] sm:text-[42px] lg:text-[52px] ${light ? "text-white" : "text-inkDeep"}`}>{title}</h2>
    {subtitle && <p className={`mt-4 font-ui text-base font-normal leading-7 sm:text-[17px] ${light ? "text-white/70" : "text-inkMuted"}`}>{subtitle}</p>}
  </div>
);

export const PageBanner = ({ title, subtitle, image }) => (
  <section className="relative overflow-hidden bg-ink text-white">
    <div className="absolute inset-0">
      {image && <img src={assetUrl(image)} alt="" className="h-full w-full object-cover opacity-35" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
    </div>
    <div className="container-pad relative py-20">
      <p className="mb-3 font-ui text-xs font-semibold uppercase tracking-[0.22em] text-saffron">ISKCON Juhu Self-Excellence</p>
      <h1 className="max-w-4xl font-display text-[40px] font-semibold leading-[1.06] tracking-[-0.015em] sm:text-[52px] lg:text-[62px]">{title}</h1>
      {subtitle && <p className="mt-5 max-w-2xl font-ui text-[17px] font-normal leading-8 text-white/75">{subtitle}</p>}
    </div>
  </section>
);

export const ProgressBar = ({ percent = 0, label = "Progress" }) => (
  <div>
    <div className="mb-2 flex items-center justify-between text-sm font-bold text-ink">
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div className="h-3 overflow-hidden rounded-full bg-primary/10">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  </div>
);

export const EmptyState = ({ title = "Nothing here yet", subtitle = "Content added from the admin panel will appear here." }) => (
  <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
    <h3 className="text-xl font-black text-ink">{title}</h3>
    <p className="mt-2 text-sm text-muted">{subtitle}</p>
  </div>
);

const navClass = ({ isActive }) =>
  `relative font-ui text-[15px] tracking-[0.005em] transition-colors duration-300 ${
    isActive
      ? "font-semibold text-primary after:absolute after:-bottom-2 after:left-1/2 after:h-[2px] after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-primary after:content-['']"
      : "font-medium text-heading hover:text-primary"
  }`;

export const BrandLogo = ({ logo = "/logo-black-header.png", tone = "light", compact = false, bare = false, tagline = "Self-Excellence" }) => {
  const dark = tone === "dark";
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`${compact ? "h-10 w-10" : bare ? "h-11 w-11" : "h-12 w-12"} grid shrink-0 place-items-center ${
          bare ? "" : "rounded-xl bg-white p-1 shadow-sm"
        }`}
      >
        <img src={assetUrl(logo || "/logo-black-header.png")} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="leading-tight">
        <span className={`block font-ui text-[15px] font-bold tracking-tight ${dark ? "text-white" : "text-inkDeep"}`}>ISKCON Juhu</span>
        <span className="block font-ui text-[11px] font-bold uppercase leading-tight tracking-[0.14em] text-saffron sm:text-[12px]">{tagline}</span>
      </span>
    </span>
  );
};

const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(659.25, audioCtx.currentTime, 0.4); // E5
    playTone(880.00, audioCtx.currentTime + 0.12, 0.6); // A5
  } catch (e) {
    console.warn("Web Audio chime failed", e);
  }
};

export const NotificationBell = () => {
  const { user, socket } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [jiggle, setJiggle] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("iskcon_notification_sound") !== "false");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const fetchNotifications = () => {
    apiFetch("/notifications")
      .then((data) => setNotifications(data.items || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();

    const handleReadEvent = () => {
      fetchNotifications();
    };
    window.addEventListener("notifications_read", handleReadEvent);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("notifications_read", handleReadEvent);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (data) => {
      fetchNotifications();
      setJiggle(true);
      setTimeout(() => setJiggle(false), 1200);
      if (soundEnabled) {
        playChime();
      }
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, soundEnabled]);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("iskcon_notification_sound", String(nextVal));
    if (nextVal) playChime();
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/notifications/mark-all-read", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  const handleReadNotification = async (n) => {
    try {
      if (!n.read) {
        await apiFetch(`/notifications/${n._id}/read`, { method: "PUT" });
        setNotifications((prev) => prev.map((item) => item._id === n._id ? { ...item, read: true } : item));
      }
      setOpen(false);
      if (n.link) {
        navigate(n.link);
      }
    } catch (e) {}
  };

  const viewAllLink = user?.role === "main_admin"
    ? "/admin/notifications"
    : user?.role === "teacher"
      ? "/teacher/notifications"
      : "/student/notifications";

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-full p-2.5 hover:bg-soft transition"
        aria-label="Notification bell"
      >
        <Bell size={20} className={`${unreadCount > 0 && jiggle ? "animate-jiggle text-primary" : unreadCount > 0 ? "text-primary" : "text-ink"}`} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 md:absolute md:inset-x-auto md:right-0 md:top-auto mt-2 w-auto max-w-sm md:w-96 rounded-2xl bg-white p-4 shadow-xl border border-black/5">
          <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-2.5">
            <h3 className="text-sm font-black text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 py-1 pr-1">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n._id}
                onClick={() => handleReadNotification(n)}
                className={`group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 transition ${n.read ? "hover:bg-soft/50" : "bg-primary/5 hover:bg-primary/10"}`}
              >
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-black/10" : "bg-primary"}`} />
                <div className="flex-1">
                  <h4 className={`text-xs ${n.read ? "font-bold text-ink/80" : "font-black text-ink"}`}>{n.title}</h4>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{n.message}</p>
                  <span className="mt-1 block text-[10px] text-muted/80">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="py-6 text-center text-xs text-muted font-bold">No notifications yet.</div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-muted hover:text-ink">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={handleToggleSound}
                className="rounded border-black/15 text-primary focus:ring-primary"
              />
              Audio Alerts
            </label>
            <Link onClick={() => setOpen(false)} to={viewAllLink} className="text-xs font-black text-primary hover:underline">
              View All
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const DesktopNavDropdown = ({ label, sublinks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAnyActive = Array.isArray(sublinks) && sublinks.some(sublink => sublink && location.pathname === sublink.url);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`flex cursor-pointer items-center gap-1 py-1.5 font-ui text-[15px] tracking-[0.005em] outline-none transition-colors duration-300 ${
          isAnyActive ? "font-semibold text-primary" : "font-medium text-heading hover:text-primary"
        }`}
      >
        {label}
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      <div
        className={`absolute left-0 top-full pt-2 w-48 transition-all duration-200 origin-top-left z-[100] ${
          isOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-1 invisible pointer-events-none"
        }`}
      >
        <div className="rounded-xl bg-white p-2 shadow-xl border border-black/5">
          {Array.isArray(sublinks) && sublinks.map((sublink) => (
            <NavLink
              key={sublink.url}
              to={sublink.url}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-primary/10 text-primary" : "text-ink hover:bg-black/5 hover:text-primary"
                }`
              }
            >
              {sublink.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileNavDropdown = ({ label, sublinks, closeMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAnyActive = Array.isArray(sublinks) && sublinks.some(sublink => sublink && location.pathname === sublink.url);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between text-base font-semibold py-1.5 transition cursor-pointer ${
          isAnyActive ? "text-primary" : "text-ink hover:text-primary"
        }`}
      >
        <span>{label}</span>
        <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="mt-2 flex flex-col gap-3 border-l-2 border-primary/20 pl-4 transition-all duration-200">
          {Array.isArray(sublinks) && sublinks.map((sublink) => (
            <NavLink
              key={sublink.url}
              to={sublink.url}
              onClick={closeMenu}
              className={({ isActive }) =>
                `text-sm font-semibold py-1 transition ${
                  isActive ? "text-primary" : "text-muted hover:text-primary"
                }`
              }
            >
              {sublink.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isPageEnabled } = useHomepageSections();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dashboard = ["main_admin", "admin", "manager", "editor", "viewer"].includes(user?.role) ? "/admin/dashboard" : user?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

  useEffect(() => {
    apiFetch("/site-settings").then((data) => setSettings(data.settings)).catch(() => {});
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    trackPage(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Lock the page behind the mobile drawer. */
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = useMemo(
    () => {
      const activeHeaderLinks = settings?.headerLinks?.filter((link) => link.status === "active").sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      if (activeHeaderLinks && activeHeaderLinks.length > 0) {
        if (!activeHeaderLinks.some((l) => l.url === "/books")) {
          const coursesIdx = activeHeaderLinks.findIndex((l) => l.url === "/courses");
          if (coursesIdx !== -1) {
            return [
              ...activeHeaderLinks.slice(0, coursesIdx + 1),
              { label: "Books", url: "/books" },
              ...activeHeaderLinks.slice(coursesIdx + 1)
            ];
          }
          return [...activeHeaderLinks, { label: "Books", url: "/books" }];
        }
        return activeHeaderLinks;
      }
      return [
        { label: "Home", url: "/" },
        { label: "About", url: "/about" },
        { label: "Courses", url: "/courses" },
        { label: "Books", url: "/books" },
        { label: "Trips", url: "/trips" },
        { label: "Visionaries", url: "/visionaries" },
        { label: "Blogs", url: "/blogs" },
        { label: "Media", url: "/gallery/images" },
        { label: "Contact", url: "/contact" }
      ];
    },
    [settings]
  );

  const processedLinks = useMemo(() => {
    const enriched = links.map((link) => {
      const labelLower = link.label?.toLowerCase() || "";
      const urlLower = link.url?.toLowerCase() || "";
      if (labelLower === "blogs" || urlLower === "/blogs" || urlLower === "/video-blogs") {
        const sub = [
          { label: "Blog Articles", url: "/blogs" },
          { label: "Video Blogs", url: "/video-blogs" }
        ].filter((s) => isPageEnabled(s.url));

        return {
          ...link,
          sublinks: sub.length > 0 ? sub : undefined
        };
      }
      if (labelLower === "media" || urlLower.startsWith("/gallery")) {
        const sub = [
          { label: "Image Gallery", url: "/gallery/images" },
          { label: "Video Gallery", url: "/gallery/videos" }
        ].filter((s) => isPageEnabled(s.url));

        return {
          ...link,
          sublinks: sub.length > 0 ? sub : undefined
        };
      }
      return link;
    });

    return enriched.filter((link) => {
      if (link.sublinks && link.sublinks.length > 0) return true;
      if (link.url === "/" || link.url === "") return true;
      return isPageEnabled(link.url);
    });
  }, [links, isPageEnabled]);

  const submitSearch = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setQuery("");
    navigate(`/courses?search=${encodeURIComponent(q)}`);
  };

  const brand = (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="ISKCON Juhu Self-Excellence">
      <img
        src={assetUrl(settings?.logo || "/logo-black-header.png")}
        alt=""
        className="h-11 w-11 shrink-0 object-contain lg:h-[52px] lg:w-[52px]"
      />
      <span className="leading-none">
        <span className="block font-display text-[17px] font-bold uppercase tracking-[0.06em] text-heading lg:text-[19px]">
          ISKCON Juhu
        </span>
        <span className="mt-1 block font-ui text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary lg:text-[11px]">
          Self-Excellence
        </span>
      </span>
    </Link>
  );

  const iconBtn =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line/90 bg-white/70 text-heading transition-colors duration-300 hover:border-primary/40 hover:text-primary";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ease-out ${
          scrolled
            ? "border-line bg-white/95 shadow-[0_6px_24px_rgba(60,30,10,0.07)] backdrop-blur-[12px]"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="shell flex h-[68px] items-center justify-between gap-6 lg:h-[84px]">
          {brand}

          <nav className="hidden items-center gap-7 min-[1100px]:flex">
            {processedLinks.map((link) =>
              link.sublinks ? (
                <DesktopNavDropdown key={link.label} label={link.label} sublinks={link.sublinks} />
              ) : (
                <NavLink key={link.url} to={link.url} className={navClass}>{link.label}</NavLink>
              )
            )}
          </nav>

          <div className="hidden items-center gap-2.5 min-[1100px]:flex">
            <button type="button" onClick={() => setSearchOpen((v) => !v)} className={iconBtn} aria-label="Search courses" aria-expanded={searchOpen}>
              <Search size={19} strokeWidth={1.9} />
            </button>

            {user && <NotificationBell />}

            {user ? (
              <>
                <Link to={dashboard} className={iconBtn} aria-label="My dashboard" title="My dashboard">
                  <User size={19} strokeWidth={1.9} />
                </Link>
                <button type="button" onClick={logout} className={iconBtn} aria-label="Log out" title="Log out">
                  <LogOut size={18} strokeWidth={1.9} />
                </button>
              </>
            ) : (
              <Link to="/login" className={iconBtn} aria-label="Sign in" title="Sign in">
                <User size={19} strokeWidth={1.9} />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 min-[1100px]:hidden">
            <button onClick={() => setOpen(true)} className={iconBtn} aria-label="Open menu">
              <Menu size={22} strokeWidth={1.9} />
            </button>
          </div>
        </div>

        {/* Search drops out of the bar and routes into the existing course filter. */}
        {searchOpen && (
          <div className="border-t border-line bg-white/97 backdrop-blur-[12px]">
            <form onSubmit={submitSearch} className="shell flex items-center gap-3 py-4">
              <Search size={20} strokeWidth={1.9} className="shrink-0 text-text-muted" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="h-11 w-full border-0 bg-transparent font-ui text-[15px] text-heading outline-none placeholder:text-text-muted"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="shrink-0 text-text-muted transition-colors hover:text-primary" aria-label="Close search">
                <X size={20} strokeWidth={1.9} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile slide-in drawer */}
      <div
        className={`fixed inset-0 z-[60] min-[1100px]:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-heading/45 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex w-[86%] max-w-[360px] flex-col bg-white shadow-[-20px_0_50px_rgba(60,30,10,0.18)] transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-line px-5">
            <span className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-heading">Menu</span>
            <button onClick={() => setOpen(false)} className={iconBtn} aria-label="Close menu">
              <X size={20} strokeWidth={1.9} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <form onSubmit={submitSearch} className="mb-6 flex items-center gap-2.5 rounded-full border border-line bg-bg-cream px-4">
              <Search size={18} strokeWidth={1.9} className="shrink-0 text-text-muted" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="h-11 w-full border-0 bg-transparent font-ui text-[14.5px] text-heading outline-none placeholder:text-text-muted"
              />
            </form>

            <nav className="flex flex-col gap-4">
              {processedLinks.map((link) =>
                link.sublinks ? (
                  <MobileNavDropdown key={link.label} label={link.label} sublinks={link.sublinks} closeMenu={() => setOpen(false)} />
                ) : (
                  <NavLink key={link.url} to={link.url} className={navClass}>{link.label}</NavLink>
                )
              )}
            </nav>
          </div>

          <div className="shrink-0 border-t border-line px-5 py-5">
            {user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link to={dashboard} className="flex h-12 items-center justify-center rounded-full bg-primary font-ui text-[14.5px] font-semibold text-white shadow-cta">
                  Dashboard
                </Link>
                <button onClick={logout} className="flex h-12 items-center justify-center rounded-full border-[1.5px] border-line font-ui text-[14.5px] font-semibold text-heading">
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" className="flex h-12 items-center justify-center rounded-full bg-primary font-ui text-[14.5px] font-semibold text-white shadow-cta">
                  Login
                </Link>
                <Link to="/register" className="flex h-12 items-center justify-center rounded-full border-[1.5px] border-primary font-ui text-[14.5px] font-semibold text-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export const Footer = () => {
  const [footer, setFooter] = useState(fallbackFooter);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch("/footer").then((data) => data.footer && setFooter(data.footer)).catch(() => {});
  }, []);

  const subscribe = async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/subscribers", { method: "POST", body: { email } });
      setMessage("Subscribed successfully.");
      setEmail("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  /* Only the networks the CMS actually holds get an icon. */
  const socials = [
    { key: "facebook", Icon: Facebook, label: "Facebook" },
    { key: "instagram", Icon: Instagram, label: "Instagram" },
    { key: "youtube", Icon: Youtube, label: "YouTube" },
    { key: "linkedin", Icon: Linkedin, label: "LinkedIn" },
    { key: "website", Icon: Globe, label: "Website" }
  ].filter(({ key }) => footer.socialLinks?.[key]);

  return (
    /* Deep near-black so the warm page lands on something solid;
       headings are gold, which is the only accent that holds up here. */
    <footer className="bg-footer-bg text-[#F5EFE6]">
      <div className="shell">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.25fr_2fr] lg:py-[80px]">
          <div>
            <div className="mb-5"><BrandLogo logo={footer.logo} tone="dark" /></div>
            <p className="max-w-sm font-ui text-[14px] leading-[1.75] text-[#A89C8F]">{footer.description}</p>

            {socials.length > 0 && (
              <div className="mt-7 flex items-center gap-3">
                {socials.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={footer.socialLinks[key]}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-[#BEB2A4] transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-white"
                  >
                    <Icon size={17} strokeWidth={1.9} />
                  </a>
                ))}
              </div>
            )}

            {footer.newsletterEnabled !== false && (
              <form onSubmit={subscribe} className="mt-7 flex w-full max-w-md flex-col gap-2.5 xs:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  required
                  /* `flex-1` only once the form is a row — in the stacked
                     layout it governs height and collapses the field. */
                  className="h-12 w-full min-w-0 rounded-full border border-white/15 bg-white/[0.06] px-5 font-ui text-[16px] text-[#F5EFE6] outline-none transition-colors placeholder:text-[#8C8073] focus:border-primary xs:h-11 xs:flex-1 xs:text-[14px]"
                />
                <button className="h-12 w-full shrink-0 rounded-full bg-primary px-6 font-ui text-[14px] font-semibold text-white transition-colors duration-300 hover:bg-primary-dark xs:h-11 xs:w-auto xs:text-[13.5px]">
                  Subscribe
                </button>
              </form>
            )}
            {message && <p className="mt-2.5 font-ui text-[12px] text-[#A89C8F]">{message}</p>}
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footer.columns?.map((column) => (
              <div key={column.title}>
                <h3 className="mb-5 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-gold">{column.title}</h3>
                <div className="flex flex-col gap-3">
                  {column.links?.map((link) => (
                    <Link key={link.url} to={link.url} className="font-ui text-[14px] text-[#BEB2A4] transition-colors duration-300 hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.09]">
        <div className="shell flex flex-col gap-3 py-6 font-ui text-[13px] text-[#8C8073] md:flex-row md:items-center md:justify-between">
          <span>© {footer.copyrightYear || new Date().getFullYear()} {footer.copyrightText}</span>
          <span>{footer.contactDetails?.email} · {footer.contactDetails?.phone}</span>
        </div>
      </div>
    </footer>
  );
};

export const FloatingContactButtons = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [contactSettings, setContactSettings] = useState(null);

  useEffect(() => {
    apiFetch("/contact-settings")
      .then((res) => {
        if (res.settings) setContactSettings(res.settings);
      })
      .catch(() => {});
  }, []);

  const whatsappNum = contactSettings?.whatsappNumber || "8928337055";
  const cleanWaNum = whatsappNum.replace(/[^0-9]/g, "");
  const waTarget = cleanWaNum.length === 10 ? `91${cleanWaNum}` : cleanWaNum;
  const waMsg = contactSettings?.whatsappMessage || "Hare Krishna! I would like to know more about ISKCON Self-Excellence courses.";
  const waLink = `https://wa.me/${waTarget}?text=${encodeURIComponent(waMsg)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: "Floating Contact Modal Enquiry",
          message: form.message.trim()
        }
      });
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end gap-3.5 pointer-events-auto">
        {/* Contact Us Floating Button */}
        <button
          onClick={() => {
            setSuccess(false);
            setError("");
            setOpen(true);
          }}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white border border-black/10 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none"
          aria-label="Contact Us"
          title="Contact Us"
        >
          <img
            src="/assets/contact-icon.png"
            alt="Contact Us"
            className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-ink/90 backdrop-blur-sm px-3.5 py-1.5 text-xs font-bold text-white shadow-xl sm:group-hover:block">
            Contact Us
          </span>
        </button>

        {/* WhatsApp Business Floating Button */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none drop-shadow-2xl"
          aria-label="Chat on WhatsApp"
          title={`Chat on WhatsApp (${whatsappNum})`}
        >
          <img
            src="/assets/whatsapp-icon.png"
            alt="WhatsApp"
            className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-ink/90 backdrop-blur-sm px-3.5 py-1.5 text-xs font-bold text-white shadow-xl sm:group-hover:block">
            Chat on WhatsApp
          </span>
        </a>
      </div>

      {/* Contact Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl relative animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted transition hover:bg-soft hover:text-ink"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {success ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-black text-ink">Hare Krishna!</h3>
                <p className="mt-2 text-sm text-muted">
                  Thank you for reaching out. We have received your query and our devotees will contact you shortly.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-black text-white shadow-md transition hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 p-2 shadow-sm">
                    <img src="/assets/contact-icon.png" alt="" className="h-8 w-8 object-contain" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-black uppercase tracking-wide text-primary">
                      Get in Touch
                    </span>
                    <h3 className="mt-1 text-2xl font-black text-ink">Contact Us</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      Have questions about courses, temple programs, or seva? Leave a message below.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="grid gap-3.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. ramesh@gmail.com"
                        className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted">
                      Your Message / Query *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Type your question or query here..."
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </div>

                  <div className="mt-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      {busy ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const PublicLayout = () => {
  const { pathname } = useLocation();
  // The homepage hero is designed to sit underneath the transparent bar;
  // every other page needs the fixed bar's height back as spacing.
  const overlayNav = pathname === "/";
  return (
  <div className="flex min-h-screen flex-col w-full">
    <Navbar />
    <main className={`flex-grow ${overlayNav ? "" : "pt-[68px] lg:pt-[84px]"}`}>
      <Outlet />
    </main>
    <Footer />
    <FloatingContactButtons />
  </div>
  );
};

export const HeroSlider = ({ banners = [], loading = false }) => {
  const activeBanners = banners.filter((banner) => banner?.isActive !== false && banner.desktopImage).sort((a, b) => (a.order || 0) - (b.order || 0));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return undefined;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % activeBanners.length), 5500);
    return () => window.clearInterval(timer);
  }, [activeBanners.length]);

  useEffect(() => {
    if (current >= activeBanners.length) setCurrent(0);
  }, [activeBanners.length, current]);

  if (!activeBanners.length) {
    return null;
  }

  const move = (direction) => setCurrent((index) => (index + direction + activeBanners.length) % activeBanners.length);

  return (
    <section className="relative overflow-hidden bg-white text-ink">
      <div className="relative w-full">
        {activeBanners.map((banner, index) => {
          const hasCopy = banner.title || banner.subtitle || (banner.buttonText && banner.buttonLink);
          return (
            <div key={banner._id || `${banner.desktopImage}-${index}`} className={`relative w-full h-[380px] sm:h-[480px] md:h-[580px] lg:h-[680px] overflow-hidden bg-slate-950 text-white transition-opacity duration-700 ease-out ${index === current ? "opacity-100 block" : "pointer-events-none opacity-0 absolute inset-0"}`} aria-hidden={index !== current}>
              <picture className="absolute inset-0 w-full h-full">
                {banner.mobileImage && <source media="(max-width: 639px)" srcSet={assetUrl(banner.mobileImage)} />}
                {banner.tabletImage && <source media="(max-width: 1023px)" srcSet={assetUrl(banner.tabletImage)} />}
                <img src={assetUrl(banner.desktopImage)} alt={banner.title || "Hero banner"} loading={index === 0 ? "eager" : "lazy"} className="w-full h-full object-cover" />
              </picture>
              {hasCopy && <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10" />}
              {hasCopy && (
                <div className="container-pad absolute inset-x-0 top-1/2 -translate-y-1/2 z-20">
                  <div className="max-w-3xl">
                    {banner.subtitle && <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-primary">{banner.subtitle}</p>}
                    {banner.title && <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-7xl text-white">{banner.title}</h1>}
                    {banner.buttonText && banner.buttonLink && <Link to={banner.buttonLink} className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-black text-white shadow-xl shadow-primary/30 sm:px-8 sm:py-4 sm:text-base">{banner.buttonText}</Link>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {activeBanners.length > 1 && (
          <>
            <button onClick={() => move(-1)} className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur transition hover:bg-primary" aria-label="Previous banner"><ChevronLeft size={22} /></button>
            <button onClick={() => move(1)} className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur transition hover:bg-primary" aria-label="Next banner"><ChevronRight size={22} /></button>
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
              {activeBanners.map((banner, index) => <button key={banner._id || index} onClick={() => setCurrent(index)} className={`h-2.5 rounded-full transition-all ${index === current ? "w-9 bg-primary" : "w-2.5 bg-white/70"}`} aria-label={`Go to banner ${index + 1}`} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const textSummary = (value = "") => value.replace(/<[^>]*>/g, "").trim();

export const CourseCard = ({ course }) => (
  <Link to={`/courses/${course.slug || course._id}`} className="group block overflow-hidden rounded-2xl bg-white shadow-premium transition hover:-translate-y-1">
    <div className="aspect-[4/3] overflow-hidden bg-soft"><img src={assetUrl(course.thumbnail || course.bannerImage)} alt={course.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
    <div className="-mt-7 mx-4 relative rounded-2xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{course.level || "Beginner"}</span><span className="rounded-full bg-black/5 px-3 py-1 text-xs font-black text-ink">{course.isFree === false || course.priceType === "Paid" ? `₹${course.price || 0}` : "Free"}</span></div>
      <h3 className="text-xl font-black text-ink">{course.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{course.shortDescription || textSummary(course.description)}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-muted"><span>{course.duration || "Self paced"}</span><span>{course.totalLessons || course.lessons?.length || 0} lessons</span></div>
      <span className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-bold text-white">View Course</span>
    </div>
  </Link>
);

export const UpcomingClassCard = ({ item, onActionClick }) => (
  <div className="overflow-hidden rounded-2xl bg-white shadow-premium flex flex-col justify-between h-full border border-black/5 hover:-translate-y-1 transition duration-300">
    <div>
      <div className="h-52 overflow-hidden bg-soft">
        <img src={assetUrl(item.image)} alt={item.title} className="h-full w-full object-cover hover:scale-105 transition duration-500" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-ink leading-tight">{item.title}</h3>
        {item.shortDescription && <p className="mt-2 text-sm leading-6 text-muted line-clamp-3">{item.shortDescription}</p>}
        
        <div className="mt-4 pt-4 border-t border-black/5 grid gap-2 text-sm font-bold text-ink">
          <span className="flex items-center gap-2 text-muted">
            <Clock size={15} className="text-primary shrink-0" />
            {new Date(item.date).toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-2 text-muted">
            <span className="text-xs bg-soft text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Time</span>
            {item.time}
          </span>
          <span className="flex items-center gap-2 text-muted">
            <span className="text-xs bg-soft text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Venue</span>
            {item.venue}
          </span>
          <span className="flex items-center gap-2 text-muted">
            <span className="text-xs bg-soft text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Speaker</span>
            {item.speaker}
          </span>
        </div>
      </div>
    </div>
    
    <div className="px-6 pb-6 pt-2">
      {onActionClick ? (
        <button
          onClick={() => onActionClick(item)}
          className="w-full rounded-full bg-primary hover:bg-primary-hover py-2.5 text-center text-sm font-black text-white transition cursor-pointer shadow-sm hover:shadow-md"
        >
          {item.buttonText || "View Details"}
        </button>
      ) : (
        <Link
          to={item.buttonLink || "/contact"}
          className="w-full inline-block rounded-full bg-primary hover:bg-primary-hover py-2.5 text-center text-sm font-black text-white transition shadow-sm hover:shadow-md"
        >
          {item.buttonText || "View Details"}
        </Link>
      )}
    </div>
  </div>
);

export const PreacherCard = ({ preacher }) => (
  <Link to={`/visionaries/${preacher.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-premium">
    <img src={assetUrl(preacher.image)} alt={preacher.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
    <div className="p-6"><h3 className="text-xl font-black text-ink">{preacher.name}</h3><p className="mt-1 text-sm font-bold text-primary">{preacher.designation}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{preacher.shortBio}</p><span className="mt-5 inline-flex text-sm font-black text-primary">Read More</span></div>
  </Link>
);

export const VisionaryCard = ({ visionary }) => (
  <div className="group overflow-hidden rounded-2xl bg-white shadow-premium border border-black/5 hover:-translate-y-1 transition duration-300 flex flex-col h-full justify-between">
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-soft">
        <img
          src={assetUrl(visionary.image)}
          alt={visionary.name}
          /* Anchored to the top: these are portraits, and centring a
             tall source in a 4:3 frame cuts the face off. */
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
        />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md ${
          visionary.type === "Founder" ? "bg-primary" : "bg-ink"
        }`}>
          {visionary.type || "Team Member"}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-black text-ink group-hover:text-primary transition duration-200">
            {visionary.name}
          </h3>
          {/* Omitted entirely when unknown — a placeholder word beside
              cards reading "14 YEARS" just looks like missing data. */}
          {visionary.experience && (
            <span className="shrink-0 text-xs font-black uppercase tracking-wide text-primary/80 bg-primary/5 px-2 py-0.5 rounded">
              {visionary.experience}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-bold text-muted">{visionary.designation}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted font-medium">
          {visionary.shortBio}
        </p>
      </div>
    </div>
    <div className="px-6 pb-6 pt-2">
      <Link
        to={`/visionaries/${visionary.slug}`}
        className="w-full inline-block rounded-full bg-primary hover:opacity-90 py-2.5 text-center text-sm font-black text-white transition shadow-sm hover:shadow-md cursor-pointer"
      >
        View Details
      </Link>
    </div>
  </div>
);

export const BlogCard = ({ blog }) => (
  <Link to={`/blogs/${blog.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-premium">
    <img src={assetUrl(blog.image)} alt={blog.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
    <div className="p-6"><p className="text-xs font-black uppercase tracking-wide text-primary">{blog.category || "Wisdom"}</p><h3 className="mt-2 text-xl font-black text-ink">{blog.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{blog.shortDescription}</p><span className="mt-5 inline-flex text-sm font-black text-primary">Read More</span></div>
  </Link>
);

export const VideoBlogCard = ({ video }) => (
  <Link to={`/video-blogs/${video.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-premium">
    <div className="relative h-56 overflow-hidden"><img src={assetUrl(video.thumbnail)} alt={video.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><PlayCircle size={54} /></span></div>
    <div className="p-6"><h3 className="text-xl font-black text-ink">{video.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{video.shortDescription}</p><span className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-bold text-white">Watch Now</span></div>
  </Link>
);

const youtubeEmbed = (url = "") => {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

const getYoutubeId = (url) => {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? match[1] : "";
};

export const VideoPlayer = ({ url, youtubeUrl, uploadedVideo, videoType, title, startAt = 0, onProgress, onDuration, videoRef: externalVideoRef, disableSeeking = false, maxWatchedSeconds = 0 }) => {
  const isLocal = videoType === "upload" || (videoType !== "youtube" && (/\.(mp4|webm|mov)$/i.test(uploadedVideo || url || youtubeUrl || "") || (uploadedVideo && !uploadedVideo.includes("youtube.com") && !uploadedVideo.includes("youtu.be"))));
  const raw = uploadedVideo || youtubeUrl || url || "";
  const src = isLocal ? assetUrl(uploadedVideo || url || youtubeUrl) : youtubeEmbed(raw);
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const startApplied = useRef(false);

  const ytVideoId = useMemo(() => isLocal ? "" : getYoutubeId(raw), [raw, isLocal]);
  const containerId = useMemo(() => `yt-player-${Math.random().toString(36).substr(2, 9)}`, [ytVideoId]);

  const ytPlayerRef = useRef(null);
  const currentProgressTimer = useRef(null);
  const localMaxWatched = useRef(Math.max(startAt, maxWatchedSeconds));

  useEffect(() => {
    localMaxWatched.current = Math.max(localMaxWatched.current, maxWatchedSeconds);
  }, [maxWatchedSeconds]);

  useImperativeHandle(externalVideoRef, () => {
    if (isLocal) {
      return {
        get currentTime() { return internalVideoRef.current?.currentTime || 0; },
        set currentTime(value) { if (internalVideoRef.current) internalVideoRef.current.currentTime = value; },
        get duration() { return internalVideoRef.current?.duration || 0; },
        play() { if (internalVideoRef.current) internalVideoRef.current.play(); },
        pause() { if (internalVideoRef.current) internalVideoRef.current.pause(); }
      };
    }
    return {
      get currentTime() {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
          return ytPlayerRef.current.getCurrentTime() || 0;
        }
        return 0;
      },
      set currentTime(value) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
          ytPlayerRef.current.seekTo(value, true);
        }
      },
      get duration() {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getDuration === "function") {
          return ytPlayerRef.current.getDuration() || 0;
        }
        return 0;
      }
    };
  }, [isLocal, ytVideoId]);

  useEffect(() => {
    startApplied.current = false;
  }, [src, startAt]);

  useEffect(() => {
    if (isLocal || !ytVideoId) return undefined;
    let active = true;
    let checkInterval;

    const initYTPlayer = () => {
      if (!window.YT || !window.YT.Player) return false;
      
      ytPlayerRef.current = new window.YT.Player(containerId, {
        width: "100%",
        height: "100%",
        videoId: ytVideoId,
        playerVars: {
          start: Math.round(startAt),
          rel: 0,
          modestbranding: 1,
          autoplay: 1,
          controls: disableSeeking ? 0 : 1
        },
        events: {
          onReady: (event) => {
            if (!active) return;
            const duration = event.target.getDuration() || 0;
            onDuration?.(duration);

            currentProgressTimer.current = window.setInterval(() => {
              if (!active || !ytPlayerRef.current || typeof ytPlayerRef.current.getPlayerState !== "function") return;
              const state = ytPlayerRef.current.getPlayerState();
              if (state === 1) {
                const currentTime = ytPlayerRef.current.getCurrentTime() || 0;
                const duration = ytPlayerRef.current.getDuration() || 0;
                
                if (disableSeeking && currentTime > localMaxWatched.current + 2) {
                  ytPlayerRef.current.seekTo(localMaxWatched.current, true);
                } else {
                  localMaxWatched.current = Math.max(localMaxWatched.current, currentTime);
                }

                onProgress?.({
                  currentTime: ytPlayerRef.current.getCurrentTime() || 0,
                  duration,
                  percent: duration ? Math.round(((ytPlayerRef.current.getCurrentTime() || 0) / duration) * 100) : 0
                });
              }
            }, 1000);
          },
          onStateChange: (event) => {
            if (!active || !ytPlayerRef.current || typeof ytPlayerRef.current.getCurrentTime !== "function") return;
            const state = event.data;
            const currentTime = ytPlayerRef.current.getCurrentTime() || 0;
            const duration = ytPlayerRef.current.getDuration() || 0;
            const percent = duration ? Math.round((currentTime / duration) * 100) : 0;

            if (state === 2 || state === 0) {
              onProgress?.({ currentTime, duration, percent, force: true });
            }
          }
        }
      });
      return true;
    };

    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      checkInterval = window.setInterval(() => {
        if (window.YT && window.YT.Player) {
          if (initYTPlayer()) {
            window.clearInterval(checkInterval);
          }
        }
      }, 200);
    }

    return () => {
      active = false;
      if (checkInterval) window.clearInterval(checkInterval);
      if (currentProgressTimer.current) window.clearInterval(currentProgressTimer.current);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === "function") {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [isLocal, ytVideoId, containerId]);

  if (!src) return <div className="grid aspect-video place-items-center rounded-2xl bg-black text-white">Video unavailable</div>;

  if (isLocal) {
    return (
      <video
        ref={internalVideoRef}
        src={src}
        title={title}
        controls={!disableSeeking}
        preload="metadata"
        className={`aspect-video w-full rounded-2xl bg-black ${disableSeeking ? "cursor-pointer" : ""}`}
        onClick={(e) => {
          if (disableSeeking) {
            const video = e.currentTarget;
            if (video.paused) video.play();
            else video.pause();
          }
        }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          onDuration?.(video.duration || 0);
          if (!startApplied.current && startAt > 0 && Number.isFinite(video.duration)) {
            video.currentTime = Math.min(startAt, Math.max(video.duration - 2, 0));
            startApplied.current = true;
          }
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          if (!video.seeking) {
            localMaxWatched.current = Math.max(localMaxWatched.current, video.currentTime);
          }
          onProgress?.({ currentTime: video.currentTime || 0, duration: video.duration || 0, percent: video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0 });
        }}
        onPause={(event) => {
          const video = event.currentTarget;
          onProgress?.({ currentTime: video.currentTime || 0, duration: video.duration || 0, percent: video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0, force: true });
        }}
        onSeeking={(event) => {
          if (!disableSeeking) return;
          const video = event.currentTarget;
          if (video.currentTime > localMaxWatched.current + 2) {
             video.currentTime = localMaxWatched.current;
          }
        }}
        onSeeked={(event) => {
          const video = event.currentTarget;
          if (disableSeeking && video.currentTime > localMaxWatched.current + 2) {
             video.currentTime = localMaxWatched.current;
          }
          onProgress?.({ currentTime: video.currentTime || 0, duration: video.duration || 0, percent: video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0, force: true });
        }}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black aspect-video w-full">
      <div id={containerId} className="h-full w-full" />
    </div>
  );
};

export const LessonRow = ({ lesson, active, completed, locked, to }) => (
  <Link to={locked ? "#" : to} className={`flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-xl border p-3 transition ${active ? "border-primary bg-primary/10" : "border-black/10 bg-white hover:border-primary/40"} ${locked ? "pointer-events-none opacity-55" : ""}`}>
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${completed ? "bg-green-100 text-green-700" : active ? "bg-primary text-white" : "bg-black/5 text-ink"}`}>{locked ? <Lock size={16} /> : completed ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}</span>
    <span className="min-w-0 flex-1 overflow-hidden"><span className="block truncate text-sm font-black text-ink">{lesson.title}</span><span className="block truncate text-xs text-muted">{lesson.duration || "Lesson"}</span></span>
    {lesson.pdfFile && <FileText size={16} className="shrink-0 text-primary" />}
  </Link>
);

export const ResourceLink = ({ href, label = "Download Resource" }) => href ? <a href={assetUrl(href)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-ink hover:border-primary hover:text-primary"><Download size={16} />{label}</a> : null;

export const StatCard = ({ icon: Icon = Users, label, value, to }) => {
  const cardContent = (
    <>
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition duration-300">
        <Icon size={22} />
      </div>
      <p className="text-sm font-bold text-muted group-hover:text-primary transition duration-300">{label}</p>
      <p className="mt-1 text-3xl font-black text-ink">{value ?? 0}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="group block rounded-2xl bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/25 border border-transparent transition duration-300 cursor-pointer">
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-transparent">
      {cardContent}
    </div>
  );
};

export const dashboardLinks = {
  student: [
    { label: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Courses", url: "/student/my-courses", icon: BookOpen },
    { label: "My Book Orders", url: "/student/my-book-orders", icon: BookOpen },
    { label: "My Trips", url: "/student/my-trips", icon: Image },
    { label: "My Bookings", url: "/student/my-bookings", icon: CheckCircle2 },
    { label: "My Notes", url: "/student/notes", icon: FileText },
    { label: "Testimonials", url: "/student/testimonials", icon: MessageSquare },
    { label: "Notifications", url: "/student/notifications", icon: Bell },
    { label: "Profile", url: "/student/dashboard?profile=true", icon: User }
  ],
  teacher: [
    { label: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "My Courses", url: "/teacher/courses", icon: BookOpen },
    { label: "Doubt Box", url: "/teacher/comments", icon: MessageSquare },
    { label: "Live Chats", url: "/teacher/chat", icon: MessageSquare },
    { label: "Devotee Progress", url: "/teacher/student-progress", icon: Users },
    { label: "Notifications", url: "/teacher/notifications", icon: Bell },
    { label: "Blogs", url: "/teacher/blogs", icon: MessageSquare },
    { label: "Profile", url: "/teacher/dashboard?profile=true", icon: User }
  ],
  main_admin: [
    { label: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Youth Outreach", url: "/admin/outreach", icon: Users },
    { label: "Profile", url: "/admin/dashboard?profile=true", icon: User },
    { label: "Teacher Panel", url: "/teacher/dashboard", icon: GraduationCap },
    { label: "Preachers / Teachers", url: "/admin/teachers", icon: Shield },
    { label: "Users", url: "/admin/users", icon: Users },
    { label: "Password Requests", url: "/admin/password-reset-requests", icon: KeyRound },
    { label: "Staff & Roles", url: "/admin/roles", icon: Shield },
    { label: "Activity Trail", url: "/admin/activity-log", icon: Clock },
    { label: "Login Sessions", url: "/admin/sessions", icon: Shield },
    { label: "Hero Banners", url: "/admin/banners", icon: Image },
    { label: "Home Sections", url: "/admin/home-sections", icon: Home },
    { label: "About Sections", url: "/admin/about-sections", icon: FileText },
    { label: "Pages", url: "/admin/pages", icon: FileText },
    { label: "Testimonials", url: "/admin/testimonials", icon: MessageSquare },
    { label: "Courses", url: "/admin/courses", icon: BookOpen },
    { label: "Question Paper Maker", url: "/admin/question-paper-maker", icon: BookOpen },
    { label: "Enrollment Requests", url: "/admin/course-requests", icon: UserCheck },
    { label: "Books", url: "/admin/books", icon: BookOpen },
    { label: "Book Orders", url: "/admin/book-orders", icon: CheckCircle2 },
    { label: "Book Payment Settings", url: "/admin/book-payment-settings", icon: Settings },
    { label: "Upcoming Journeys", url: "/admin/journeys", icon: Compass },
    { label: "Trips", url: "/admin/pilgrimages", icon: Image },
    { label: "Pilgrimage Bookings", url: "/admin/pilgrimage-bookings", icon: UserCheck },
    { label: "Booking Taxes", url: "/admin/booking-taxes", icon: FileText },
    { label: "Upcoming Classes", url: "/admin/upcoming-classes", icon: FileText },
    { label: "Visionaries Info", url: "/admin/visionaries", icon: Users },
    { label: "Video Intro", url: "/admin/video-intro", icon: PlayCircle },
    { label: "Blogs", url: "/admin/blogs", icon: MessageSquare },
    { label: "Video Blogs", url: "/admin/video-blogs", icon: PlayCircle },
    { label: "Image Gallery", url: "/admin/media/images", icon: Image },
    { label: "Video Gallery", url: "/admin/media/videos", icon: PlayCircle },
    { label: "Subscribers", url: "/admin/subscribers", icon: Users },
    { label: "Contact & Messages", url: "/admin/contact", icon: MessageSquare },
    { label: "Comments", url: "/admin/comments", icon: MessageSquare },
    { label: "Chat Moderation", url: "/admin/chat", icon: MessageSquare },
    { label: "Notifications", url: "/admin/notifications", icon: Bell },
    { label: "Footer", url: "/admin/footer", icon: FileText },
    { label: "Legal Pages", url: "/admin/legal-pages", icon: Shield },
    { label: "Site Settings", url: "/admin/site-settings", icon: Settings },
    { label: "Asset Manager", url: "/admin/assets", icon: FileText },
    { label: "Traffic", url: "/admin/traffic", icon: BarChart3 },
    { label: "Student Progress", url: "/admin/reports", icon: Users }
  ]
};

const sectionOf = (url = "") => {
  const tail = url.split("?")[0].replace(/^\/admin\//, "");
  const map = {
    journeys: "journeys",
    pilgrimages: "trips",
    trips: "trips",
    "pilgrimage-bookings": "trip-bookings",
    "trip-bookings": "trip-bookings",
    "booking-taxes": "booking-taxes",
    "upcoming-classes": "upcoming-classes",
    "media/images": "media",
    "media/videos": "media",
    "gallery-images": "media",
    "gallery-videos": "media",
    preachers: "teachers",
    teachers: "teachers",
    visionaries: "visionaries",
    "video-intro": "home-sections",
    "home-sections": "home-sections",
    "about-sections": "about-sections",
    dashboard: "dashboard",
    outreach: "outreach",
    roles: "roles",
    staff: "roles",
    banners: "banners",
    courses: "courses",
    lessons: "lessons",
    "question-paper-maker": "exams",
    exams: "exams",
    "course-requests": "course-requests",
    books: "books",
    "book-orders": "book-orders",
    "book-payment-settings": "book-payment-settings",
    contact: "contact-messages",
    "contact-settings": "contact-messages",
    "contact-messages": "contact-messages",
    testimonials: "testimonials",
    assets: "assets",
    notifications: "notifications",
    "activity-log": "activity-log",
    sessions: "sessions",
    users: "users",
    subscribers: "subscribers",
    comments: "comments",
    chat: "chat",
    footer: "footer",
    "site-settings": "site-settings",
    "legal-pages": "pages",
    pages: "pages",
    traffic: "traffic",
    reports: "reports",
    "password-reset-requests": "users"
  };
  return map[tail] || tail.split("/")[0];
};

const AdminSectionGuard = ({ user, children }) => {
  const location = useLocation();
  const isFull = Boolean(user && (user.role === "main_admin" || user.role === "admin" || user.isFullAdmin));
  if (isFull || !Array.isArray(user?.sectionAccess)) return children;

  const section = sectionOf(location.pathname);
  if (["dashboard", "profile", ""].includes(section)) return children;
  const granted = user.sectionAccess.some((g) => g.section === section && g.view !== false);
  if (granted) return children;

  return (
    <div className="grid place-items-center px-6 py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
        <Lock size={24} />
      </span>
      <h1 className="mt-4 text-2xl font-black text-ink">You do not have access to this section</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Your account does not include <span className="font-bold text-ink">{section.replace(/-/g, " ")}</span>.
        Ask an administrator if you need it.
      </p>
      <Link to="/admin/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white">
        Back to dashboard
      </Link>
    </div>
  );
};

export const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const allLinks = dashboardLinks[role] || [];

  /* A staff member only sees the sections granted to them. main_admin
     and full admins (role === "admin") are never filtered. This is presentation only — the server checks
     every request independently. */
  const isFullAdminUser = Boolean(user && (user.role === "main_admin" || user.role === "admin" || user.isFullAdmin));

  const links =
    !isFullAdminUser && Array.isArray(user?.sectionAccess)
      ? allLinks.filter((item) => {
          /* Cross-links out of the admin panel (e.g. the teacher panel)
             are for main_admin only. */
          if (!item.url.startsWith("/admin/")) return false;
          const section = sectionOf(item.url);
          if (section === "dashboard" || section === "profile") return true;
          return user.sectionAccess.some((g) => g.section === section && g.view !== false);
        })
      : allLinks;
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <div className="min-h-screen bg-soft w-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-black/5 bg-white lg:block">
        <Link to="/" className="flex h-20 items-center border-b border-black/5 px-6" aria-label="ISKCON Juhu Self-Excellence"><BrandLogo compact /></Link>
        <nav className="h-[calc(100vh-9rem)] overflow-y-auto custom-scrollbar px-4 py-5">
          {links.map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.url} to={item.url} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-ink hover:bg-soft"}`}><Icon size={18} />{item.label}</NavLink>;
          })}
        </nav>
        <button onClick={handleLogout} className="mx-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white"><LogOut size={18} />Logout</button>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/5 bg-white px-4 lg:px-8">
          <Link to="/" className="min-w-0 flex-1 mr-2 block hover:opacity-85 transition cursor-pointer" title="Go to homepage">
            <p className="text-[10px] sm:text-xs font-bold uppercase text-primary">{(user?.role || role).replace("_", " ")}</p>
            <h1 className="text-sm sm:text-lg font-black text-ink truncate max-w-[160px] sm:max-w-xs md:max-w-none">
              Welcome, {user?.name}
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell />
            <button onClick={handleLogout} className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold lg:hidden">Logout</button>
          </div>
        </header>
        <nav className="sticky top-16 z-20 flex gap-2 overflow-x-auto border-b border-black/5 bg-white px-4 py-3 lg:hidden">
          {links.map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.url} to={item.url} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${isActive ? "bg-primary text-white" : "bg-soft text-ink"}`}><Icon size={14} />{item.label}</NavLink>;
          })}
        </nav>
        <div className="px-4 py-6 lg:px-8">
          {role === "main_admin" ? (
            <AdminSectionGuard user={user}><Outlet /></AdminSectionGuard>
          ) : (
            <Outlet />
          )}
        </div>
        {role === "student" && <StudentSupportChat />}
      </main>
    </div>
  );
};

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const home = ["main_admin", "admin", "manager", "editor", "viewer"].includes(user?.role) ? "/admin/dashboard" : user?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
  if (loading) return <div className="grid min-h-screen place-items-center text-sm font-semibold">Loading...</div>;
  if (!user) return <NavigateTo to="/login" state={{ from: location.pathname }} />;
  const allowedRoles = roles?.includes("student") ? Array.from(new Set([...roles, "devotee", "user"])) : roles;
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) return <NavigateTo to={home || "/"} />;
  return children ? children : <Outlet />;
};

const NavigateTo = ({ to, state }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace: true, state });
  }, [navigate, state, to]);
  return null;
};

export const ProgressChart = ({ data }) => {
  if (!data || !data.length) {
    return <div className="text-center text-sm text-muted py-6">No progress activity data available yet.</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.watchSeconds || 0), 60);
  const chartHeight = 150;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.max((plotWidth / data.length) * 0.6, 12);
  const gap = (plotWidth - (barWidth * data.length)) / (data.length - 1 || 1);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-black/5 bg-soft p-4">
      <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-muted font-sans">Weekly Watch Activity (Minutes)</h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + plotHeight * (1 - ratio);
          const minutesVal = Math.round(((maxVal * ratio) / 60) * 10) / 10;
          return (
            <g key={ratio} className="opacity-40">
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#000" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[9px] font-sans font-bold fill-muted">{minutesVal}m</text>
            </g>
          );
        })}

        {data.map((day, idx) => {
          const val = day.watchSeconds || 0;
          const barHeight = maxVal > 0 ? (val / maxVal) * plotHeight : 0;
          const x = paddingLeft + idx * (barWidth + gap);
          const y = paddingTop + plotHeight - barHeight;

          return (
            <g key={idx} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                className="fill-primary transition-all duration-300 hover:fill-primary/80 cursor-pointer"
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[9px] font-sans font-black fill-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                {Math.round((val / 60) * 10) / 10}m
              </text>
              <text
                x={x + barWidth / 2}
                y={paddingTop + plotHeight + 14}
                textAnchor="middle"
                className="text-[9px] font-sans font-bold fill-ink"
              >
                {day.dayName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* `general` opens the desk with no course attached, which is what the
   site-wide launcher uses: any signed-in visitor can ask a question
   without being enrolled in anything. Inside the course area the
   component keeps its old behaviour and pre-selects a course. */
export const StudentSupportChat = ({ general = false }) => {
  const { user, socket } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load user's courses
  useEffect(() => {
    if (isOpen) {
      apiFetch("/student/dashboard").then((data) => {
        const enrollments = data.dashboard?.courses || [];
        const activeCourses = enrollments.map((e) => e.course).filter(Boolean);
        setCourses(activeCourses);
        if (!general && activeCourses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(activeCourses[0]._id);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Fetch or create conversation room when a course is chosen
  useEffect(() => {
    if (isOpen && (selectedCourseId || general)) {
      apiFetch("/chats/conversation/get-or-create", {
        method: "POST",
        /* omitted courseId => general support room */
        body: selectedCourseId ? { courseId: selectedCourseId } : {}
      }).then((data) => {
        if (data.success && data.room) {
          setActiveRoom(data.room);
          // fetch messages
          apiFetch(`/chats/${data.room._id}/messages`).then((msgData) => {
            setMessages(msgData.items || []);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          });
        }
      }).catch(() => {});
    }
  }, [selectedCourseId, isOpen, general]);

  // Bind to socket events
  useEffect(() => {
    if (!socket || !activeRoom || !isOpen) return;
    const handleMsg = (data) => {
      const roomId = data.room?._id || data.room;
      if (roomId === activeRoom._id) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        // Mark as read
        apiFetch(`/chats/${roomId}/messages`).catch(() => {});
      }
    };
    socket.on("receive_message", handleMsg);
    return () => socket.off("receive_message", handleMsg);
  }, [socket, activeRoom, isOpen]);

  const handleSend = async (text, fileUrl = null, fileName = null, fileType = null) => {
    if (!text.trim() && !fileUrl) return;
    if (!activeRoom) return;
    try {
      const payload = {
        conversationId: activeRoom._id,
        courseId: selectedCourseId,
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
    } catch (e) {
      console.error(e);
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
      alert("Attachment upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleHandoff = async (targetType) => {
    if (!activeRoom) return;
    try {
      const data = await apiFetch("/chatbot/handoff", {
        method: "POST",
        body: { conversationId: activeRoom._id, targetType }
      });
      if (data.success && data.room) {
        setActiveRoom(data.room);
        // Refresh messages list
        apiFetch(`/chats/${data.room._id}/messages`).then((msgData) => {
          setMessages(msgData.items || []);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
      } else {
        alert(data.message || "Failed to switch support channel");
      }
    } catch (err) {
      alert(err.message || "Failed to route support chat");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition hover:scale-105 active:scale-95 animate-bounce-short"
        aria-label="Spiritual Helpdesk Support"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl bg-white border border-black/10 shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-ink text-white p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm">Devotee Support Desk</h3>
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold capitalize">
                {activeRoom?.assignedToType === "teacher" ? "Preacher Mode" : "Admin Support"}
              </span>
            </div>
            
            {/* Triage Handoff Selector */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-[10px] text-white/70">Chat with:</span>
              <div className="flex bg-white/10 p-0.5 rounded-full border border-white/5">
                <button
                  type="button"
                  onClick={() => handleHandoff("teacher")}
                  disabled={!selectedCourseId}
                  title={selectedCourseId ? "Chat with the course preacher" : "Pick a course to reach its preacher"}
                  className={`px-3 py-0.5 text-[10px] font-black rounded-full transition-all ${
                    activeRoom?.assignedToType === "teacher"
                      ? "bg-primary text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  } ${!selectedCourseId ? "cursor-not-allowed opacity-40 hover:text-white/60" : ""}`}
                >
                  Preacher
                </button>
                <button
                  type="button"
                  onClick={() => handleHandoff("admin")}
                  className={`px-3 py-0.5 text-[10px] font-black rounded-full transition-all ${
                    activeRoom?.assignedToType === "admin" || !activeRoom?.assignedToType
                      ? "bg-primary text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {general || courses.length > 0 ? (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl bg-white/10 text-white text-xs border border-white/10 p-2 focus:outline-none"
              >
                {general && (
                  <option value="" className="text-ink">
                    Chat context: General question
                  </option>
                )}
                {courses.map((c) => (
                  <option key={c._id} value={c._id} className="text-ink">
                    Chat context: {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[10px] text-white/60">No enrolled courses yet</p>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-soft/20">
            {activeRoom ? (
              <>
                {messages.length === 0 && (
                  <div className="text-center py-12 text-muted text-xs">
                    {selectedCourseId
                      ? "Start a conversation with our teacher/admin regarding this course."
                      : "Hare Krishna! Ask us anything about classes, courses or pilgrimages."}
                  </div>
                )}
                {messages.map((m) => {
                  const isMe = m.sender?._id === user?._id;
                  return (
                    <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white text-ink border border-black/5 rounded-bl-sm shadow-sm"}`}>
                        {m.fileUrl ? (
                          m.fileType?.startsWith("image/") ? (
                            <a href={assetUrl(m.fileUrl)} target="_blank" rel="noreferrer">
                              <img src={assetUrl(m.fileUrl)} alt="Attachment" className="mb-1.5 max-h-36 rounded-lg object-cover" />
                            </a>
                          ) : (
                            <a href={assetUrl(m.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline mb-1.5 text-xs font-black">
                              <FileText size={14} /> {m.fileName}
                            </a>
                          )
                        ) : null}
                        {m.text && <p className="text-xs leading-5 whitespace-pre-wrap">{m.text}</p>}
                        <div className={`mt-1 text-[8px] text-right ${isMe ? "text-white/60" : "text-muted"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center py-12 text-muted text-xs">
                Select a course from dropdown to start chat.
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-black/5 p-3 bg-white">
            <div className="flex items-center gap-2 relative">
              <label className={`cursor-pointer rounded-full p-2 text-muted hover:bg-soft transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" onChange={handleFileUpload} className="hidden" />
                <Paperclip size={18} />
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                placeholder={uploading ? "Uploading file..." : "Ask a question..."}
                disabled={uploading}
                className="flex-1 rounded-full border border-black/10 bg-soft px-4 py-2 text-xs focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim() && !uploading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/95 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const QuizPlayer = ({ attempt, onAnswerChange, onSubmit }) => {
  if (!attempt || !attempt.questionsServed) return null;

  return (
    <div className="bg-white rounded-2xl shadow-premium p-6">
      <h3 className="text-xl font-black text-ink mb-6">Lesson Quiz</h3>
      <div className="space-y-8">
        {attempt.questionsServed.map((q, idx) => (
          <div key={q._id} className="border-b border-black/5 pb-6 last:border-0">
            <p className="font-bold text-ink mb-4"><span className="text-primary mr-2">{idx + 1}.</span>{q.text}</p>
            {q.type === "mcq" ? (
              <div className="space-y-3 pl-6">
                {q.options.map(opt => (
                  <label key={opt._id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name={q._id} 
                      className="text-primary focus:ring-primary h-4 w-4 border-gray-300"
                      onChange={() => onAnswerChange(q._id, opt._id, null)}
                    />
                    <span className="text-sm text-muted group-hover:text-ink">{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="pl-6">
                <textarea 
                  rows={2}
                  className="w-full rounded-xl border border-black/10 p-3 text-sm focus:border-primary focus:outline-none"
                  placeholder="Your answer..."
                  onChange={(e) => onAnswerChange(q._id, null, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button onClick={onSubmit} className="rounded-full bg-primary px-8 py-3 font-bold text-white transition hover:bg-primary/95">
          Submit Quiz
        </button>
      </div>
    </div>
  );
};
