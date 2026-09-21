/**
 * Date and time helpers.
 *
 * Deliberately a .js module: react-hooks/purity is an error in this project
 * and flags `new Date()` inside a component render body. Clock reads live
 * here and are called from event handlers or lazy useState initialisers.
 */

export const MAX_ADVANCE_DAYS = 14;

// Must match the server's SALON_TZ (server/src/utils/slots.js). "Today" and
// "now" are computed against the salon's wall clock so the date strip never
// offers a day the server then rejects, and never crosses a slot out as
// "past" on the customer's clock when the salon is still open.
export const SALON_TZ = "Asia/Kolkata";

const _dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SALON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const _timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: SALON_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local-date ISO. toISOString() would report yesterday for anyone behind UTC. */
export function toDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date in the salon's timezone (matches the server). */
export function todayISO() {
  return _dateFmt.format(new Date());
}

export function currentYear() {
  return new Date().getFullYear();
}

export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateISO(d);
}

export function maxDateISO() {
  return addDaysISO(todayISO(), MAX_ADVANCE_DAYS);
}

export function isToday(iso) {
  return iso === todayISO();
}

export function isPastDate(iso) {
  return iso < todayISO();
}

/** The next N bookable days, for the date strip. */
export function upcomingDates(count = 7) {
  const start = todayISO();
  return Array.from({ length: count }, (_, i) => addDaysISO(start, i));
}

export function formatDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Today" / "Tomorrow" / "Thu 12" — compact, for the date strip buttons. */
export function shortDateLabel(iso) {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDaysISO(today, 1)) return "Tomorrow";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

export function toTimeLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "10:00" -> "10:00 AM" */
export function to12Hour(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "1 hr 30 min" */
export function formatDuration(totalMinutes) {
  if (!totalMinutes) return "0 min";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/** True when the appointment is in the future (used to allow cancelling). */
export function isUpcoming(booking) {
  if (!booking?.date) return false;
  const today = todayISO();
  if (booking.date > today) return true;
  if (booking.date < today) return false;
  const [h, m] = _timeFmt.format(new Date()).split(":");
  return booking.startMinutes > Number(h) * 60 + Number(m);
}
