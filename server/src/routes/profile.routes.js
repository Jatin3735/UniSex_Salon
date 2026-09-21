import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadImage } from "../controllers/uploadController.js";
import {
  changePassword,
  deactivateAccount,
  getProfile,
  listSavedServices,
  myBookings,
  saveService,
  unsaveService,
  updateProfile,
} from "../controllers/profileController.js";

const router = Router();

// Everything here is the signed-in user's own data.
router.use(requireAuth);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/password", changePassword);
router.post("/avatar", upload.single("image"), uploadImage);
router.post("/deactivate", deactivateAccount);

router.get("/bookings", myBookings);

router.get("/saved-services", listSavedServices);
router.post("/saved-services/:serviceId", saveService);
router.delete("/saved-services/:serviceId", unsaveService);

export default router;
