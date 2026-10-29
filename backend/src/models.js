import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model, models } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

const activeStatus = { type: String, enum: ["active", "inactive"], default: "active" };
const userStatus = { type: String, enum: ["active", "blocked", "pending", "inactive", "suspended"], default: "active", index: true };
const publishStatus = { type: String, enum: ["draft", "published"], default: "draft" };
const seo = { seoTitle: String, seoDescription: String, seoKeywords: [String] };
const socialLinks = new Schema(
  { facebook: String, instagram: String, youtube: String, linkedin: String, website: String },
  { _id: false }
);

const heroBannerSchema = new Schema(
  {
    title: String,
    subtitle: String,
    buttonText: String,
    buttonLink: String,
    desktopImage: { type: String, required: true },
    tabletImage: String,
    mobileImage: String,
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

const permissions = {
  canCreateCourse: { type: Boolean, default: false },
  canEditCourse: { type: Boolean, default: false },
  canDeleteCourse: { type: Boolean, default: false },
  canCreateLesson: { type: Boolean, default: true },
  canEditLesson: { type: Boolean, default: true },
  canCreateBlog: { type: Boolean, default: false },
  canCreateVideoBlog: { type: Boolean, default: false },
  canViewStudents: { type: Boolean, default: true },
  canViewAnalytics: { type: Boolean, default: false },
  canReplyToComments: { type: Boolean, default: false },
  canReplyToChats: { type: Boolean, default: false },
  canUploadResources: { type: Boolean, default: false },
  canViewStudentProgress: { type: Boolean, default: false },
  canSendReminders: { type: Boolean, default: false },
  canMarkDoubtsResolved: { type: Boolean, default: false },
  canEscalateToAdmin: { type: Boolean, default: false }
};

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    mobile: String,
    /* Not required for an account created through Google — there is no
       password to set in that flow. Password sign-in still works for
       everyone who has one, staff and admin included. */
    password: {
      type: String,
      required: function () {
        return !this.googleId && ["main_admin", "admin", "manager", "editor", "viewer", "outreach_coordinator", "attendance_operator", "teacher"].includes(this.role);
      },
      minlength: 6,
      select: false
    },
    /* Google's stable subject id. Sparse so the unique index ignores
       the many accounts that will never have one. */
    googleId: { type: String, index: true, unique: true, sparse: true },
    /* Staff roles sit above teacher; main_admin remains the owner and
       is never restricted. Existing values are untouched. */
    role: {
      type: String,
      enum: ["main_admin", "admin", "manager", "editor", "viewer", "outreach_coordinator", "attendance_operator", "teacher", "student", "devotee", "user"],
      default: "student",
      index: true
    },
    /* Which admin sections this staff member may open, and what they
       may do in each. Ignored for main_admin, who always has everything. */
    sectionAccess: [
      {
        _id: false,
        section: { type: String, required: true },
        view: { type: Boolean, default: true },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        /* not "remove" — that is a reserved Mongoose path */
        canDelete: { type: Boolean, default: false }
      }
    ],
    /* Who created this staff account, for the hierarchy view. */
    managedBy: { type: ObjectId, ref: "User", index: true },
    profileImage: String,
    bio: String,
    expertise: [String],
    specialization: [String],
    teacherType: { type: String, enum: ["primary", "support", "guest", "mentor"], default: "primary" },
    status: userStatus,
    emailVerified: { type: Boolean, default: true, index: true },
    otpVerifiedAt: Date,
    mustChangePassword: { type: Boolean, default: false },
    lastActiveAt: Date,
    isOnline: { type: Boolean, default: false },
    lastSeen: Date,
    adminNotes: String,
    blockedAt: Date,
    blockedReason: String,
    assignedCourses: [{ type: ObjectId, ref: "Course" }],
    createdByAdminId: { type: ObjectId, ref: "User" },
    permissions
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function matchPassword(password) {
  /* A Google-created account has no password stored. Answer "no match"
     rather than letting bcrypt throw on an undefined hash, so password
     sign-in simply fails for it like any wrong credential would. */
  if (!password || !this.password) return Promise.resolve(false);
  return bcrypt.compare(password, this.password);
};
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    thumbnail: String,
    bannerImage: String,
    shortDescription: String,
    description: String,
    category: String,
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    teacher: { type: ObjectId, ref: "User" },
    primaryTeacherId: { type: ObjectId, ref: "User" },
    supportTeacherIds: [{ type: ObjectId, ref: "User" }],
    assignedTeacherIds: [{ type: ObjectId, ref: "User" }],
    completionMode: { type: String, enum: ["manual", "auto", "quiz", "assignment"], default: "manual" },
    requiredWatchPercentage: { type: Number, default: 80 },
    certificateEnabled: { type: Boolean, default: true },
    teacherPermissions: { type: Mixed, default: {} },
    duration: String,
    priceType: { type: String, enum: ["Free", "Paid"], default: "Free" },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
    featured: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: false },
    status: publishStatus,
    whatYouWillLearn: [String],
    faq: [{ question: String, answer: String }],
    resources: [{ title: String, url: String }],
    createdBy: { type: ObjectId, ref: "User" },
    enrollmentType: { type: [String], default: ["free"] },
    verificationInstructions: String,
    requiredDocumentName: String,
    allowedFileTypes: [String],
    maxFileSize: Number,
    paymentQrCode: String,
    ...seo
  },
  { timestamps: true }
);

