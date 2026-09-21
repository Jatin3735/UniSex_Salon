import { asyncHandler, badRequest } from "../middleware/asyncHandler.js";
import { publicUrlFor } from "../middleware/upload.js";

/**
 * POST /api/uploads (multipart, field "image")
 *
 * Stores the file via the shared multer disk storage and returns the public
 * URL. Used by the admin panel (staff/service/offer/gallery images) and the
 * customer profile (avatar). The route wires `upload.single("image")` ahead of
 * this handler, so by here the file is already validated and on disk.
 */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest("No image received. Attach a file in the 'image' field.");
  res.status(201).json({ url: publicUrlFor(req.file.filename), filename: req.file.filename });
});
