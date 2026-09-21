import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="text-6xl font-bold text-ink-600">404</p>
      <h1 className="mt-4 text-2xl font-display font-light text-ivory">Page not found</h1>
      <p className="mt-2 text-ash">
        That link doesn&apos;t go anywhere. It may have moved, or never existed.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-champagne px-6 py-3 text-sm font-semibold text-ink transition hover:bg-champagne-soft"
        >
          Go home
        </Link>
        <Link
          to="/services"
          className="rounded-lg border border-ink-600 px-6 py-3 text-sm font-semibold text-ivory-dim transition hover:bg-ink-700"
        >
          Browse services
        </Link>
      </div>
    </div>
  );
}
