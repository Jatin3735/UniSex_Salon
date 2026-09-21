import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler, forbidden, unauthorized } from "./asyncHandler.js";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function bearerFrom(req) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

/** Rejects the request unless a valid, unexpired token names a real user. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = bearerFrom(req);
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized("Your session has expired. Please log in again.");
  }

  // Look the user up every time: a deleted or demoted account must lose
  // access immediately rather than when its token happens to expire.
  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized("Your session has expired. Please log in again.");
  // A deactivated account keeps its token but loses all access immediately.
  if (user.active === false) {
    throw unauthorized("This account has been deactivated. Please contact the salon.");
  }

  req.user = user;
  next();
});

/** Use after requireAuth. */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden(`This area is for ${roles.join(" / ")} accounts only.`));
    }
    next();
  };
