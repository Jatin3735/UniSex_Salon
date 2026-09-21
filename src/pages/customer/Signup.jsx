import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/authContext.js";
import { useBooking } from "../../context/bookingContext.js";

const BLANK = { name: "", email: "", mobile: "", password: "" };

export default function Signup() {
  const { signup, user } = useAuth();
  const { hasSlot } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const from = location.state?.from ?? null;

  if (user) return <Navigate to={from ?? "/my-bookings"} replace />;

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setBusy(true);

    try {
      // The old version never wrote anything anywhere, so creating an account
      // left you logged out. Now the token comes back from the API.
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
      });

      if (from) navigate(from, { replace: true });
      else navigate(hasSlot ? "/payment" : "/my-bookings", { replace: true });
    } catch (err) {
      // The API returns per-field details for a 400.
      if (err.details) setFieldErrors(err.details);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <label className="block">
      <span className="text-sm font-medium text-ivory-dim">{label}</span>
      <input
        required
        value={form[name]}
        onChange={set(name)}
        aria-invalid={Boolean(fieldErrors[name])}
        className={`mt-1 w-full rounded-lg border bg-ink-700 px-4 py-2 text-ivory placeholder-ash focus:outline-none ${
          fieldErrors[name]
            ? "border-red-400 focus:border-red-500"
            : "border-ink-600 focus:border-champagne"
        }`}
        {...props}
      />
      {fieldErrors[name] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[name]}</span>}
    </label>
  );

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-display font-light text-ivory">Create your account</h1>
      <p className="mt-2 text-ivory-dim">
        {hasSlot
          ? "One step and your appointment is confirmed."
          : "It takes a moment, and you can book straight away."}
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

        {field("name", "Full name", { autoComplete: "name" })}
        {field("email", "Email", { type: "email", autoComplete: "email" })}
        {/* Payment used to invent "9999999999" because nothing ever asked. */}
        {field("mobile", "Mobile number", {
          type: "tel",
          inputMode: "numeric",
          autoComplete: "tel",
          placeholder: "10 digits",
        })}
        {field("password", "Password", {
          type: "password",
          autoComplete: "new-password",
          minLength: 8,
          placeholder: "At least 8 characters",
        })}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-champagne px-6 py-3 font-semibold text-ink transition hover:bg-champagne-soft disabled:bg-ink-600 disabled:text-ash"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-sm text-ivory-dim">
          Already have an account?{" "}
          <Link
            to="/login"
            state={from ? { from } : undefined}
            className="font-semibold text-champagne underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
