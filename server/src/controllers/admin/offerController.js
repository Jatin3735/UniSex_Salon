import { Offer, DISCOUNT_TYPES } from "../../models/Offer.js";
import { asyncHandler, badRequest, notFound } from "../../middleware/asyncHandler.js";
import { shapeOfferAdmin } from "./adminShapers.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readOfferBody(body, { partial = false } = {}) {
  const b = body ?? {};
  const out = {};
  const errors = {};

  if (!partial || b.title !== undefined) {
    if (!b.title || String(b.title).trim().length < 2) errors.title = "Enter an offer title.";
    else out.title = String(b.title).trim();
  }
  if (b.description !== undefined) {
    const d = String(b.description).trim();
    if (d.length > 600) errors.description = "Description must be 600 characters or fewer.";
    else out.description = d;
  }
  if (!partial || b.discountType !== undefined) {
    const t = String(b.discountType ?? "percent").trim();
    if (!DISCOUNT_TYPES.includes(t)) errors.discountType = `Discount type must be one of: ${DISCOUNT_TYPES.join(", ")}.`;
    else out.discountType = t;
  }
  if (!partial || b.discountValue !== undefined) {
    const v = Number(b.discountValue);
    if (!Number.isFinite(v) || v < 0) errors.discountValue = "Enter a valid discount value.";
    else if ((out.discountType ?? b.discountType) === "percent" && v > 100)
      errors.discountValue = "A percentage discount cannot exceed 100.";
    else out.discountValue = v;
  }
  if (b.promoCode !== undefined) out.promoCode = String(b.promoCode).trim().toUpperCase();
  if (b.image !== undefined) out.image = String(b.image).trim();

  if (b.startDate !== undefined) {
    const s = String(b.startDate).trim();
    if (s && !DATE_RE.test(s)) errors.startDate = "Start date must be YYYY-MM-DD.";
    else out.startDate = s;
  }
  if (b.expiryDate !== undefined) {
    const e = String(b.expiryDate).trim();
    if (e && !DATE_RE.test(e)) errors.expiryDate = "Expiry date must be YYYY-MM-DD.";
    else out.expiryDate = e;
  }
  const start = out.startDate ?? "";
  const expiry = out.expiryDate ?? "";
  if (start && expiry && expiry < start) errors.expiryDate = "Expiry must be on or after the start date.";

  if (b.minBookingAmount !== undefined) {
    const m = Number(b.minBookingAmount);
    if (!Number.isFinite(m) || m < 0) errors.minBookingAmount = "Enter a valid minimum amount.";
    else out.minBookingAmount = m;
  }
  if (b.status !== undefined) out.status = Boolean(b.status);
  if (b.featured !== undefined) out.featured = Boolean(b.featured);

  return { data: out, errors };
}

/** GET /api/admin/offers */
export const listOffers = asyncHandler(async (req, res) => {
  const filter = {};
  const { q, status } = req.query;
  if (status === "active") filter.status = true;
  if (status === "inactive") filter.status = false;
  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { description: rx }, { promoCode: rx }];
  }
  const offers = await Offer.find(filter).sort({ createdAt: -1 });
  res.json({ offers: offers.map(shapeOfferAdmin) });
});

/** GET /api/admin/offers/:id */
export const getOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) throw notFound("Offer not found.");
  res.json({ offer: shapeOfferAdmin(offer) });
});

/** POST /api/admin/offers */
export const createOffer = asyncHandler(async (req, res) => {
  const { data, errors } = readOfferBody(req.body);
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);
  const offer = await Offer.create(data);
  res.status(201).json({ offer: shapeOfferAdmin(offer) });
});

/** PUT /api/admin/offers/:id */
export const updateOffer = asyncHandler(async (req, res) => {
  const { data, errors } = readOfferBody(req.body, { partial: true });
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);
  const offer = await Offer.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!offer) throw notFound("Offer not found.");
  res.json({ offer: shapeOfferAdmin(offer) });
});

/** DELETE /api/admin/offers/:id — offers carry no historical references, so a hard delete is safe. */
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) throw notFound("Offer not found.");
  res.json({ deleted: true, id: req.params.id });
});
