// followRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes that let students follow and unfollow societies, and retrieve
// a personalised feed of posts from societies they follow.
// Mounted at /api/follow in the main server file.
//
// Full paths:
//   GET    /api/follow/feed          — get the student's personalised post feed
//   POST   /api/follow/:societyId    — follow a society
//   DELETE /api/follow/:societyId    — unfollow a society
//
// All three routes are student-only:
//   Societies don't follow other societies, so every route is guarded by
//   verifyRole("student"). This also prevents a society account from
//   accidentally polluting the follow graph.
//
// Middleware used:
//   verifyToken  — validates JWT; required on all routes (following is a personal action)
//   verifyRole   — restricts all routes to "student" role users only
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { followSociety, unfollowSociety, getFeed } from "../controllers/followController.js";
import verifyToken from "../middleware/authMiddleware.js"; // JWT validation
import verifyRole from "../middleware/roleMiddleware.js"; // role-based access guard

const router = express.Router();

// GET /api/follow/feed
// Returns a feed of recent posts from all societies the logged-in student follows.
// This is the student's home/discovery feed — the core value of the follow system.
// Requires auth so the server knows which student's follow list to look up.
router.get("/feed", verifyToken, verifyRole("student"), getFeed);

// POST /api/follow/:societyId
// Adds the given society to the logged-in student's follow list.
// societyId in the URL identifies which society to follow.
// The controller prevents duplicate follows (idempotent-safe).
router.post("/:societyId", verifyToken, verifyRole("student"), followSociety);

// DELETE /api/follow/:societyId
// Removes the given society from the logged-in student's follow list.
// Uses DELETE because we are removing a relationship resource, which is
// semantically correct REST usage.
router.delete("/:societyId", verifyToken, verifyRole("student"), unfollowSociety);

export default router;
