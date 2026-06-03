// societyRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes for reading and updating Society profiles.
// Mounted at /api/societies in the main server file.
//
// Full paths:
//   GET  /api/societies          — list all societies (paginated, public)
//   GET  /api/societies/:id      — get one society by ID (public)
//   PUT  /api/societies/update   — update the logged-in society's own profile (protected)
//
// Route ordering note:
//   "/update" is defined BEFORE "/:id" intentionally.
//   Express matches routes in the order they are defined. If "/:id" came first,
//   a request to GET /api/societies/update would be treated as a request for
//   a society whose ID is the string "update", which would produce a Mongoose
//   CastError. Placing the static path first avoids this ambiguity.
//
// Middleware used:
//   verifyToken   — validates the JWT in the Authorization header; required for writes
//   verifyRole    — checks req.user.role === "society"; only societies can update their profile
//   upload        — multer middleware; parses the optional logo file from the form submission
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  getAllSocieties,
  getSocietyById,
  updateSocietyProfile,
} from "../controllers/societyController.js";
import verifyToken from "../middleware/authMiddleware.js"; // JWT auth check
import verifyRole from "../middleware/roleMiddleware.js"; // role-based access check
import { upload } from "../utils/cloudinary.js"; // multer for file parsing

const router = express.Router();

// GET /api/societies
// Returns all societies with pagination support (?page=1&limit=10).
// Public — no authentication required so students can browse without logging in.
router.get("/", getAllSocieties);

// GET /api/societies/:id
// Returns a single society's full profile by MongoDB ObjectId.
// Public — used by the student-facing society detail/profile page.
router.get("/:id", getSocietyById);

// PUT /api/societies/update
// Updates the currently logged-in society's own profile.
// Middleware chain:
//   1. verifyToken   — ensures the request carries a valid JWT
//   2. verifyRole("society") — ensures only a society (not a student) can call this
//   3. upload.single("logo") — parses an optional logo image from the request body
//   4. updateSocietyProfile  — the actual controller logic
// Note: a society can only update THEIR OWN profile because the controller uses
// req.user.id (from the JWT) as the MongoDB filter, not a user-supplied ID.
router.put(
  "/update",
  verifyToken,
  verifyRole("society"),
  upload.single("logo"),
  updateSocietyProfile
);

export default router;
