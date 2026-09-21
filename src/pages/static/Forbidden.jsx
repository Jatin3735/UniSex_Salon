import { Link } from "react-router-dom";

/** Shown when a signed-in user reaches a route their role can't access. */
export default function Forbidden() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="text-6xl font-bold text-ink-600">403</p>
      <h1 className="mt-4 text-2xl font-display font-light text-ivory">Not your page</h1>
      <p className="mt-2 text-ash">
        You&apos;re signed in, but this area is for a different kind of account.
      </p>

      <Link
        to="/"
        className="mt-8 rounded-lg bg-champagne px-6 py-3 text-sm font-semibold text-ink transition hover:bg-champagne-soft"
      >
        Go home
      </Link>
    </div>
  );
}
