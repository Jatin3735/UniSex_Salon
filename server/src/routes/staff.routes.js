import { Router } from "express";
import { listAvailableStaff, listStaff } from "../controllers/staffController.js";

const router = Router();

// Must be declared before any "/:id" route would be.
router.get("/available", listAvailableStaff);
router.get("/", listStaff);

export default router;
