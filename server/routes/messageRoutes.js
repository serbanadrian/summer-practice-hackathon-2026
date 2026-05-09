import express from "express";
import {
  getEventMessages,
  createEventMessage,
} from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/events/:id/messages", authMiddleware, getEventMessages);
router.post("/events/:id/messages", authMiddleware, createEventMessage);

export default router;