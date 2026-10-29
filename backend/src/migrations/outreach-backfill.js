import "dotenv/config";
import mongoose from "mongoose";
import { OutreachContact, OutreachCounter, OutreachFollowUp } from "../outreachModels.js";

const apply = process.argv.includes("--apply");
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI is required. The migration is dry-run unless --apply is supplied.");

const MigrationRecord = mongoose.models.MigrationRecord || mongoose.model("MigrationRecord", new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  appliedAt: Date,
  summary: mongoose.Schema.Types.Mixed
}, { timestamps: true }));

const run = async () => {
  await mongoose.connect(mongoUri);
  const contacts = await OutreachContact.find().sort({ registrationDate: 1, createdAt: 1, _id: 1 }).lean();
  const duplicateSequences = await OutreachContact.aggregate([
    { $match: { sequenceNumber: { $type: "number" } } },
    { $group: { _id: "$sequenceNumber", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  if (duplicateSequences.length) throw new Error(`Duplicate sequence numbers must be resolved first: ${duplicateSequences.map((x) => x._id).join(", ")}`);

  const used = new Set(contacts.map((x) => x.sequenceNumber).filter(Number.isFinite));
  let next = Math.max(0, ...used);
  const operations = [];
  let missingEmail = 0;
  let missingOccupation = 0;

  for (const contact of contacts) {
    const set = {};
    if (!contact.email) missingEmail += 1;
    if (!contact.occupation) missingOccupation += 1;
    if (!Number.isFinite(contact.sequenceNumber)) {
      do next += 1; while (used.has(next));
      used.add(next);
      set.sequenceNumber = next;
    }
    const strikes = Math.min(3, await OutreachFollowUp.countDocuments({ contact: contact._id, strikeApplied: true }));
    if (contact.strikeCount !== strikes) set.strikeCount = strikes;
    if (!contact.followUpListStatus) set.followUpListStatus = strikes >= 3 ? "non_follow_up" : "current";
    if (!contact.followUpStatus) set.followUpStatus = contact.permissionToContact ? "unassigned" : "opted_out";
    if (!contact.interestStatus) set.interestStatus = "follow_up_required";
    if (Object.keys(set).length) operations.push({ updateOne: { filter: { _id: contact._id }, update: { $set: set } } });
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    contactsScanned: contacts.length,
    contactsNeedingUpdate: operations.length,
    missingEmail,
    missingOccupation,
    maximumSequence: next
  };

  if (apply) {
    if (operations.length) await OutreachContact.bulkWrite(operations, { ordered: true });
    await OutreachCounter.findOneAndUpdate({ key: "contact_sequence" }, { $max: { value: next } }, { upsert: true });
    await MigrationRecord.findOneAndUpdate(
      { key: "2026-10-outreach-backfill-v1" },
      { $set: { appliedAt: new Date(), summary } },
      { upsert: true }
    );
  }
  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
