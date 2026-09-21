import { statusClasses } from "../lib/salon.js";

/** Small pill for a booking or payment status. */
export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(status)} ${className}`}
    >
      {status}
    </span>
  );
}
