import { useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { fetchBookingByToken } from "../../api/bookings.js";
import { formatCurrency, paymentMethodLabel } from "../../lib/salon.js";
import { formatDateLabel, formatDuration, to12Hour } from "../../lib/time.js";
import { useAsync } from "../../lib/useAsync.js";

/**
 * The booking pass.
 *
 * Payment used to navigate to "/token", a route that didn't exist — the whole
 * flow ended on a blank white page. The token is now in the URL, so the pass
 * is shareable, reloadable and reachable from My Bookings.
 */
export default function Token() {
  const { token } = useParams();
  const location = useLocation();

  const justBooked = location.state?.justBooked ?? false;
  const seeded = location.state?.booking ?? null;

  const load = useCallback((signal) => fetchBookingByToken(token, { signal }), [token]);
  const { data, loading, error, reload } = useAsync(load, { enabled: Boolean(token) });

  // Render instantly from the booking we just created, then let the fetch
  // confirm it.
  const booking = data ?? seeded;

  if (loading && !booking) return <Loader label="Fetching your booking…" />;

  if (error && !booking) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <ErrorState message={error.message} onRetry={reload} />
        <div className="mt-6 text-center">
          <Link
            to="/my-bookings"
            className="text-sm font-semibold text-champagne underline hover:text-champagne-soft"
          >
            See all my bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-ivory-dim">No booking found for that token.</p>
        <Link
          to="/services"
          className="mt-6 inline-block rounded-lg bg-champagne px-6 py-3 font-semibold text-ink transition hover:bg-champagne-soft"
        >
          Book an appointment
        </Link>
      </div>
    );
  }

  const services = Array.isArray(booking.services) ? booking.services : [];

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="overflow-hidden rounded-2xl border border-ivory/10 bg-ink-800 shadow-lg shadow-black/40">
        <div className="bg-ink-700 px-6 py-8 text-center">
          <div className="text-5xl text-champagne" aria-hidden="true">
            &#10003;
          </div>
          <h1 className="mt-3 text-2xl font-display font-light text-ivory">
            {justBooked ? "Booking confirmed" : "Your booking"}
          </h1>
          <p className="mt-1 text-sm text-ivory-dim">Show this token at the salon counter</p>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-xl bg-ink py-4 text-center">
            <p className="text-xs tracking-widest text-ash uppercase">Token</p>
            <p className="font-mono text-3xl font-bold tracking-wider text-ivory">
              {booking.token}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ash">Name</dt>
              <dd className="text-right font-medium text-ivory">{booking.userName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ash">Stylist</dt>
              <dd className="text-right font-medium text-ivory">{booking.staffName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ash">When</dt>
              <dd className="text-right font-medium text-ivory">
                {formatDateLabel(booking.date)}
                <br />
                {to12Hour(booking.startMinutes)} &ndash; {booking.endLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ash">Services</dt>
              <dd className="text-right font-medium text-ivory">
                {/* `.join` on an absent array used to throw here. */}
                {services.map((s) => s.title).join(", ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ash">Duration</dt>
              <dd className="text-right font-medium text-ivory">
                {formatDuration(booking.durationMins)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-ink-600 pt-3">
              <dt className="text-ash">Amount</dt>
              <dd className="text-right font-bold text-ivory">
                {formatCurrency(booking.amount)}
                <span className="block text-xs font-normal text-ash">
                  {paymentMethodLabel(booking.paymentMethod)}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/my-bookings"
          className="rounded-lg bg-champagne px-6 py-3 text-sm font-semibold text-ink transition hover:bg-champagne-soft"
        >
          My bookings
        </Link>
        <Link
          to="/"
          className="rounded-lg border border-ink-600 px-6 py-3 text-sm font-semibold text-ivory-dim transition hover:bg-ink-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
