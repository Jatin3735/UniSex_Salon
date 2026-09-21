/**
 * Opening hours and slot arithmetic. The server is the single authority on
 * availability — the client renders what this module decides.
 *
 * Times are "minutes since midnight" internally and "HH:MM" (zero-padded) on
 * the wire, so they sort lexicographically and never depend on a locale.
 */

export const OPEN_MINUTES = 10 * 60; // 10:00
export const CLOSE_MINUTES = 20 * 60; // 20:00
export const SLOT_STEP = 15;
export const MIN_LEAD_MINUTES = 30; // no walk-in bookings inside half an hour
export const MAX_ADVANCE_DAYS = 14;

// The salon's wall-clock timezone. Every "today"/"now" decision is made
// against this, NOT the host's local clock — otherwise a server deployed on a
// UTC PaaS host (the norm) would be ~5.5h behind IST and flag valid morning
// slots as "past", and disagree with the browser about what day it is near
// midnight. Overridable so the same code serves a salon in another region.
export const SALON_TZ = process.env.SALON_TZ?.trim() || "Asia/Kolkata";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// "en-CA" formats as YYYY-MM-DD, which is exactly our wire format.
const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SALON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: SALON_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function toTimeLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function toMinutes(label) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(label ?? ""));
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Every slot a customer could start at, ignoring duration. */
export function generateStartMinutes() {
  const out = [];
  for (let m = OPEN_MINUTES; m < CLOSE_MINUTES; m += SLOT_STEP) out.push(m);
  return out;
}

/**
 * The slots a booking physically occupies. A 90-minute service starting at
 * 11:00 owns 11:00 through 12:15 — which is what makes the unique index on
 * { staff, date, slotKeys } reject any overlapping booking.
 */
export function slotKeysFor(startMinutes, durationMins) {
  const keys = [];
  const span = Math.max(SLOT_STEP, Math.ceil(durationMins / SLOT_STEP) * SLOT_STEP);
  for (let m = startMinutes; m < startMinutes + span; m += SLOT_STEP) {
    keys.push(toTimeLabel(m));
  }
  return keys;
}

export function isValidDateISO(value) {
  if (!DATE_RE.test(String(value ?? ""))) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime()) && toDateISO(d) === value;
}

/** Local-date ISO. `toISOString()` would shift the day for anyone behind UTC. */
export function toDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date in the salon's timezone, not the host's. */
export function todayISO() {
  return dateFmt.format(new Date());
}

export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateISO(d);
}

/** Minutes since midnight in the salon's timezone. */
export function nowMinutes() {
  const [h, m] = timeFmt.format(new Date()).split(":");
  return Number(h) * 60 + Number(m);
}

export function isToday(iso) {
  return iso === todayISO();
}

/**
 * Why a given start time cannot be booked, or null when it can.
 * `takenKeys` is a Set of "HH:MM" already occupied for this staff and date.
 */
export function slotUnavailableReason(startMinutes, durationMins, dateISO, takenKeys) {
  if (startMinutes + durationMins > CLOSE_MINUTES) return "after-hours";
  if (isToday(dateISO) && startMinutes < nowMinutes() + MIN_LEAD_MINUTES) return "past";
  const keys = slotKeysFor(startMinutes, durationMins);
  if (keys.some((k) => takenKeys.has(k))) return "booked";
  return null;
}

/** Bookable window: today through today + MAX_ADVANCE_DAYS. */
export function isDateBookable(dateISO) {
  if (!isValidDateISO(dateISO)) return false;
  const today = todayISO();
  return dateISO >= today && dateISO <= addDaysISO(today, MAX_ADVANCE_DAYS);
}
