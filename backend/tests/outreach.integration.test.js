import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "../src/models.js";
import { OutreachAttendanceEntry, OutreachContact } from "../src/outreachModels.js";
import { attachOutreachRoutes } from "../src/outreachRoutes.js";

let mongo;
let app;

const access = [{ section: "outreach", view: true, create: true, edit: true, canDelete: false }];
const makeUser = (role, suffix) => User.create({
  name: `${role} ${suffix}`,
  email: `${role}.${suffix}@example.test`,
  password: "Password123!",
  role,
  status: "active",
  emailVerified: true,
  sectionAccess: role.includes("outreach") || role.includes("attendance") ? access : []
});

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = express();
  app.use(express.json());
  const protect = async (req, res, next) => {
    req.user = await User.findById(req.header("x-test-user"));
    if (!req.user) return res.status(401).json({ success: false });
    next();
  };
  const canAccessSection = (user, section, action = "view") => {
    const grant = user.sectionAccess?.find((item) => item.section === section);
    return Boolean(grant && (action === "view" ? grant.view : grant[action]));
  };
  attachOutreachRoutes(app, { protect, canAccessSection, recordActivity: async () => {} });
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ success: false, message: error.message }));
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test("assigned volunteers cannot read another volunteer's contact and three unclear follow-ups move the contact", async () => {
  const coordinator = await makeUser("outreach_coordinator", "one");
  const volunteer = await makeUser("devotee", "one");
  const otherVolunteer = await makeUser("devotee", "two");
  const created = await request(app).post("/api/outreach/contacts").set("x-test-user", String(coordinator._id)).send({
    fullName: "Test Participant", primaryPhone: "9000000001", email: "participant@example.test",
    occupation: "Student", registrationDate: "2026-10-29", registrationSource: "Campus desk", permissionToContact: true
  }).expect(201);
  const contactId = created.body.item._id;
  await request(app).post(`/api/outreach/contacts/${contactId}/assign`).set("x-test-user", String(coordinator._id)).send({ volunteer: volunteer._id }).expect(201);
  await request(app).get(`/api/outreach/contacts/${contactId}`).set("x-test-user", String(otherVolunteer._id)).expect(403);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await request(app).post(`/api/outreach/contacts/${contactId}/follow-ups`).set("x-test-user", String(volunteer._id)).send({
      channel: "phone_call", remarks: `No answer on attempt ${attempt + 1}`
    }).expect(201);
  }
  const contact = await OutreachContact.findById(contactId).lean();
  assert.equal(contact.strikeCount, 3);
  assert.equal(contact.followUpListStatus, "non_follow_up");
  assert.equal(contact.finalDecisionReason, "three_strikes");
});

test("attendance operator records the same participant independently in multiple sessions", async () => {
  const coordinator = await makeUser("outreach_coordinator", "two");
  const operator = await makeUser("attendance_operator", "one");
  const contact = await OutreachContact.create({
    sequenceNumber: 1, fullName: "Multi Session Participant", primaryPhone: "9000000002",
    email: "multi@example.test", occupation: "Engineer", registrationSource: "Website",
    registrationDate: new Date(), permissionToContact: true, registeredBy: coordinator._id
  });
  const program = await request(app).post("/api/outreach/programs").set("x-test-user", String(operator._id)).send({ name: "Sunday Youth Program" }).expect(201);
  const sessionIds = [];
  for (const startsAt of ["2026-10-29T09:00:00.000Z", "2026-10-29T17:00:00.000Z"]) {
    const session = await request(app).post("/api/outreach/sessions").set("x-test-user", String(operator._id)).send({ program: program.body.item._id, startsAt }).expect(201);
    sessionIds.push(session.body.item._id);
  }
  for (const session of sessionIds) {
    const sheet = await request(app).post("/api/outreach/attendance-sheets").set("x-test-user", String(operator._id)).send({ session }).expect(201);
    await request(app).put(`/api/outreach/attendance-sheets/${sheet.body.sheet._id}/entries/${contact._id}`).set("x-test-user", String(operator._id)).send({ status: "present" }).expect(200);
  }
  assert.equal(await OutreachAttendanceEntry.countDocuments({ contact: contact._id, status: "present" }), 2);
});
