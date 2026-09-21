import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";

import { badRequest } from "./asyncHandler.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// server/uploads — created on boot if missing. Served statically by index.js.
export const UPLOAD_DIR = path.resolve(here, "../../uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8) || ".jpg";
    // Random name so uploads can't overwrite each other or be guessed.
    cb(null, `${crypto.randomBytes(12).toString("hex")}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(badRequest("Only JPEG, PNG, WebP or GIF images are allowed."));
  },
});

/** The public path a stored file is reachable at. */
export function publicUrlFor(filename) {
  return `/uploads/${filename}`;
}
