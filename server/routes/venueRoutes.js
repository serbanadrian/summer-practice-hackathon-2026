import express from "express";
import { getVenues } from "../controllers/venueController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getVenues);

export default router;