import mongoose from "mongoose";

export const DISCOUNT_TYPES = ["percent", "flat"];

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true, maxlength: 600 },
    discountType: { type: String, enum: DISCOUNT_TYPES, default: "percent" },
    discountValue: { type: Number, required: true, min: 0 },
    promoCode: { type: String, trim: true, uppercase: true, default: "" },
    startDate: { type: String, default: "" }, // "YYYY-MM-DD"
    expiryDate: { type: String, default: "" }, // "YYYY-MM-DD"
    minBookingAmount: { type: Number, min: 0, default: 0 },
    image: { type: String, default: "" },
    status: { type: Boolean, default: true }, // admin on/off switch
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

offerSchema.index({ status: 1, expiryDate: 1 });

/**
 * An offer is "live" when the admin switch is on AND today falls within its
 * date window (blank start/expiry mean open-ended). Percent discounts are
 * clamped 0..100 defensively.
 */
offerSchema.methods.isLive = function isLive(todayISO) {
  if (!this.status) return false;
  if (this.startDate && todayISO < this.startDate) return false;
  if (this.expiryDate && todayISO > this.expiryDate) return false;
  return true;
};

offerSchema.methods.toPublic = function toPublic() {
  const value =
    this.discountType === "percent"
      ? Math.min(100, Math.max(0, this.discountValue))
      : Math.max(0, this.discountValue);
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    discountType: this.discountType,
    discountValue: value,
    promoCode: this.promoCode,
    startDate: this.startDate,
    expiryDate: this.expiryDate,
    minBookingAmount: this.minBookingAmount,
    image: this.image,
    featured: this.featured,
  };
};

export const Offer = mongoose.model("Offer", offerSchema);
