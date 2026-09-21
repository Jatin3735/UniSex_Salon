/**
 * Customer profile API — the signed-in user's own data. All calls are
 * authenticated; the server scopes every response to req.user.
 */
import { api } from "./client.js";

export const fetchProfile = ({ signal } = {}) =>
  api.get("/api/profile", { auth: true, signal }).then((d) => d.user);

export const updateProfile = (body) => api.put("/api/profile", body, { auth: true }).then((d) => d.user);

export const changePassword = (body) => api.put("/api/profile/password", body, { auth: true });

export const deactivateAccount = (password) => api.post("/api/profile/deactivate", { password }, { auth: true });

export async function uploadAvatar(file, { signal } = {}) {
  const fd = new FormData();
  fd.append("image", file);
  const data = await api.post("/api/profile/avatar", fd, { auth: true, signal });
  return data?.url ?? "";
}

export const fetchMyBookings = ({ signal } = {}) =>
  api.get("/api/profile/bookings", { auth: true, signal }).then((d) => d?.bookings ?? []);

export const fetchSavedServices = ({ signal } = {}) =>
  api.get("/api/profile/saved-services", { auth: true, signal }).then((d) => d?.services ?? []);

export const saveService = (serviceId) =>
  api.post(`/api/profile/saved-services/${serviceId}`, undefined, { auth: true }).then((d) => d.savedServices);

export const unsaveService = (serviceId) =>
  api.del(`/api/profile/saved-services/${serviceId}`, { auth: true }).then((d) => d.savedServices);
