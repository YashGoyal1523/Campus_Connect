import Student from "../models/StudentModel.js";
import Society from "../models/SocietyModel.js";
import Post from "../models/PostModel.js";
import Event from "../models/EventModel.js";
import Recruitment from "../models/RecruitmentModel.js";
import Announcement from "../models/AnnouncementModel.js";
import Message from "../models/MessageModel.js";
import TeamMember from "../models/TeamMemberModel.js";
import TeamAnnouncement from "../models/TeamAnnouncementModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────
// Deletes the logged-in user's account along with ALL their related data
// This is called "cascade delete" — removing all dependent records
export const deleteAccount = async (req, res) => {
  try {
    if (req.user.role === "student") {
      const student = await Student.findById(req.user.id);
      // Guard: if the document doesn't exist (stale token after prior deletion), bail early
      if (!student) return res.status(404).json({ message: "Student not found" });

      // Delete student account + their team memberships + their chat messages
      // Promise.all runs all deletions simultaneously (faster than one by one)
      await Promise.all([
        Student.findByIdAndDelete(req.user.id),
        TeamMember.deleteMany({ rollNo: student.rollNo }), // remove from all society teams
        Message.deleteMany({ senderId: req.user.id }),     // remove their chat messages
      ]);
    } else {
      // Society account deletion — remove everything the society ever created
      await Promise.all([
        Society.findByIdAndDelete(req.user.id),
        Post.deleteMany({ society: req.user.id }),
        Event.deleteMany({ society: req.user.id }),
        Recruitment.deleteMany({ society: req.user.id }),
        Announcement.deleteMany({ society: req.user.id }),
        TeamMember.deleteMany({ society: req.user.id }),
        TeamAnnouncement.deleteMany({ society: req.user.id }),
        Message.deleteMany({ society: req.user.id }),
        // Remove this society from all students' following lists
        // $pull removes a value from an array field in MongoDB
        Student.updateMany({ following: req.user.id }, { $pull: { following: req.user.id } }),
      ]);
    }
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// Returns the full profile of the currently logged-in user
// Used to populate profile modals and dashboards
export const getMe = async (req, res) => {
  try {
    if (req.user.role === "student") {
      // populate("following") replaces society IDs with actual society objects
      // so frontend gets name and logo directly instead of just an ID
      const student = await Student.findById(req.user.id)
        .select("-password") // never send password to frontend
        .populate("following", "name logo");
      if (!student) return res.status(404).json({ message: "Student not found" });
      return res.json(student);
    } else {
      // Count how many students follow this society
      const followerCount = await Student.countDocuments({ following: req.user.id });
      const society = await Society.findById(req.user.id).select("-password");
      if (!society) return res.status(404).json({ message: "Society not found" });
      return res.json({ ...society.toObject(), followerCount });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── REGISTER STUDENT ─────────────────────────────────────────────────────────
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, college, rollNo } = req.body;

    // Check if email already registered
    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // bcrypt.hash converts plain password to a secure hash
    // 10 = number of salt rounds (higher = more secure but slower)
    const hashedPassword = await bcrypt.hash(password, 10);
//note:
//const hashedPassword = await bcrypt.hash(password, 10);
//here Internally bcrypt does:
// const salt = await bcrypt.genSalt(10);
// const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({ name, email, password: hashedPassword, college, rollNo });

    // Create JWT token — stores id, role, name inside it
    // expiresIn: "7d" means token expires after 7 days
    const token = jwt.sign(
      { id: student._id, role: "student", name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: { id: student._id, name: student.name, role: "student" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── LOGIN STUDENT ────────────────────────────────────────────────────────────
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: "Invalid credentials" });

    // bcrypt.compare checks plain password against the stored hash
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: student._id, role: "student", name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: student._id, name: student.name, role: "student" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── REGISTER SOCIETY ─────────────────────────────────────────────────────────
export const registerSociety = async (req, res) => {
  try {
    const { name, email, password, college, category, description } = req.body;

    const existing = await Society.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    let logo = "";
    // If a logo file was uploaded, send it to Cloudinary and get back a URL
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      logo = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const society = await Society.create({ name, email, password: hashedPassword, college, category, description, logo });

    const token = jwt.sign(
      { id: society._id, role: "society", name: society.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: { id: society._id, name: society.name, role: "society", logo: society.logo } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── LOGIN SOCIETY ────────────────────────────────────────────────────────────
export const loginSociety = async (req, res) => {
  try {
    const { email, password } = req.body;

    const society = await Society.findOne({ email });
    if (!society) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, society.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: society._id, role: "society", name: society.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: society._id, name: society.name, role: "society", logo: society.logo } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
