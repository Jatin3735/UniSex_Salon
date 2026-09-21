import crypto from "node:crypto";
import mongoose from "mongoose";
import { Booking, BOOKING_STATUS, PAYMENT_METHODS } from "../models/Booking.js";
import { Staff } from "../models/Staff.js";
import {
  asyncHandler,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../middleware/asyncHandler.js";
import { loadServices, requiredSkillsFor, totalDuration, totalPrice } from "../utils/services.js";
import {
  CLOSE_MINUTES,
  MAX_ADVANCE_DAYS,
  OPEN_MINUTES,
  SLOT_STEP,
  addDaysISO,
  generateStartMinutes,
  isDateBookable,
  slotKeysFor,
  slotUnavailableReason,
  toTimeLabel,
  todayISO,
} from "../utils/slots.js";

/** Slots already spoken for, for one staff member on one date. */
async function takenSlotKeys(staffId, date) {
  const bookings = await Booking.find({ staff: staffId, date, active: true }).select("slotKeys");
  return new Set(bookings.flatMap((b) => b.slotKeys));
}

async function loadStaffOrThrow(staffId) {
  if (!mongoose.isValidObjectId(staffId)) throw badRequest("Choose a staff member.");
  const staff = await Staff.findOne({ _id: staffId, active: true });
  if (!staff) throw notFound("That staff member is not available.");
  return staff;
}

/** Rejects a staff member who cannot perform every selected service. */
function assertStaffCanPerform(staff, services) {
  const required = requiredSkillsFor(services);
  const missing = required.filter((skill) => !staff.skills.includes(skill));
  if (missing.length) {
    throw badRequest(`${staff.name} does not offer: ${missing.join(", ")}.`);
  }
}

/**
 * GET /api/bookings/availability?staffId=&date=&serviceIds=
 *
 * Duration is derived from the services server-side, so the grid the customer
 * sees reflects the real span a booking would occupy.
 */
export const getAvailability = asyncHandler(async (req, res) => {
  const { staffId, date } = req.query;

  if (!isDateBookable(date)) {
    throw badRequest(
      `Pick a date between today and ${addDaysISO(todayISO(), MAX_ADVANCE_DAYS)}.`
    );
  }

  const staff = await loadStaffOrThrow(staffId);
  const services = await loadServices(req.query.serviceIds);
  assertStaffCanPerform(staff, services);

  const durationMins = totalDuration(services);
  const taken = await takenSlotKeys(staff._id, date);

  const slots = generateStartMinutes().map((start) => {
    const reason = slotUnavailableReason(start, durationMins, date, taken);
    return {
      start,
      label: toTimeLabel(start),
      endLabel: toTimeLabel(start + durationMins),
      available: reason === null,
      reason,
    };
  });

  res.json({
    date,
    staffId: staff._id.toString(),
    staffName: staff.name,
    durationMins,
    amount: totalPrice(services),
    openLabel: toTimeLabel(OPEN_MINUTES),
    closeLabel: toTimeLabel(CLOSE_MINUTES),
    slots,
  });
});

// Ambiguous characters (0/O, 1/I) dropped so a token is easy to read aloud
// at the counter.
const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * A booking token the customer shows at the salon. Uses crypto.randomInt (not
 * Math.random) and ~40 bits of entropy so tokens can't be guessed or
 * enumerated to read other customers' bookings.
 */
function generateToken(staffName) {
  const initials = (staffName ?? "SX").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "SX";
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    body += TOKEN_ALPHABET[crypto.randomInt(TOKEN_ALPHABET.length)];
  }
  return `${initials}-${body}`;
}

/** POST /api/bookings — customers only. */
export const createBooking = asyncHandler(async (req, res) => {
  const { staffId, date, startMinutes, serviceIds, paymentMethod } = req.body ?? {};

  if (!isDateBookable(date)) {
    throw badRequest(
      `Pick a date between today and ${addDaysISO(todayISO(), MAX_ADVANCE_DAYS)}.`
    );
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw badRequest("Choose a payment method.");
  }

  const start = Number(startMinutes);
  if (!Number.isInteger(start) || start < OPEN_MINUTES || start % SLOT_STEP !== 0) {
    throw badRequest("Choose a valid time slot.");
  }

  const staff = await loadStaffOrThrow(staffId);
  const services = await loadServices(serviceIds);
  assertStaffCanPerform(staff, services);

  const durationMins = totalDuration(services);
  const amount = totalPrice(services);

  // Friendly pre-check. The unique index below is what actually guarantees
  // correctness under a race; this just produces a better error message.
  const taken = await takenSlotKeys(staff._id, date);
  const reason = slotUnavailableReason(start, durationMins, date, taken);
  if (reason === "after-hours") {
    throw badRequest(
      `That would run past closing (${toTimeLabel(CLOSE_MINUTES)}). Pick an earlier slot.`
    );
  }
  if (reason === "past") throw badRequest("That time has already passed. Pick a later slot.");
  if (reason === "booked") throw conflict("That slot is already booked. Please pick another.");

  const base = {
    user: req.user._id,
    userName: req.user.name,
    userEmail: req.user.email,
    userMobile: req.user.mobile,
    staff: staff._id,
    staffName: staff.name,
    services: services.map((s) => ({
      service: s._id,
      key: s.key,
      title: s.title,
      price: s.price,
      duration: s.duration,
    })),
    date,
    startMinutes: start,
    durationMins,
    slotKeys: slotKeysFor(start, durationMins),
    amount,
    paymentMethod,
    // "Pay at salon" must not be recorded as money already received.
    paymentStatus: paymentMethod === "cash" ? "Pay at salon" : "Paid",
    status: "Pending",
  };

  // Retry only on a token collision; a slot collision is a real 409 for the
  // caller and must not be retried behind their back.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const booking = await Booking.create({ ...base, token: generateToken(staff.name) });
      return res.status(201).json({ booking: booking.toPublic() });
    } catch (err) {
      const isTokenClash = err.code === 11000 && err.keyPattern?.token;
      if (!isTokenClash) throw err;
    }
  }
  throw conflict("Could not allocate a booking token. Please try again.");
});

