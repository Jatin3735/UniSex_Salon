import { Router } from "express";
import {
  listActiveAnnouncements,
  listActiveOffers,
  listPublicGallery,
  listPublicReviews,
} from "../controllers/publicController.js";

const router = Router();

// Read-only, unauthenticated. The customer website renders whatever the admin
// has switched on and dated live — no source-code changes needed to update.
router.get("/offers", listActiveOffers);
router.get("/announcements", listActiveAnnouncements);
router.get("/reviews", listPublicReviews);
router.get("/gallery", listPublicGallery);

export default router;
