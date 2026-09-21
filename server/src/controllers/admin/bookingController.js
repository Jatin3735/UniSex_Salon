import mongoose from "mongoose";
import { Booking, BOOKING_STATUS } from "../../models/Booking.js";
import { Staff } from "../../models/Staff.js";
import { Service } from "../../models/Service.js";
import { asyncHandler, badRequest, conflict, notFound } from "../../middleware/asyncHandler.js";
import {
  OPEN_MINUTES,
  SLOT_STEP,
  isDateBookable,
  slotKeysFor,
  slotUnavailableReason,
} from "../../utils/slots.js";

/** GET /api/admin/bookings — rich, filterable list for the admin table. */
export const listBookings = asyncHandler(async (req, res) => {
  const filter = {};
  const { q, date, status, staffId } = req.query;

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(String(date))) filter.date = String(date);
  if (status && BOOKING_STATUS.includes(String(status))) filter.status = String(status);
  if (staffId && mongoose.isValidObjectId(String(staffId))) filter.staff = String(staffId);
  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ token: rx }, { userName: rx }, { userEmail: rx }, { userMobile: rx }, { staffName: rx }];
  }

  const bookings = await Booking.find(filter).sort({ date: -1, startMinutes: 1 }).limit(500);
  res.json({ bookings: bookings.map((b) => b.toPublic()) });
});

/** GET /api/admin/bookings/:id */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw notFound("Booking not found.");
  res.json({ booking: booking.toPublic() });
});

/**
 * PUT /api/admin/bookings/:id
 *
 * Admin may change status, reassign staff, and move the appointment time.
 * Slot conflicts are re-checked against the target staff/date so the unique
 * slot index is never violated (a duplicate-key surfaces as a friendly 409).
 */
export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw notFound("Booking not found.");

  const { status, staffId, date, startMinutes } = req.body ?? {};

  if (status !== undefined) {
    if (!BOOKING_STATUS.includes(status)) {
      throw badRequest(`Status must be one of: ${BOOKING_STATUS.join(", ")}.`);
    }
    if (booking.status === "Cancelled" && status !== "Cancelled") {
      throw badRequest("A cancelled booking cannot be reopened — please create a new booking.");
    }
  }

  // --- Reschedule / reassign ------------------------------------------------
  const reassigning = staffId !== undefined || date !== undefined || startMinutes !== undefined;
  if (reassigning) {
    const targetDate = date !== undefined ? String(date) : booking.date;
    if (!isDateBookable(targetDate)) throw badRequest("Pick a valid, bookable date.");

    let targetStaff = booking.staff;
    let targetStaffName = booking.staffName;
    if (staffId !== undefined) {
      if (!mongoose.isValidObjectId(String(staffId))) throw badRequest("That staff id is not valid.");
      const staff = await Staff.findOne({ _id: staffId, active: true });
      if (!staff) throw notFound("That staff member is not available.");

      // The reassigned stylist must be able to perform every booked service.
      // Booking snapshots don't store skills, so resolve the live services by
      // their referenced ids and union their required skills.
      const serviceIds = booking.services.map((s) => s.service).filter(Boolean);
      if (serviceIds.length) {
        const services = await Service.find({ _id: { $in: serviceIds } }).select("skills title");
        const required = [...new Set(services.flatMap((s) => s.skills))];
        const missing = required.filter((skill) => !staff.skills.includes(skill));
        if (missing.length) {
          throw badRequest(`${staff.name} does not offer: ${missing.join(", ")}.`);
        }
      }
      targetStaff = staff._id;
      targetStaffName = staff.name;
    }

    const start = startMinutes !== undefined ? Number(startMinutes) : booking.startMinutes;
    if (!Number.isInteger(start) || start < OPEN_MINUTES || start % SLOT_STEP !== 0) {
      throw badRequest("Choose a valid time slot.");
    }

    const durationMins = booking.durationMins;
    const newSlotKeys = slotKeysFor(start, durationMins);

    // Which slots are taken on the target calendar, excluding this booking.
    const others = await Booking.find({
      staff: targetStaff,
      date: targetDate,
      active: true,
      _id: { $ne: booking._id },
    }).select("slotKeys");
    const taken = new Set(others.flatMap((b) => b.slotKeys));

    const reason = slotUnavailableReason(start, durationMins, targetDate, taken);
    if (reason === "after-hours") throw badRequest("That would run past closing. Pick an earlier slot.");
    if (reason === "booked") throw conflict("That slot is already booked on the target calendar.");
    // "past" is allowed for admin edits of historical records.

    booking.staff = targetStaff;
    booking.staffName = targetStaffName;
    booking.date = targetDate;
    booking.startMinutes = start;
    booking.slotKeys = newSlotKeys; // pre-validate hook re-derives labels/end
  }

  if (status !== undefined) {
    booking.status = status;
    if (status === "Cancelled" && booking.paymentStatus === "Paid") booking.paymentStatus = "Refunded";
  }

  try {
    await booking.save();
  } catch (err) {
    if (err.code === 11000) throw conflict("That slot is already booked on the target calendar.");
    throw err;
  }

  res.json({ booking: booking.toPublic() });
});
