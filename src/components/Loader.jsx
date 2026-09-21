export default function Loader({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-champagne"
      />
      <p className="text-sm text-ash" role="status">
        {label}
      </p>
    </div>
  );
}
