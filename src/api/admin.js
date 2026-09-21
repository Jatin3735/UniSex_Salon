/**
 * Admin management API. Every call is authenticated with the shared bearer
 * token (the admin unlocks the panel with an admin-role login, which stores
 * that token). The server re-checks the admin role on every one of these
 * endpoints — the client is never trusted to assert it.
 */
import { api, queryString } from "./client.js";

const opts = (signal) => ({ auth: true, signal });

// ---- Dashboard -------------------------------------------------------------
export const fetchDashboard = ({ signal } = {}) => api.get("/api/admin/dashboard", opts(signal));

// ---- Image upload ----------------------------------------------------------
export async function uploadImage(file, { signal } = {}) {
  const fd = new FormData();
  fd.append("image", file);
  const data = await api.post("/api/admin/uploads", fd, opts(signal));
  return data?.url ?? "";
}

// ---- Staff -----------------------------------------------------------------
export const fetchStaff = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/staff${queryString(filters)}`, opts(signal)).then((d) => d?.staff ?? []);
export const createStaff = (body) => api.post("/api/admin/staff", body, { auth: true }).then((d) => d.staff);
export const updateStaff = (id, body) => api.put(`/api/admin/staff/${id}`, body, { auth: true }).then((d) => d.staff);
export const deleteStaff = (id, { hard = false } = {}) =>
  api.del(`/api/admin/staff/${id}${hard ? "?hard=true" : ""}`, { auth: true });

// ---- Services --------------------------------------------------------------
export const fetchServices = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/services${queryString(filters)}`, opts(signal)).then((d) => d?.services ?? []);
export const createService = (body) => api.post("/api/admin/services", body, { auth: true }).then((d) => d.service);
export const updateService = (id, body) =>
  api.put(`/api/admin/services/${id}`, body, { auth: true }).then((d) => d.service);
export const deleteService = (id, { hard = false } = {}) =>
  api.del(`/api/admin/services/${id}${hard ? "?hard=true" : ""}`, { auth: true });

// ---- Offers ----------------------------------------------------------------
export const fetchOffers = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/offers${queryString(filters)}`, opts(signal)).then((d) => d?.offers ?? []);
export const createOffer = (body) => api.post("/api/admin/offers", body, { auth: true }).then((d) => d.offer);
export const updateOffer = (id, body) => api.put(`/api/admin/offers/${id}`, body, { auth: true }).then((d) => d.offer);
export const deleteOffer = (id) => api.del(`/api/admin/offers/${id}`, { auth: true });

// ---- Announcements ---------------------------------------------------------
export const fetchAnnouncements = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/announcements${queryString(filters)}`, opts(signal)).then((d) => d?.announcements ?? []);
export const createAnnouncement = (body) =>
  api.post("/api/admin/announcements", body, { auth: true }).then((d) => d.announcement);
export const updateAnnouncement = (id, body) =>
  api.put(`/api/admin/announcements/${id}`, body, { auth: true }).then((d) => d.announcement);
export const deleteAnnouncement = (id) => api.del(`/api/admin/announcements/${id}`, { auth: true });

// ---- Bookings --------------------------------------------------------------
export const fetchBookings = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/bookings${queryString(filters)}`, opts(signal)).then((d) => d?.bookings ?? []);
export const updateBooking = (id, body) =>
  api.put(`/api/admin/bookings/${id}`, body, { auth: true }).then((d) => d.booking);

// ---- Customers -------------------------------------------------------------
export const fetchCustomers = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/customers${queryString(filters)}`, opts(signal)).then((d) => d?.customers ?? []);
export const fetchCustomer = (id, { signal } = {}) => api.get(`/api/admin/customers/${id}`, opts(signal));
export const setCustomerStatus = (id, active) =>
  api.patch(`/api/admin/customers/${id}/status`, { active }, { auth: true }).then((d) => d.customer);

// ---- Reviews ---------------------------------------------------------------
export const fetchReviews = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/reviews${queryString(filters)}`, opts(signal)).then((d) => d?.reviews ?? []);
export const updateReview = (id, body) => api.put(`/api/admin/reviews/${id}`, body, { auth: true }).then((d) => d.review);
export const deleteReview = (id) => api.del(`/api/admin/reviews/${id}`, { auth: true });

// ---- Gallery ---------------------------------------------------------------
export const fetchGallery = (filters = {}, { signal } = {}) =>
  api.get(`/api/admin/gallery${queryString(filters)}`, opts(signal)).then((d) => d?.images ?? []);
export const createGalleryImage = (body) => api.post("/api/admin/gallery", body, { auth: true }).then((d) => d.image);
export const updateGalleryImage = (id, body) =>
  api.put(`/api/admin/gallery/${id}`, body, { auth: true }).then((d) => d.image);
export const deleteGalleryImage = (id) => api.del(`/api/admin/gallery/${id}`, { auth: true });
