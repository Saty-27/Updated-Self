import mongoose from "mongoose";
import {
  ATTENDANCE_STATUSES, INTEREST_STATUSES, OutreachAssignment, OutreachAttendanceEntry,
  OutreachAttendanceSheet, OutreachContact, OutreachCounter, OutreachFollowUp, OutreachInvitation,
  OutreachProgram, OutreachSession, OutreachSettings
} from "./outreachModels.js";
import { User } from "./models.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const id = (value) => String(value?._id || value || "");
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const phone = (value) => clean(value, 40);
const isStaff = (user) => ["main_admin", "admin", "manager", "editor", "viewer", "outreach_coordinator", "attendance_operator"].includes(user?.role);
const isFullAdmin = (user) => ["main_admin", "admin"].includes(user?.role);
const canViewAll = (user, canAccessSection) => user?.role !== "attendance_operator" && (isFullAdmin(user) || user?.role === "outreach_coordinator" || (isStaff(user) && canAccessSection(user, "outreach", "view")));
const canMutate = (user, canAccessSection, action = "edit") => user?.role !== "attendance_operator" && (isFullAdmin(user) || user?.role === "outreach_coordinator" || (isStaff(user) && canAccessSection(user, "outreach", action)));
const canOperateAttendance = (user, canAccessSection, action = "edit") =>
  isFullAdmin(user) || ["outreach_coordinator", "attendance_operator"].includes(user?.role) ||
  (isStaff(user) && canAccessSection(user, "outreach", action));
const validId = (value) => mongoose.isValidObjectId(value);

export const analyzeRemark = (remark = "") => {
  const text = String(remark).toLowerCase();
  const positive = ["interested", "will attend", "want to attend", "yes", "confirmed", "send details", "join", "आऊंगा", "आएंगे", "इच्छुक", "हाँ"];
  const negative = ["not interested", "do not call", "don't call", "stop calling", "remove my number", "no interest", "नहीं आना", "फोन मत", "इच्छुक नहीं"];
  const negativeHits = negative.filter((term) => text.includes(term)).length;
  const positiveHits = positive.filter((term) => text.includes(term)).length;
  if (negativeHits) return { sentiment: "not_interested", interestStatus: "not_interested", confidence: Math.min(0.98, 0.7 + negativeHits * 0.1) };
  if (positiveHits) return { sentiment: "interested", interestStatus: "interested", confidence: Math.min(0.95, 0.65 + positiveHits * 0.1) };
  return { sentiment: "unclear", interestStatus: "follow_up_required", confidence: 0.5 };
};

export const participationLabel = ({ attended = 0, recent = 0, firstAttendance, lastAttendance, now = new Date(), settings }) => {
  if (!attended) return "never_attended";
  const inactiveMs = settings.inactiveAfterDays * 86400000;
  if (lastAttendance && now - new Date(lastAttendance) > inactiveMs) return "inactive";
  if (attended === 1) return "first_time";
  if (recent >= settings.regularMinimumAttendances) return "regular";
  return "returning";
};

const accessFilter = (req, canAccessSection) => canViewAll(req.user, canAccessSection)
  ? {}
  : { currentVolunteer: req.user._id };

const requireContactAccess = async (req, canAccessSection, contactId) => {
  const contact = await OutreachContact.findById(contactId);
  if (!contact) return null;
  if (canViewAll(req.user, canAccessSection) || id(contact.currentVolunteer) === id(req.user)) return contact;
  const error = new Error("You may only access contacts assigned to you.");
  error.statusCode = 403;
  throw error;
};

