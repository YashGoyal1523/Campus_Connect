// postRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes for society posts (similar to social-media posts).
// Mounted at /api/posts in the main server file.
//
// Full paths:
//   POST   /api/posts               — create a new post (society only)
//   GET    /api/posts/:societyId    — get all posts from a specific society (public)
//   DELETE /api/posts/:id           — delete a post by its ID (society only)
//
// Design decision — public reads, protected writes:
//   Anyone (including unauthenticated users) can read posts. Only an authenticated
//   society with a valid JWT can create or delete posts. This is the standard
//   REST pattern for content platforms.
//
// Middleware used:
//   verifyToken  — validates JWT; applied to write operations only
//   verifyRole   — ensures only "society" role users can create/delete posts
//   upload       — multer middleware for optional media (image/video) attachment
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  createPost,
  getPostsBySociety,
  deletePost,
} from "../controllers/postController.js";
import verifyToken from "../middlewares/authMiddleware.js"; // JWT validation
import verifyRole from "../middlewares/roleMiddleware.js"; // role-based access guard
import { upload } from "../utils/cloudinary.js"; // multer instance for file parsing

const router = express.Router();

// POST /api/posts
// Creates a new post for the authenticated society.
// Middleware chain:
//   1. verifyToken         — confirms the request is from a logged-in user
//   2. verifyRole("society") — only society accounts can publish posts
//   3. upload.single("media") — parses an optional image or video attachment
//      The field name "media" must match what the client sends in FormData
//   4. createPost          — controller: saves the post to MongoDB and uploads
//      the media file to Cloudinary if present
router.post("/", verifyToken, verifyRole("society"), upload.single("media"), createPost);

// GET /api/posts/:societyId
// Returns all posts published by a specific society, identified by societyId.
// Public — used on the society's public profile page viewed by students.
// No auth required so unauthenticated visitors can also read posts.
router.get("/:societyId", getPostsBySociety);

// DELETE /api/posts/:id
// Deletes a single post by its MongoDB _id.
// Protected — verifyToken + verifyRole ensures only an authenticated society
// can delete posts, and the controller additionally verifies that the post
// belongs to the requesting society before deleting.
router.delete("/:id", verifyToken, verifyRole("society"), deletePost);

export default router;
