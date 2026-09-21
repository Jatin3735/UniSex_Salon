import { api, queryString } from "./client.js";

export async function fetchServices({ signal } = {}) {
  const data = await api.get("/api/services", { signal });
  return data.services ?? [];
}

export async function fetchStaff({ signal } = {}) {
  const data = await api.get("/api/staff", { signal });
  return data.staff ?? [];
}

/** Staff who can perform every one of the given services. */
export function fetchAvailableStaff(serviceIds, { signal } = {}) {
  return api.get(`/api/staff/available${queryString({ serviceIds })}`, { signal });
}

/** Public, read-only marketing content driven by the admin panel. */
export async function fetchActiveOffers({ signal } = {}) {
  const data = await api.get("/api/offers", { signal });
  return data.offers ?? [];
}

export async function fetchAnnouncements(placement, { signal } = {}) {
  const data = await api.get(`/api/announcements${queryString({ placement })}`, { signal });
  return data.announcements ?? [];
}

export async function fetchPublicReviews({ signal } = {}) {
  const data = await api.get("/api/reviews", { signal });
  return data.reviews ?? [];
}

export async function fetchPublicGallery({ signal } = {}) {
  const data = await api.get("/api/gallery", { signal });
  return data.images ?? [];
}
