import { useCallback } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import DateStrip from "../../components/DateStrip.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { fetchAvailability } from "../../api/bookings.js";
import { useBooking } from "../../context/bookingContext.js";
import { formatCurrency } from "../../lib/salon.js";
import { formatDateLabel, formatDuration, to12Hour, todayISO } from "../../lib/time.js";
import { useAsync } from "../../lib/useAsync.js";

const REASON_LABEL = {
  booked: "Already booked",
  past: "Time has passed",
  "after-hours": "Would run past closing",
};

export default function SlotSelect() {
  const navigate = useNavigate();
  const {
    services,
    serviceIds,
    staff,
    date,
    startMinutes,
    setDate,
    setSlot,
    totalPrice,
    totalDuration,
  } = useBooking();

  // Default to today rather than rendering with no date at all.
  const activeDate = date ?? todayISO();
  const idsKey = serviceIds.join(",");
  const staffId = staff?.id;

  const load = useCallback(
    (signal) =>
      fetchAvailability(
        { staffId, date: activeDate, serviceIds: idsKey.split(",").filter(Boolean) },
        { signal }
      ),
    [staffId, activeDate, idsKey]
  );

  const { data, loading, error, reload } = useAsync(load, {
    enabled: Boolean(staffId) && serviceIds.length > 0,
  });

  // Deep-linked without a draft. The old page read `staff.name` unguarded here
  // and threw a TypeError on a blank screen.
  if (serviceIds.length === 0) return <Navigate to="/services" replace />;
  if (!staff) return <Navigate to="/select-staff" replace />;

  const slots = data?.slots ?? [];
  const freeCount = slots.filter((s) => s.available).length;

  const handlePick = (slot) => {
    if (!slot.available) return;
    // The date may still be the implicit default; commit it with the slot.
    if (date !== activeDate) setDate(activeDate);
    setSlot(slot.start);
  };

  const chosen = slots.find((s) => s.start === startMinutes && s.available);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-ash uppercase">Step 3 of 4</p>
        <h1 className="mt-1 text-3xl font-display font-light text-ivory">Pick a time</h1>
        <p className="mt-2 text-ivory-dim">
          with <span className="font-semibold text-ivory">{staff.name}</span> &middot;{" "}
          {formatDuration(totalDuration)} &middot; {formatCurrency(totalPrice)}
        </p>
        <Link
          to="/select-staff"
          className="mt-1 inline-block text-sm font-medium text-ash underline hover:text-ivory"
        >
          Change stylist
        </Link>
      </header>

      <div className="mt-8">
        <DateStrip
          value={activeDate}
          onChange={(next) => {
            setDate(next);
          }}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <Loader label="Checking the calendar…" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display font-light text-ivory">{formatDateLabel(activeDate)}</h2>
              <p className="text-sm text-ash">
                {freeCount > 0
                  ? `${freeCount} slot${freeCount > 1 ? "s" : ""} free`
                  : "Fully booked"}
              </p>
            </div>

            {freeCount === 0 && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Nothing free on this date for a {formatDuration(totalDuration)} appointment. Try
                another day.
              </p>
            )}

            <div
              role="group"
              aria-label="Available times"
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
            >
              {slots.map((slot) => {
                const active = slot.start === startMinutes;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!slot.available}
                    aria-pressed={active}
                    title={slot.available ? `Ends ${slot.endLabel}` : REASON_LABEL[slot.reason]}
                    onClick={() => handlePick(slot)}
                    className={`rounded-xl border px-2 py-3 text-sm font-semibold transition
                      ${
                        active
                          ? "border-champagne bg-champagne text-ink"
                          : slot.available
                            ? "border-ink-600 bg-ink-700 text-ivory-dim hover:border-champagne"
                            : "cursor-not-allowed border-ink-600 bg-ink-800 text-ash line-through"
                      }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-ash">
              Crossed-out times are booked, already past, or too late to finish before we close at{" "}
              {data?.closeLabel ?? "20:00"}.
            </p>
          </>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-ivory/10 bg-ink-800 p-5">
        <p className="text-sm font-semibold text-ivory">
          {services.length} service{services.length > 1 ? "s" : ""}:{" "}
          {services.map((s) => s.title).join(", ")}
        </p>

        {chosen ? (
          <p className="mt-2 text-sm text-ivory-dim">
            {formatDateLabel(activeDate)} at{" "}
            <span className="font-semibold text-ivory">{to12Hour(chosen.start)}</span>, finishing
            around {chosen.endLabel}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ash">Select a time above to continue.</p>
        )}

        <button
          type="button"
          disabled={!chosen}
          onClick={() => navigate("/payment")}
          className="mt-4 w-full rounded-lg bg-champagne px-6 py-4 font-semibold text-ink transition hover:bg-champagne-soft disabled:cursor-not-allowed disabled:bg-ink-600 disabled:text-ash"
        >
          {chosen ? `Continue to payment \u2192` : "Pick a time to continue"}
        </button>
      </div>
    </div>
  );
}
