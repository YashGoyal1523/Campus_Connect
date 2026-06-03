import express from "express";
import Message from "../models/MessageModel.js";
import TeamMember from "../models/TeamMemberModel.js";
import Student from "../models/StudentModel.js";
import verifyToken from "../middleware/authMiddleware.js";
import { upload, uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// Load chat history — accessible by society admin and team members
router.get("/:societyId", verifyToken, async (req, res) => {
  try {
    const { societyId } = req.params;

    if (req.user.role === "student") {
      const student = await Student.findById(req.user.id);
      const isMember = await TeamMember.findOne({ society: societyId, rollNo: student.rollNo });
      if (!isMember) return res.status(403).json({ message: "Not a member of this society" });
    } else {
      if (req.user.id !== societyId) return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({ society: societyId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload a media attachment → returns the Cloudinary URL
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    const attachmentType = req.file.mimetype.startsWith("video") ? "video" : "image";
    res.json({ url: result.secure_url, type: attachmentType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
