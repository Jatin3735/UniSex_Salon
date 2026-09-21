import { Link } from "react-router-dom";

/**
 * Shown wherever a list can legitimately come back empty. Every grid in the
 * original app rendered nothing at all in that case, which read as a bug.
 */
export default function EmptyState({ title, message, actionLabel, actionTo, onAction, icon = "🗓️" }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-600 bg-ink px-6 py-12 text-center">
      <div className="mb-3 text-4xl" aria-hidden="true">
        {icon}
      </div>

      <h2 className="text-lg font-semibold text-ivory">{title}</h2>

      {message && <p className="mx-auto mt-2 max-w-md text-sm text-ash">{message}</p>}

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 inline-block rounded-lg bg-champagne px-6 py-3 text-sm font-semibold
                     text-ink transition hover:bg-champagne-soft"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionTo && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-champagne px-6 py-3 text-sm font-semibold text-ink
                     transition hover:bg-champagne-soft"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
