import { api, setToken } from "./client.js";

export function login({ email, password }) {
  return api.post("/api/auth/login", { email, password });
}

export function register(fields) {
  return api.post("/api/auth/register", fields);
}

export function fetchMe({ signal } = {}) {
  return api.get("/api/auth/me", { auth: true, signal });
}

export { setToken };
