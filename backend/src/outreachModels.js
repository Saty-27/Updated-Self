import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const make = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

export const INTEREST_STATUSES = ["interested", "not_interested", "follow_up_required"];
export const ATTENDANCE_STATUSES = ["present", "absent", "excused", "unmarked"];

const outreachContactSchema = new Schema({
  sequenceNumber: { type: Number, unique: true, sparse: true, index: true },
  fullName: { type: String, required: true, trim: true, index: true },
  primaryPhone: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  occupation: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },
  registrationDate: { type: Date, required: true, default: Date.now, index: true },
  registrationSource: { type: String, required: true, trim: true, index: true },
  registeredBy: { type: ObjectId, ref: "User" },
  locality: { type: String, trim: true, index: true },
  ageGroup: { type: String, enum: ["", "minor", "18-24", "25-34", "35-44", "45+"], default: "" },
  guardianConsentConfirmed: { type: Boolean, default: false },
  preferredLanguage: String,
  educationOrProfession: String,
  introducedThrough: String,
  preferredContactMethod: { type: String, enum: ["", "phone", "message", "email", "in_person"], default: "" },
  suitableContactTime: String,
  permissionToContact: { type: Boolean, default: false, index: true },
  introductoryRemarks: { type: String, maxlength: 2000 },
  interestStatus: { type: String, enum: INTEREST_STATUSES, default: "follow_up_required", index: true },
  interestStatusChangedAt: { type: Date, default: Date.now },
  currentVolunteer: { type: ObjectId, ref: "User", index: true },
  lastContactDate: Date,
  nextFollowUpDate: { type: Date, index: true },
  followUpStatus: { type: String, enum: ["unassigned", "awaiting_first_contact", "pending", "completed", "opted_out"], default: "unassigned", index: true },
  followUpListStatus: { type: String, enum: ["current", "non_follow_up"], default: "current", index: true },
  strikeCount: { type: Number, default: 0, min: 0, max: 3, index: true },
  finalDecisionReason: { type: String, enum: ["", "three_strikes", "explicit_opt_out", "coordinator_decision"], default: "" },
  finalDecisionAt: Date,
  archivedAt: Date,
  archivedBy: { type: ObjectId, ref: "User" },
  archiveReason: String,
  linkedAccount: { type: ObjectId, ref: "User", default: null }
}, { timestamps: true });
outreachContactSchema.index({ fullName: "text", primaryPhone: "text", alternatePhone: "text" });

const assignmentSchema = new Schema({
  contact: { type: ObjectId, ref: "OutreachContact", required: true, index: true },
  volunteer: { type: ObjectId, ref: "User", required: true, index: true },
  assignedBy: { type: ObjectId, ref: "User", required: true },
  assignedAt: { type: Date, default: Date.now, index: true },
  endedAt: Date,
  endedBy: { type: ObjectId, ref: "User" },
  status: { type: String, enum: ["active", "reassigned", "completed"], default: "active", index: true },
  note: { type: String, maxlength: 1000 }
}, { timestamps: true });

const followUpSchema = new Schema({
  contact: { type: ObjectId, ref: "OutreachContact", required: true, index: true },
  volunteer: { type: ObjectId, ref: "User", required: true },
  interactedAt: { type: Date, required: true, default: Date.now, index: true },
  channel: { type: String, enum: ["phone_call", "message", "in_person", "event_conversation", "other"], required: true },
  outcome: { type: String, required: true, trim: true },
  remarks: { type: String, required: true, maxlength: 4000 },
  interestStatus: { type: String, enum: INTEREST_STATUSES, required: true },
  /* Normalized value for reporting/sentiment analysis. The original
     devotee-written remark remains unchanged beside it. */
  sentiment: { type: String, enum: ["interested", "not_interested", "unclear"], required: true, index: true },
  analysisSource: { type: String, enum: ["automatic", "manual_override"], default: "automatic" },
  analysisConfidence: { type: Number, min: 0, max: 1, default: 0.5 },
  strikeApplied: { type: Boolean, default: false },
  invited: { type: Boolean, default: false },
  invitation: { type: ObjectId, ref: "OutreachInvitation" },
  confirmedAttendance: { type: Boolean, default: false },
  nextAction: String,
  nextFollowUpDate: Date,
  recordedBy: { type: ObjectId, ref: "User", required: true },
  correctedAt: Date,
  correctedBy: { type: ObjectId, ref: "User" },
  correctionReason: String
}, { timestamps: true });
followUpSchema.index({ contact: 1, interactedAt: -1 });

const programSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true },
  description: String,
  venue: String,
  active: { type: Boolean, default: true, index: true },
  createdBy: { type: ObjectId, ref: "User", required: true }
}, { timestamps: true });

const sessionSchema = new Schema({
  program: { type: ObjectId, ref: "OutreachProgram", required: true, index: true },
  title: String,
  startsAt: { type: Date, required: true, index: true },
  venue: String,
  seriesKey: { type: String, index: true },
  createdBy: { type: ObjectId, ref: "User", required: true }
}, { timestamps: true });

const invitationSchema = new Schema({
  contact: { type: ObjectId, ref: "OutreachContact", required: true, index: true },
  session: { type: ObjectId, ref: "OutreachSession", required: true, index: true },
  invitedBy: { type: ObjectId, ref: "User", required: true },
  invitedAt: { type: Date, default: Date.now },
  confirmation: { type: String, enum: ["pending", "confirmed", "declined"], default: "pending", index: true },
  confirmedAt: Date
}, { timestamps: true });
invitationSchema.index({ contact: 1, session: 1 }, { unique: true });

const attendanceSheetSchema = new Schema({
  session: { type: ObjectId, ref: "OutreachSession", required: true, unique: true },
  createdBy: { type: ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["draft", "finalized"], default: "draft", index: true },
  finalizedAt: Date,
  finalizedBy: { type: ObjectId, ref: "User" }
}, { timestamps: true });

const attendanceEntrySchema = new Schema({
  sheet: { type: ObjectId, ref: "OutreachAttendanceSheet", required: true, index: true },
  contact: { type: ObjectId, ref: "OutreachContact", required: true, index: true },
  status: { type: String, enum: ATTENDANCE_STATUSES, default: "unmarked", index: true },
  markedAt: Date,
  markedBy: { type: ObjectId, ref: "User" },
  correctionHistory: [{
    _id: false, from: String, to: String, reason: String,
    correctedAt: { type: Date, default: Date.now }, correctedBy: { type: ObjectId, ref: "User" }
  }]
}, { timestamps: true });
attendanceEntrySchema.index({ sheet: 1, contact: 1 }, { unique: true });

const outreachSettingsSchema = new Schema({
  singletonKey: { type: String, default: "outreach", unique: true },
  regularMinimumAttendances: { type: Number, default: 3, min: 1 },
  regularWindowDays: { type: Number, default: 60, min: 1 },
  inactiveAfterDays: { type: Number, default: 90, min: 1 },
  updatedBy: { type: ObjectId, ref: "User" }
}, { timestamps: true });

const outreachCounterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 }
});

export const OutreachContact = make("OutreachContact", outreachContactSchema);
export const OutreachAssignment = make("OutreachAssignment", assignmentSchema);
export const OutreachFollowUp = make("OutreachFollowUp", followUpSchema);
export const OutreachProgram = make("OutreachProgram", programSchema);
export const OutreachSession = make("OutreachSession", sessionSchema);
export const OutreachInvitation = make("OutreachInvitation", invitationSchema);
export const OutreachAttendanceSheet = make("OutreachAttendanceSheet", attendanceSheetSchema);
export const OutreachAttendanceEntry = make("OutreachAttendanceEntry", attendanceEntrySchema);
export const OutreachSettings = make("OutreachSettings", outreachSettingsSchema);
export const OutreachCounter = make("OutreachCounter", outreachCounterSchema);
