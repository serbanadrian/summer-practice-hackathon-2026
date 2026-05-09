import express from "express";
import {
  getEventLocationSuggestions,
  createEventLocationSuggestion,
  chooseFinalEventLocation,
  voteLocationSuggestion,
  unvoteLocationSuggestion,
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

router.post(
  "/events/:id/location-suggestions/:suggestionId/vote",
  authMiddleware,
  voteLocationSuggestion
);

router.delete(
  "/events/:id/location-suggestions/:suggestionId/vote",
  authMiddleware,
  unvoteLocationSuggestion
);

router.patch(
  "/events/:id/location-suggestions/:suggestionId/choose",
  authMiddleware,
  chooseFinalEventLocation
);

export default router;