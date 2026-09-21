import mongoose from "mongoose";
import { slotKeysFor, toTimeLabel } from "../utils/slots.js";

export const BOOKING_STATUS = ["Pending", "Completed", "Cancelled", "No-show"];
export const PAYMENT_METHODS = ["upi", "card", "cash"];
export const PAYMENT_STATUS = ["Paid", "Pay at salon", "Refunded"];

/**
 * A snapshot of the service as booked. Prices change; a historical booking
 * must not silently change with them, and the duration has to survive on the
 * record or availability can never be recomputed.
 */
const bookedServiceSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    key: String,
    title: String,
    price: Number,
    duration: Number,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, uppercase: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: String,
    userEmail: String,
    userMobile: String,

    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    staffName: String,

    services: {
      type: [bookedServiceSchema],
      validate: [(v) => v.length > 0, "a booking needs at least one service"],
    },

    // Appointment date, distinct from createdAt. "YYYY-MM-DD", sortable.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true },
    durationMins: { type: Number, required: true },
    startLabel: String,
    endLabel: String,

    // Every 15-minute slot this booking occupies. Drives the overlap index.
    slotKeys: { type: [String], required: true },

    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, required: true },
    status: { type: String, enum: BOOKING_STATUS, default: "Pending" },

    // Mirrors "status !== Cancelled". Exists as its own field so the partial
    // index below can use a plain equality filter, which every MongoDB
    // version supports ($ne and $in in partialFilterExpression do not).
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * The heart of double-booking prevention.
 *
 * slotKeys is an array, so this is a multikey index: MongoDB indexes each
 * element separately and enforces uniqueness across documents. Two live
 * bookings for the same staff on the same date sharing even one 15-minute
 * slot collide with a duplicate-key error at write time — no read-then-write
 * race, no transaction required.
 *
 * The partial filter keeps cancelled bookings out of the index so their slots
 * are released for rebooking.
 */
bookingSchema.index(
  { staff: 1, date: 1, slotKeys: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

bookingSchema.index({ user: 1, date: -1 });
bookingSchema.index({ date: 1 });

/** Keep the derived time fields honest no matter who sets what. */
bookingSchema.pre("validate", function syncDerivedFields(next) {
  if (this.startMinutes != null && this.durationMins != null) {
    this.endMinutes = this.startMinutes + this.durationMins;
    this.startLabel = toTimeLabel(this.startMinutes);
    this.endLabel = toTimeLabel(this.endMinutes);
    if (!this.slotKeys || this.slotKeys.length === 0) {
      this.slotKeys = slotKeysFor(this.startMinutes, this.durationMins);
    }
  }
  this.active = this.status !== "Cancelled";
  next();
});

bookingSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    token: this.token,
    userName: this.userName,
    userEmail: this.userEmail,
    userMobile: this.userMobile,
    staffId: this.staff?._id ? this.staff._id.toString() : this.staff?.toString(),
    staffName: this.staffName,
    services: (this.services ?? []).map((s) => ({
      key: s.key,
      title: s.title,
      price: s.price,
      duration: s.duration,
    })),
    date: this.date,
    startMinutes: this.startMinutes,
    endMinutes: this.endMinutes,
    durationMins: this.durationMins,
    startLabel: this.startLabel,
    endLabel: this.endLabel,
    amount: this.amount,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    status: this.status,
    createdAt: this.createdAt,
  };
};

export const Booking = mongoose.model("Booking", bookingSchema);
