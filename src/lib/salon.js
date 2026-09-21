const ADDRESS = "12 MG Road, Bengaluru 560001";

export const SALON = {
  name: "Unisex Salon",
  tagline: "One house for everyone — precision grooming for all.",
  phone: "+91 98765 43210",
  email: "hello@salonx.com",
  address: ADDRESS,
  hoursLabel: "Open daily, 10:00 AM – 8:00 PM",
  // Keyless Google Maps embed (no API key needed). Change ADDRESS above to
  // move the pin; both URLs derive from it.
  mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`,
  mapLinkUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
};

/** Human labels for the skill ids stored on services and staff. */
export const SKILL_LABELS = {
  hair: "Hair",
  beard: "Beard",
  facial: "Facial",
  spa: "Spa",
  styling: "Styling",
  keratin: "Keratin",
  massage: "Head Massage",
};

export function skillLabel(skill) {
  return SKILL_LABELS[skill] ?? skill;
}

export const CATEGORY_LABELS = {
  men: "Men's Services",
  women: "Women's Services",
};

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] ?? category;
}

export function formatCurrency(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "₹0";
  return `₹${value.toLocaleString("en-IN")}`;
}

export const PAYMENT_METHOD_LABELS = {
  upi: "UPI (GPay / PhonePe / Paytm)",
  card: "Debit / Credit Card",
  cash: "Pay at Salon",
};

export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export const BOOKING_STATUSES = ["Pending", "Completed", "Cancelled", "No-show"];

/** Tailwind classes per status, so the badge reads at a glance. */
export function statusClasses(status) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    case "No-show":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "Refunded":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Pay at salon":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
