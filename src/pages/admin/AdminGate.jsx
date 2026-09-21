import { useCallback, useEffect, useRef, useState } from "react";

import AdminApp from "./AdminApp.jsx";
import * as authApi from "../../api/auth.js";
import { setToken } from "../../api/client.js";

/**
 * The lock screen in front of the admin panel.
 *
 * This panel has no link anywhere in the public UI and lives only at a secret
 * path (VITE_ADMIN_PATH). Reaching the path is not enough: the gate ALWAYS
 * asks for a username + password, verifies the account is an admin, and only
 * then reveals the dashboard for a short, auto-expiring window. An existing
 * customer/staff session in localStorage does NOT unlock it — the credentials
 * are re-checked every visit.
 *
 * Security note: a VITE_* value is compiled into the client bundle, so the
 * path string itself is technically discoverable by someone reading the JS.
 * The real protection is this credential gate, the admin-role check, and the
 * server-side `requireRole("admin")` on every admin endpoint — the path is
 * only the first, thin layer.
 */

const SESSION_KEY = "salonx.admin.session";
const SESSION_MS = 15 * 60 * 1000; // auto-lock after 15 minutes

function readSessionExpiry() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const expiry = Number(raw);
    return Number.isFinite(expiry) ? expiry : 0;
  } catch {
    return 0;
  }
}

export default function AdminGate() {
  const [unlockedUntil, setUnlockedUntil] = useState(() => {
    const expiry = readSessionExpiry();
    return expiry > Date.now() ? expiry : 0;
  });

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(null);
  const timerRef = useRef(null);

  const unlocked = unlockedUntil > Date.now();

  const lock = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore storage failures */
    }
    setUnlockedUntil(0);
    setForm({ email: "", password: "" });
  }, []);

  // Auto-lock exactly when the window elapses, and re-check on tab focus (a
  // timer alone can drift while a background tab is throttled).
  useEffect(() => {
    if (!unlocked) return undefined;

    const msLeft = unlockedUntil - Date.now();
    timerRef.current = setTimeout(lock, Math.max(0, msLeft));

    const onFocus = () => {
      if (readSessionExpiry() <= Date.now()) lock();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [unlocked, unlockedUntil, lock]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const { token, user } = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      // Same generic message whether the account is wrong or simply not an
      // admin — the gate never confirms that an email is an admin account.
      if (user.role !== "admin") {
        throw new Error("Those credentials do not have access.");
      }

      // Persist the bearer token so the dashboard's API calls authenticate,
      // then open a short session window.
      setToken(token);
      setAdmin(user);
      const expiry = Date.now() + SESSION_MS;
      try {
        sessionStorage.setItem(SESSION_KEY, String(expiry));
      } catch {
        /* session just won't survive a reload */
      }
      setUnlockedUntil(expiry);
      setForm({ email: "", password: "" });
    } catch (err) {
      setError(err.message || "Those credentials do not have access.");
    } finally {
      setBusy(false);
    }
  };

  if (unlocked) {
    return <AdminApp admin={admin} onLock={lock} />;
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-display font-light text-ivory">Restricted</h1>
      <p className="mt-2 text-ivory-dim">Enter your credentials to continue.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-ivory/10 bg-ink-800 p-6"
      >
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <label className="block">
          <span className="text-sm font-medium text-ivory-dim">Username</span>
          <input
            required
            type="email"
            autoComplete="off"
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
            autoComplete="off"
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
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
