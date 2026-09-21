import { Router } from "express";
import {
  allBookings,
  bookingByToken,
  createBooking,
  getAvailability,
  myBookings,
  staffBookings,
  updateStatus,
} from "../controllers/bookingController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public: the slot grid is visible before you log in, so the flow can be
// explored and the login prompt only appears at payment.
router.get("/availability", getAvailability);

// Literal paths first so they are not swallowed by "/:id"-shaped routes.
router.get("/me", requireAuth, myBookings);
router.get("/staff", requireAuth, requireRole("staff", "admin"), staffBookings);
router.get("/token/:token", requireAuth, bookingByToken);

router.get("/", requireAuth, requireRole("admin"), allBookings);
router.post("/", requireAuth, requireRole("customer"), createBooking);
router.patch("/:id/status", requireAuth, updateStatus);

export default router;
