import { useCallback, useMemo, useState } from "react";

import BookingCard from "../../components/BookingCard.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchAllBookings, updateBookingStatus } from "../../api/bookings.js";
import { BOOKING_STATUSES, formatCurrency } from "../../lib/salon.js";
import { useAsync } from "../../lib/useAsync.js";

/**
 * Every booking, for admins.
 *
 * The old version read localStorage, called `b.services.join(", ")` on data
 * that was an array of objects (so it printed "[object Object]"), and read a
 * `b.status` field that never existed. It now reads the API, and status
 * changes persist server-side.
 */

const FILTERS = ["All", ...BOOKING_STATUSES];

export default function AdminDashboard() {
  const load = useCallback((signal) => fetchAllBookings({}, { signal }), []);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [filter, setFilter] = useState("All");
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const bookings = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const revenue = bookings
      .filter((b) => b.status !== "Cancelled" && b.paymentStatus === "Paid")
      .reduce((sum, b) => sum + (b.amount ?? 0), 0);
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "Pending").length,
      completed: bookings.filter((b) => b.status === "Completed").length,
      revenue,
    };
  }, [bookings]);

  const visible =
    filter === "All" ? bookings : bookings.filter((b) => b.status === filter);

  const changeStatus = async (booking, status) => {
    if (status === booking.status) return;
    setPendingId(booking.id);
    setActionError(null);
    try {
      const updated = await updateBookingStatus(booking.id, status);
      setData(bookings.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  if (loading) return <Loader label="Loading all bookings…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-ash uppercase">Admin</p>
        <h1 className="mt-1 text-3xl font-display font-light text-ivory">All bookings</h1>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { value: stats.total, label: "Total" },
          { value: stats.pending, label: "Pending" },
          { value: stats.completed, label: "Completed" },
          { value: formatCurrency(stats.revenue), label: "Paid revenue" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-ivory/10 bg-ink-800 p-5">
            <p className="text-2xl font-bold text-ivory">{stat.value}</p>
            <p className="mt-1 text-xs tracking-wide text-ash uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              filter === option
                ? "border-champagne bg-champagne text-ink"
                : "border-ivory/10 bg-ink-800 text-ivory-dim hover:border-champagne/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={filter === "All" ? "No bookings yet" : `No ${filter.toLowerCase()} bookings`}
            message={
              filter === "All"
                ? "Bookings will appear here as customers make them."
                : "Try a different filter."
            }
            icon="&#128203;"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {visible.map((booking) => (
            <BookingCard key={booking.id} booking={booking} showCustomer>
              <label className="ml-auto flex items-center gap-2 text-sm text-ash">
                <span>Status</span>
                <select
                  value={booking.status}
                  disabled={pendingId === booking.id}
                  onChange={(e) => changeStatus(booking, e.target.value)}
                  className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm font-semibold text-ivory focus:border-champagne focus:outline-none disabled:opacity-50"
                >
                  {BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </BookingCard>
          ))}
        </div>
      )}
    </div>
  );
}