export const attachOutreachRoutes = (app, { protect, canAccessSection, recordActivity }) => {
  const coordinator = (action = "view") => (req, res, next) => {
    if (!canMutate(req.user, canAccessSection, action) && !(action === "view" && canViewAll(req.user, canAccessSection))) {
      return res.status(403).json({ success: false, message: "Outreach coordinator permission required." });
    }
    next();
  };
  const attendanceOperator = (action = "view") => (req, res, next) => {
    if (!canOperateAttendance(req.user, canAccessSection, action)) {
      return res.status(403).json({ success: false, message: "Attendance operator permission required." });
    }
    next();
  };

  app.get("/api/outreach/meta", protect, wrap(async (req, res) => {
    const query = canViewAll(req.user, canAccessSection)
      ? { status: "active", role: { $in: ["main_admin", "admin", "manager", "editor", "viewer", "teacher", "devotee"] } }
      : { _id: req.user._id };
    const [volunteers, programs, sessions, settings] = await Promise.all([
      User.find(query).select("name email phone role").sort({ name: 1 }).lean(),
      OutreachProgram.find({ active: true }).sort({ name: 1 }).lean(),
      OutreachSession.find().populate("program", "name").sort({ startsAt: -1 }).limit(100).lean(),
      OutreachSettings.findOneAndUpdate({ singletonKey: "outreach" }, { $setOnInsert: { singletonKey: "outreach" } }, { upsert: true, new: true }).lean()
    ]);
    res.json({ success: true, volunteers, programs, sessions, settings, interestStatuses: INTEREST_STATUSES, attendanceStatuses: ATTENDANCE_STATUSES, scope: req.user?.role === "attendance_operator" ? "attendance" : canViewAll(req.user, canAccessSection) ? "team" : "assigned" });
  }));

  app.get("/api/outreach/contacts/duplicates", protect, coordinator("create"), wrap(async (req, res) => {
    const name = clean(req.query.name, 120);
    const primaryPhone = phone(req.query.phone);
    const terms = [];
    if (primaryPhone) terms.push({ $or: [{ primaryPhone }, { alternatePhone: primaryPhone }] });
    if (name) terms.push({ fullName: { $regex: name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } });
    const items = terms.length ? await OutreachContact.find({ $or: terms }).select("fullName primaryPhone alternatePhone registrationDate registrationSource").limit(10).lean() : [];
    res.json({ success: true, items, warning: items.length ? "Possible duplicates found. Review them before creating a new contact; records are never merged automatically." : "" });
  }));

  app.post("/api/outreach/contacts", protect, coordinator("create"), wrap(async (req, res) => {
    const fullName = clean(req.body.fullName, 160);
    const primaryPhone = phone(req.body.primaryPhone);
    const email = clean(req.body.email, 200).toLowerCase();
    const occupation = clean(req.body.occupation, 200);
    const registrationSource = clean(req.body.registrationSource, 200);
    if (!fullName || !primaryPhone || !email || !occupation || !registrationSource || !req.body.registrationDate) return res.status(400).json({ success: false, message: "Full name, primary contact, email, occupation, registration date and source are required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Enter a valid email address." });
    if (req.body.ageGroup === "minor" && !req.body.guardianConsentConfirmed) return res.status(400).json({ success: false, message: "Approved guardian consent must be confirmed before registering a minor for follow-up." });
    const possibleDuplicates = await OutreachContact.find({ $or: [{ primaryPhone }, { alternatePhone: primaryPhone }] }).select("fullName primaryPhone registrationDate").limit(10).lean();
    const counter = await OutreachCounter.findOneAndUpdate({ key: "contact_sequence" }, { $inc: { value: 1 } }, { upsert: true, new: true });
    const item = await OutreachContact.create({
      ...req.body, fullName, primaryPhone, email, occupation, registrationSource,
      sequenceNumber: counter.value,
      alternatePhone: phone(req.body.alternatePhone), registeredBy: req.user._id,
      permissionToContact: Boolean(req.body.permissionToContact),
      followUpStatus: req.body.permissionToContact ? "unassigned" : "opted_out",
      interestStatus: "follow_up_required", linkedAccount: null
    });
    await recordActivity(req, { action: "create", section: "outreach", resource: "outreach-contacts", resourceId: id(item), label: item.fullName, after: item.toObject() });
    res.status(201).json({ success: true, item, possibleDuplicates, message: possibleDuplicates.length ? "Contact saved. Possible duplicates were retained for human review." : "Contact registered successfully." });
  }));

  app.get("/api/outreach/contacts", protect, wrap(async (req, res) => {
    const filter = { ...accessFilter(req, canAccessSection), archivedAt: null };
    if (req.query.interestStatus && INTEREST_STATUSES.includes(req.query.interestStatus)) filter.interestStatus = req.query.interestStatus;
    if (req.query.volunteer && canViewAll(req.user, canAccessSection) && validId(req.query.volunteer)) filter.currentVolunteer = req.query.volunteer;
    if (req.query.followUpStatus) filter.followUpStatus = req.query.followUpStatus;
    if (req.query.listStatus && ["current", "non_follow_up"].includes(req.query.listStatus)) filter.followUpListStatus = req.query.listStatus;
    if (req.query.locality) filter.locality = req.query.locality;
    if (req.query.search) {
      const term = clean(req.query.search, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ fullName: { $regex: term, $options: "i" } }, { primaryPhone: { $regex: term, $options: "i" } }];
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const [items, total] = await Promise.all([
      OutreachContact.find(filter).populate("currentVolunteer", "name email").sort({ nextFollowUpDate: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      OutreachContact.countDocuments(filter)
    ]);
    res.json({ success: true, items: items.map((x) => ({ ...x, primaryPhone: canViewAll(req.user, canAccessSection) || id(x.currentVolunteer) === id(req.user) ? x.primaryPhone : undefined })), total, page, pages: Math.ceil(total / limit) });
  }));

  app.get("/api/outreach/follow-up-register", protect, wrap(async (req, res) => {
    const from = req.query.from ? new Date(`${req.query.from}T00:00:00`) : new Date(Date.now() - 6 * 86400000);
    const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : new Date();
    const filter = { ...accessFilter(req, canAccessSection), archivedAt: null };
    if (["current", "non_follow_up"].includes(req.query.listStatus)) filter.followUpListStatus = req.query.listStatus;
    const contacts = await OutreachContact.find(filter).populate("currentVolunteer", "name").sort({ sequenceNumber: 1, createdAt: 1 }).lean();
    const followUps = await OutreachFollowUp.find({ contact: { $in: contacts.map((x) => x._id) }, interactedAt: { $gte: from, $lte: to } }).populate("recordedBy", "name").sort({ interactedAt: 1 }).lean();
    res.json({ success: true, from, to, contacts: contacts.map((contact, index) => ({ ...contact, listNumber: index + 1 })), followUps });
  }));

  app.post("/api/outreach/assign-range", protect, coordinator("edit"), wrap(async (req, res) => {
    const from = Number(req.body.from);
    const to = Number(req.body.to);
    const listStatus = ["current", "non_follow_up"].includes(req.body.listStatus) ? req.body.listStatus : "current";
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || !validId(req.body.volunteer)) return res.status(400).json({ success: false, message: "Valid from/to serial numbers and volunteer are required." });
    const [volunteer, contacts] = await Promise.all([User.findById(req.body.volunteer), OutreachContact.find({ followUpListStatus: listStatus, archivedAt: null }).sort({ sequenceNumber: 1, createdAt: 1 }).skip(from - 1).limit(to - from + 1)]);
    if (!volunteer) return res.status(404).json({ success: false, message: "Volunteer not found." });
    for (const contact of contacts) {
      await OutreachAssignment.updateMany({ contact: contact._id, status: "active" }, { $set: { status: "reassigned", endedAt: new Date(), endedBy: req.user._id } });
      await OutreachAssignment.create({ contact: contact._id, volunteer: volunteer._id, assignedBy: req.user._id, note: `Bulk ${listStatus} list assignment ${from}-${to}` });
      contact.currentVolunteer = volunteer._id;
      contact.followUpStatus = contact.permissionToContact ? "awaiting_first_contact" : "opted_out";
      await contact.save();
    }
    await recordActivity(req, { action: "update", section: "outreach", resource: "outreach-range-assignment", resourceId: `${from}-${to}`, label: `#${from}-#${to} to ${volunteer.name}`, after: { from, to, volunteer: volunteer._id, count: contacts.length } });
    res.json({ success: true, count: contacts.length, message: `${contacts.length} contact(s) assigned to ${volunteer.name}.` });
  }));

  app.get("/api/outreach/contacts/:contactId", protect, wrap(async (req, res) => {
    const item = await requireContactAccess(req, canAccessSection, req.params.contactId);
    if (!item) return res.status(404).json({ success: false, message: "Contact not found." });
    const [assignments, followUps, invitations, attendance] = await Promise.all([
      OutreachAssignment.find({ contact: item._id }).populate("volunteer assignedBy", "name").sort({ assignedAt: -1 }).lean(),
      OutreachFollowUp.find({ contact: item._id }).populate("volunteer recordedBy", "name").sort({ interactedAt: -1 }).lean(),
      OutreachInvitation.find({ contact: item._id }).populate({ path: "session", populate: { path: "program", select: "name" } }).sort({ invitedAt: -1 }).lean(),
      OutreachAttendanceEntry.find({ contact: item._id, status: { $ne: "unmarked" } }).populate({ path: "sheet", populate: { path: "session", populate: { path: "program", select: "name" } } }).sort({ updatedAt: -1 }).lean()
    ]);
    res.json({ success: true, item, history: { assignments, followUps, invitations, attendance } });
  }));

  app.patch("/api/outreach/contacts/:contactId", protect, coordinator("edit"), wrap(async (req, res) => {
    const before = await OutreachContact.findById(req.params.contactId).lean();
    if (!before) return res.status(404).json({ success: false, message: "Contact not found." });
    const allowed = ["fullName", "primaryPhone", "alternatePhone", "email", "occupation", "locality", "ageGroup", "guardianConsentConfirmed", "preferredLanguage", "educationOrProfession", "introducedThrough", "preferredContactMethod", "suitableContactTime", "permissionToContact", "introductoryRemarks"];
    const patch = Object.fromEntries(allowed.filter((key) => key in req.body).map((key) => [key, req.body[key]]));
    if (patch.permissionToContact === false) Object.assign(patch, { followUpStatus: "opted_out", nextFollowUpDate: null, interestStatus: "not_interested", interestStatusChangedAt: new Date() });
    const item = await OutreachContact.findByIdAndUpdate(req.params.contactId, { $set: patch }, { new: true, runValidators: true });
    await recordActivity(req, { action: "update", section: "outreach", resource: "outreach-contacts", resourceId: id(item), label: item.fullName, before, after: item.toObject(), changedFields: Object.keys(patch) });
    res.json({ success: true, item });
  }));

  app.post("/api/outreach/contacts/:contactId/assign", protect, coordinator("edit"), wrap(async (req, res) => {
    if (!validId(req.body.volunteer)) return res.status(400).json({ success: false, message: "A valid volunteer is required." });
    const [contact, volunteer] = await Promise.all([OutreachContact.findById(req.params.contactId), User.findById(req.body.volunteer)]);
    if (!contact || !volunteer) return res.status(404).json({ success: false, message: "Contact or volunteer not found." });
    await OutreachAssignment.updateMany({ contact: contact._id, status: "active" }, { $set: { status: "reassigned", endedAt: new Date(), endedBy: req.user._id } });
    const assignment = await OutreachAssignment.create({ contact: contact._id, volunteer: volunteer._id, assignedBy: req.user._id, note: clean(req.body.note, 1000) });
    contact.currentVolunteer = volunteer._id;
    contact.followUpStatus = contact.permissionToContact ? "awaiting_first_contact" : "opted_out";
    await contact.save();
    await recordActivity(req, { action: "update", section: "outreach", resource: "outreach-assignments", resourceId: id(assignment), label: contact.fullName, after: assignment.toObject(), changedFields: ["currentVolunteer"] });
    res.status(201).json({ success: true, assignment, message: `Assigned to ${volunteer.name}.` });
  }));

  app.post("/api/outreach/contacts/:contactId/follow-ups", protect, wrap(async (req, res) => {
    const contact = await requireContactAccess(req, canAccessSection, req.params.contactId);
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found." });
    if (!contact.permissionToContact && req.body.interestStatus !== "not_interested") return res.status(409).json({ success: false, message: "This contact has opted out. Routine outreach cannot be recorded unless the person re-initiated contact and a coordinator updates consent." });
    if (!clean(req.body.remarks)) return res.status(400).json({ success: false, message: "The devotee's actual remark is required." });
    const analysis = analyzeRemark(req.body.remarks);
    const outcome = analysis.sentiment === "interested" ? "Interested" : analysis.sentiment === "not_interested" ? "Not interested" : "Interest not yet confirmed";
    const strikeApplied = analysis.sentiment === "unclear";
    const item = await OutreachFollowUp.create({ ...req.body, interestStatus: analysis.interestStatus, contact: contact._id, volunteer: contact.currentVolunteer || req.user._id, recordedBy: req.user._id, sentiment: analysis.sentiment, analysisSource: "automatic", analysisConfidence: analysis.confidence, strikeApplied, remarks: clean(req.body.remarks), outcome });
    contact.interestStatus = analysis.interestStatus;
    contact.interestStatusChangedAt = item.interactedAt;
    contact.lastContactDate = item.interactedAt;
    if (analysis.sentiment === "interested") {
      contact.strikeCount = 0;
      contact.followUpListStatus = "current";
      contact.finalDecisionReason = "";
      contact.finalDecisionAt = null;
    } else if (analysis.sentiment === "not_interested") {
      contact.permissionToContact = false;
      contact.strikeCount = 0;
      contact.followUpListStatus = "non_follow_up";
      contact.finalDecisionReason = "explicit_opt_out";
      contact.finalDecisionAt = new Date();
    } else {
      contact.strikeCount = Math.min(3, (contact.strikeCount || 0) + 1);
      if (contact.strikeCount >= 3) {
        contact.followUpListStatus = "non_follow_up";
        contact.finalDecisionReason = "three_strikes";
        contact.finalDecisionAt = new Date();
      }
    }
    contact.nextFollowUpDate = analysis.sentiment === "not_interested" ? null : item.nextFollowUpDate;
    contact.followUpStatus = analysis.sentiment === "not_interested" ? "opted_out" : item.nextFollowUpDate ? "pending" : "completed";
    await contact.save();
    await recordActivity(req, { action: "create", section: "outreach", resource: "outreach-follow-ups", resourceId: id(item), label: contact.fullName, after: item.toObject() });
    res.status(201).json({ success: true, item, message: "Follow-up added to the chronological history." });
  }));

  app.post("/api/outreach/programs", protect, attendanceOperator("create"), wrap(async (req, res) => {
    if (!clean(req.body.name, 200)) return res.status(400).json({ success: false, message: "Program name is required." });
    const item = await OutreachProgram.create({ ...req.body, name: clean(req.body.name, 200), createdBy: req.user._id });
    await recordActivity(req, { action: "create", section: "outreach", resource: "outreach-programs", resourceId: id(item), label: item.name, after: item.toObject() });
    res.status(201).json({ success: true, item });
  }));

  app.post("/api/outreach/sessions", protect, attendanceOperator("create"), wrap(async (req, res) => {
    if (!validId(req.body.program) || !req.body.startsAt) return res.status(400).json({ success: false, message: "Program and session date/time are required." });
    const item = await OutreachSession.create({ ...req.body, createdBy: req.user._id });
    await recordActivity(req, { action: "create", section: "outreach", resource: "outreach-sessions", resourceId: id(item), label: req.body.title || "Program session", after: item.toObject() });
    res.status(201).json({ success: true, item });
  }));

  app.post("/api/outreach/invitations", protect, wrap(async (req, res) => {
    const contact = await requireContactAccess(req, canAccessSection, req.body.contact);
    if (!contact || !validId(req.body.session)) return res.status(400).json({ success: false, message: "Valid contact and session are required." });
    if (!contact.permissionToContact) return res.status(409).json({ success: false, message: "This contact has opted out of routine invitations." });
    const item = await OutreachInvitation.findOneAndUpdate({ contact: contact._id, session: req.body.session }, { $set: { invitedBy: req.user._id, confirmation: req.body.confirmation || "pending", confirmedAt: req.body.confirmation === "confirmed" ? new Date() : null } }, { upsert: true, new: true, runValidators: true });
    res.json({ success: true, item });
  }));

  app.post("/api/outreach/attendance-sheets", protect, attendanceOperator("create"), wrap(async (req, res) => {
    if (!validId(req.body.session)) return res.status(400).json({ success: false, message: "A session is required." });
    const sheet = await OutreachAttendanceSheet.findOneAndUpdate({ session: req.body.session }, { $setOnInsert: { createdBy: req.user._id, status: "draft" } }, { upsert: true, new: true });
    /* Attendance is a session roster, not an invitation list. Load every active
       registered contact so an operator can mark someone who arrived without
       a recorded invitation. Reopening the sheet also adds newer contacts. */
    const eligible = await OutreachContact.find({ archivedAt: null }).distinct("_id");
    if (eligible.length) await OutreachAttendanceEntry.bulkWrite(eligible.map((contact) => ({ updateOne: { filter: { sheet: sheet._id, contact }, update: { $setOnInsert: { status: "unmarked" } }, upsert: true } })));
    res.status(201).json({ success: true, sheet, message: "Attendance sheet is ready. Every registered contact is unmarked until explicitly recorded for this session." });
  }));

  app.get("/api/outreach/attendance-sheets/:sheetId", protect, attendanceOperator("view"), wrap(async (req, res) => {
    const sheet = await OutreachAttendanceSheet.findById(req.params.sheetId).populate({ path: "session", populate: { path: "program" } }).lean();
    if (!sheet) return res.status(404).json({ success: false, message: "Attendance sheet not found." });
    const entries = await OutreachAttendanceEntry.find({ sheet: sheet._id }).populate({ path: "contact", select: "fullName primaryPhone currentVolunteer", populate: { path: "currentVolunteer", select: "name" } }).sort({ "contact.fullName": 1 }).lean();
    res.json({ success: true, sheet, entries });
  }));

  app.put("/api/outreach/attendance-sheets/:sheetId/entries/:contactId", protect, attendanceOperator("edit"), wrap(async (req, res) => {
    if (!ATTENDANCE_STATUSES.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid attendance status." });
    const sheet = await OutreachAttendanceSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ success: false, message: "Attendance sheet not found." });
    const existing = await OutreachAttendanceEntry.findOne({ sheet: sheet._id, contact: req.params.contactId });
    if (sheet.status === "finalized" && !clean(req.body.correctionReason, 500)) return res.status(409).json({ success: false, message: "A correction reason is required for a finalized sheet." });
    const history = sheet.status === "finalized" && existing ? [{ from: existing.status, to: req.body.status, reason: clean(req.body.correctionReason, 500), correctedBy: req.user._id }] : [];
    const entry = await OutreachAttendanceEntry.findOneAndUpdate({ sheet: sheet._id, contact: req.params.contactId }, { $set: { status: req.body.status, markedAt: req.body.status === "unmarked" ? null : new Date(), markedBy: req.user._id }, ...(history.length ? { $push: { correctionHistory: history[0] } } : {}) }, { upsert: true, new: true, runValidators: true });
    res.json({ success: true, entry });
  }));

  app.post("/api/outreach/attendance-sheets/:sheetId/finalize", protect, attendanceOperator("edit"), wrap(async (req, res) => {
    const sheet = await OutreachAttendanceSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ success: false, message: "Attendance sheet not found." });
    const unmarked = await OutreachAttendanceEntry.countDocuments({ sheet: sheet._id, status: "unmarked" });
    if (unmarked && !req.body.confirmUnmarked) return res.status(409).json({ success: false, message: `${unmarked} participant(s) are still unmarked. Review them or explicitly confirm finalization with unmarked entries.` });
    sheet.status = "finalized"; sheet.finalizedAt = new Date(); sheet.finalizedBy = req.user._id; await sheet.save();
    await recordActivity(req, { action: "update", section: "outreach", resource: "outreach-attendance", resourceId: id(sheet), label: "Finalized attendance sheet", after: sheet.toObject(), changedFields: ["status", "finalizedAt"] });
    res.json({ success: true, sheet, message: "Attendance sheet finalized. Only recorded absences count in reports." });
  }));

  app.get("/api/outreach/dashboard", protect, wrap(async (req, res) => {
    const contactFilter = accessFilter(req, canAccessSection);
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
    const to = req.query.to ? new Date(req.query.to) : new Date(); to.setHours(23, 59, 59, 999);
    const range = { $gte: from, $lte: to };
    const contacts = await OutreachContact.find(contactFilter).select("interestStatus registrationDate currentVolunteer nextFollowUpDate lastContactDate followUpStatus").lean();
    const permittedIds = contacts.map((x) => x._id);
    const [followUps, invitations, finalizedSheets, settings] = await Promise.all([
      OutreachFollowUp.find({ contact: { $in: permittedIds }, interactedAt: range }).select("contact").lean(),
      OutreachInvitation.find({ contact: { $in: permittedIds }, invitedAt: range }).lean(),
      OutreachAttendanceSheet.find({ status: "finalized", finalizedAt: range }).select("_id").lean(),
      OutreachSettings.findOne({ singletonKey: "outreach" }).lean()
    ]);
    const sheetIds = finalizedSheets.map((x) => x._id);
    const entries = await OutreachAttendanceEntry.find({ sheet: { $in: sheetIds }, contact: { $in: permittedIds } }).lean();
    const allSheets = await OutreachAttendanceSheet.find({ status: "finalized" }).select("_id finalizedAt").lean();
    const allSheetDates = new Map(allSheets.map((x) => [id(x._id), x.finalizedAt]));
    const allPresent = await OutreachAttendanceEntry.find({ sheet: { $in: allSheets.map((x) => x._id) }, contact: { $in: permittedIds }, status: "present" }).select("sheet contact").lean();
    const now = new Date();
    const registrations = contacts.filter((x) => x.registrationDate >= from && x.registrationDate <= to);
    const count = (status) => contacts.filter((x) => x.interestStatus === status).length;
    const attendedContacts = new Set(entries.filter((x) => x.status === "present").map((x) => id(x.contact)));
    const effectiveSettings = settings || { regularMinimumAttendances: 3, regularWindowDays: 60, inactiveAfterDays: 90 };
    const attendanceByContact = new Map();
    for (const entry of allPresent) {
      const key = id(entry.contact);
      const dates = attendanceByContact.get(key) || [];
      dates.push(allSheetDates.get(id(entry.sheet)));
      attendanceByContact.set(key, dates.filter(Boolean));
    }
    const participation = { firstTime: 0, returning: 0, regular: 0, inactive: 0, neverAttended: 0 };
    for (const contact of contacts) {
      const dates = (attendanceByContact.get(id(contact._id)) || []).sort((a, b) => new Date(a) - new Date(b));
      const recentCutoff = new Date(now.getTime() - effectiveSettings.regularWindowDays * 86400000);
      const label = participationLabel({ attended: dates.length, recent: dates.filter((d) => new Date(d) >= recentCutoff).length, firstAttendance: dates[0], lastAttendance: dates.at(-1), now, settings: effectiveSettings });
      if (label === "first_time") participation.firstTime += 1;
      else if (label === "returning") participation.returning += 1;
      else if (label === "regular") participation.regular += 1;
      else if (label === "inactive") participation.inactive += 1;
      else participation.neverAttended += 1;
    }
    const returned = [...attendanceByContact.values()].filter((dates) => dates.length >= 2).length;
    const assigned = contacts.filter((x) => x.currentVolunteer).length;
    const contacted = new Set(followUps.map((x) => id(x.contact))).size;
    const interestedIds = new Set(contacts.filter((x) => x.interestStatus === "interested").map((x) => id(x._id)));
    const invitedIds = new Set(invitations.map((x) => id(x.contact)));
    const confirmedIds = new Set(invitations.filter((x) => x.confirmation === "confirmed").map((x) => id(x.contact)));
    const funnel = [
      ["Newly registered", registrations.length], ["Assigned", registrations.filter((x) => x.currentVolunteer).length],
      ["Successfully contacted", contacted], ["Interested", [...interestedIds].filter((x) => registrations.some((r) => id(r._id) === x)).length],
      ["Invited", invitedIds.size], ["Confirmed", confirmedIds.size], ["Actually attended", attendedContacts.size], ["Returned", returned]
    ].map(([label, value], index, all) => ({ label, value, conversion: index ? (all[index - 1][1] ? Math.round(value / all[index - 1][1] * 1000) / 10 : 0) : 100 }));
    res.json({ success: true, range: { from, to }, registration: { total: contacts.length, newInRange: registrations.length, assigned, unassigned: contacts.length - assigned }, interest: { interested: count("interested"), notInterested: count("not_interested"), followUpRequired: count("follow_up_required") }, followUp: { completedInRange: followUps.length, dueToday: contacts.filter((x) => x.nextFollowUpDate && new Date(x.nextFollowUpDate).toDateString() === now.toDateString()).length, overdue: contacts.filter((x) => x.nextFollowUpDate && new Date(x.nextFollowUpDate) < now).length }, attendance: { finalizedSheets: sheetIds.length, present: entries.filter((x) => x.status === "present").length, absent: entries.filter((x) => x.status === "absent").length, excused: entries.filter((x) => x.status === "excused").length, unmarked: entries.filter((x) => x.status === "unmarked").length }, participation, funnel, settings: effectiveSettings });
  }));

  app.put("/api/outreach/settings", protect, coordinator("edit"), wrap(async (req, res) => {
    const allowed = ["regularMinimumAttendances", "regularWindowDays", "inactiveAfterDays"];
    const patch = Object.fromEntries(allowed.filter((key) => Number(req.body[key]) > 0).map((key) => [key, Number(req.body[key])]));
    const item = await OutreachSettings.findOneAndUpdate({ singletonKey: "outreach" }, { $set: { ...patch, updatedBy: req.user._id } }, { upsert: true, new: true, runValidators: true });
    res.json({ success: true, item });
  }));
};
