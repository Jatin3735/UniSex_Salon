import { Offer } from "../models/Offer.js";
import { Announcement } from "../models/Announcement.js";
import { Review } from "../models/Review.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { todayISO } from "../utils/slots.js";

/**
 * GET /api/offers — only offers that are switched on AND within their date
 * window right now. Expired offers naturally fall out via isLive().
 */
export const listActiveOffers = asyncHandler(async (req, res) => {
  const today = todayISO();
  const offers = await Offer.find({ status: true }).sort({ featured: -1, createdAt: -1 });
  const live = offers.filter((o) => o.isLive(today)).map((o) => o.toPublic());
  res.json({ offers: live });
});

/**
 * GET /api/announcements[?placement=bar]
 *
 * Live announcements for the public site, optionally scoped to one placement
 * (bar / hero / offers / popup). Date-windowed via isLive().
 */
export const listActiveAnnouncements = asyncHandler(async (req, res) => {
  const today = todayISO();
  const filter = { status: true };
  const { placement } = req.query;
  if (placement && ["bar", "hero", "offers", "popup"].includes(String(placement))) {
    filter.placement = String(placement);
  }
  const items = await Announcement.find(filter).sort({ createdAt: -1 });
  const live = items.filter((a) => a.isLive(today)).map((a) => a.toPublic());
  res.json({ announcements: live });
});

/** GET /api/reviews — approved reviews for the public testimonials section. */
export const listPublicReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ approved: true }).sort({ featured: -1, createdAt: -1 }).limit(50);
  res.json({ reviews: reviews.map((r) => r.toPublic()) });
});

/** GET /api/gallery — active gallery images in display order. */
export const listPublicGallery = asyncHandler(async (req, res) => {
  const images = await GalleryImage.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 });
  res.json({ images: images.map((g) => g.toPublic()) });
});
