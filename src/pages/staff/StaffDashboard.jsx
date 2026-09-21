import { useCallback, useState } from "react";

import BookingCard from "../../components/BookingCard.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchStaffBookings, updateBookingStatus } from "../../api/bookings.js";
import { useAuth } from "../../context/authContext.js";
import { formatCurrency } from "../../lib/salon.js";
import { formatDateLabel, isUpcoming, todayISO } from "../../lib/time.js";
import { useAsync } from "../../lib/useAsync.js";

/**
 * The logged-in stylist's own calendar.
 *
 * The old version read localStorage, hardcoded staffName = "Ravi", and read a
 * `b.status` field Payment never wrote (so Status was always blank). It now
 * fetches the server-filtered calendar for whichever staff account is signed
 * in and lets them progress each appointment.
 */

// What a stylist is allowed to do to a Pending appointment.
const ACTIONS = [
  { status: "Completed", label: "Mark done", cls: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
  { status: "No-show", label: "No-show", cls: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { status: "Cancelled", label: "Cancel", cls: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
];

export default function StaffDashboard() {
  const { user } = useAuth();
  const load = useCallback((signal) => fetchStaffBookings({}, { signal }), []);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const applyStatus = async (booking, status) => {
    setPendingId(booking.id);
    setActionError(null);
    try {
      const updated = await updateBookingStatus(booking.id, status);
      setData((data ?? []).map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  if (loading) return <Loader label="Loading your schedule…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  const bookings = data ?? [];
  const today = todayISO();
  const todays = bookings.filter((b) => b.date === today);
  const upcoming = bookings.filter((b) => b.date > today);
  const earlier = bookings.filter((b) => b.date < today);

  const pendingCount = bookings.filter((b) => b.status === "Pending" && isUpcoming(b)).length;
  const earned = bookings
    .filter((b) => b.status === "Completed")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

  const actionsFor = (booking) =>
    booking.status === "Pending" ? (
      <>
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={pendingId === booking.id}
            onClick={() => applyStatus(booking, action.status)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${action.cls}`}
          >
            {action.label}
          </button>
        ))}
      </>
    ) : null;

  const renderGroup = (title, list) =>
    list.length > 0 && (
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-display font-light text-ivory">
          {title} <span className="text-ash">({list.length})</span>
        </h2>
        <div className="space-y-4">
          {list.map((booking) => (
            <BookingCard key={booking.id} booking={booking} showCustomer>
              {actionsFor(booking)}
            </BookingCard>
          ))}
        </div>
      </section>
    );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-ash uppercase">Staff</p>
        <h1 className="mt-1 text-3xl font-display font-light text-ivory">
          {user?.name ? `${user.name.split(" ")[0]}'s schedule` : "My schedule"}
        </h1>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-5">
          <p className="text-2xl font-bold text-ivory">{todays.length}</p>
          <p className="mt-1 text-xs tracking-wide text-ash uppercase">Today</p>
        </div>
        <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-5">
          <p className="text-2xl font-bold text-ivory">{pendingCount}</p>
          <p className="mt-1 text-xs tracking-wide text-ash uppercase">Still pending</p>
        </div>
        <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-5">
          <p className="text-2xl font-bold text-ivory">{formatCurrency(earned)}</p>
          <p className="mt-1 text-xs tracking-wide text-ash uppercase">Completed value</p>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {bookings.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No appointments yet"
            message="When customers book you, they'll appear here grouped by day."
            icon="&#9986;"
          />
        </div>
      ) : (
        <>
          {renderGroup(`Today · ${formatDateLabel(today)}`, todays)}
          {renderGroup("Upcoming", upcoming)}
          {renderGroup("Earlier", earlier)}
        </>
      )}
    </div>
  );
}
