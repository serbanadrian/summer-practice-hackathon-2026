import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  runMatching,
  previewMatching,
} from "../controllers/matchingController.js";

const router = express.Router();

router.post("/run", authMiddleware, runMatching);
router.get("/preview", authMiddleware, previewMatching);

export default router;