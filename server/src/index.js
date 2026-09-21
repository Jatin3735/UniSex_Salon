import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { pathToFileURL } from "node:url";

import { assertConfig, config } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { UPLOAD_DIR } from "./middleware/upload.js";
import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import publicRoutes from "./routes/public.routes.js";
import { demoAccountsBanner, seed } from "./utils/seed.js";

// A no-op passthrough so the limiters can be switched off wholesale (see the
// RATE_LIMIT_DISABLED opt-in) without threading conditionals through the routes.
const passthrough = (req, res, next) => next();

// Tight throttle on the credential endpoints — the one place a bad actor
// brute-forces passwords or enumerates accounts. Keyed by IP.
const authLimiter = config.rateLimitDisabled
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 8,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many attempts. Please wait a few minutes and try again." },
    });

// A looser ceiling on the rest of the API to blunt scraping / abuse.
const apiLimiter = config.rateLimitDisabled
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests. Please slow down." },
    });

export function createApp() {
  const app = express();

  // Behind a proxy (most PaaS hosts) so express-rate-limit sees the real
  // client IP from X-Forwarded-For rather than the proxy's.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  // Strip any $-prefixed / dotted keys from body, query and params so a
  // crafted payload cannot smuggle Mongo query operators into a filter.
  app.use(mongoSanitize());

  app.get("/api/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

  // Uploaded images (avatars, staff/service/offer/gallery photos). Served with
  // a long cache since filenames are random and content-addressed on write.
  app.use(
    "/uploads",
    express.static(UPLOAD_DIR, {
      maxAge: "7d",
      // Only ever serve files, never a directory listing.
      index: false,
      fallthrough: true,
    })
  );

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api", apiLimiter);
  app.use("/api/services", serviceRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/bookings", bookingRoutes);
  // Public read-only content (offers, announcements, reviews, gallery).
  app.use("/api", publicRoutes);
  // Signed-in user's own profile + appointments + saved services.
  app.use("/api/profile", profileRoutes);
  // Admin-only management surface (guarded inside the router).
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function start() {
  console.log("\n  SalonX API\n");
  assertConfig();
  await connectDb();

  if (config.seedOnBoot) await seed();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`  ✔ API listening on http://localhost:${config.port}`);
    console.log(`  ✔ Allowing requests from ${config.clientOrigin}\n`);
    console.log(demoAccountsBanner() + "\n");
  });
}

// A rejected promise anywhere must not leave a half-dead server running.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

// Only boot when run directly (`node src/index.js`). Tests import `createApp`
// and drive their own listener, and must not trigger a second server here.
const isEntrypoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) start();
