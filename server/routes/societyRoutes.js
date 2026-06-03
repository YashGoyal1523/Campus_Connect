// societyRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines read-only routes for the Society resource.
// Mounted at /api/societies in the main server file.
//
// Full paths:
//   GET  /api/societies      — list all societies (paginated, public)
//   GET  /api/societies/:id  — get one society by ID (public)
//
// Both routes are public — no authentication required.
// Students can browse all societies without logging in.
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { getAllSocieties, getSocietyById } from "../controllers/societyController.js";

const router = express.Router();

// GET /api/societies
// Returns all societies with pagination support (?page=1&limit=10).
router.get("/", getAllSocieties);

// GET /api/societies/:id
// Returns a single society's full profile by MongoDB ObjectId.
router.get("/:id", getSocietyById);

export default router;