const lessonSchema = new Schema(
  {
    course: { type: ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: String,
    videoType: { type: String, enum: ["youtube", "upload"], default: "youtube" },
    youtubeUrl: String,
    videoUrl: String,
    uploadedVideo: String,
    thumbnail: String,
    pdfFile: String,
    attachmentFile: String,
    examPaper: { type: ObjectId, ref: "ExamPaper" },
    resources: [{ title: String, url: String, type: String }],
    duration: String,
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    status: activeStatus,
    publishStatus: { type: String, enum: ["draft", "published"], default: "published", index: true },
    commentsEnabled: { type: Boolean, default: true },
    notesEnabled: { type: Boolean, default: true },
    chatEnabled: { type: Boolean, default: true },
    completionThreshold: { type: Number, default: 80 },
    createdBy: { type: ObjectId, ref: "User" },
    videoSettings: {
      disableSeeking: { type: Boolean, default: true },
      enableCompleteButton: { type: Boolean, default: true }
    },
    quizSettings: {
      hasQuiz: { type: Boolean, default: false },
      mandatory: { type: Boolean, default: false },
      passPercentage: { type: Number, default: 80 },
      totalPool: { type: Number, default: 0 },
      questionsPerAttempt: { type: Number, default: 10 },
      randomOrder: { type: Boolean, default: true },
      optionsRandomOrder: { type: Boolean, default: false },
      retakeAllowed: { type: Boolean, default: true },
      maxRetakes: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);
lessonSchema.index({ course: 1, slug: 1 }, { unique: true });

const courseContentSchema = new Schema(
  {
    course: { type: ObjectId, ref: "Course", required: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true },
    type: { type: String, enum: ["video", "exam", "pdf", "text"], default: "video" },
    title: { type: String, required: true },
    description: String,
    slug: { type: String, required: true, lowercase: true, trim: true },
    order: { type: Number, default: 0, index: true },
    isRequired: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    
    // Video Type
    videoType: { type: String, enum: ["youtube", "upload"], default: "youtube" },
    youtubeUrl: String,
    videoUrl: String,
    uploadedVideo: String,
    thumbnail: String,
    duration: String,
    videoSettings: {
      disableSeeking: { type: Boolean, default: true },
      enableCompleteButton: { type: Boolean, default: true },
      completionThreshold: { type: Number, default: 80 }
    },

    // Exam Type
    examPaper: { type: ObjectId, ref: "ExamPaper" },
    
    // PDF / Text Type
    pdfFile: String,
    textContent: String,
    attachmentFile: String,
  },
  { timestamps: true }
);
courseContentSchema.index({ lesson: 1, slug: 1 }, { unique: true });

const enrollmentSchema = new Schema(
  {
    student: { type: ObjectId, ref: "User", required: true },
    course: { type: ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    completedAt: Date
  },
  { timestamps: true }
);
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const progressSchema = new Schema(
  {
    student: { type: ObjectId, ref: "User", required: true },
    course: { type: ObjectId, ref: "Course", required: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true },
    isCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started", index: true },
    lastPosition: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    watchPercent: { type: Number, default: 0 },
    watchSeconds: { type: Number, default: 0 },
    watchedIntervals: { type: [{ start: Number, end: Number, _id: false }], default: [] },
    completedAt: Date,
    quizPassed: { type: Boolean, default: false },
    assignmentSubmitted: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now },
    maxWatchedSeconds: { type: Number, default: 0 },
    unlockedLessons: [{ type: ObjectId, ref: "Lesson" }]
  },
  { timestamps: true }
);
progressSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });

const contentProgressSchema = new Schema(
  {
    student: { type: ObjectId, ref: "User", required: true },
    course: { type: ObjectId, ref: "Course", required: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true },
    content: { type: ObjectId, ref: "CourseContent", required: true },
    isCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started", index: true },
    lastPosition: { type: Number, default: 0 },
    watchPercent: { type: Number, default: 0 },
    maxWatchedSeconds: { type: Number, default: 0 },
    watchedIntervals: { type: [{ start: Number, end: Number, _id: false }], default: [] },
    completedAt: Date,
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
contentProgressSchema.index({ student: 1, course: 1, lesson: 1, content: 1 }, { unique: true });

const otpCodeSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User" },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["register", "forgot_password"], required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verifiedAt: Date,
    consumedAt: Date
  },
  { timestamps: true }
);
otpCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });

const passwordResetRequestSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User" },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    message: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: String,
    resolvedBy: { type: ObjectId, ref: "User" },
    resolvedAt: Date,
    tempPasswordSetAt: Date
  },
  { timestamps: true }
);

const noteSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true, index: true },
    title: String,
    content: { type: String, required: true },
    timestamp: { type: Number, default: 0 }
  },
  { timestamps: true }
);
noteSchema.index({ user: 1, lesson: 1, createdAt: -1 });

const commentSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true, index: true },
    parentComment: { type: ObjectId, ref: "Comment", default: null, index: true },
    text: { type: String, required: true },
    fileUrl: String,
    fileName: String,
    adminReply: String,
    adminReplyUser: { type: ObjectId, ref: "User" },
    adminReplyAt: Date,
    status: { type: String, enum: ["pending", "replied", "resolved", "escalated"], default: "pending", index: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium", index: true },
    isPinned: { type: Boolean, default: false, index: true },
    adminNote: String,
    assignedToType: { type: String, enum: ["admin", "teacher"], default: "admin", index: true },
    assignedTeacherId: { type: ObjectId, ref: "User", index: true },
    repliedById: { type: ObjectId, ref: "User" },
    repliedByRole: { type: String, enum: ["admin", "teacher"] }
  },
  { timestamps: true }
);
commentSchema.index({ lesson: 1, status: 1, createdAt: -1 });

const chatRoomSchema = new Schema(
  {
    /* null = general support room, opened from the site rather than a course */
    course: { type: ObjectId, ref: "Course", default: null, index: true },
    participants: [{ type: ObjectId, ref: "User", index: true }],
    lastMessage: String,
    lastMessageAt: { type: Date, default: Date.now },
    unreadCounts: { type: Map, of: Number, default: {} },
    assignedToType: { type: String, enum: ["admin", "teacher", "bot"], default: "bot", index: true },
    assignedTeacherId: { type: ObjectId, ref: "User", index: true },
    lastReplyBy: { type: String, enum: ["student", "teacher", "admin", "system", "bot"], default: "system" },
    status: { type: String, enum: ["open", "pending", "resolved", "escalated"], default: "open", index: true },
    botSummary: String,
    adminReviewed: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);
chatRoomSchema.index({ course: 1, lastMessageAt: -1 });

const chatMessageSchema = new Schema(
  {
    room: { type: ObjectId, ref: "ChatRoom", required: true, index: true },
    /* null for messages in a general support room */
    course: { type: ObjectId, ref: "Course", default: null, index: true },
    sender: { type: ObjectId, ref: "User", required: true, index: true },
    receiver: { type: ObjectId, ref: "User", index: true },
    text: String,
    fileUrl: String,
    fileType: String,
    fileName: String,
    messageType: { type: String, enum: ["text", "file", "system", "bot"], default: "text" },
    senderRole: { type: String, enum: ["student", "teacher", "admin", "system", "bot"], default: "student" },
    isBotMessage: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent", index: true },
    readAt: Date,
    deliveredAt: Date
  },
  { timestamps: true }
);
chatMessageSchema.index({ room: 1, createdAt: -1 });

const notificationSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", index: true },
    audience: { type: String, enum: ["user", "admin", "all"], default: "user", index: true },
    type: { type: String, default: "info", index: true },
    title: { type: String, required: true },
    message: String,
    link: String,
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    metadata: Mixed
  },
  { timestamps: true }
);

const fileUploadSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User" },
    url: { type: String, required: true },
    filename: String,
    folder: String,
    mimeType: String,
    size: Number
  },
  { timestamps: true }
);

const upcomingClassSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: String,
    date: Date,
    time: String,
    venue: String,
    speaker: String,
    shortDescription: String,
    fullDescription: String,
    videoUrl: String,
    youtubeUrl: String,

    /* ---- what the class actually involves ---- */
    whatToExpect: String,
    /* a simple running order: "6:00 PM" -> "Kirtan" */
    schedule: [
      {
        _id: false,
        time: String,
        activity: String,
        detail: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],
    highlights: [{ _id: false, title: String, sortOrder: { type: Number, default: 0 } }],
    whoFor: [String],
    notes: String,

    /* ---- handout the admin attaches (kept small on purpose) ---- */
    pdfUrl: String,
    pdfName: String,
    pdfSize: Number,
    pdfUploadedAt: Date,

    /* ---- photographs from previous sessions ---- */
    gallery: [
      {
        _id: false,
        imageUrl: { type: String, required: true },
        altText: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],

    registrationNote: String,
    seats: { type: Number, default: 0 },
    status: activeStatus,
    showOnHomepage: { type: Boolean, default: true, index: true },
    buttonText: { type: String, default: "View Details" },
    buttonLink: String,
    sortOrder: { type: Number, default: 0 },
    ...seo
  },
  { timestamps: true }
);

const pageSectionSchema = new Schema(
  {
    pageName: { type: String, required: true, lowercase: true, trim: true },
    sectionKey: { type: String, required: true, lowercase: true, trim: true },
    sectionName: String,
    routePath: String,
    navLabel: String,
    sectionTitle: String,
    sectionSubtitle: String,
    content: Mixed,
    image: String,
    images: [String],
    videoUrl: String,
    buttonText: String,
    buttonLink: String,
    sortOrder: { type: Number, default: 0 },
    status: activeStatus,
    homepageVisible: { type: Boolean, default: true },
    websiteEnabled: { type: Boolean, default: true },
    settings: Mixed
  },
  { timestamps: true }
);
pageSectionSchema.index({ pageName: 1, sectionKey: 1 }, { unique: true });

const aboutPageSectionSchema = new Schema(
  {
    pageName: { type: String, default: "about" },
    sectionTitle: String,
    sectionSubtitle: String,
    description: String,
    image: String,
    images: [String],
    buttonText: String,
    buttonLink: String,
    sortOrder: { type: Number, default: 0 },
    status: activeStatus
  },
  { timestamps: true }
);

const preacherSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: String,
    designation: String,
    type: { type: String, default: "Team Member", index: true },
    shortBio: String,
    fullBio: String,
    experience: String,
    specialization: [String],
    email: String,
    phone: String,
    socialLinks,
    status: activeStatus,
    showOnHomepage: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    user: { type: ObjectId, ref: "User" },
    ...seo
  },
  { timestamps: true }
);

const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: String,
    shortDescription: String,
    content: String,
    listItems: [String],
    author: { type: ObjectId, ref: "User" },
    category: String,
    tags: [String],
    status: publishStatus,
    featured: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: false },
    ...seo
  },
  { timestamps: true }
);

const videoBlogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    /* Left blank, the poster is taken from the video itself — the
       YouTube or Vimeo still. Setting it overrides that. */
    thumbnail: String,
    /* "youtube" plays videoUrl in an embed (YouTube or Vimeo);
       "upload" plays uploadedVideo from our own server. */
    videoType: { type: String, enum: ["youtube", "upload"], default: "youtube" },
    videoUrl: String,
    uploadedVideo: String,
    duration: String,
    speaker: String,
    shortDescription: String,
    description: String,
    category: String,
    tags: [String],
    status: publishStatus,
    showOnHomepage: { type: Boolean, default: false },
    /* The featured one leads the homepage band and the videos page. */
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    ...seo
  },
  { timestamps: true }
);
videoBlogSchema.index({ featured: -1, sortOrder: 1, createdAt: -1 });

const imageGallerySchema = new Schema(
  {
    title: { type: String, required: true },
    image: String,
    category: String,
    description: String,
    status: activeStatus,
    showInMediaHighlight: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const videoGallerySchema = new Schema(
  {
    title: { type: String, required: true },
    thumbnail: String,
    videoUrl: String,
    description: String,
    category: String,
    status: activeStatus,
    showInMediaHighlight: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    subscribedDate: { type: Date, default: Date.now },
    status: activeStatus
  },
  { timestamps: true }
);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    subject: String,
    classTitle: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["read", "unread"], default: "unread" }
  },
  { timestamps: true }
);

const contactSettingSchema = new Schema(
  {
    singletonKey: { type: String, default: "contact", unique: true },
    title: { type: String, default: "Contact Information" },
    address: { type: String, default: "ISKCON Juhu, Hare Krishna Land, Juhu, Mumbai" },
    phone: { type: String, default: "+91 22 2620 6860" },
    email: { type: String, default: "selfexcellence@iskconjuhu.in" },
    whatsappNumber: { type: String, default: "8928337055" },
    whatsappMessage: { type: String, default: "Hare Krishna! I would like to know more about ISKCON Self-Excellence courses." },
    mapUrl: { type: String, default: "https://www.google.com/maps?q=ISKCON%20Juhu&output=embed" },
    bannerTitle: { type: String, default: "Contact Us" },
    bannerSubtitle: { type: String, default: "Questions about classes, courses, enrollment, or volunteering? Reach out." }
  },
  { timestamps: true }
);

