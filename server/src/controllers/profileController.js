import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Service } from "../models/Service.js";
import { Booking } from "../models/Booking.js";
import { asyncHandler, badRequest, forbidden, unauthorized } from "../middleware/asyncHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /api/profile — the signed-in user's own profile. */
export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

/**
 * PUT /api/profile
 *
 * A user edits their own name / mobile / avatar / dob / preferences /
 * notifications. Protected fields (role, admin privileges, active, email
 * uniqueness bypass, password) are deliberately NOT writable here — a
 * customer must never be able to elevate themselves to admin by editing
 * their profile. `role` and `active` in the body are ignored.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const b = req.body ?? {};
  const errors = {};
  const user = req.user;

  if (b.name !== undefined) {
    if (String(b.name).trim().length < 2) errors.name = "Enter your full name.";
    else user.name = String(b.name).trim();
  }
  if (b.mobile !== undefined) {
    const mobile = String(b.mobile).replace(/\D/g, "");
    if (!MOBILE_RE.test(mobile)) errors.mobile = "Enter a 10-digit mobile number.";
    else user.mobile = mobile;
  }
  if (b.email !== undefined) {
    const email = String(b.email).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      errors.email = "Enter a valid email address.";
    } else if (email !== user.email) {
      const clash = await User.exists({ email, _id: { $ne: user._id } });
      if (clash) errors.email = "An account with this email already exists.";
      else user.email = email;
    }
  }
  if (b.avatar !== undefined) user.avatar = String(b.avatar).trim();
  if (b.dob !== undefined) {
    const dob = String(b.dob).trim();
    if (dob && !DATE_RE.test(dob)) errors.dob = "Date of birth must be YYYY-MM-DD.";
    else user.dob = dob;
  }
  if (b.preferences !== undefined) {
    const prefs = String(b.preferences).trim();
    if (prefs.length > 500) errors.preferences = "Preferences must be 500 characters or fewer.";
    else user.preferences = prefs;
  }
  if (b.notifications !== undefined && typeof b.notifications === "object") {
    const n = b.notifications;
    if (n.email !== undefined) user.notifications.email = Boolean(n.email);
    if (n.sms !== undefined) user.notifications.sms = Boolean(n.sms);
    if (n.offers !== undefined) user.notifications.offers = Boolean(n.offers);
  }

  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);

  await user.save();
  res.json({ user: user.toPublic() });
});

/**
 * PUT /api/profile/password
 *
 * Requires the current password. The pre-save hook re-hashes; the plaintext
 * is never stored or logged, and the existing hash is never exposed.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) throw badRequest("Enter your current and new password.");
  if (String(newPassword).length < 8) {
    throw badRequest("Please fix the highlighted fields.", {
      newPassword: "Password must be at least 8 characters.",
    });
  }

  // The default query excludes the hash; select it explicitly to verify.
  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.checkPassword(currentPassword))) {
    throw badRequest("Please fix the highlighted fields.", {
      currentPassword: "Current password is incorrect.",
    });
  }

  user.password = String(newPassword);
  await user.save();
  res.json({ ok: true });
});

/** GET /api/profile/bookings — the signed-in user's own bookings. */
export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort({ date: -1, startMinutes: -1 });
  res.json({ bookings: bookings.map((b) => b.toPublic()) });
});

/** GET /api/profile/saved-services — resolves saved service ids to live docs. */
export const listSavedServices = asyncHandler(async (req, res) => {
  const ids = (req.user.savedServices ?? []).filter(Boolean);
  const services = await Service.find({ _id: { $in: ids }, active: true }).sort({ title: 1 });
  res.json({
    services: services.map((s) => ({
      id: s._id.toString(),
      key: s.key,
      title: s.title,
      desc: s.desc,
      price: s.price,
      duration: s.duration,
      image: s.image,
      category: s.category,
    })),
  });
});

/** POST /api/profile/saved-services/:serviceId — save (toggle on). */
export const saveService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  if (!mongoose.isValidObjectId(serviceId)) throw badRequest("Invalid service id.");
  const exists = await Service.exists({ _id: serviceId });
  if (!exists) throw badRequest("That service no longer exists.");

  await User.updateOne({ _id: req.user._id }, { $addToSet: { savedServices: serviceId } });
  const user = await User.findById(req.user._id);
  res.json({ savedServices: user.toPublic().savedServices });
});

/** DELETE /api/profile/saved-services/:serviceId — unsave (toggle off). */
export const unsaveService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  if (!mongoose.isValidObjectId(serviceId)) throw badRequest("Invalid service id.");
  await User.updateOne({ _id: req.user._id }, { $pull: { savedServices: serviceId } });
  const user = await User.findById(req.user._id);
  res.json({ savedServices: user.toPublic().savedServices });
});

/**
 * POST /api/profile/deactivate
 *
 * A customer may deactivate their own account (requires password confirmation).
 * Admins are blocked from self-deactivating to avoid locking out the panel.
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") throw forbidden("Admin accounts cannot be deactivated here.");

  const { password } = req.body ?? {};
  if (!password) throw badRequest("Confirm your password to deactivate your account.");

  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.checkPassword(password))) throw unauthorized("Incorrect password.");

  user.active = false;
  await user.save();
  res.json({ ok: true });
});
