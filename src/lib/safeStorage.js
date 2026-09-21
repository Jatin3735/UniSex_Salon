/**
 * localStorage / sessionStorage that cannot throw.
 *
 * The original code called JSON.parse(localStorage.getItem(...)) unguarded in
 * six places. Because <Navbar> renders on every page, a single corrupt value
 * took down the entire app with a white screen. Every read goes through here.
 */

function store(kind) {
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null; // Safari private mode, disabled storage, SSR
  }
}

export function readJSON(key, fallback = null, kind = "local") {
  const s = store(kind);
  if (!s) return fallback;

  let raw;
  try {
    raw = s.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    // Corrupt value — drop it so it cannot break every future page load.
    try {
      s.removeItem(key);
    } catch {
      /* nothing else we can do */
    }
    return fallback;
  }
}

export function writeJSON(key, value, kind = "local") {
  const s = store(kind);
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota exceeded or unserialisable
  }
}

export function removeKey(key, kind = "local") {
  const s = store(kind);
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Delete the pre-rewrite keys. The old build stored an unvalidated `user`
 * object and bookings that no longer match the current shape; leaving them
 * around only invites confusion in a browser that ran the old code.
 */
export function purgeLegacyKeys() {
  ["user", "bookings", "lastBooking"].forEach((key) => removeKey(key));
}
