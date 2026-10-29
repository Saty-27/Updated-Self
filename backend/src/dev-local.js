import crypto from "crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const database = await MongoMemoryServer.create({ instance: { dbName: "self-excellence-local" } });
process.env.MONGO_URI = database.getUri("self-excellence-local");
process.env.PORT = process.env.PORT || "5055";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173";
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
process.env.BOOKS_ENABLED = "true";

await import("./server.js");
await mongoose.connection.asPromise();

const { User } = await import("./models.js");
if (!(await User.exists({ email: "admin@local.test" }))) {
  await User.create({
    name: "Local Administrator",
    email: "admin@local.test",
    password: "LocalAdmin123!",
    role: "main_admin",
    status: "active",
    emailVerified: true
  });
}

console.log("Local-only admin: admin@local.test / LocalAdmin123!");

const stop = async () => {
  await mongoose.disconnect().catch(() => {});
  await database.stop().catch(() => {});
  process.exit(0);
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
