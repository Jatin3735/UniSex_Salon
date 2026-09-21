/**
 * Shared server-side shapers for admin responses. Admin sees richer fields
 * than the public shapers expose (status flags, contact details, timestamps),
 * but still never a password hash.
 */

export function shapeStaffAdmin(s) {
  return {
    id: s._id.toString(),
    key: s.key,
    name: s.name,
    age: s.age ?? null,
    mobile: s.mobile ?? "",
    email: s.email ?? "",
    photo: s.photo ?? "",
    skills: s.skills ?? [],
    role: s.role ?? "Stylist",
    specialization: s.specialization ?? "",
    bio: s.bio ?? "",
    experience: s.experience ?? 0,
    services: (s.services ?? []).map((x) => (x?._id ? x._id.toString() : x.toString())),
    workingDays: s.workingDays ?? [],
    workingHours: {
      start: s.workingHours?.start ?? "10:00",
      end: s.workingHours?.end ?? "20:00",
    },
    displayOrder: s.displayOrder ?? 0,
    active: s.active !== false,
    createdAt: s.createdAt,
  };
}

export function shapeServiceAdmin(s) {
  return {
    id: s._id.toString(),
    key: s.key,
    title: s.title,
    desc: s.desc ?? "",
    price: s.price,
    duration: s.duration,
    image: s.image ?? "",
    category: s.category,
    skills: s.skills ?? [],
    featured: Boolean(s.featured),
    displayOrder: s.displayOrder ?? 0,
    staff: (s.staff ?? []).map((x) => (x?._id ? x._id.toString() : x.toString())),
    active: s.active !== false,
    createdAt: s.createdAt,
  };
}

export function shapeOfferAdmin(o) {
  return {
    id: o._id.toString(),
    title: o.title,
    description: o.description ?? "",
    discountType: o.discountType,
    discountValue: o.discountValue,
    promoCode: o.promoCode ?? "",
    startDate: o.startDate ?? "",
    expiryDate: o.expiryDate ?? "",
    minBookingAmount: o.minBookingAmount ?? 0,
    image: o.image ?? "",
    status: Boolean(o.status),
    featured: Boolean(o.featured),
    createdAt: o.createdAt,
  };
}

export function shapeAnnouncementAdmin(a) {
  return {
    id: a._id.toString(),
    message: a.message,
    ctaLabel: a.ctaLabel ?? "",
    ctaHref: a.ctaHref ?? "",
    placement: a.placement,
    startDate: a.startDate ?? "",
    endDate: a.endDate ?? "",
    status: Boolean(a.status),
    createdAt: a.createdAt,
  };
}

export function shapeReviewAdmin(r) {
  return {
    id: r._id.toString(),
    name: r.name,
    email: r.email ?? "",
    rating: r.rating,
    text: r.text,
    approved: Boolean(r.approved),
    featured: Boolean(r.featured),
    createdAt: r.createdAt,
  };
}

export function shapeGalleryAdmin(g) {
  return {
    id: g._id.toString(),
    image: g.image,
    label: g.label ?? "",
    category: g.category ?? "",
    displayOrder: g.displayOrder ?? 0,
    active: g.active !== false,
    createdAt: g.createdAt,
  };
}
