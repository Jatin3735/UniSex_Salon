import { useCallback } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import StaffCard from "../../components/StaffCard.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchAvailableStaff } from "../../api/catalog.js";
import { useBooking } from "../../context/bookingContext.js";
import { formatCurrency, skillLabel } from "../../lib/salon.js";
import { formatDuration } from "../../lib/time.js";
import { useAsync } from "../../lib/useAsync.js";

export default function StaffSelect() {
  const navigate = useNavigate();
  const { services, serviceIds, staff: chosen, setStaff, totalPrice, totalDuration } = useBooking();

  const idsKey = serviceIds.join(",");

  // The server answers "who can do ALL of these", replacing a client-side
  // SERVICE_SKILL_MAP that had no entry for Hair Styling or Spa (so those
  // matched nobody) and used .some() (so one shared skill was enough).
  const load = useCallback(
    (signal) => fetchAvailableStaff(idsKey.split(",").filter(Boolean), { signal }),
    [idsKey]
  );
  const { data, loading, error, reload } = useAsync(load, { enabled: serviceIds.length > 0 });

  // Deep-linked here without picking services first.
  if (serviceIds.length === 0) return <Navigate to="/services" replace />;

  if (loading) return <Loader label="Finding available stylists…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  const available = data?.staff ?? [];
  const requiredSkills = data?.requiredSkills ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-ash uppercase">Step 2 of 4</p>
        <h1 className="mt-1 text-3xl font-display font-light text-ivory">Choose your stylist</h1>
      </header>

      <div className="mt-6 rounded-2xl border border-ivory/10 bg-ink-800 p-5">
        <p className="text-sm font-semibold text-ivory">Your selection</p>
        <ul className="mt-2 space-y-1 text-sm text-ivory-dim">
          {services.map((s) => (
            <li key={s.id} className="flex justify-between">
              <span>{s.title}</span>
              <span>{formatCurrency(s.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-ink-600 pt-3 text-sm font-semibold text-ivory">
          <span>Total &middot; {formatDuration(totalDuration)}</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
        <Link
          to="/services"
          className="mt-3 inline-block text-sm font-medium text-ash underline hover:text-ivory"
        >
          Change services
        </Link>
      </div>

      {available.length === 0 ? (
        <div className="mt-8">
          {/* Previously this rendered an empty grid with no explanation. */}
          <EmptyState
            title="Nobody covers that whole combination"
            message={`We need one stylist with all of: ${requiredSkills.map(skillLabel).join(", ")}. Try booking these as separate appointments, or drop a service.`}
            actionLabel="Change services"
            actionTo="/services"
            icon="&#128533;"
          />
        </div>
      ) : (
        <>
          <p className="mt-8 mb-4 text-sm text-ivory-dim">
            {available.length} stylist{available.length > 1 ? "s" : ""} can do everything you
            selected.
          </p>

          <div className="space-y-4">
            {available.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                selected={chosen?.id === member.id}
                onSelect={setStaff}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={!chosen}
            onClick={() => navigate("/select-slot")}
            className="mt-8 w-full rounded-lg bg-champagne px-6 py-4 font-semibold text-ink transition hover:bg-champagne-soft disabled:cursor-not-allowed disabled:bg-ink-600 disabled:text-ash"
          >
            {chosen ? `Continue with ${chosen.name} \u2192` : "Select a stylist to continue"}
          </button>
        </>
      )}
    </div>
  );
}
