import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadImage } from "../controllers/uploadController.js";
import { getDashboard } from "../controllers/admin/dashboardController.js";
import * as staff from "../controllers/admin/staffController.js";
import * as services from "../controllers/admin/serviceController.js";
import * as offers from "../controllers/admin/offerController.js";
import * as announcements from "../controllers/admin/announcementController.js";
import * as bookings from "../controllers/admin/bookingController.js";
import * as customers from "../controllers/admin/customerController.js";
import * as reviews from "../controllers/admin/reviewController.js";
import * as gallery from "../controllers/admin/galleryController.js";

const router = Router();

// Every admin route is gated twice: a valid session (requireAuth) AND the
// admin role (requireRole). The role comes from the DB user looked up on each
// request — never from anything the client sends.
router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", getDashboard);

// Image upload (multipart). Shared by all admin image fields.
router.post("/uploads", upload.single("image"), uploadImage);

// Staff
router.get("/staff", staff.listStaff);
router.post("/staff", staff.createStaff);
router.get("/staff/:id", staff.getStaff);
router.put("/staff/:id", staff.updateStaff);
router.delete("/staff/:id", staff.deleteStaff);

// Services
router.get("/services", services.listServices);
router.post("/services", services.createService);
router.get("/services/:id", services.getService);
router.put("/services/:id", services.updateService);
router.delete("/services/:id", services.deleteService);

// Offers
router.get("/offers", offers.listOffers);
router.post("/offers", offers.createOffer);
router.get("/offers/:id", offers.getOffer);
router.put("/offers/:id", offers.updateOffer);
router.delete("/offers/:id", offers.deleteOffer);

// Announcements
router.get("/announcements", announcements.listAnnouncements);
router.post("/announcements", announcements.createAnnouncement);
router.get("/announcements/:id", announcements.getAnnouncement);
router.put("/announcements/:id", announcements.updateAnnouncement);
router.delete("/announcements/:id", announcements.deleteAnnouncement);

// Bookings
router.get("/bookings", bookings.listBookings);
router.get("/bookings/:id", bookings.getBooking);
router.put("/bookings/:id", bookings.updateBooking);

// Customers
router.get("/customers", customers.listCustomers);
router.get("/customers/:id", customers.getCustomer);
router.patch("/customers/:id/status", customers.setCustomerStatus);

// Reviews
router.get("/reviews", reviews.listReviews);
router.put("/reviews/:id", reviews.updateReview);
router.delete("/reviews/:id", reviews.deleteReview);

// Gallery
router.get("/gallery", gallery.listGallery);
router.post("/gallery", gallery.createGalleryImage);
router.put("/gallery/:id", gallery.updateGalleryImage);
router.delete("/gallery/:id", gallery.deleteGalleryImage);

export default router;
