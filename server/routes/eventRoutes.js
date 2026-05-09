import express from "express";
import {
  getMyEvents,
  getEventById,
  confirmParticipation,
} from "../controllers/eventController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyEvents);
router.get("/:id", authMiddleware, getEventById);
router.patch("/:id/participation", authMiddleware, confirmParticipation);

export default router;