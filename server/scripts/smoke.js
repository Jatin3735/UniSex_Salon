/**
 * End-to-end API smoke test.
 *
 * Boots a throwaway in-memory MongoDB, seeds it, and exercises every endpoint
 * and guard. Run with:  npm run smoke
 *
 * Requires the optional dev dependency:  npm i -D mongodb-memory-server
 * Nothing in the shipped app depends on it.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  ok   ${name}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri("salonx_smoke");
process.env.JWT_SECRET = "smoke-test-secret-not-for-production";
process.env.SEED_ON_BOOT = "false";
process.env.PORT = "0";
// The suite fires auth calls in a burst that would trip the production rate
// limiter (8 / 15 min). Turn it off for the test — the limiter itself is
// exercised in production, not here.
process.env.RATE_LIMIT_DISABLED = "true";

const { connectDb, disconnectDb } = await import("../src/config/db.js");
const { createApp } = await import("../src/index.js");
const { seed, DEMO_PASSWORD } = await import("../src/utils/seed.js");
const { todayISO, addDaysISO } = await import("../src/utils/slots.js");

await connectDb();
await seed({ quiet: true });

const server = createApp().listen(0);
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}

console.log("\n── health & catalog ──");
check("health responds", (await call("GET", "/api/health")).status === 200);

const services = (await call("GET", "/api/services")).body.services;
check("services seeded", services.length === 7, `got ${services.length}`);

const spa = services.find((s) => s.key === "spa");
const facial = services.find((s) => s.key === "facial");
const haircut = services.find((s) => s.key === "hair-cut");
const combo = services.find((s) => s.key === "hair-beard");
check("spa is 90 min / ₹1200", spa.duration === 90 && spa.price === 1200);
check("combo needs two skills", combo.skills.length === 2 && combo.skills.includes("beard"));

const allStaff = (await call("GET", "/api/staff")).body.staff;
check("staff seeded", allStaff.length === 3, `got ${allStaff.length}`);

console.log("\n── staff matching (fixes .some -> ALL skills) ──");
const forHaircut = (await call("GET", `/api/staff/available?serviceIds=${haircut.id}`)).body.staff;
check("all 3 can cut hair", forHaircut.length === 3, `got ${forHaircut.length}`);

const forFacialSpa = (await call(
  "GET",
  `/api/staff/available?serviceIds=${facial.id},${spa.id}`
)).body.staff;
check(
  "facial+spa needs BOTH skills",
  forFacialSpa.length === 1 && forFacialSpa[0].name === "Suresh Nair",
  `got ${forFacialSpa.map((s) => s.name).join(",") || "none"}`
);

const noServices = await call("GET", "/api/staff/available?serviceIds=");
check("empty service list rejected", noServices.status === 400, `got ${noServices.status}`);

console.log("\n── auth ──");
const badLogin = await call("POST", "/api/auth/login", {
  body: { email: "demo@salonx.com", password: "wrong" },
});
check("wrong password rejected", badLogin.status === 401);

const login = await call("POST", "/api/auth/login", {
  body: { email: "demo@salonx.com", password: DEMO_PASSWORD },
});
check("demo customer logs in", login.status === 200 && Boolean(login.body.token));
check("password never returned", login.body.user?.password === undefined);
const customerToken = login.body.token;

const adminLogin = await call("POST", "/api/auth/login", {
  body: { email: "admin@salonx.com", password: DEMO_PASSWORD },
});
const adminToken = adminLogin.body.token;
check("admin logs in", adminLogin.status === 200 && adminLogin.body.user.role === "admin");

const staffLogin = await call("POST", "/api/auth/login", {
  body: { email: "ravi@salonx.com", password: DEMO_PASSWORD },
});
const staffToken = staffLogin.body.token;
check("staff account is linked to a profile", Boolean(staffLogin.body.user.staffId));

const dupe = await call("POST", "/api/auth/register", {
  body: { name: "Copy", email: "demo@salonx.com", mobile: "9000000009", password: "Password123" },
});
check("duplicate email rejected", dupe.status === 400 && Boolean(dupe.body.details?.email));

const weak = await call("POST", "/api/auth/register", {
  body: { name: "X", email: "not-an-email", mobile: "12", password: "short" },
});
check(
  "registration validates every field",
  weak.status === 400 && Object.keys(weak.body.details ?? {}).length === 4
);

const privEsc = await call("POST", "/api/auth/register", {
  body: {
    name: "Sneaky",
    email: "sneaky@salonx.com",
    mobile: "9000000010",
    password: "Password123",
    role: "admin",
  },
});
check("cannot self-register as admin", privEsc.body.user?.role === "customer");

check("no token = 401", (await call("GET", "/api/auth/me")).status === 401);
check(
  "garbage token = 401",
  (await call("GET", "/api/auth/me", { token: "not.a.jwt" })).status === 401
);

console.log("\n── availability ──");
const tomorrow = addDaysISO(todayISO(), 1);
const spaAvail = (await call(
  "GET",
  `/api/bookings/availability?staffId=${forFacialSpa[0].id}&date=${tomorrow}&serviceIds=${spa.id}`
)).body;
check("availability returns 40 slots", spaAvail.slots.length === 40);
check("duration echoed", spaAvail.durationMins === 90);

const late = spaAvail.slots.find((s) => s.label === "19:45");
check("19:45 + 90min blocked as after-hours", late.available === false && late.reason === "after-hours");
const midday = spaAvail.slots.find((s) => s.label === "11:00");
check("11:00 initially free", midday.available === true);

const pastDate = await call(
  "GET",
  `/api/bookings/availability?staffId=${forFacialSpa[0].id}&date=${addDaysISO(todayISO(), -1)}&serviceIds=${spa.id}`
);
check("past date rejected", pastDate.status === 400);

const tooFar = await call(
  "GET",
  `/api/bookings/availability?staffId=${forFacialSpa[0].id}&date=${addDaysISO(todayISO(), 60)}&serviceIds=${spa.id}`
);
check("far-future date rejected", tooFar.status === 400);

console.log("\n── booking ──");
const suresh = forFacialSpa[0];

const anon = await call("POST", "/api/bookings", {
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 660, serviceIds: [spa.id], paymentMethod: "upi" },
});
check("anonymous booking rejected", anon.status === 401);

const booked = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 660, serviceIds: [spa.id], paymentMethod: "upi" },
});
check("customer books 11:00 spa", booked.status === 201, JSON.stringify(booked.body));
const booking = booked.body.booking;
check("amount computed server-side", booking.amount === 1200);
check("end time is 12:30", booking.endLabel === "12:30");
check("token generated", /^[A-Z]{2}-[A-HJ-NP-Z2-9]{8}$/.test(booking.token), booking.token);
check("status starts Pending", booking.status === "Pending");
check("upi marked Paid", booking.paymentStatus === "Paid");
check("services stored with duration", booking.services[0].duration === 90);

console.log("\n── double-booking (the unique index) ──");
const exact = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 660, serviceIds: [spa.id], paymentMethod: "upi" },
});
check("exact same slot rejected", exact.status === 409, `got ${exact.status}`);

const overlapping = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 690, serviceIds: [haircut.id], paymentMethod: "upi" },
});
check("11:30 inside the 90-min spa rejected", overlapping.status === 409, `got ${overlapping.status}`);

const straddling = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 645, serviceIds: [haircut.id], paymentMethod: "upi" },
});
check("10:45+30min straddling the start rejected", straddling.status === 409, `got ${straddling.status}`);

const after = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 750, serviceIds: [haircut.id], paymentMethod: "cash" },
});
check("12:30 immediately after is allowed", after.status === 201, `got ${after.status}`);
check("cash = Pay at salon, not Paid", after.body.booking.paymentStatus === "Pay at salon");

const otherStaff = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: allStaff.find((s) => s.name === "Ravi Kumar").id, date: tomorrow, startMinutes: 660, serviceIds: [haircut.id], paymentMethod: "card" },
});
check("same time, different staff is fine", otherStaff.status === 201);

const wrongSkill = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: allStaff.find((s) => s.name === "Ravi Kumar").id, date: tomorrow, startMinutes: 900, serviceIds: [spa.id], paymentMethod: "upi" },
});
check("staff without the skill rejected", wrongSkill.status === 400, `got ${wrongSkill.status}`);

const misaligned = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 667, serviceIds: [haircut.id], paymentMethod: "upi" },
});
check("off-grid start time rejected", misaligned.status === 400);

console.log("\n── availability reflects the booking ──");
const after2 = (await call(
  "GET",
  `/api/bookings/availability?staffId=${suresh.id}&date=${tomorrow}&serviceIds=${haircut.id}`
)).body;
const blocked = ["11:00", "11:30", "12:00", "12:15"].every(
  (label) => after2.slots.find((s) => s.label === label)?.available === false
);
check("all 90 minutes now show as booked", blocked);
// suresh now has 11:00–12:30 (spa) and 12:30–13:00 (30-min haircut), so 12:45
// is inside the second booking and 13:00 is the first genuinely free start.
check("12:45 is inside the 12:30 haircut", after2.slots.find((s) => s.label === "12:45")?.available === false);
check("13:00 free once both bookings end", after2.slots.find((s) => s.label === "13:00")?.available === true);

console.log("\n── reading bookings ──");
const mine = (await call("GET", "/api/bookings/me", { token: customerToken })).body.bookings;
check("customer sees own bookings", mine.length === 3, `got ${mine.length}`);

const byToken = await call("GET", `/api/bookings/token/${booking.token}`, { token: customerToken });
check("lookup by token works", byToken.status === 200);
check("unknown token = 404", (await call("GET", "/api/bookings/token/ZZ-0000", { token: customerToken })).status === 404);

const staffCal = (await call("GET", "/api/bookings/staff", { token: staffToken })).body.bookings;
check("staff sees only their own calendar", staffCal.length === 1 && staffCal[0].staffName === "Ravi Kumar");

check(
  "customer cannot list all bookings",
  (await call("GET", "/api/bookings", { token: customerToken })).status === 403
);
check(
  "customer cannot open a staff calendar",
  (await call("GET", "/api/bookings/staff", { token: customerToken })).status === 403
);

// Three bookings exist: spa 11:00 + haircut 12:30 (Suresh) and haircut 11:00
// (Ravi). All were made by the demo customer, so admin's list must match theirs.
const adminAll = (await call("GET", "/api/bookings", { token: adminToken })).body.bookings;
check("admin sees everything", adminAll.length === 3, `got ${adminAll.length}`);
check("admin's view is a superset of the customer's", mine.every((b) => adminAll.some((a) => a.id === b.id)));

console.log("\n── status transitions ──");
const complete = await call("PATCH", `/api/bookings/${staffCal[0].id}/status`, {
  token: staffToken,
  body: { status: "Completed" },
});
check("staff completes own booking", complete.status === 200 && complete.body.booking.status === "Completed");

const foreign = await call("PATCH", `/api/bookings/${booking.id}/status`, {
  token: staffToken,
  body: { status: "Completed" },
});
check("staff cannot touch another calendar", foreign.status === 403);

const custComplete = await call("PATCH", `/api/bookings/${booking.id}/status`, {
  token: customerToken,
  body: { status: "Completed" },
});
check("customer cannot mark Completed", custComplete.status === 403);

const cancel = await call("PATCH", `/api/bookings/${booking.id}/status`, {
  token: customerToken,
  body: { status: "Cancelled" },
});
check("customer can cancel own booking", cancel.status === 200);
check("paid booking becomes Refunded", cancel.body.booking.paymentStatus === "Refunded");

const bogus = await call("PATCH", `/api/bookings/${booking.id}/status`, {
  token: adminToken,
  body: { status: "Banana" },
});
check("invalid status rejected", bogus.status === 400);

console.log("\n── cancelling frees the slot ──");
const rebook = await call("POST", "/api/bookings", {
  token: customerToken,
  body: { staffId: suresh.id, date: tomorrow, startMinutes: 660, serviceIds: [spa.id], paymentMethod: "upi" },
});
check("cancelled slot can be rebooked", rebook.status === 201, `got ${rebook.status}`);

console.log("\n── misc ──");
check("unknown route = 404 JSON", (await call("GET", "/api/nope")).status === 404);
check(
  "bad ObjectId handled",
  [400, 404].includes((await call("GET", "/api/bookings/availability?staffId=abc&date=" + tomorrow + "&serviceIds=" + spa.id)).status)
);

server.close();
await disconnectDb();
await mongo.stop();

console.log(`\n  ${pass} passed, ${fail} failed\n`);
if (fail) {
  console.log("  Failed:\n" + failures.map((f) => `    - ${f}`).join("\n") + "\n");
}
process.exit(fail ? 1 : 0);
