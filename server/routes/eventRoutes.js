// eventRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes for society events (workshops, fests, meetups, etc.).
// Mounted at /api/events in the main server file.
//
// Full paths:
//   GET    /api/events           — list ALL upcoming events (public)
//   POST   /api/events           — create a new event with an optional poster (society only)
//   GET    /api/events/my        — list only THIS society's events (society only)
//   DELETE /api/events/:id       — delete a specific event (society only)
//
// Route ordering note:
//   "/my" is defined before "/:id" for the same reason as in recruitmentRoutes —
//   to prevent Express from interpreting the literal string "my" as a MongoDB ID.
//
// Middleware used:
//   verifyToken  — validates JWT; required on write and society-scoped routes
//   verifyRole   — restricts writes and "/my" to the "society" role only
//   upload       — multer middleware; parses the optional event poster image
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventsBySociety,
  deleteEvent,
} from "../controllers/eventController.js";
import verifyToken from "../middleware/authMiddleware.js"; // JWT validation
import verifyRole from "../middleware/roleMiddleware.js"; // role-based access guard
import { upload } from "../utils/cloudinary.js"; // multer for optional poster image

const router = express.Router();

// GET /api/events
// Returns all events across every society on the platform.
// Public — no auth required. Used on the student-facing events discovery page
// so students can see what's happening across campus without logging in.
router.get("/", getAllEvents);

// POST /api/events
// Creates a new event for the authenticated society.
// Middleware chain:
//   1. verifyToken          — ensures the request has a valid JWT
//   2. verifyRole("society") — only society accounts can create events
//   3. upload.single("poster") — parses an optional poster image from the request
//      The field name "poster" must match what the client sends in FormData
//   4. createEvent          — controller: saves the event and uploads the poster to Cloudinary
router.post("/", verifyToken, verifyRole("society"), upload.single("poster"), createEvent);

// GET /api/events/my
// Returns only the events created by the currently logged-in society.
// Protected: used on the society dashboard to manage their own events.
// Defined before "/:id" to prevent route collision.
router.get("/my", verifyToken, verifyRole("society"), getEventsBySociety);

// DELETE /api/events/:id
// Deletes a single event by its MongoDB ObjectId.
// Protected: only an authenticated society can delete events, and the controller
// checks that the event belongs to the requesting society before removing it.
router.delete("/:id", verifyToken, verifyRole("society"), deleteEvent);

export default router;
