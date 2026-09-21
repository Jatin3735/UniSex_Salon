/** Turns a thrown error in an async handler into next(err). */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** An error with an HTTP status attached. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new ApiError(400, msg, details);
export const unauthorized = (msg = "Please log in to continue.") => new ApiError(401, msg);
export const forbidden = (msg = "You do not have access to this.") => new ApiError(403, msg);
export const notFound = (msg = "Not found.") => new ApiError(404, msg);
export const conflict = (msg) => new ApiError(409, msg);