const footerSettingSchema = new Schema(
  {
    singletonKey: { type: String, default: "footer", unique: true },
    logo: String,
    description: String,
    columns: [{ title: String, links: [{ label: String, url: String }] }],
    contactDetails: { address: String, phone: String, email: String },
    socialLinks,
    copyrightText: String,
    copyrightYear: Number,
    newsletterEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const siteSettingSchema = new Schema(
  {
    singletonKey: { type: String, default: "site", unique: true },
    logo: String,
    favicon: String,
    siteName: { type: String, default: "ISKCON Juhu Self-Excellence" },
    primaryColor: { type: String, default: "#f52246" },
    headerLinks: [{ label: String, url: String, sortOrder: Number, status: activeStatus }],
    loginButtonText: { type: String, default: "Login" },
    registerButtonText: { type: String, default: "Register" },
    socialLinks,
    defaultSeoTitle: String,
    defaultSeoDescription: String,
    customHeaderHtml: String,
    googleSearchConsoleTag: String,
    aboutStats: {
      courses: { type: String, default: "6+" },
      teachers: { type: String, default: "6+" },
      lessons: { type: String, default: "12+" },
      sundayClasses: { type: String, default: "Every Week" }
    }
  },
  { timestamps: true }
);

const legalPageSchema = new Schema(
  { slug: { type: String, required: true, unique: true }, title: { type: String, required: true }, content: String, status: activeStatus, ...seo },
  { timestamps: true }
);

const trafficLogSchema = new Schema(
  { pageUrl: String, ip: String, browser: String, deviceType: String, referrer: String, user: { type: ObjectId, ref: "User" } },
  { timestamps: true }
);

const benefitSchema = new Schema(
  {
    title: { type: String, required: true },
    image: String,
    shortDescription: String,
    fullDescription: String,
    buttonText: String,
    buttonLink: String,
    status: activeStatus,
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const testimonialSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", index: true },
    userName: { type: String, trim: true },
    name: { type: String, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    userProfileImage: { type: String, default: "" },
    image: { type: String, default: "" },
    testimonialText: { type: String, required: true },
    quote: { type: String },
    designation: { type: String, default: "Student" },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "inactive"],
      default: "pending",
      index: true
    },
    isFeatured: { type: Boolean, default: false, index: true },
    showOnHomepage: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    rejectionReason: { type: String, default: "" },
    adminResponse: { type: String, default: "" },
    approvedAt: { type: Date },
    approvedBy: { type: ObjectId, ref: "User" },
    approvedByName: { type: String, default: "" }
  },
  { timestamps: true }
);

testimonialSchema.pre("save", function (next) {
  if (!this.userName && this.name) this.userName = this.name;
  if (!this.name && this.userName) this.name = this.userName;
  if (!this.testimonialText && this.quote) this.testimonialText = this.quote;
  if (!this.quote && this.testimonialText) this.quote = this.testimonialText;
  if (!this.userProfileImage && this.image) this.userProfileImage = this.image;
  if (!this.image && this.userProfileImage) this.image = this.userProfileImage;
  if (this.status === "active") {
    this.status = "approved";
    this.showOnHomepage = true;
  }
  if (this.rating) {
    this.rating = Math.round(Number(this.rating));
    if (this.rating < 1) this.rating = 1;
    if (this.rating > 5) this.rating = 5;
  }
  next();
});

testimonialSchema.index({ status: 1, showOnHomepage: 1, isFeatured: -1, sortOrder: 1, createdAt: -1 });
testimonialSchema.index({ userId: 1, createdAt: -1 });

const pageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    pageName: String,
    bannerImage: String,
    excerpt: String,
    content: String,
    status: activeStatus,
    sortOrder: { type: Number, default: 0 },
    ...seo
  },
  { timestamps: true }
);

const courseEnrollmentRequestSchema = new Schema(
  {
    student: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: String,
    documentUrl: String,
    documentType: String,
    paymentPhotoUrl: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    rejectionReason: String,
    reviewedBy: { type: ObjectId, ref: "User" },
    reviewedAt: Date,
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const userActivitySchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true },
    currentVideoTime: { type: Number, default: 0 },
    totalWatchTime: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now, index: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: Date,
    progressPercentage: { type: Number, default: 0 },
    completedLessons: [{ type: ObjectId, ref: "Lesson" }]
  },
  { timestamps: true }
);
userActivitySchema.index({ user: 1, course: 1, lastActiveAt: -1 });

const studentAnalyticsSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    dailyWatchTimes: [{ date: String, minutes: Number }],
    weeklyWatchTime: { type: Number, default: 0 },
    monthlyWatchTime: { type: Number, default: 0 },
    quizScores: [Number],
    assignmentScores: [Number],
    improvementScore: { type: Number, default: 50 },
    engagementScore: { type: Number, default: 50 },
    inactiveDays: { type: Number, default: 0 }
  },
  { timestamps: true }
);
studentAnalyticsSchema.index({ user: 1, course: 1 });

const teacherAnalyticsSchema = new Schema(
  {
    teacher: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    totalChatsHandled: { type: Number, default: 0 },
    totalCommentsReplied: { type: Number, default: 0 },
    averageReplyTime: { type: Number, default: 0 },
    pendingChats: { type: Number, default: 0 },
    pendingComments: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },
    studentRating: { type: Number, default: 5 },
    escalatedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);
teacherAnalyticsSchema.index({ teacher: 1, course: 1 });

