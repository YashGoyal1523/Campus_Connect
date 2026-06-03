// announcementRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes for public-facing society announcements.
// These are broadcast messages that a society sends to ALL followers/students
// (not to be confused with internal team announcements in teamRoutes.js).
// Mounted at /api/announcements in the main server file.
//
// Full paths:
//   GET    /api/announcements        — list ALL announcements (public)
//   POST   /api/announcements        — create a new announcement (society only)
//   GET    /api/announcements/my     — list only THIS society's announcements (society only)
//   DELETE /api/announcements/:id    — delete a specific announcement (society only)
//
// Route ordering note:
//   "/my" is defined before "/:id" to prevent the dynamic segment from
//   swallowing the static "my" path segment. This is a common Express gotcha.
//
// Design — two types of announcements in the system:
//   1. Public announcements (this file): visible to all students on the platform.
//   2. Team announcements (teamRoutes.js): internal, only visible to society members.
//   Keeping them in separate routes and controllers makes the distinction explicit.
//
// Middleware used:
//   verifyToken  — validates JWT on protected routes
//   verifyRole   — restricts writes and "/my" to the "society" role only
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getMyAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import verifyToken from "../middleware/authMiddleware.js"; // JWT validation
import verifyRole from "../middleware/roleMiddleware.js"; // role-based access guard

const router = express.Router();

// GET /api/announcements
// Returns all public announcements from every society.
// Public — no auth needed. Students can view announcements on the discovery feed.
router.get("/", getAllAnnouncements);

// POST /api/announcements
// Creates a new public announcement for the authenticated society.
// Only a logged-in society can broadcast an announcement.
// The controller attaches req.user.id as the "society" field on the document.
router.post("/", verifyToken, verifyRole("society"), createAnnouncement);

// GET /api/announcements/my
// Returns only the announcements created by the currently logged-in society.
// Used on the society dashboard for managing their own announcements.
// MUST be placed before "/:id" to avoid Express matching "my" as a dynamic param.
router.get("/my", verifyToken, verifyRole("society"), getMyAnnouncements);

// DELETE /api/announcements/:id
// Deletes a single announcement by its MongoDB ObjectId.
// Protected: the controller also verifies that the announcement belongs to the
// requesting society before deleting, preventing unauthorised deletion.
router.delete("/:id", verifyToken, verifyRole("society"), deleteAnnouncement);

export default router;
