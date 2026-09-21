import mongoose from "mongoose";
import { Staff } from "../../models/Staff.js";
import { Service } from "../../models/Service.js";
import { asyncHandler, badRequest, notFound } from "../../middleware/asyncHandler.js";
import { shapeStaffAdmin } from "./adminShapers.js";

const WORKING_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Turns "a,b,c" / ["a","b"] into a clean, de-duplicated string array. */
function toStringArray(raw) {
  if (raw == null) return undefined;
  const list = Array.isArray(raw) ? raw : String(raw).split(",");
  return [...new Set(list.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
}

/** Validates + shapes the writable staff fields shared by create and update. */
function readStaffBody(body, { partial = false } = {}) {
  const b = body ?? {};
  const out = {};
  const errors = {};

  if (!partial || b.name !== undefined) {
    if (!b.name || String(b.name).trim().length < 2) errors.name = "Enter the staff member's name.";
    else out.name = String(b.name).trim();
  }
  if (b.role !== undefined) out.role = String(b.role).trim() || "Stylist";
  if (b.specialization !== undefined) out.specialization = String(b.specialization).trim();
  if (b.bio !== undefined) {
    const bio = String(b.bio).trim();
    if (bio.length > 800) errors.bio = "Bio must be 800 characters or fewer.";
    else out.bio = bio;
  }
  if (b.mobile !== undefined) out.mobile = String(b.mobile).trim();
  if (b.email !== undefined) out.email = String(b.email).trim().toLowerCase();
  if (b.photo !== undefined) out.photo = String(b.photo).trim();

  if (b.age !== undefined && b.age !== "" && b.age !== null) {
    const age = Number(b.age);
    if (!Number.isFinite(age) || age < 16 || age > 100) errors.age = "Age must be between 16 and 100.";
    else out.age = age;
  }
  if (b.experience !== undefined && b.experience !== "" && b.experience !== null) {
    const exp = Number(b.experience);
    if (!Number.isFinite(exp) || exp < 0 || exp > 70) errors.experience = "Experience must be 0–70 years.";
    else out.experience = exp;
  }

  const skills = toStringArray(b.skills);
  if (skills !== undefined) out.skills = skills;

  if (b.workingDays !== undefined) {
    const days = toStringArray(b.workingDays) ?? [];
    const invalid = days.filter((d) => !WORKING_DAYS.includes(d));
    if (invalid.length) errors.workingDays = `Invalid day(s): ${invalid.join(", ")}.`;
    else out.workingDays = days;
  }

  if (b.workingHours !== undefined) {
    const start = String(b.workingHours?.start ?? "10:00");
    const end = String(b.workingHours?.end ?? "20:00");
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) {
      errors.workingHours = "Working hours must be in HH:MM format.";
    } else if (end <= start) {
      errors.workingHours = "Closing time must be after opening time.";
    } else {
      out.workingHours = { start, end };
    }
  }

  if (b.services !== undefined) {
    const ids = (Array.isArray(b.services) ? b.services : String(b.services).split(","))
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (ids.some((id) => !mongoose.isValidObjectId(id))) errors.services = "One of the services is invalid.";
    else out.services = ids;
  }

  if (b.displayOrder !== undefined) {
    const order = Number(b.displayOrder);
    out.displayOrder = Number.isFinite(order) ? order : 0;
  }
  if (b.active !== undefined) out.active = Boolean(b.active);

  return { data: out, errors };
}

/** Derives a stable unique key from the name, avoiding collisions. */
async function uniqueKeyFor(name) {
  const base =
    "st-" +
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  let key = base;
  let n = 1;
   
  while (await Staff.exists({ key })) {
    n += 1;
    key = `${base}-${n}`;
  }
  return key;
}

/** GET /api/admin/staff — full roster, optional search / status filter. */
export const listStaff = asyncHandler(async (req, res) => {
  const filter = {};
  const { q, status } = req.query;
  if (status === "active") filter.active = true;
  if (status === "inactive") filter.active = false;
  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { role: rx }, { specialization: rx }, { email: rx }, { mobile: rx }];
  }

  const staff = await Staff.find(filter).sort({ displayOrder: 1, name: 1 });
  res.json({ staff: staff.map(shapeStaffAdmin) });
});

/** GET /api/admin/staff/:id */
export const getStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw notFound("Staff member not found.");
  res.json({ staff: shapeStaffAdmin(staff) });
});

/** POST /api/admin/staff */
export const createStaff = asyncHandler(async (req, res) => {
  const { data, errors } = readStaffBody(req.body);
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);

  if (data.services?.length) {
    const found = await Service.countDocuments({ _id: { $in: data.services } });
    if (found !== data.services.length) throw badRequest("One of the selected services no longer exists.");
  }

  data.key = await uniqueKeyFor(data.name);
  const staff = await Staff.create(data);
  res.status(201).json({ staff: shapeStaffAdmin(staff) });
});

/** PUT /api/admin/staff/:id */
export const updateStaff = asyncHandler(async (req, res) => {
  const { data, errors } = readStaffBody(req.body, { partial: true });
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);

  if (data.services?.length) {
    const found = await Service.countDocuments({ _id: { $in: data.services } });
    if (found !== data.services.length) throw badRequest("One of the selected services no longer exists.");
  }

  const staff = await Staff.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!staff) throw notFound("Staff member not found.");
  res.json({ staff: shapeStaffAdmin(staff) });
});

/**
 * DELETE /api/admin/staff/:id
 *
 * Staff are referenced by historical bookings, so we deactivate rather than
 * hard-delete by default. A hard delete is only honoured when the member has
 * never taken a booking AND ?hard=true is passed explicitly.
 */
export const deleteStaff = asyncHandler(async (req, res) => {
  const { Booking } = await import("../../models/Booking.js");
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw notFound("Staff member not found.");

  const bookingCount = await Booking.countDocuments({ staff: staff._id });
  if (req.query.hard === "true" && bookingCount === 0) {
    await staff.deleteOne();
    return res.json({ deleted: true, id: req.params.id });
  }

  staff.active = false;
  await staff.save();
  res.json({
    deleted: false,
    deactivated: true,
    staff: shapeStaffAdmin(staff),
    note: bookingCount > 0 ? "Deactivated to preserve historical bookings." : undefined,
  });
});
