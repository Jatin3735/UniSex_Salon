import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    desc: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 5 }, // minutes
    image: { type: String, default: "" },
    category: { type: String, enum: ["men", "women"], required: true },
    // Skills a staff member must have to perform this service. An array, not a
    // single value — "Hair + Beard" genuinely needs both.
    skills: {
      type: [String],
      required: true,
      validate: [(v) => v.length > 0, "a service needs at least one skill"],
    },
    active: { type: Boolean, default: true },

    // ---- Admin-managed presentation fields (optional) ----
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    // Optional explicit staff curation; booking still matches on skills.
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
  },
  { timestamps: true }
);

serviceSchema.index({ active: 1, displayOrder: 1 });

export const Service = mongoose.model("Service", serviceSchema);
