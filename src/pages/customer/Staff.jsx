import { useCallback } from "react";
import { Link } from "react-router-dom";

import StaffCard from "../../components/StaffCard.jsx";
import Loader from "../../components/Loader.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchStaff } from "../../api/catalog.js";
import { useAsync } from "../../lib/useAsync.js";

/**
 * Read-only roster. It used to render <StaffCard> with no onSelect while
 * StaffCard called onSelect(staff) unconditionally, so every click threw.
 */
export default function Staff() {
  const load = useCallback((signal) => fetchStaff({ signal }), []);
  const { data, loading, error, reload } = useAsync(load);

  if (loading) return <Loader label="Loading the team…" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  const staff = data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-display font-light text-ivory">Meet the team</h1>
      <p className="mt-2 text-ivory-dim">
        Pick your services first and we&apos;ll show you who can do all of them.
      </p>

      {staff.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No stylists listed" message="Check back shortly." icon="&#128102;" />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {staff.map((member) => (
            <StaffCard key={member.id} staff={member} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/services"
          className="inline-block rounded-lg bg-champagne px-8 py-3 font-semibold text-ink transition hover:bg-champagne-soft"
        >
          Start booking
        </Link>
      </div>
    </div>
  );
}
