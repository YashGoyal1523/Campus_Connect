import Announcement from "../models/AnnouncementModel.js";
import { getPagination } from "../utils/pagination.js";

// ─── CREATE ANNOUNCEMENT ──────────────────────────────────────────────────────
// Society posts a public announcement visible to all students
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    const announcement = await Announcement.create({
      society: req.user.id,
      title,
      content,
    });
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ALL ANNOUNCEMENTS (student view) ────────────────────────────────────
// Returns paginated announcements from ALL societies
export const getAllAnnouncements = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const total = await Announcement.countDocuments();
    const announcements = await Announcement.find()
      .populate("society", "name logo") // get society name and logo for display
      .sort({ createdAt: -1 })           // newest first
      .skip(skip)
      .limit(limit);

    res.json({ data: announcements, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET SOCIETY'S OWN ANNOUNCEMENTS ─────────────────────────────────────────
// Returns only the logged-in society's announcements (for society dashboard)
export const getMyAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ society: req.user.id })
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE ANNOUNCEMENT ──────────────────────────────────────────────────────
export const deleteAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: "Not found" });

    // Only the society that created this announcement can delete it
    if (a.society.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await a.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
