import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // URL or /uploads path
    label: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

galleryImageSchema.index({ active: 1, displayOrder: 1 });

galleryImageSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    image: this.image,
    label: this.label,
    category: this.category,
  };
};

export const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);
