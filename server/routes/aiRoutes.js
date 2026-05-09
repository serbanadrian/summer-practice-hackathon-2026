import express from "express";
import { detectSports } from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/detect-sports", authMiddleware, detectSports);

export default router;