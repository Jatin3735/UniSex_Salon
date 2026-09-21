import { asyncHandler } from "../../middleware/asyncHandler.js";
import { User } from "../../models/User.js";
import { Staff } from "../../models/Staff.js";
import { Service } from "../../models/Service.js";
import { Booking } from "../../models/Booking.js";
import { Offer } from "../../models/Offer.js";
import { todayISO } from "../../utils/slots.js";

/**
 * GET /api/admin/dashboard
 *
 * Every number here is a live count/aggregate from MongoDB — no fabricated
 * figures. Revenue is summed only from bookings that were actually paid
 * (paymentStatus "Paid") and not cancelled.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const today = todayISO();

  const [
    totalCustomers,
    totalStaff,
    totalServices,
    todaysBookings,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    activeOffers,
    revenueAgg,
    statusAgg,
    recentBookings,
    revenueByDay,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Staff.countDocuments({ active: true }),
    Service.countDocuments({ active: true }),
    Booking.countDocuments({ date: today, status: { $ne: "Cancelled" } }),
    Booking.countDocuments({ date: { $gt: today }, status: { $ne: "Cancelled" } }),
    Booking.countDocuments({ status: "Completed" }),
    Booking.countDocuments({ status: "Cancelled" }),
    Booking.countDocuments({ status: "Pending" }),
    Offer.countDocuments({ status: true }),
    Booking.aggregate([
      { $match: { paymentStatus: "Paid", status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.find().sort({ createdAt: -1 }).limit(6),
    // Paid revenue grouped by appointment date, last 14 days → a real chart.
    Booking.aggregate([
      { $match: { paymentStatus: "Paid", status: { $ne: "Cancelled" } } },
      { $group: { _id: "$date", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 14 },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total ?? 0;

  const statusBreakdown = statusAgg.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  res.json({
    stats: {
      totalCustomers,
      totalStaff,
      totalServices,
      todaysBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      activeOffers,
      revenue,
    },
    statusBreakdown,
    revenueByDay: revenueByDay
      .map((r) => ({ date: r._id, total: r.total, count: r.count }))
      .reverse(),
    recentBookings: recentBookings.map((b) => b.toPublic()),
  });
});
