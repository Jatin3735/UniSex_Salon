import { Announcement, ANNOUNCEMENT_PLACEMENTS } from "../../models/Announcement.js";
import { asyncHandler, badRequest, notFound } from "../../middleware/asyncHandler.js";
import { shapeAnnouncementAdmin } from "./adminShapers.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readAnnouncementBody(body, { partial = false } = {}) {
  const b = body ?? {};
  const out = {};
  const errors = {};

  if (!partial || b.message !== undefined) {
    const m = String(b.message ?? "").trim();
    if (m.length < 2) errors.message = "Enter an announcement message.";
    else if (m.length > 300) errors.message = "Message must be 300 characters or fewer.";
    else out.message = m;
  }
  if (b.ctaLabel !== undefined) out.ctaLabel = String(b.ctaLabel).trim();
  if (b.ctaHref !== undefined) out.ctaHref = String(b.ctaHref).trim();

  if (b.placement !== undefined) {
    const p = String(b.placement).trim();
    if (!ANNOUNCEMENT_PLACEMENTS.includes(p)) {
      errors.placement = `Placement must be one of: ${ANNOUNCEMENT_PLACEMENTS.join(", ")}.`;
    } else out.placement = p;
  }

  if (b.startDate !== undefined) {
    const s = String(b.startDate).trim();
    if (s && !DATE_RE.test(s)) errors.startDate = "Start date must be YYYY-MM-DD.";
    else out.startDate = s;
  }
  if (b.endDate !== undefined) {
    const e = String(b.endDate).trim();
    if (e && !DATE_RE.test(e)) errors.endDate = "End date must be YYYY-MM-DD.";
    else out.endDate = e;
  }
  const start = out.startDate ?? "";
  const end = out.endDate ?? "";
  if (start && end && end < start) errors.endDate = "End date must be on or after the start date.";

  if (b.status !== undefined) out.status = Boolean(b.status);

  return { data: out, errors };
}

/** GET /api/admin/announcements */
export const listAnnouncements = asyncHandler(async (req, res) => {
  const filter = {};
  const { status, placement } = req.query;
  if (status === "active") filter.status = true;
  if (status === "inactive") filter.status = false;
  if (placement && ANNOUNCEMENT_PLACEMENTS.includes(String(placement))) filter.placement = String(placement);
  const items = await Announcement.find(filter).sort({ createdAt: -1 });
  res.json({ announcements: items.map(shapeAnnouncementAdmin) });
});

/** GET /api/admin/announcements/:id */
export const getAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findById(req.params.id);
  if (!item) throw notFound("Announcement not found.");
  res.json({ announcement: shapeAnnouncementAdmin(item) });
});

/** POST /api/admin/announcements */
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { data, errors } = readAnnouncementBody(req.body);
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);
  const item = await Announcement.create(data);
  res.status(201).json({ announcement: shapeAnnouncementAdmin(item) });
});

/** PUT /api/admin/announcements/:id */
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { data, errors } = readAnnouncementBody(req.body, { partial: true });
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);
  const item = await Announcement.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!item) throw notFound("Announcement not found.");
  res.json({ announcement: shapeAnnouncementAdmin(item) });
});

/** DELETE /api/admin/announcements/:id */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) throw notFound("Announcement not found.");
  res.json({ deleted: true, id: req.params.id });
});
