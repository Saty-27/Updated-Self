const text = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const date = (value) => value ? new Date(value) : undefined;

export const contactCreateInput = (body = {}) => ({
  fullName: text(body.fullName, 160),
  primaryPhone: text(body.primaryPhone, 40),
  alternatePhone: text(body.alternatePhone, 40),
  email: text(body.email, 200).toLowerCase(),
  occupation: text(body.occupation, 200),
  registrationDate: date(body.registrationDate),
  registrationSource: text(body.registrationSource, 200),
  locality: text(body.locality, 200),
  ageGroup: text(body.ageGroup, 20),
  guardianConsentConfirmed: Boolean(body.guardianConsentConfirmed),
  preferredLanguage: text(body.preferredLanguage, 100),
  educationOrProfession: text(body.educationOrProfession, 200),
  introducedThrough: text(body.introducedThrough, 200),
  preferredContactMethod: text(body.preferredContactMethod, 30),
  suitableContactTime: text(body.suitableContactTime, 100),
  permissionToContact: Boolean(body.permissionToContact),
  introductoryRemarks: text(body.introductoryRemarks, 2000)
});

export const followUpCreateInput = (body = {}) => ({
  channel: text(body.channel, 40),
  remarks: text(body.remarks, 4000),
  interactedAt: date(body.interactedAt) || new Date(),
  nextFollowUpDate: date(body.nextFollowUpDate),
  nextAction: text(body.nextAction, 500)
});

export const programCreateInput = (body = {}) => ({
  name: text(body.name, 200),
  description: text(body.description, 2000),
  venue: text(body.venue, 300),
  active: body.active !== false
});

export const sessionCreateInput = (body = {}) => ({
  program: body.program,
  title: text(body.title, 200),
  startsAt: date(body.startsAt),
  venue: text(body.venue, 300),
  seriesKey: text(body.seriesKey, 120)
});

export const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
