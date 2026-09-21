import { Review } from "../../models/Review.js";
import { asyncHandler, badRequest, notFound } from "../../middleware/asyncHandler.js";
import { shapeReviewAdmin } from "./adminShapers.js";

/** GET /api/admin/reviews — moderation queue, filterable by approval state. */
export const listReviews = asyncHandler(async (req, res) => {
  const filter = {};
  const { status } = req.query;
  if (status === "approved") filter.approved = true;
  if (status === "pending") filter.approved = false;
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({ reviews: reviews.map(shapeReviewAdmin) });
});

/** PUT /api/admin/reviews/:id — toggle approved / featured. */
export const updateReview = asyncHandler(async (req, res) => {
  const data = {};
  if (req.body?.approved !== undefined) data.approved = Boolean(req.body.approved);
  if (req.body?.featured !== undefined) data.featured = Boolean(req.body.featured);
  if (Object.keys(data).length === 0) throw badRequest("Pass approved and/or featured.");

  const review = await Review.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
  if (!review) throw notFound("Review not found.");
  res.json({ review: shapeReviewAdmin(review) });
});

/** DELETE /api/admin/reviews/:id */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw notFound("Review not found.");
  res.json({ deleted: true, id: req.params.id });
});
