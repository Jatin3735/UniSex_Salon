import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 16, max: 100 },
    mobile: { type: String, trim: true },
    photo: { type: String, default: "" },
    // Skills a staff member can perform — the booking flow matches services to
    // staff on these (Staff.find({ skills: { $all: requiredSkills } })), so it
    // stays load-bearing and must not be removed.
    skills: { type: [String], default: [] },
    active: { type: Boolean, default: true },

    // ---- Extended profile (admin-managed, all optional) ----
    role: { type: String, trim: true, default: "Stylist" },
    specialization: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "", maxlength: 800 },
    experience: { type: Number, min: 0, max: 70, default: 0 }, // years
    email: { type: String, trim: true, lowercase: true, default: "" },
    // Explicit service assignment (in addition to skill-based matching), so an
    // admin can curate exactly which services a stylist is showcased for.
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    // e.g. ["mon","tue","wed","thu","fri"]
    workingDays: { type: [String], default: [] },
    workingHours: {
      start: { type: String, default: "10:00" },
      end: { type: String, default: "20:00" },
    },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

staffSchema.index({ active: 1, displayOrder: 1 });

export const Staff = mongoose.model("Staff", staffSchema);
