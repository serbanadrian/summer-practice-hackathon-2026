import express from "express";
import { runMatching } from "../controllers/matchingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/run", authMiddleware, runMatching);

export default router;