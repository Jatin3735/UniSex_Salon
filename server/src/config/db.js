import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (err) {
    console.error("\n  ✖ Could not connect to MongoDB.\n");
    console.error(`    ${err.message}\n`);
    console.error("    Check that MONGODB_URI in server/.env is correct.");
    console.error("    Using Atlas? Make sure your current IP is allowed under");
    console.error("    Network Access, and that the password is URL-encoded.\n");
    process.exit(1);
  }

  const { host, name } = mongoose.connection;
  console.log(`  ✔ MongoDB connected — ${name} @ ${host}`);
}

export async function disconnectDb() {
  await mongoose.connection.close();
}
