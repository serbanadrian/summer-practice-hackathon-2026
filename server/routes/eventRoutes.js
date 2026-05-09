import express from "express";
import {
  getMyEvents,
  getEventById,
  confirmParticipation,
  createManualEvent,
  getPublicEvents,
  joinEvent,
} from "../controllers/eventController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createManualEvent);
router.get("/public", authMiddleware, getPublicEvents);
router.get("/me", authMiddleware, getMyEvents);
router.get("/:id", authMiddleware, getEventById);
router.post("/:id/join", authMiddleware, joinEvent);
router.patch("/:id/participation", authMiddleware, confirmParticipation);

export default router;