// authRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines all routes related to authentication (register, login, and account
// management) for both user types: students and societies.
//
// These routes are mounted at /api/auth in the main server file, so the full
// paths are:
//   POST   /api/auth/student/register
//   POST   /api/auth/student/login
//   POST   /api/auth/society/register
//   POST   /api/auth/society/login
//   GET    /api/auth/me
//   DELETE /api/auth/me
//
// Middleware used:
//   upload        — multer middleware (memory storage) that parses multipart/form-data
//                   and makes the uploaded file available at req.file
//   verifyToken   — checks the Authorization header for a valid JWT, then attaches
//                   the decoded user payload (id + role) to req.user
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  registerStudent,
  loginStudent,
  registerSociety,
  loginSociety,
  getMe,
  deleteAccount,
} from "../controllers/authController.js";
import { upload } from "../utils/cloudinary.js"; // multer instance configured for memory storage
import verifyToken from "../middleware/authMiddleware.js"; // JWT verification middleware

const router = express.Router();

// POST /api/auth/student/register
// Registers a new student account.
// No file upload needed for students, so no multer middleware here.
// Expects body: { name, email, password, college, rollNo }
router.post("/student/register", registerStudent);

// POST /api/auth/student/login
// Authenticates an existing student and returns a JWT token.
// Expects body: { email, password }
router.post("/student/login", loginStudent);

// POST /api/auth/society/register
// Registers a new society account.
// upload.single("logo") tells multer to parse a single file with the field
// name "logo" from the incoming multipart/form-data request and store it in
// memory (req.file) so the controller can forward the buffer to Cloudinary.
// Expects body: { name, email, password, college, category, description } + optional logo file
router.post("/society/register", upload.single("logo"), registerSociety);

// POST /api/auth/society/login
// Authenticates an existing society account and returns a JWT token.
// Expects body: { email, password }
router.post("/society/login", loginSociety);

// GET /api/auth/me
// Returns the currently authenticated user's profile data.
// verifyToken middleware must run first to validate the JWT and populate req.user.
// Used on app startup / page refresh to re-hydrate the AuthContext from the stored token.
router.get("/me", verifyToken, getMe);

// DELETE /api/auth/me
// Permanently deletes the currently authenticated user's account.
// verifyToken ensures only the owner of the account can delete it.
router.delete("/me", verifyToken, deleteAccount);

export default router;
