import { Link } from "react-router-dom";

import StatusBadge from "./StatusBadge.jsx";
import { formatCurrency, paymentMethodLabel } from "../lib/salon.js";
import { formatDateLabel, isUpcoming } from "../lib/time.js";

/**
 * One appointment. Used by My Bookings and both dashboards so the three
 * screens can't drift apart again — they previously read `b.status`, a field
 * Payment never wrote, so the status column was permanently blank.
 */
export default function BookingCard({
  booking,
  onCancel,
  busy = false,
  showCustomer = false,
  children,
}) {
  const services = Array.isArray(booking.services) ? booking.services : [];
  const canCancel =
    typeof onCancel === "function" && booking.status === "Pending" && isUpcoming(booking);

  return (
    <article className="rounded-2xl border border-ivory/10 bg-ink-800 p-5 shadow-sm shadow-black/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-widest text-ash uppercase">
            {booking.token}
          </p>
          <h3 className="mt-1 text-lg font-bold text-ivory">
            {services.map((s) => s.title).join(", ") || "Appointment"}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between sm:block">
          <dt className="text-ash">When</dt>
          <dd className="font-medium text-ivory">
            {formatDateLabel(booking.date)} &middot; {booking.startLabel}&ndash;{booking.endLabel}
          </dd>
        </div>

        <div className="flex justify-between sm:block">
          <dt className="text-ash">Stylist</dt>
          <dd className="font-medium text-ivory">{booking.staffName ?? "—"}</dd>
        </div>

        {showCustomer && booking.userName && (
          <div className="flex justify-between sm:block">
            <dt className="text-ash">Customer</dt>
            <dd className="font-medium text-ivory">
              {booking.userName}
              {booking.userMobile ? ` · ${booking.userMobile}` : ""}
            </dd>
          </div>
        )}

        <div className="flex justify-between sm:block">
          <dt className="text-ash">Amount</dt>
          <dd className="font-medium text-ivory">
            {formatCurrency(booking.amount)}{" "}
            <span className="text-ash">({paymentMethodLabel(booking.paymentMethod)})</span>
          </dd>
        </div>
      </dl>

      {(canCancel || children) && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-600 pt-4">
          <Link
            to={`/token/${booking.token}`}
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-semibold text-ivory-dim transition hover:bg-ink-700"
          >
            View pass
          </Link>

          {canCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(booking)}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              {busy ? "Cancelling…" : "Cancel"}
            </button>
          )}

          {children}
        </div>
      )}
    </article>
  );
}
