import { config } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export function errorHandler(err, req, res, next) {
  let status = err.status ?? 500;
  let message = err.message ?? "Something went wrong.";
  let details = err.details;

  // Mongoose validation → 400 with per-field messages
  if (err.name === "ValidationError") {
    status = 400;
    message = "Some fields are invalid.";
    details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
  }

  // Bad ObjectId in a URL param
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}.`;
  }

  // Duplicate key. The slot index is the interesting one — it means someone
  // else booked this time between the availability check and the write.
  if (err.code === 11000) {
    status = 409;
    const keys = Object.keys(err.keyPattern ?? {});
    if (keys.includes("slotKeys")) {
      message = "That time was just booked by someone else. Please pick another slot.";
    } else if (keys.includes("email")) {
      message = "An account with that email already exists.";
    } else {
      message = "That record already exists.";
    }
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
    // Only expose a stack when explicitly opted in (DEBUG_ERRORS=true), never
    // by default — a leaked stack reveals file paths and internals.
    ...(config.debugErrors && status >= 500 ? { stack: err.stack } : {}),
  });
}