const sortByWhen = { date: 1, startMinutes: 1 };

/** GET /api/bookings/me */
export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort({ date: -1, startMinutes: -1 });
  res.json({ bookings: bookings.map((b) => b.toPublic()) });
});

/** GET /api/bookings/staff — the logged-in staff member's own calendar. */
export const staffBookings = asyncHandler(async (req, res) => {
  // Admins may inspect any staff calendar; a staff user only ever sees theirs.
  const staffId =
    req.user.role === "admin" ? (req.query.staffId ? String(req.query.staffId) : null) : req.user.staff;

  if (!staffId) {
    throw badRequest(
      req.user.role === "admin"
        ? "Pass ?staffId= to view a staff calendar."
        : "This account is not linked to a staff profile yet."
    );
  }
  if (req.user.role === "admin" && !mongoose.isValidObjectId(staffId)) {
    throw badRequest("That staff id is not valid.");
  }

  const filter = { staff: staffId };
  if (req.query.date) filter.date = String(req.query.date);

  const bookings = await Booking.find(filter).sort(sortByWhen);
  res.json({ bookings: bookings.map((b) => b.toPublic()) });
});

/** GET /api/bookings — admin only. */
export const allBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.date) filter.date = String(req.query.date);
  if (req.query.status && BOOKING_STATUS.includes(String(req.query.status))) {
    filter.status = String(req.query.status);
  }
  if (req.query.staffId && mongoose.isValidObjectId(String(req.query.staffId))) {
    filter.staff = String(req.query.staffId);
  }

  const bookings = await Booking.find(filter).sort({ date: -1, startMinutes: 1 }).limit(500);
  res.json({ bookings: bookings.map((b) => b.toPublic()) });
});

/** GET /api/bookings/token/:token */
export const bookingByToken = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ token: String(req.params.token).toUpperCase() });
  if (!booking) throw notFound("No booking found for that token.");

  const { role } = req.user;
  const isOwner = booking.user.toString() === req.user._id.toString();
  // A staff member may only read bookings on their own calendar — not any
  // booking by token, which would let one account enumerate every customer's
  // name, email and mobile. Admins may read anything.
  const ownsCalendar =
    role === "staff" && booking.staff.toString() === req.user.staff?.toString();

  if (!isOwner && role !== "admin" && !ownsCalendar) {
    throw forbidden("That booking belongs to someone else.");
  }

  res.json({ booking: booking.toPublic() });
});

/** PATCH /api/bookings/:id/status */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body ?? {};
  if (!BOOKING_STATUS.includes(status)) {
    throw badRequest(`Status must be one of: ${BOOKING_STATUS.join(", ")}.`);
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw notFound("Booking not found.");

  const { role } = req.user;
  const isOwner = booking.user.toString() === req.user._id.toString();

  if (role === "customer") {
    // A customer may cancel their own booking, and nothing else.
    if (!isOwner) throw forbidden("That booking belongs to someone else.");
    if (status !== "Cancelled") throw forbidden("You can only cancel a booking.");
  } else if (role === "staff") {
    const ownsCalendar = booking.staff.toString() === req.user.staff?.toString();
    if (!ownsCalendar) throw forbidden("That booking is not on your calendar.");
  }

  if (booking.status === "Cancelled" && status !== "Cancelled") {
    throw badRequest("A cancelled booking cannot be reopened — please book a new slot.");
  }

  booking.status = status;
  if (status === "Cancelled" && booking.paymentStatus === "Paid") {
    booking.paymentStatus = "Refunded";
  }
  await booking.save();

  res.json({ booking: booking.toPublic() });
});
