import { useCallback, useState } from "react";
import { Star, Trash2, Check, X } from "lucide-react";

import { fetchReviews, updateReview, deleteReview } from "../../../api/admin.js";
import { useAsync } from "../../../lib/useAsync.js";
import { formatDateLabel } from "../../../lib/time.js";
import { useToast } from "../../../components/admin/toastContext.js";
import {
  ConfirmDialog,
  PrimaryButton,
  GhostButton,
  SectionLoader,
  SectionError,
  SectionEmpty,
  Pill,
} from "../../../components/admin/ui.jsx";
import { Toolbar, FilterSelect } from "./parts.jsx";

function Stars({ rating }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= rating ? "fill-champagne text-champagne" : "text-ink-600"}
        />
      ))}
    </span>
  );
}

export default function ReviewsSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");

  const load = useCallback((signal) => fetchReviews({ status }, { signal }), [status]);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const all = data ?? [];
  const q = query.trim().toLowerCase();
  const reviews = q
    ? all.filter((r) => `${r.name} ${r.text}`.toLowerCase().includes(q))
    : all;

  const patch = async (r, body) => {
    setBusyId(r.id);
    try {
      const updated = await updateReview(r.id, body);
      setData(all.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      toast.error(err.message || "Could not update the review.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteReview(confirm.id);
      setData(all.filter((r) => r.id !== confirm.id));
      toast.success("Review deleted.");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Toolbar>
        <FilterSelect value={status} onChange={setStatus} label="Status">
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </FilterSelect>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading reviews…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : reviews.length === 0 ? (
        <SectionEmpty title="No reviews" message="Customer reviews will appear here for moderation." icon={Star} />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ivory/10 bg-ink-800 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ivory">{r.name}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="mt-0.5 text-xs text-ash">{formatDateLabel(r.createdAt?.slice?.(0, 10))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill tone={r.approved ? "on" : "warn"}>{r.approved ? "Approved" : "Pending"}</Pill>
                  {r.featured && <Pill tone="gold">Featured</Pill>}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">{r.text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => patch(r, { approved: !r.approved })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ivory-dim transition hover:border-green-400/40 hover:text-green-300 disabled:opacity-50"
                >
                  {r.approved ? <X size={13} /> : <Check size={13} />}
                  {r.approved ? "Unapprove" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => patch(r, { featured: !r.featured })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ivory-dim transition hover:border-champagne hover:text-champagne-soft disabled:opacity-50"
                >
                  <Star size={13} />
                  {r.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(r)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ash transition hover:border-red-400/40 hover:text-red-300"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Delete review?"
        message={`The review from "${confirm?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
