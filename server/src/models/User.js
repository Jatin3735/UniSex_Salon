import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["customer", "staff", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Never returned by a query unless explicitly selected.
    password: { type: String, required: true, select: false, minlength: 8 },
    mobile: { type: String, trim: true, default: "" },
    role: { type: String, enum: ROLES, default: "customer" },
    // Set on staff accounts so a dashboard can filter by staff id rather than
    // by display name (two people called "Ravi" must not share a calendar).
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },

    // ---- Customer profile (all optional, safe to add to existing docs) ----
    avatar: { type: String, default: "" },
    dob: { type: String, default: "" }, // "YYYY-MM-DD"
    // Free-form preferences (favourite stylist note, allergies, etc.).
    preferences: { type: String, default: "", trim: true, maxlength: 500 },
    // Services the customer has saved/favourited for quick re-booking.
    savedServices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    // Notification opt-ins. Cosmetic for this app but real, editable state.
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      offers: { type: Boolean, default: true },
    },
    // Soft account state. An admin may deactivate; a deactivated user cannot
    // authenticate (enforced in requireAuth / login).
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

/** Shape sent to the client — never includes the hash. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    role: this.role,
    avatar: this.avatar ?? "",
    dob: this.dob ?? "",
    preferences: this.preferences ?? "",
    savedServices: (this.savedServices ?? []).map((s) =>
      s?._id ? s._id.toString() : s.toString()
    ),
    notifications: {
      email: this.notifications?.email ?? true,
      sms: this.notifications?.sms ?? false,
      offers: this.notifications?.offers ?? true,
    },
    active: this.active !== false,
    createdAt: this.createdAt,
    // `staff` may be a raw ObjectId or a populated document.
    staffId: this.staff?._id
      ? this.staff._id.toString()
      : (this.staff?.toString() ?? null),
  };
};

export const User = mongoose.model("User", userSchema);
