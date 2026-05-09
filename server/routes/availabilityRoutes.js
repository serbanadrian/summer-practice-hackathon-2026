import express from "express";
import {
  showUpToday,
  getMyAvailabilities,
} from "../controllers/availabilityController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/show-up-today", authMiddleware, showUpToday);
router.get("/me", authMiddleware, getMyAvailabilities);

export default router;