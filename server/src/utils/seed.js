import { fileURLToPath } from "node:url";
import path from "node:path";

import { Service } from "../models/Service.js";
import { Staff } from "../models/Staff.js";
import { User } from "../models/User.js";

/**
 * Reconciles the three contradictory hardcoded datasets the frontend used to
 * carry (services in Services.jsx, one staff roster in Staff.jsx and a
 * different one in StaffSelect.jsx) into a single seeded source of truth.
 *
 * Idempotent: safe to run on every boot.
 */

export const DEMO_PASSWORD = "Password123";

const SERVICES = [
  {
    key: "hair-cut",
    title: "Hair Cut",
    desc: "Professional hair cutting & styling",
    price: 150,
    duration: 30,
    image: "/haircut.jpg",
    category: "men",
    skills: ["hair"],
  },
  {
    key: "beard-trim",
    title: "Beard Trim",
    desc: "Clean beard trimming & shaping",
    price: 100,
    duration: 15,
    image: "/beard.jpg",
    category: "men",
    skills: ["beard"],
  },
  {
    key: "hair-beard",
    title: "Hair + Beard",
    desc: "Complete grooming package",
    price: 220,
    duration: 45,
    image: "/combo.jpg",
    category: "men",
    // Two skills, not one — a hair-only barber must not qualify.
    skills: ["hair", "beard"],
  },
  {
    key: "hair-styling",
    title: "Hair Styling",
    desc: "Trendy haircut & styling",
    price: 400,
    duration: 45,
    image: "/girls-hair.jpg",
    category: "women",
    skills: ["styling"],
  },
  {
    key: "facial",
    title: "Facial",
    desc: "Glow facial treatment",
    price: 800,
    duration: 60,
    image: "/facial.jpg",
    category: "women",
    skills: ["facial"],
  },
  {
    key: "spa",
    title: "Spa",
    desc: "Relaxing spa therapy",
    price: 1200,
    duration: 90,
    image: "/spa.jpg",
    category: "women",
    skills: ["spa"],
  },
  {
    key: "keratin",
    title: "Keratin Treatment",
    desc: "Smoothing keratin therapy with a glossy finish",
    price: 2500,
    duration: 120,
    image: "/keratin.jpg",
    category: "women",
    skills: ["styling", "keratin"],
  },
];

const STAFF = [
  {
    key: "st-ravi",
    name: "Ravi Kumar",
    age: 28,
    mobile: "9876543210",
    photo: "/staff1.jpg",
    skills: ["hair", "beard", "facial"],
  },
  {
    key: "st-aman",
    name: "Aman Sharma",
    age: 32,
    mobile: "9123456789",
    photo: "/staff2.jpg",
    skills: ["hair", "beard", "styling", "spa"],
  },
  {
    key: "st-suresh",
    name: "Suresh Nair",
    age: 26,
    mobile: "9988776655",
    photo: "/staff3.jpg",
    skills: ["hair", "facial", "spa", "styling", "keratin", "massage"],
  },
];

const USERS = [
  { name: "Salon Admin", email: "admin@salonx.com", mobile: "9000000001", role: "admin" },
  { name: "Ravi Kumar", email: "ravi@salonx.com", mobile: "9876543210", role: "staff", staffKey: "st-ravi" },
  { name: "Aman Sharma", email: "aman@salonx.com", mobile: "9123456789", role: "staff", staffKey: "st-aman" },
  { name: "Demo Customer", email: "demo@salonx.com", mobile: "9000000004", role: "customer" },
];

export async function seed({ quiet = false } = {}) {
  const log = quiet ? () => {} : (msg) => console.log(msg);

  for (const service of SERVICES) {
    await Service.findOneAndUpdate(
      { key: service.key },
      { $set: service },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const staffByKey = new Map();
  for (const member of STAFF) {
    const doc = await Staff.findOneAndUpdate(
      { key: member.key },
      { $set: member },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    staffByKey.set(member.key, doc);
  }

  let created = 0;
  for (const { staffKey, ...fields } of USERS) {
    const staffDoc = staffKey ? staffByKey.get(staffKey) : null;
    const existing = await User.findOne({ email: fields.email });

    if (existing) {
      // Keep the staff link current without touching an existing password.
      if (staffDoc && String(existing.staff) !== String(staffDoc._id)) {
        existing.staff = staffDoc._id;
        await existing.save();
      }
      continue;
    }

    // Created through the model (not updateOne) so the pre-save hook hashes
    // the password rather than storing it in plaintext.
    await User.create({
      ...fields,
      password: DEMO_PASSWORD,
      staff: staffDoc?._id ?? null,
    });
    created += 1;
  }

  log(
    `  ✔ Seeded ${SERVICES.length} services, ${STAFF.length} staff` +
      (created ? `, ${created} demo account(s)` : ", demo accounts already present")
  );

  return { services: SERVICES.length, staff: STAFF.length, usersCreated: created };
}

export function demoAccountsBanner() {
  return [
    "  Demo logins (password: " + DEMO_PASSWORD + ")",
    "    admin@salonx.com   admin",
    "    ravi@salonx.com    staff",
    "    demo@salonx.com    customer",
  ].join("\n");
}

// Allow `npm run seed` to run this file on its own.
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const { assertConfig } = await import("../config/env.js");
  const { connectDb, disconnectDb } = await import("../config/db.js");
  assertConfig();
  await connectDb();
  await seed();
  await disconnectDb();
  console.log("\n" + demoAccountsBanner() + "\n");
}
