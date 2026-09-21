import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { createBooking } from "../../api/bookings.js";
import { useAuth } from "../../context/authContext.js";
import { useBooking } from "../../context/bookingContext.js";
import { PAYMENT_METHOD_LABELS, formatCurrency } from "../../lib/salon.js";
import { formatDateLabel, formatDuration, to12Hour } from "../../lib/time.js";

const METHODS = [
  { value: "upi", note: "Paid online, nothing to settle at the salon." },
  { value: "card", note: "Paid online, nothing to settle at the salon." },
  { value: "cash", note: "Your booking is confirmed; you pay at the chair." },
];

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { services, staff, date, startMinutes, hasSlot, totalPrice, totalDuration, clearDraft } =
    useBooking();

  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [slotGone, setSlotGone] = useState(false);

  // Guard each missing piece separately so the customer is sent back to the
  // exact step they still need, instead of the old dead-end error screen.
  if (services.length === 0) return <Navigate to="/services" replace />;
  if (!staff) return <Navigate to="/select-staff" replace />;
  if (!hasSlot) return <Navigate to="/select-slot" replace />;

  const handlePay = async () => {
    setBusy(true);
    setError(null);

    try {
      // Amount, token and payment status are all decided by the server from
      // its own price list — the client never sends them.
      const booking = await createBooking({
        staffId: staff.id,
        date,
        startMinutes,
        serviceIds: services.map((s) => s.id),
        paymentMethod: method,
      });

      clearDraft();
      navigate(`/token/${booking.token}`, { replace: true, state: { booking, justBooked: true } });
    } catch (err) {
      // Somebody else took the slot between picking and paying.
      if (err.status === 409) setSlotGone(true);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (slotGone) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">
          &#9203;
        </p>
        <h1 className="mt-4 text-2xl font-display font-light text-ivory">That slot just went</h1>
        <p className="mt-2 text-ivory-dim">
          Someone booked it while you were on this page. Nothing has been charged — pick another
          time and you&apos;re set.
        </p>
        <Link
          to="/select-slot"
          className="mt-6 inline-block rounded-lg bg-champagne px-6 py-3 font-semibold text-ink transition hover:bg-champagne-soft"
        >
          Pick another time
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-ash uppercase">Step 4 of 4</p>
      <h1 className="mt-1 text-3xl font-display font-light text-ivory">Confirm &amp; pay</h1>

      <section className="mt-8 rounded-2xl border border-ivory/10 bg-ink-800 p-6">
        <h2 className="font-display font-light text-ivory">Booking summary</h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ash">Customer</dt>
            <dd className="font-medium text-ivory">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ash">Stylist</dt>
            <dd className="font-medium text-ivory">{staff.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ash">When</dt>
            <dd className="font-medium text-ivory">
              {formatDateLabel(date)} at {to12Hour(startMinutes)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ash">Duration</dt>
            <dd className="font-medium text-ivory">{formatDuration(totalDuration)}</dd>
          </div>
        </dl>

        <ul className="mt-4 space-y-1 border-t border-ink-600 pt-4 text-sm">
          {services.map((s) => (
            <li key={s.id} className="flex justify-between text-ivory-dim">
              <span>{s.title}</span>
              <span>{formatCurrency(s.price)}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 flex justify-between border-t border-ink-600 pt-4 text-base font-bold text-ivory">
          <span>Total</span>
          <span>{formatCurrency(totalPrice)}</span>
        </p>

        <Link
          to="/select-slot"
          className="mt-4 inline-block text-sm font-medium text-ash underline hover:text-ivory"
        >
          Change time
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-ivory/10 bg-ink-800 p-6">
        <h2 className="font-display font-light text-ivory">Payment method</h2>

        <div className="mt-4 space-y-3">
          {METHODS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                method === option.value
                  ? "border-champagne bg-ink-700"
                  : "border-ink-600 hover:border-champagne/40"
              }`}
            >
              {/* A shared `name` was missing, so these behaved as three
                  independent checkboxes rather than one radio group. */}
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-ivory">
                  {PAYMENT_METHOD_LABELS[option.value]}
                </span>
                <span className="block text-xs text-ash">{option.note}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="mt-6 w-full rounded-lg bg-champagne px-6 py-4 text-lg font-semibold text-ink transition hover:bg-champagne-soft disabled:bg-ink-600 disabled:text-ash"
      >
        {busy
          ? "Confirming…"
          : method === "cash"
            ? `Confirm booking · pay ${formatCurrency(totalPrice)} at salon`
            : `Pay ${formatCurrency(totalPrice)}`}
      </button>

      <p className="mt-3 text-center text-xs text-ash">
        Demo project — no real payment is taken.
      </p>
    </div>
  );
}
