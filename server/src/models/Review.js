import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Author. `user` is set when a signed-in customer leaves it; name/email are
    // snapshotted so the review survives an account deletion.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    // Moderation: only approved reviews show on the public site.
    approved: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ approved: 1, featured: 1, createdAt: -1 });

reviewSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    rating: this.rating,
    text: this.text,
    featured: this.featured,
    createdAt: this.createdAt,
  };
};

export const Review = mongoose.model("Review", reviewSchema);
