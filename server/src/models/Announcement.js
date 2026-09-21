import mongoose from "mongoose";

// Where an announcement is allowed to surface on the public site.
export const ANNOUNCEMENT_PLACEMENTS = ["bar", "hero", "offers", "popup"];

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 300 },
    // Optional call-to-action link + label rendered with the message.
    ctaLabel: { type: String, trim: true, default: "" },
    ctaHref: { type: String, trim: true, default: "" },
    placement: { type: String, enum: ANNOUNCEMENT_PLACEMENTS, default: "bar" },
    startDate: { type: String, default: "" }, // "YYYY-MM-DD"
    endDate: { type: String, default: "" }, // "YYYY-MM-DD"
    status: { type: Boolean, default: true }, // admin on/off switch
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, placement: 1 });

announcementSchema.methods.isLive = function isLive(todayISO) {
  if (!this.status) return false;
  if (this.startDate && todayISO < this.startDate) return false;
  if (this.endDate && todayISO > this.endDate) return false;
  return true;
};

announcementSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    message: this.message,
    ctaLabel: this.ctaLabel,
    ctaHref: this.ctaHref,
    placement: this.placement,
  };
};

export const Announcement = mongoose.model("Announcement", announcementSchema);
