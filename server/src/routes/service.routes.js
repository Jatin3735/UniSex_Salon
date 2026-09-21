import { Router } from "express";
import { listServices } from "../controllers/serviceController.js";

const router = Router();

router.get("/", listServices);

export default router;
