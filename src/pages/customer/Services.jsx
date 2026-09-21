import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import ServiceCard from "../../components/ServiceCard.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchServices } from "../../api/catalog.js";
import { useBooking } from "../../context/bookingContext.js";
import { categoryLabel, formatCurrency } from "../../lib/salon.js";
import { formatDuration } from "../../lib/time.js";
import { useAsync } from "../../lib/useAsync.js";

const ORDER = ["men", "women"];

export default function Services() {
  const navigate = useNavigate();
  const { services: selected, isSelected, toggleService, totalPrice, totalDuration } = useBooking();

  // The catalogue used to be hardcoded here, in Staff.jsx and again in
  // StaffSelect.jsx — three lists that disagreed with each other.
  const load = useCallback((signal) => fetchServices({ signal }), []);
  const { data, loading, error, reload } = useAsync(load);

  if (loading) return <Loader label="Loading services…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  const all = data ?? [];

  if (all.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <EmptyState
          title="No services yet"
          message="The salon hasn't published its price list. Try again shortly."
          icon="&#9986;"
        />
      </div>
    );
  }

  const groups = ORDER.map((category) => ({
    category,
    items: all.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pb-32">
      <header>
        <p className="text-sm font-semibold tracking-wide text-ash uppercase">Step 1 of 4</p>
        <h1 className="mt-1 text-3xl font-display font-light text-ivory">Choose your services</h1>
        <p className="mt-2 text-ivory-dim">
          Pick as many as you like. We&apos;ll only show stylists who can do all of them.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.category} className="mt-10">
          <h2 className="mb-4 text-xl font-display font-light text-ivory">
            {categoryLabel(group.category)}
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={isSelected(service.id)}
                onSelect={toggleService}
              />
            ))}
          </div>
        </section>
      ))}

      {/* STICKY BASKET */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-600 bg-ink-800/95 px-6 py-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-semibold text-ivory">
                {selected.length} service{selected.length > 1 ? "s" : ""} &middot;{" "}
                {formatCurrency(totalPrice)}
              </p>
              <p className="text-ash">About {formatDuration(totalDuration)} in the chair</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/select-staff")}
              className="rounded-lg bg-champagne px-8 py-3 font-semibold text-ink transition hover:bg-champagne-soft"
            >
              Choose a stylist &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
