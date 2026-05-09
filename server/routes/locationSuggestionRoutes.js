import express from "express";
import {
  getEventLocationSuggestions,
  createEventLocationSuggestion,
  chooseFinalEventLocation,
} from "../controllers/locationSuggestionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/events/:id/location-suggestions",
  authMiddleware,
  getEventLocationSuggestions
);

router.post(
  "/events/:id/location-suggestions",
  authMiddleware,
  createEventLocationSuggestion
);

router.patch(
  "/events/:id/location-suggestions/:suggestionId/choose",
  authMiddleware,
  chooseFinalEventLocation
);

export default router;