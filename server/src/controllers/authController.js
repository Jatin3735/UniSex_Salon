import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { asyncHandler, badRequest, unauthorized } from "../middleware/asyncHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;

function validateRegistration({ name, email, mobile, password }) {
  const errors = {};

  if (!name || name.trim().length < 2) errors.name = "Enter your full name.";
  if (!email || !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!mobile || !MOBILE_RE.test(String(mobile).replace(/\D/g, "")))
    errors.mobile = "Enter a 10-digit mobile number.";
  if (!password || password.length < 8)
    errors.password = "Password must be at least 8 characters.";

  return errors;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body ?? {};

  const errors = validateRegistration({ name, email, mobile, password });
  if (Object.keys(errors).length) throw badRequest("Please fix the highlighted fields.", errors);

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw badRequest("Please fix the highlighted fields.", {
      email: "An account with this email already exists.",
    });
  }

  // Role is deliberately not taken from the request body — self-registration
  // always produces a customer. Staff and admin accounts are seeded.
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    mobile: String(mobile).replace(/\D/g, ""),
    password,
    role: "customer",
  });

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw badRequest("Enter your email and password.");

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select(
    "+password"
  );

  // One message for both cases so the form cannot be used to discover which
  // email addresses have accounts.
  if (!user || !(await user.checkPassword(password))) {
    throw unauthorized("Incorrect email or password.");
  }
  if (user.active === false) {
    throw unauthorized("This account has been deactivated. Please contact the salon.");
  }

  res.json({ token: signToken(user), user: user.toPublic() });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});
