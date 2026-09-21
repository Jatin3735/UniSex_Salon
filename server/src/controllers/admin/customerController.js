import { User } from "../../models/User.js";
import { Booking } from "../../models/Booking.js";
import { asyncHandler, badRequest, forbidden, notFound } from "../../middleware/asyncHandler.js";

/** Admin-facing customer shape — never a password, never another admin's row by default. */
function shapeCustomer(u, extra = {}) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    mobile: u.mobile ?? "",
    role: u.role,
    avatar: u.avatar ?? "",
    active: u.active !== false,
    createdAt: u.createdAt,
    ...extra,
  };
}

/**
 * GET /api/admin/customers
 *
 * Lists customer accounts with per-customer booking aggregates (total +
 * last booking date), computed in one aggregation rather than N queries.
 */
export const listCustomers = asyncHandler(async (req, res) => {
  const match = { role: "customer" };
  const { q, status } = req.query;
  if (status === "active") match.active = { $ne: false };
  if (status === "inactive") match.active = false;
  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    match.$or = [{ name: rx }, { email: rx }, { mobile: rx }];
  }

  const users = await User.find(match).sort({ createdAt: -1 }).limit(500);

  // Booking aggregates keyed by user id.
  const ids = users.map((u) => u._id);
  const agg = await Booking.aggregate([
    { $match: { user: { $in: ids } } },
    {
      $group: {
        _id: "$user",
        totalBookings: { $sum: 1 },
        lastBookingDate: { $max: "$date" },
        totalSpent: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$paymentStatus", "Paid"] }, { $ne: ["$status", "Cancelled"] }] }, "$amount", 0],
          },
        },
      },
    },
  ]);
  const byUser = new Map(agg.map((r) => [r._id.toString(), r]));

  const customers = users.map((u) => {
    const stats = byUser.get(u._id.toString());
    return shapeCustomer(u, {
      totalBookings: stats?.totalBookings ?? 0,
      lastBookingDate: stats?.lastBookingDate ?? null,
      totalSpent: stats?.totalSpent ?? 0,
    });
  });

  res.json({ customers });
});

/** GET /api/admin/customers/:id — profile + booking history. */
export const getCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound("Customer not found.");

  const bookings = await Booking.find({ user: user._id }).sort({ date: -1, startMinutes: -1 }).limit(200);
  res.json({
    customer: shapeCustomer(user, { dob: user.dob ?? "", preferences: user.preferences ?? "" }),
    bookings: bookings.map((b) => b.toPublic()),
  });
});

/**
 * PATCH /api/admin/customers/:id/status
 *
 * Soft activate/deactivate. An admin cannot deactivate another admin or
 * their own account through this endpoint.
 */
export const setCustomerStatus = asyncHandler(async (req, res) => {
  const { active } = req.body ?? {};
  if (typeof active !== "boolean") throw badRequest("Pass { active: true|false }.");

  const user = await User.findById(req.params.id);
  if (!user) throw notFound("Customer not found.");
  if (user.role === "admin") throw forbidden("Admin accounts cannot be changed here.");
  if (user._id.toString() === req.user._id.toString()) throw forbidden("You cannot change your own account status.");

  user.active = active;
  await user.save();
  res.json({ customer: shapeCustomer(user) });
});
