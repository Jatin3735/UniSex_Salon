/**
 * Thin fetch wrapper around the SalonX API.
 *
 * Kept in a plain .js file (not .jsx) deliberately: the react-refresh lint
 * rule forbids a .jsx module from exporting anything but components.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
const TOKEN_KEY = "salonx.token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private mode / storage disabled
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* not fatal — the session just won't survive a reload */
  }
}

/** An HTTP error carrying the server's message and per-field details. */
export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details ?? null;
  }
}

async function request(path, { method = "GET", body, auth = false, signal } = {}) {
  const headers = {};
  // A FormData body (file upload) must NOT get a JSON content-type — the
  // browser sets multipart/form-data with the correct boundary itself.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // Almost always: the API isn't running.
    throw new ApiError(
      "Cannot reach the server. Make sure the API is running (npm run dev in server/).",
      { status: 0 }
    );
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null; // e.g. an HTML error page from a proxy
    }
  }

  if (!res.ok) {
    throw new ApiError(payload?.error ?? `Request failed (${res.status}).`, {
      status: res.status,
      details: payload?.details,
    });
  }

  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

/** Base URL for building absolute asset URLs (e.g. /uploads/... images). */
export { BASE_URL };

/**
 * Resolves a stored image path to a full URL. Absolute URLs and public bundle
 * assets (e.g. "/haircut.jpg") pass through untouched; server-relative upload
 * paths ("/uploads/...") are prefixed with the API origin.
 */
export function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  if (path.startsWith("/uploads/")) return `${BASE_URL}${path}`;
  return path;
}

export function queryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