const teacherAssignmentHistorySchema = new Schema(
  {
    course: { type: ObjectId, ref: "Course", required: true },
    oldTeacherIds: [{ type: ObjectId, ref: "User" }],
    newTeacherIds: [{ type: ObjectId, ref: "User" }],
    changedByAdmin: { type: ObjectId, ref: "User" },
    reason: String,
    changedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const teacherPerformanceSchema = new Schema(
  {
    teacher: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    totalChatsHandled: { type: Number, default: 0 },
    totalCommentsReplied: { type: Number, default: 0 },
    totalDoubtsResolved: { type: Number, default: 0 },
    pendingDoubts: { type: Number, default: 0 },
    averageReplyTime: { type: Number, default: 0 },
    studentRatingAverage: { type: Number, default: 5 },
    helpfulReplyPercentage: { type: Number, default: 100 },
    escalatedCount: { type: Number, default: 0 },
    missedReplyCount: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 100 }
  },
  { timestamps: true }
);

const courseProgressSchema = new Schema(
  {
    student: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    totalLessons: { type: Number, default: 0 },
    completedLessons: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    totalWatchTime: { type: Number, default: 0 },
    currentLesson: { type: ObjectId, ref: "Lesson" },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started", index: true },
    completedAt: Date,
    certificateStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none", index: true },
    certificateApprovedAt: Date,
    certificateUrl: String
  },
  { timestamps: true }
);
courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

const teacherRatingSchema = new Schema(
  {
    student: { type: ObjectId, ref: "User", required: true, index: true },
    teacher: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    conversation: { type: ObjectId, ref: "ChatRoom" },
    comment: { type: ObjectId, ref: "Comment" },
    rating: { type: Number, required: true },
    helpful: { type: Boolean, required: true },
    feedbackText: String,
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const questionSchema = new Schema(
  {
    course: { type: ObjectId, ref: "Course", index: true },
    lesson: { type: ObjectId, ref: "Lesson", index: true },
    type: { type: String, enum: ["mcq", "short_answer"], default: "mcq" },
    text: { type: String, required: true },
    options: [{ text: String, isCorrect: Boolean }],
    correctAnswer: String,
    explanation: String,
    marks: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
questionSchema.index({ lesson: 1, isActive: 1 });

const quizAttemptSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true, index: true },
    questionsServed: [{ type: ObjectId, ref: "Question" }],
    answersSubmitted: [{
      question: { type: ObjectId, ref: "Question" },
      selectedOption: String,
      shortAnswerText: String,
      isCorrect: Boolean,
      marksAwarded: { type: Number, default: 0 }
    }],
    totalMarks: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ["passed", "failed", "pending_review"], default: "pending_review" },
    attemptNumber: { type: Number, default: 1 }
  },
  { timestamps: true }
);
quizAttemptSchema.index({ user: 1, lesson: 1 });

const watchLogSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true, index: true },
    sessionStart: { type: Date, default: Date.now },
    sessionEnd: Date,
    totalWatchedSeconds: { type: Number, default: 0 },
    lastPosition: { type: Number, default: 0 },
    pausesCount: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    deviceInfo: String
  },
  { timestamps: true }
);
watchLogSchema.index({ user: 1, lesson: 1, sessionStart: -1 });

const examQuestionBankSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    totalMcqsAvailable: { type: Number, default: 0 },
    totalObjectiveAvailable: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const examQuestionSchema = new Schema(
  {
    questionBank: { type: ObjectId, ref: "ExamQuestionBank", required: true, index: true },
    type: { type: String, enum: ["MCQ", "OBJECTIVE"], required: true },
    questionText: { type: String, required: true },
    marks: { type: Number, default: 1 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    options: [{ text: String, isCorrect: Boolean, order: Number }],
    expectedKeywords: [String],
    fullModelAnswer: String,
    autoEvaluate: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const examPaperSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    durationMinutes: { type: Number, default: 60 },
    numMcqsToPick: { type: Number, default: 10 },
    numObjectiveToPick: { type: Number, default: 5 },
    questionBank: { type: ObjectId, ref: "ExamQuestionBank", required: true },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    instructions: String,
    isPublished: { type: Boolean, default: false },
    createdBy: { type: ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const examAssignmentSchema = new Schema(
  {
    exam: { type: ObjectId, ref: "ExamPaper", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: ObjectId, ref: "Lesson", required: true, index: true },
    startDate: Date,
    endDate: Date,
    maxAttempts: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
examAssignmentSchema.index({ exam: 1, course: 1 }, { unique: true });

const examAttemptSchema = new Schema(
  {
    exam: { type: ObjectId, ref: "ExamPaper", required: true, index: true },
    user: { type: ObjectId, ref: "User", required: true, index: true },
    assignment: { type: ObjectId, ref: "ExamAssignment" },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    status: { type: String, enum: ["in_progress", "submitted", "evaluated", "passed", "failed"], default: "in_progress" },
    selectedQuestions: [{ type: ObjectId, ref: "ExamQuestion" }]
  },
  { timestamps: true }
);

const examResponseSchema = new Schema(
  {
    attempt: { type: ObjectId, ref: "ExamAttempt", required: true, index: true },
    question: { type: ObjectId, ref: "ExamQuestion", required: true },
    mcqSelectedOptionId: { type: ObjectId },
    objectiveAnswerText: String,
    marksAwarded: { type: Number, default: 0 },
    evaluatedBy: { type: ObjectId, ref: "User" },
    evaluationNote: String
  },
  { timestamps: true }
);

const make = (name, schema) => models[name] || model(name, schema);

export const User = make("User", userSchema);
export const HeroBanner = make("HeroBanner", heroBannerSchema);
export const Course = make("Course", courseSchema);
export const CourseEnrollmentRequest = make("CourseEnrollmentRequest", courseEnrollmentRequestSchema);
export const Lesson = make("Lesson", lessonSchema);
export const Enrollment = make("Enrollment", enrollmentSchema);
export const Progress = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
export const ContentProgress = mongoose.models.ContentProgress || mongoose.model("ContentProgress", contentProgressSchema);
export const CourseContent = mongoose.models.CourseContent || mongoose.model("CourseContent", courseContentSchema);
export const OtpCode = mongoose.models.OtpCode || mongoose.model("OtpCode", otpCodeSchema);
export const PasswordResetRequest = make("PasswordResetRequest", passwordResetRequestSchema);
export const Note = make("Note", noteSchema);
export const Comment = make("Comment", commentSchema);
export const ChatRoom = make("ChatRoom", chatRoomSchema);
export const ChatMessage = make("ChatMessage", chatMessageSchema);
export const Notification = make("Notification", notificationSchema);
export const FileUpload = make("FileUpload", fileUploadSchema);
export const UpcomingClass = make("UpcomingClass", upcomingClassSchema);
export const PageSection = make("PageSection", pageSectionSchema);
export const AboutPageSection = make("AboutPageSection", aboutPageSectionSchema);
export const Preacher = make("Preacher", preacherSchema);
/* ============================================================
   Pilgrimage booking
   ------------------------------------------------------------
   A Pilgrimage is the journey the admin publishes. A booking is
   one request against it, holding the traveller list and a
   snapshot of what the price worked out to at the time it was
   submitted, so later tax or price edits never rewrite history.
   Taxes themselves live in their own collection so the admin can
   add, edit or retire them without a code change.
   ============================================================ */

const pilgrimageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    badge: { type: String, default: "FEATURED PILGRIMAGE" },
    image: String,
    bannerImage: String,
    route: String,
    routeDetail: String,
    days: { type: Number, default: 0 },
    nights: { type: Number, default: 0 },
    visitDetail: String,
    guideDetail: String,
    pricePerPerson: { type: Number, default: 0, min: 0 },
    maxTravellers: { type: Number, default: 10, min: 1 },
    startDate: Date,
    endDate: Date,
    shortDescription: String,
    description: String,
    paymentInstructions: String,
    /* ---- where the money actually goes ----
       These are the temple's own receiving details, shown to the
       devotee on the payment step so they can pay by UPI or by
       bank transfer before uploading proof. */
    paymentQrImage: String,
    upiId: String,
    bankAccountName: String,
    bankAccountNumber: String,
    bankIfsc: String,
    bankName: String,
    bankBranch: String,
    /* who to call if a payment does not go through */
    paymentContactName: String,
    paymentContactNumber: String,

    /* ---- trip detail ---- */
    destination: String,
    tripType: { type: String, default: "Spiritual Pilgrimage", index: true },
    durationLabel: String,
    ageGroup: String,
    accommodation: String,
    transport: String,
    departurePoint: String,
    meetingPoint: String,

    /* ---- booking window & pricing ---- */
    bookingOpenDate: Date,
    bookingCloseDate: Date,
    discountPrice: { type: Number, min: 0 },
    bookingEnabled: { type: Boolean, default: true },

    /* ---- rich content ---- */
    gallery: [
      {
        _id: false,
        imageUrl: { type: String, required: true },
        altText: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],
    itinerary: [
      {
        _id: false,
        dayNumber: { type: Number, required: true },
        title: String,
        description: String,
        morning: String,
        afternoon: String,
        evening: String,
        imageUrl: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],
    inclusions: [{ _id: false, title: String, sortOrder: { type: Number, default: 0 } }],
    exclusions: [{ _id: false, title: String, sortOrder: { type: Number, default: 0 } }],
    whoFor: [String],
    importantInfo: String,
    faqs: [
      {
        _id: false,
        question: { type: String, required: true },
        answer: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],

    /* ---- trip guide PDF ---- */
    pdfUrl: String,
    pdfName: String,
    pdfSize: Number,
    pdfUploadedAt: Date,

    featured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },
    showOnHomepage: { type: Boolean, default: false, index: true },
    /* activeStatus (active/inactive) stays for the existing CMS toggle;
       tripStatus carries the richer publishing lifecycle. */
    status: activeStatus,
    tripStatus: {
      type: String,
      enum: ["draft", "published", "unpublished", "completed", "cancelled"],
      default: "draft",
      index: true
    },
    sortOrder: { type: Number, default: 0 },
    ...seo
  },
  { timestamps: true }
);
pilgrimageSchema.index({ tripStatus: 1, startDate: 1 });

/* ============================================================
   Upcoming Journey / Featured Pilgrimage Model
   ============================================================ */

const journeyInformationBlockSchema = new Schema(
  {
    icon: { type: String, default: "calendar" },
    label: { type: String, required: true },
    value: { type: String, required: true },
    sortOrder: { type: Number, default: 0 }
  },
  { _id: true }
);

const journeySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    subtitle: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },

    badgeText: { type: String, default: "FEATURED PILGRIMAGE" },
    badgeEnabled: { type: Boolean, default: true },

    startingLocation: { type: String, default: "ISKCON Juhu" },
    destination: { type: String, default: "Vrindavana" },
    returnLocation: { type: String, default: "ISKCON Juhu" },
    routeText: { type: String, default: "ISKCON Juhu → Vrindavana → ISKCON Juhu" },
    intermediateLocations: [String],

    days: { type: Number, default: 5 },
    nights: { type: Number, default: 4 },
    startDate: Date,
    endDate: Date,
    dateText: String,

    mainImage: { type: String, default: "/assets/pilgrimage-hero.webp" },
    floatingImage1: { type: String, default: "/assets/pilgrimage-kashi-postcard-01.webp" },
    floatingImage2: { type: String, default: "/assets/pilgrimage-kashi-postcard-02.webp" },
    gallery: [
      {
        _id: false,
        imageUrl: { type: String, required: true },
        altText: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],

    informationBlocks: [journeyInformationBlockSchema],

    basePrice: { type: Number, default: 18500, min: 0 },
    priceType: {
      type: String,
      enum: ["per_person", "per_couple", "per_room", "fixed"],
      default: "per_person"
    },
    currency: { type: String, default: "₹" },
    discountPrice: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    taxes: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    addOns: [
      {
        title: String,
        price: Number,
        description: String
      }
    ],

    maxTravellers: { type: Number, default: 20, min: 1 },
    seatsLeft: { type: Number, default: 20 },
    bookingEnabled: { type: Boolean, default: true },
    bookingOpenDate: Date,
    bookingCloseDate: Date,

    ctaText: { type: String, default: "Book Now" },
    ctaLink: String,

    templeVisits: String,
    guideInfo: String,
    itinerary: [
      {
        _id: false,
        dayNumber: { type: Number, required: true },
        title: String,
        description: String,
        morning: String,
        afternoon: String,
        evening: String,
        imageUrl: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],
    inclusions: [String],
    exclusions: [String],
    whoFor: [String],
    importantInfo: String,
    faqs: [
      {
        _id: false,
        question: { type: String, required: true },
        answer: String,
        sortOrder: { type: Number, default: 0 }
      }
    ],

    paymentInstructions: String,
    upiId: String,
    paymentQrImage: String,
    bankAccountName: String,
    bankAccountNumber: String,
    bankIfsc: String,
    bankName: String,
    bankBranch: String,
    paymentContactName: String,
    paymentContactNumber: String,

    sortOrder: { type: Number, default: 0 },
    ...seo
  },
  { timestamps: true }
);
journeySchema.index({ status: 1, isFeatured: 1, sortOrder: 1 });

const bookingTaxSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    /* percent => value is a %, flat => value is a rupee amount */
    type: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, default: 0, min: 0 },
    /* a flat charge can be per booking or per traveller */
    appliesTo: { type: String, enum: ["booking", "person"], default: "booking" },
    note: String,
    status: activeStatus,
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const pilgrimageBookingSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    pilgrimage: { type: ObjectId, ref: "Pilgrimage", required: true, index: true },
    bookingRef: { type: String, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    travellers: [
      {
        _id: false,
        name: { type: String, required: true },
        age: { type: Number, min: 0, max: 120 },
        gender: { type: String, enum: ["male", "female", "other", ""], default: "" }
      }
    ],
    travellerCount: { type: Number, required: true, min: 1 },
    message: String,
    /* price snapshot — never recomputed after submission */
    pricePerPerson: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxBreakdown: [
      {
        _id: false,
        label: String,
        type: { type: String, enum: ["percent", "flat"] },
        value: Number,
        appliesTo: String,
        amount: Number
      }
    ],
    taxTotal: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentPhotoUrl: String,
    /* `status` is the booking lifecycle the admin queue already drives.
       "payment_submitted" is what a receipt upload produces; "pending"
       is kept so bookings made before this existed still read correctly. */
    status: {
      type: String,
      enum: ["pending", "payment_submitted", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "proof_submitted", "verified", "failed"],
      default: "unpaid",
      index: true
    },
    rejectionReason: String,
    reviewedBy: { type: ObjectId, ref: "User" },
    reviewedAt: Date,
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
pilgrimageBookingSchema.index({ user: 1, submittedAt: -1 });

/* Granted by the server when an admin approves a booking — this is what
   unlocks the trip area in the devotee's dashboard. Mirrors how
   Enrollment works for courses. */
const tripAccessSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    pilgrimage: { type: ObjectId, ref: "Pilgrimage", required: true, index: true },
    booking: { type: ObjectId, ref: "PilgrimageBooking", required: true },
    status: { type: String, enum: ["active", "revoked", "completed"], default: "active", index: true },
    grantedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
tripAccessSchema.index({ user: 1, pilgrimage: 1 }, { unique: true });

/* ============================================================
   Staff accountability
   ------------------------------------------------------------
   ActivityLog records every write a staff member makes, keeping
   a snapshot of the document before and after. A delete keeps the
   whole document in `before`, which is what makes restore possible.

   LoginSession records where someone signed in from, so an admin
   can see the device and IP behind any change.
   ============================================================ */

const activityLogSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", index: true },
    userName: String,
    userRole: String,
    action: { type: String, enum: ["create", "update", "delete", "restore", "login", "logout"], required: true, index: true },
    /* "admin" = made inside the panel, "public" = made by a visitor
       on the website (a booking, a registration, a subscribe). */
    source: { type: String, enum: ["admin", "public"], default: "admin", index: true },
    section: { type: String, index: true },
    resource: String,
    resourceId: { type: String, index: true },
    label: String,
    /* full document before the change — a delete stores everything,
       which is what `restore` reads back */
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    changedFields: [String],
    restored: { type: Boolean, default: false, index: true },
    restoredAt: Date,
    restoredBy: { type: ObjectId, ref: "User" },
    ip: String,
    userAgent: String,
    device: String,
    browser: String,
    os: String,
    method: String,
    path: String
  },
  { timestamps: true }
);
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

const loginSessionSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    userName: String,
    userRole: String,
    ip: String,
    userAgent: String,
    device: String,
    browser: String,
    os: String,
    loginAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    endedAt: Date,
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);
/* ============================================================
   Sacred Books module
   ------------------------------------------------------------
   Books are sacred publications available for Buy (with delivery)
   and Distribute (sponsored distribution seva).
   ============================================================ */

const bookSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    shortDescription: { type: String, trim: true, maxlength: 220 },
    fullDescription: { type: String, default: "" },
    authorOrTranslator: { type: String, trim: true },
    language: { type: String, default: "English", trim: true },
    pages: { type: Number, min: 0 },
    binding: { type: String, trim: true },
    publisher: { type: String, trim: true },
    coverImage: { type: String, default: "" },
    galleryImages: [{ type: String }],
    highlights: [{ type: String }],
    pricePerBook: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    distributionPricePerBook: { type: Number, min: 0, default: null },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    allowBuy: { type: Boolean, default: true },
    allowDistribute: { type: Boolean, default: true },
    minBuyQty: { type: Number, default: 1, min: 1 },
    maxBuyQty: { type: Number, default: 100, min: 1 },
    minDistributeQty: { type: Number, default: 1, min: 1 },
    maxDistributeQty: { type: Number, default: 100000, min: 1 },
    distributionPresets: {
      type: [Number],
      default: [10, 50, 100, 250, 500, 600, 700, 1000]
    },
    trackStock: { type: Boolean, default: false },
    stockQuantity: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0, index: true }
  },
  { timestamps: true }
);
bookSchema.index({ isActive: 1, displayOrder: 1 });

const bookOrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: ObjectId, ref: "User", required: true, index: true },
    book: { type: ObjectId, ref: "Book", required: true, index: true },
    orderType: { type: String, enum: ["BUY", "DISTRIBUTE"], required: true, index: true },
    bookTitleSnapshot: { type: String, required: true },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    gstPercentSnapshot: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PAYMENT_SUBMITTED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"],
      default: "PENDING_PAYMENT",
      index: true
    },
    payerName: { type: String, trim: true },
    transactionReference: { type: String, trim: true },
    paymentPhotoUrl: { type: String, default: "" },
    paymentSubmittedAt: Date,
    verifiedBy: { type: ObjectId, ref: "User" },
    verifiedAt: Date,
    rejectionReason: String,
    adminNotes: String,
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    deliveryAddress: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      landmark: { type: String, default: "" }
    },
    dedicationName: { type: String, trim: true },
    dedicationMessage: { type: String, trim: true, maxlength: 300 },
    trackingInfo: { type: String, trim: true }
  },
  { timestamps: true }
);
bookOrderSchema.index({ user: 1, createdAt: -1 });
bookOrderSchema.index({ status: 1, createdAt: -1 });

const bookPaymentSettingSchema = new Schema(
  {
    singletonKey: { type: String, default: "default_book_settings", unique: true },
    upiId: { type: String, default: "", trim: true },
    upiPayeeName: { type: String, default: "ISKCON Juhu", trim: true },
    qrCodeImage: { type: String, default: "" },
    bankAccountHolder: { type: String, default: "", trim: true },
    bankAccountNumber: { type: String, default: "", trim: true },
    bankIfsc: { type: String, default: "", trim: true },
    bankName: { type: String, default: "", trim: true },
    bankBranch: { type: String, default: "", trim: true },
    extraInstructions: { type: String, default: "" },
    defaultGstPercent: { type: Number, default: 0, min: 0, max: 100 },
    shippingFeeEnabled: { type: Boolean, default: false },
    shippingFeeAmount: { type: Number, default: 0, min: 0 },
    contactPhone: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true },
    useTripPaymentDetails: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const bookAuditLogSchema = new Schema(
  {
    entityType: { type: String, enum: ["BOOK", "ORDER", "SETTINGS"], required: true, index: true },
    entityId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    performedBy: { type: ObjectId, ref: "User" },
    performerName: String,
    performerRole: String,
    note: String
  },
  { timestamps: true }
);
bookAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const Book = make("Book", bookSchema);
export const BookOrder = make("BookOrder", bookOrderSchema);
export const BookPaymentSetting = make("BookPaymentSetting", bookPaymentSettingSchema);
export const BookAuditLog = make("BookAuditLog", bookAuditLogSchema);

export const Blog = make("Blog", blogSchema);
export const VideoBlog = make("VideoBlog", videoBlogSchema);
export const ImageGallery = make("ImageGallery", imageGallerySchema);
export const VideoGallery = make("VideoGallery", videoGallerySchema);
export const Subscriber = make("Subscriber", subscriberSchema);
export const ContactMessage = make("ContactMessage", contactMessageSchema);
export const ContactSetting = make("ContactSetting", contactSettingSchema);
export const FooterSetting = make("FooterSetting", footerSettingSchema);
export const SiteSetting = make("SiteSetting", siteSettingSchema);
export const LegalPage = make("LegalPage", legalPageSchema);
export const TrafficLog = make("TrafficLog", trafficLogSchema);
export const Benefit = make("Benefit", benefitSchema);
export const Testimonial = make("Testimonial", testimonialSchema);
export const Pilgrimage = make("Pilgrimage", pilgrimageSchema);
export const Journey = make("Journey", journeySchema);
export const BookingTax = make("BookingTax", bookingTaxSchema);
export const PilgrimageBooking = make("PilgrimageBooking", pilgrimageBookingSchema);
export const TripAccess = make("TripAccess", tripAccessSchema);
export const ActivityLog = make("ActivityLog", activityLogSchema);
export const LoginSession = make("LoginSession", loginSessionSchema);
export const Page = make("Page", pageSchema);
export const UserActivity = make("UserActivity", userActivitySchema);
export const StudentAnalytics = make("StudentAnalytics", studentAnalyticsSchema);
export const TeacherAnalytics = make("TeacherAnalytics", teacherAnalyticsSchema);
export const TeacherAssignmentHistory = make("TeacherAssignmentHistory", teacherAssignmentHistorySchema);
export const TeacherPerformance = make("TeacherPerformance", teacherPerformanceSchema);
export const CourseProgress = make("CourseProgress", courseProgressSchema);
export const TeacherRating = make("TeacherRating", teacherRatingSchema);
export const Question = make("Question", questionSchema);
export const QuizAttempt = make("QuizAttempt", quizAttemptSchema);
export const WatchLog = make("WatchLog", watchLogSchema);
export const ExamQuestionBank = make("ExamQuestionBank", examQuestionBankSchema);
export const ExamQuestion = make("ExamQuestion", examQuestionSchema);
export const ExamPaper = make("ExamPaper", examPaperSchema);
export const ExamAssignment = make("ExamAssignment", examAssignmentSchema);
export const ExamAttempt = make("ExamAttempt", examAttemptSchema);
export const ExamResponse = make("ExamResponse", examResponseSchema);

export const modelRegistry = {
  users: User,
  banners: HeroBanner,
  courses: Course,
  lessons: Lesson,
  enrollments: Enrollment,
  progress: Progress,
  notes: Note,
  comments: Comment,
  "chat-rooms": ChatRoom,
  "chat-messages": ChatMessage,
  notifications: Notification,
  "password-reset-requests": PasswordResetRequest,
  "file-uploads": FileUpload,
  "upcoming-classes": UpcomingClass,
  "home-sections": PageSection,
  "page-sections": PageSection,
  "about-sections": AboutPageSection,
  "course-requests": CourseEnrollmentRequest,
  pages: Page,
  preachers: Preacher,
  blogs: Blog,
  "video-blogs": VideoBlog,
  "gallery-images": ImageGallery,
  "gallery-videos": VideoGallery,
  subscribers: Subscriber,
  "contact-messages": ContactMessage,
  "contact-settings": ContactSetting,
  "legal-pages": LegalPage,
  benefits: Benefit,
  testimonials: Testimonial,
  pilgrimages: Pilgrimage,
  journeys: Journey,
  "booking-taxes": BookingTax,
  "pilgrimage-bookings": PilgrimageBooking,
  "trip-access": TripAccess,
  "activity-logs": ActivityLog,
  "login-sessions": LoginSession,
  "user-activities": UserActivity,
  "student-analytics": StudentAnalytics,
  "teacher-analytics": TeacherAnalytics,
  "teacher-assignment-histories": TeacherAssignmentHistory,
  "teacher-performances": TeacherPerformance,
  "course-progress": CourseProgress,
  "teacher-ratings": TeacherRating,
  questions: Question,
  "quiz-attempts": QuizAttempt,
  "watch-logs": WatchLog,
  "exam-question-banks": ExamQuestionBank,
  "exam-questions": ExamQuestion,
  "exam-papers": ExamPaper,
  "exam-assignments": ExamAssignment,
  "exam-attempts": ExamAttempt,
  "exam-responses": ExamResponse,
  books: Book,
  "book-orders": BookOrder,
  "book-payment-settings": BookPaymentSetting,
  "book-audit-logs": BookAuditLog
};
