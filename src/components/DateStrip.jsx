import { shortDateLabel, upcomingDates, maxDateISO, todayISO } from "../lib/time.js";

/**
 * Horizontal day picker plus a native date input for anything further out.
 *
 * The original slot page had no date at all — every booking was implicitly
 * "today", and the booked-slot list lived in useState so it vanished on
 * navigation.
 */
export default function DateStrip({ value, onChange, days = 7 }) {
  const dates = upcomingDates(days);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((iso) => {
          const active = iso === value;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              aria-pressed={active}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold transition
                ${
                  active
                    ? "border-champagne bg-champagne text-ink"
                    : "border-ivory/10 bg-ink-800 text-ivory-dim hover:border-champagne/40"
                }`}
            >
              {shortDateLabel(iso)}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-3 text-sm text-ash">
        <span>Or pick a date:</span>
        <input
          type="date"
          value={value ?? ""}
          min={todayISO()}
          max={maxDateISO()}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ivory placeholder-ash focus:border-champagne focus:outline-none"
        />
      </label>
    </div>
  );
}
