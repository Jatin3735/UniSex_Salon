/** A failed request. `onRetry` re-runs whatever load produced the error. */
export default function ErrorState({ message, onRetry, className = "" }) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center ${className}`}
    >
      <p className="font-semibold text-red-800">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-700">
        {message ?? "Please try again."}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white
                     transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
