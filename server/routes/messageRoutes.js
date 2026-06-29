// messageRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines REST routes that support the real-time society team chat feature.
// Mounted at /api/messages in the main server file.
//
// Note: the actual real-time message DELIVERY is handled by Socket.IO (configured
// elsewhere in the server). These HTTP routes handle:
//   1. Loading the full chat history when a user first opens the chat window.
//   2. Uploading media attachments (images/videos) and returning a CDN URL that
//      the Socket.IO event can then reference.
//
// Full paths:
//   GET   /api/messages/:societyId   — fetch chat history for a society's chat room
//   POST  /api/messages/upload       — upload a media file, returns its Cloudinary URL
//
// Access control — two-tier check in the GET route:
//   - Students: must be a registered TeamMember of the requested society.
//   - Societies: can only fetch their OWN chat room (societyId must match req.user.id).
//   This ensures chat history is private to the team and not visible to outsiders.
//
// Middleware used:
//   verifyToken  — required on both routes; chat is always private/authenticated
//   upload       — multer memory storage; used on the /upload route to receive the file
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import Message from "../models/MessageModel.js"; // Mongoose model for chat messages
import TeamMember from "../models/TeamMemberModel.js"; // model for society team membership
import Student from "../models/StudentModel.js"; // model for student profiles (to look up rollNo)
import verifyToken from "../middlewares/authMiddleware.js"; // JWT validation
import { upload, uploadToCloudinary } from "../utils/cloudinary.js"; // multer + Cloudinary upload helper

const router = express.Router();

// GET /api/messages/:societyId
// Loads the full chat history for a society's private team chat room.
// Messages are sorted oldest-first (createdAt: 1) so the client can render
// them in chronological order from top to bottom — matching the natural
// reading direction of a chat window.
//
// Access control logic:
//   - If the requester is a STUDENT: look up their Student document to get
//     their rollNo, then check the TeamMember collection to verify they belong
//     to this society. If not found, return 403 Forbidden.
//   - If the requester is a SOCIETY: verify that req.user.id (from the JWT)
//     matches the requested societyId. A society can only read its own chat.
//
// Why use rollNo for membership check instead of student _id?
//   Team members are added by roll number (the identifier the admin knows),
//   so the TeamMember document stores rollNo rather than the Student's MongoDB _id.
router.get("/:societyId", verifyToken, async (req, res) => {
  try {
    const { societyId } = req.params;

    if (req.user.role === "student") {
      // Fetch the student's profile to retrieve their roll number
      const student = await Student.findById(req.user.id);

      // Check if this student's roll number appears in the society's team member list
      const isMember = await TeamMember.findOne({ society: societyId, rollNo: student.rollNo });

      // If no matching TeamMember document, the student is not part of this team
      if (!isMember) return res.status(403).json({ success: false, message: "Not a member of this society" });
    } else {
      // For society accounts: req.user.id is the society's own MongoDB _id.
      // They should only be able to read their own society's chat.
      if (req.user.id !== societyId) return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Fetch all messages for this chat room, sorted chronologically
    const messages = await Message.find({ society: societyId }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages/upload
// Accepts a media file (image or video), uploads it to Cloudinary,
// and returns the secure CDN URL along with the detected media type.
//
// Why a dedicated upload endpoint instead of embedding the file in the message?
//   Socket.IO is not designed to transfer large binary payloads efficiently.
//   The standard pattern is: upload the file via HTTP first → get a URL →
//   then emit the URL through the Socket.IO event. This keeps socket messages
//   lightweight and leverages Cloudinary's CDN for fast delivery.
//
// The `attachmentType` field in the response ("image" or "video") lets the
// client render the correct preview element in the chat UI.
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    // Guard against requests that have no file attached
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    // Upload the buffer to Cloudinary; the helper handles resource_type detection
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    // Determine whether the uploaded file is a video or image based on MIME type
    // so the client knows which HTML element to use (<video> vs <img>)
    const attachmentType = req.file.mimetype.startsWith("video") ? "video" : "image";

    res.json({ success: true, url: result.secure_url, type: attachmentType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
