import mongoose from "mongoose";
import { Service } from "../../models/Service.js";
import { Staff } from "../../models/Staff.js";
import { Booking } from "../../models/Booking.js";
import { asyncHandler, badRequest, notFound } from "../../middleware/asyncHandler.js";
import { shapeServiceAdmin } from "./adminShapers.js";

const CATEGORIES = ["men", "women"];

function toSkills(raw) {
  if (raw == null) return undefined;
  const list = Array.isArray(raw) ? raw : String(raw).split(",");
  return [...new Set(list.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
}

function readServiceBody(body, { partial = false } = {}) {
  const b = body ?? {};
  const out = {};
  const errors = {};

  if (!partial || b.title !== undefined) {
    if (!b.title || String(b.title).trim().length < 2) errors.title = "Enter a service title.";
    else out.title = String(b.title).trim();
  }
  if (b.desc !== undefined) out.desc = String(b.desc).trim();
  if (b.image !== undefined) out.image = String(b.image).trim();

  if (!partial || b.category !== undefined) {
    const cat = String(b.category ?? "").trim().toLowerCase();
    if (!CATEGORIES.includes(cat)) errors.category = `Category must be one of: ${CATEGORIES.join(", ")}.`;
    else out.category = cat;
  }

  if (!partial || b.price !== undefined) {
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0) errors.price = "Enter a valid price.";
    else out.price = price;
  }
  if (!partial || b.duration !== undefined) {
    const duration = Number(b.duration);
    if (!Number.isFinite(duration) || duration < 5) errors.duration = "Duration must be at least 5 minutes.";
    else out.duration = duration;
  }

  const skills = toSkills(b.skills);
  if (skills !== undefined) {
    if (!partial && skills.length === 0) errors.skills = "A service needs at least one skill.";
    else out.skills = skills;
  }

  if (b.staff !== undefined) {
    const ids = (Array.isArray(b.staff) ? b.staff : String(b.staff).split(","))
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (ids.some((id) => !mongoose.isValidObjectId(id))) errors.staff = "One of the staff ids is invalid.";
    else out.staff = ids;
  }

  if (b.featured !== undefined) out.featured = Boolean(b.featured);
  if (b.active !== undefined) out.active = Boolean(b.active);
  if (b.displayOrder !== undefined) {
    const order = Number(b.displayOrder);
    out.displayOrder = Number.isFinite(order) ? order : 0;
  }

  return { data: out, errors };
}

async function uniqueKeyFor(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "service";
  let key = base;
  let n = 1;
   
  while (await Service.exists({ key })) {
    n += 1;
    key = `${base}-${n}`;
  }
  return key;
}

/** GET /api/admin/services */
export const listServices = asyncHandler(async (req, res) => {
  const filter = {};
  const { q, status, category } = req.query;
  if (status === "active") filter.active = true;
  if (status === "inactive") filter.active = false;
  if (category && CATEGORIES.includes(String(category))) filter.category = String(category);
  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { desc: rx }];
  }

  const services = await Service.find(filter).sort({ displayOrder: 1, category: 1, title: 1 });
  res.json({ services: services.map(shapeServiceAdmin) });
});

/** GET /api/admin/services/:id */
export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw notFound("Service not found.");
  res.json({ service: shapeServiceAdmin(service) });
});

/** POST /api/admin/services */
export const createService = asyncHandler(async (req, res) => {
  const { data, errors } = readServiceBody(req.body);
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);

  if (data.staff?.length) {
    const found = await Staff.countDocuments({ _id: { $in: data.staff } });
    if (found !== data.staff.length) throw badRequest("One of the selected staff no longer exists.");
  }

  data.key = await uniqueKeyFor(data.title);
  const service = await Service.create(data);
  res.status(201).json({ service: shapeServiceAdmin(service) });
});

/** PUT /api/admin/services/:id */
export const updateService = asyncHandler(async (req, res) => {
  const { data, errors } = readServiceBody(req.body, { partial: true });
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);

  if (data.staff?.length) {
    const found = await Staff.countDocuments({ _id: { $in: data.staff } });
    if (found !== data.staff.length) throw badRequest("One of the selected staff no longer exists.");
  }

  const service = await Service.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!service) throw notFound("Service not found.");
  res.json({ service: shapeServiceAdmin(service) });
});

/**
 * DELETE /api/admin/services/:id
 *
 * Bookings snapshot service title/price/duration at booking time, but still
 * reference the service _id. Deactivate by default; only hard-delete when the
 * service has never been booked and ?hard=true is passed.
 */
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw notFound("Service not found.");

  const bookingCount = await Booking.countDocuments({ "services.service": service._id });
  if (req.query.hard === "true" && bookingCount === 0) {
    await service.deleteOne();
    return res.json({ deleted: true, id: req.params.id });
  }

  service.active = false;
  await service.save();
  res.json({
    deleted: false,
    deactivated: true,
    service: shapeServiceAdmin(service),
    note: bookingCount > 0 ? "Deactivated to preserve historical bookings." : undefined,
  });
});
