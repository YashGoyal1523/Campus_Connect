// societyController.js
// ─────────────────────────────────────────────────────────────────────────────
// This controller handles all HTTP request logic related to Society accounts.
// It sits between the route definitions (societyRoutes.js) and the database
// model (SocietyModel), keeping route files thin and business logic centralised.
//
// Responsibilities:
//   - Fetch all societies with pagination (for the student discovery feed)
//   - Fetch a single society by its MongoDB _id (for profile pages)
//   - Allow a logged-in society to update their own profile details and logo
//
// Design decision — password never leaves the server:
//   Every query uses `.select("-password")` to exclude the hashed password from
//   the response. This is a critical security practice; even hashed passwords
//   should not be exposed to the client.
// ─────────────────────────────────────────────────────────────────────────────

import Society from "../models/SocietyModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // helper that uploads a buffer to Cloudinary
import { getPagination } from "../utils/pagination.js"; // helper that extracts page/limit/skip from query params

// ── getAllSocieties ───────────────────────────────────────────────────────────
// GET /api/societies
// Returns a paginated list of all societies.
//
// Why paginate?
//   A university may have dozens or hundreds of societies. Returning all of them
//   at once would be slow and waste bandwidth. Pagination lets the client load
//   data in smaller batches and display a "Load More" button.
//
// Response shape:
//   { data: Society[], hasMore: boolean }
//   `hasMore` tells the client whether another page exists so it knows whether
//   to show the "Load More" button.
//
// This route is PUBLIC — no auth token required, because students on the
// discovery page should be able to browse without logging in.
export const getAllSocieties = async (req, res) => {
  try {
    // getPagination parses ?page=1&limit=10 from the query string and returns
    // the corresponding skip offset so MongoDB knows which documents to skip
    const { page, limit, skip } = getPagination(req.query);

    // Count total documents first so we can calculate hasMore
    const total = await Society.countDocuments();

    // Fetch only the current page of societies, excluding the password field
    const societies = await Society.find()
      .select("-password")
      .skip(skip)       // skip documents from previous pages
      .limit(limit);    // cap the number of documents returned

    // hasMore: true if there are still more documents beyond this page
    res.json({ data: societies, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── getSocietyById ────────────────────────────────────────────────────────────
// GET /api/societies/:id
// Returns the full profile of a single society identified by its MongoDB ObjectId.
//
// Use case: when a student clicks on a society card, the app navigates to a
// detail page which calls this endpoint to fetch complete profile data.
//
// Returns 404 if no society with the given ID exists — important for meaningful
// error messages instead of a cryptic null/undefined crash on the client.
//
// This route is PUBLIC — no auth required.
export const getSocietyById = async (req, res) => {
  try {
    // req.params.id is extracted from the URL pattern "/:id"
    const society = await Society.findById(req.params.id).select("-password");

    // Explicit 404 guard: findById returns null if no document matches
    if (!society) return res.status(404).json({ message: "Society not found" });

    res.json(society);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── updateSocietyProfile ──────────────────────────────────────────────────────
// PUT /api/societies/update
// Allows an authenticated society to update their own profile.
//
// Fields that can be updated: description, instagramLink, websiteLink, logo.
//
// Why is this a PUT (not PATCH)?
//   Technically a PATCH would be more semantically correct here since only
//   certain fields are updated. In practice both work because Mongoose's
//   findByIdAndUpdate only modifies the fields present in updateData.
//
// Logo upload flow:
//   1. The client sends the image as multipart/form-data (handled by multer).
//   2. Multer stores the file in memory as a Buffer (req.files.logo[0].buffer).
//   3. We call uploadToCloudinary with the buffer and MIME type.
//   4. Cloudinary returns a secure HTTPS URL which we store in the DB.
//
//   This approach keeps images off our own server, leveraging Cloudinary's CDN
//   for fast global delivery and free storage.
//
// Auth: requires a valid JWT + role "society" (enforced by middleware in the route).
// The society's own _id is available as req.user.id (set by verifyToken middleware).
export const updateSocietyProfile = async (req, res) => {
  try {
    // Destructure only the fields we allow to be updated — any other fields
    // sent in the request body are intentionally ignored for safety
    const { description, instagramLink, websiteLink } = req.body;
    const updateData = { description, instagramLink, websiteLink };

    // Only upload a new logo if the client actually sent one
    // req.files is populated by multer's memory storage middleware
    if (req.files?.logo) {
      // Pass the raw buffer and MIME type so Cloudinary knows the file format
      const result = await uploadToCloudinary(req.files.logo[0].buffer, req.files.logo[0].mimetype);
      // Store only the URL, not the buffer — the image lives on Cloudinary
      updateData.logo = result.secure_url;
    }

    // findByIdAndUpdate with { new: true } returns the UPDATED document, not the old one.
    // We use req.user.id (from the JWT) to ensure a society can only update their OWN profile,
    // even if someone crafted a request with a different ID in the body.
    const updated = await Society.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "Society not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
