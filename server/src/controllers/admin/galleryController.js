import { GalleryImage } from "../../models/GalleryImage.js";
import { asyncHandler, badRequest, notFound } from "../../middleware/asyncHandler.js";
import { shapeGalleryAdmin } from "./adminShapers.js";

function readGalleryBody(body, { partial = false } = {}) {
  const b = body ?? {};
  const out = {};
  const errors = {};

  if (!partial || b.image !== undefined) {
    if (!b.image || !String(b.image).trim()) errors.image = "An image is required.";
    else out.image = String(b.image).trim();
  }
  if (b.label !== undefined) out.label = String(b.label).trim();
  if (b.category !== undefined) out.category = String(b.category).trim();
  if (b.displayOrder !== undefined) {
    const order = Number(b.displayOrder);
    out.displayOrder = Number.isFinite(order) ? order : 0;
  }
  if (b.active !== undefined) out.active = Boolean(b.active);

  return { data: out, errors };
}

/** GET /api/admin/gallery */
export const listGallery = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === "active") filter.active = true;
  if (req.query.status === "inactive") filter.active = false;
  const images = await GalleryImage.find(filter).sort({ displayOrder: 1, createdAt: -1 });
  res.json({ images: images.map(shapeGalleryAdmin) });
});

/** POST /api/admin/gallery */
export const createGalleryImage = asyncHandler(async (req, res) => {
  const { data, errors } = readGalleryBody(req.body);
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);
  const image = await GalleryImage.create(data);
  res.status(201).json({ image: shapeGalleryAdmin(image) });
});

/** PUT /api/admin/gallery/:id */
export const updateGalleryImage = asyncHandler(async (req, res) => {
  const { data, errors } = readGalleryBody(req.body, { partial: true });
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);
  const image = await GalleryImage.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!image) throw notFound("Gallery image not found.");
  res.json({ image: shapeGalleryAdmin(image) });
});

/** DELETE /api/admin/gallery/:id */
export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findByIdAndDelete(req.params.id);
  if (!image) throw notFound("Gallery image not found.");
  res.json({ deleted: true, id: req.params.id });
});
