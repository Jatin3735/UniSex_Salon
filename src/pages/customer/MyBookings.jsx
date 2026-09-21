import { useCallback, useState } from "react";

import BookingCard from "../../components/BookingCard.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchMyBookings, updateBookingStatus } from "../../api/bookings.js";
import { isUpcoming } from "../../lib/time.js";
import { useAsync } from "../../lib/useAsync.js";

/**
 * New page. Previously a customer could never see a booking again once they
 * left the token screen — nothing listed them.
 */
export default function MyBookings() {
  const load = useCallback((signal) => fetchMyBookings({ signal }), []);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel your ${booking.startLabel} appointment on ${booking.date}?`)) {
      return;
    }

    setCancellingId(booking.id);
    setCancelError(null);

    try {
      const updated = await updateBookingStatus(booking.id, "Cancelled");
      setData((data ?? []).map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loader label="Loading your bookings…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  const bookings = data ?? [];
  const upcoming = bookings.filter((b) => b.status === "Pending" && isUpcoming(b));
  const upcomingIds = new Set(upcoming.map((b) => b.id));
  const past = bookings.filter((b) => !upcomingIds.has(b.id));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-display font-light text-ivory">My bookings</h1>

      {cancelError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {cancelError}
        </p>
      )}

      {bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No bookings yet"
            message="When you book an appointment it'll show up here, along with your token."
            actionLabel="Book an appointment"
            actionTo="/services"
          />
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-display font-light text-ivory">
              Upcoming {upcoming.length > 0 && <span className="text-ash">({upcoming.length})</span>}
            </h2>

            {upcoming.length === 0 ? (
              <EmptyState
                title="Nothing coming up"
                message="Book your next appointment whenever you're ready."
                actionLabel="Book an appointment"
                actionTo="/services"
              />
            ) : (
              <div className="space-y-4">
                {upcoming.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancel}
                    busy={cancellingId === booking.id}
                  />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-display font-light text-ivory">
                History <span className="text-ash">({past.length})</span>
              </h2>
              <div className="space-y-4">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
