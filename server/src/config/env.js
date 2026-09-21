import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// server/.env — resolved relative to this file so the server can be started
// from any working directory (root `npm run dev`, or from inside server/).
dotenv.config({ path: path.resolve(here, "../../.env") });

const missing = [];

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    missing.push(name);
    return "";
  }
  return value.trim();
}

export const config = {
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || "http://localhost:5173",
  seedOnBoot: process.env.SEED_ON_BOOT?.trim() !== "false",
  isProd: process.env.NODE_ENV === "production",
  // Stack traces are only ever sent to a client when this is explicitly "true".
  // Defaulting off means a misconfigured NODE_ENV can't leak internals.
  debugErrors: process.env.DEBUG_ERRORS?.trim() === "true",
  // Rate limiters protect production but get in the way of the smoke test,
  // which fires many auth calls in a burst. Only ever disabled by an explicit
  // opt-in — a misconfiguration can't silently drop the protection.
  rateLimitDisabled: process.env.RATE_LIMIT_DISABLED?.trim() === "true",
};

/**
 * Fail loudly and usefully rather than dying with a cryptic mongoose error
 * three stack frames deep.
 */
export function assertConfig() {
  // A short JWT secret is brute-forceable, and a forged token can claim
  // role:"admin". Refuse to boot rather than run with a weak secret.
  if (config.jwtSecret && config.jwtSecret.length < 32) {
    console.error(
      [
        "",
        "  ✖ SalonX server cannot start — JWT_SECRET is too short.",
        "",
        "    It must be at least 32 characters. Generate a strong one with:",
        '      node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
        "",
        "    Put the result in server/.env as JWT_SECRET=...",
        "",
      ].join("\n")
    );
    process.exit(1);
  }

  if (missing.length === 0) return;

  console.error(
    [
      "",
      "  ✖ SalonX server cannot start — missing environment variables:",
      ...missing.map((name) => `      - ${name}`),
      "",
      "  Fix it in three steps:",
      "",
      "    1. cd server && cp .env.example .env      (Windows: copy .env.example .env)",
      "    2. Put a MongoDB connection string in MONGODB_URI.",
      "       Free cloud database: https://cloud.mongodb.com",
      "         mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/salonx",
      "    3. Put any long random string in JWT_SECRET:",
      '       node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
      "",
    ].join("\n")
  );
  process.exit(1);
}
