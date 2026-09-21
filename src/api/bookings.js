import { api, queryString } from "./client.js";

export function fetchAvailability({ staffId, date, serviceIds }, { signal } = {}) {
  return api.get(`/api/bookings/availability${queryString({ staffId, date, serviceIds })}`, {
    signal,
  });
}

export async function createBooking(payload) {
  const data = await api.post("/api/bookings", payload, { auth: true });
  return data.booking;
}

export async function fetchMyBookings({ signal } = {}) {
  const data = await api.get("/api/bookings/me", { auth: true, signal });
  return data.bookings ?? [];
}

export async function fetchStaffBookings({ date } = {}, { signal } = {}) {
  const data = await api.get(`/api/bookings/staff${queryString({ date })}`, {
    auth: true,
    signal,
  });
  return data.bookings ?? [];
}

export async function fetchAllBookings(filters = {}, { signal } = {}) {
  const data = await api.get(`/api/bookings${queryString(filters)}`, { auth: true, signal });
  return data.bookings ?? [];
}

export async function fetchBookingByToken(token, { signal } = {}) {
  const data = await api.get(`/api/bookings/token/${encodeURIComponent(token)}`, {
    auth: true,
    signal,
  });
  return data.booking;
}

export async function updateBookingStatus(id, status) {
  const data = await api.patch(`/api/bookings/${id}/status`, { status }, { auth: true });
  return data.booking;
}
