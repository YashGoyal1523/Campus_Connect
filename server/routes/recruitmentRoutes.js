// recruitmentRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes for society recruitment drives (open positions / job postings).
// Mounted at /api/recruitments in the main server file.
//
// Full paths:
//   GET    /api/recruitments        - list ALL active recruitments (public)
//   POST   /api/recruitments        - create a new recruitment post (society only)
//   GET    /api/recruitments/my     - list only THIS society's recruitments (society only)
//   DELETE /api/recruitments/:id    - delete a specific recruitment (society only)
//
// Route ordering note:
//   "/my" must be defined BEFORE "/:id".
//   Express matches routes top-to-bottom. If "/:id" came first, a request to
//   GET /api/recruitments/my would treat "my" as a MongoDB ObjectId and fail
//   with a CastError. Static segment paths must always precede dynamic ones.
//
// Design - dual GET routes:
//   - "/" is public and returns every recruitment across all societies.
//     Used on the student-facing global recruitments discovery page.
//   - "/my" is protected and returns only the requesting society's own postings.
//     Used on the society dashboard to manage their open positions.
//
// Middleware used:
//   verifyToken  - validates JWT on protected routes
//   verifyRole   - restricts write/society-scoped routes to the "society" role
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  createRecruitment,
  getAllRecruitments,
  getRecruitmentsBySociety,
  deleteRecruitment,
} from "../controllers/recruitmentController.js";
import verifyToken from "../middlewares/authMiddleware.js"; // JWT validation
import verifyRole from "../middlewares/roleMiddleware.js"; // role-based access guard

const router = express.Router();

// GET /api/recruitments
// Returns all open recruitment posts from every society.
// Public - no auth needed. Students can browse recruitments even before logging in.
router.get("/", getAllRecruitments);

// POST /api/recruitments
// Creates a new recruitment posting for the authenticated society.
// Protected: only a logged-in society can post a recruitment drive.
// The controller uses req.user.id (from the JWT) to associate the recruitment
// with the correct society automatically.
router.post("/", verifyToken, verifyRole("society"), createRecruitment);

// GET /api/recruitments/my
// Returns only the recruitment posts that belong to the currently logged-in society.
// Used in the society dashboard to let admins see and manage their own postings.
// MUST be defined before "/:id" to avoid Express treating "my" as a dynamic param.
router.get("/my", verifyToken, verifyRole("society"), getRecruitmentsBySociety);

// DELETE /api/recruitments/:id
// Deletes a recruitment post by its MongoDB ObjectId.
// Protected: only an authenticated society can delete a post, and the controller
// verifies ownership before deletion to prevent one society from deleting another's posts.
router.delete("/:id", verifyToken, verifyRole("society"), deleteRecruitment);

export default router;
