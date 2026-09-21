import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/authContext.js";
import { useBooking } from "../../context/bookingContext.js";

// No "Admin" entry here on purpose — the admin panel is not advertised on the
// public site. Admins reach it through its secret path, not this form.
const DEMO_ACCOUNTS = [
  { label: "Customer", email: "demo@salonx.com" },
  { label: "Staff", email: "ravi@salonx.com" },
];
const DEMO_PASSWORD = "Password123";

/** Where a given role belongs after signing in through the public form. */
function landingFor(role) {
  if (role === "staff") return "/dashboard";
  // Admins signing in here have no public dashboard; send them home. The admin
  // panel is only ever reached via its secret path + gate.
  return "/my-bookings";
}

export default function Login() {
  const { login, user } = useAuth();
  const { hasSlot } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from ?? null;

  if (user) return <Navigate to={from ?? landingFor(user.role)} replace />;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      // The old version ignored both fields and hardcoded a user called
      // "Jatin", then always pushed to /payment with no booking state.
      const signedIn = await login(form.email.trim(), form.password);

      // Mid-booking? Go back to finish it. The draft survived in storage.
      if (from) navigate(from, { replace: true });
      else if (signedIn.role === "customer" && hasSlot) navigate("/payment", { replace: true });
      else navigate(landingFor(signedIn.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Not named use* — the hooks linter treats any use-prefixed function as a
  // hook and forbids calling it from an onClick.
  const fillDemo = (email) => {
    setForm({ email, password: DEMO_PASSWORD });
    setError(null);
  };

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-display font-light text-ivory">Welcome back</h1>
      <p className="mt-2 text-ivory-dim">
        {hasSlot
          ? "Sign in to confirm the appointment you just picked."
          : "Sign in to manage your appointments."}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-ivory/10 bg-ink-800 p-6"
      >
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="block">
          <span className="text-sm font-medium text-ivory-dim">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-ivory placeholder-ash focus:border-champagne focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ivory-dim">Password</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={set("password")}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-ivory placeholder-ash focus:border-champagne focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-champagne px-6 py-3 font-semibold text-ink transition hover:bg-champagne-soft disabled:bg-ink-600 disabled:text-ash"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-sm text-ivory-dim">
          New here?{" "}
          <Link
            to="/signup"
            state={from ? { from } : undefined}
            className="font-semibold text-champagne underline"
          >
            Create an account
          </Link>
        </p>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-700 p-5">
        <p className="text-sm font-semibold text-ivory-dim">Demo accounts</p>
        <p className="mt-1 text-xs text-ash">
          Password for all three: <code className="font-mono">{DEMO_PASSWORD}</code>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acct) => (
            <button
              key={acct.email}
              type="button"
              onClick={() => fillDemo(acct.email)}
              className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-xs font-semibold text-ivory-dim transition hover:border-champagne"
            >
              {acct.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
