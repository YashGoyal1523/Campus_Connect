import Recruitment from "../models/RecruitmentModel.js";
import { getPagination } from "../utils/pagination.js";

// ─── CREATE RECRUITMENT ───────────────────────────────────────────────────────
// Society posts an open position for students to apply
export const createRecruitment = async (req, res) => {
  try {
    const { role, description, googleFormLink, deadline } = req.body;
    const recruitment = await Recruitment.create({
      society: req.user.id,
      role,
      description,
      googleFormLink, // link to Google Form for applications
      deadline,
    });
    res.status(201).json({ success: true, data: recruitment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL RECRUITMENTS (student view) ─────────────────────────────────────
// Returns paginated open positions from ALL societies
export const getAllRecruitments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const total = await Recruitment.countDocuments();
    const recruitments = await Recruitment.find()
      .populate("society", "name logo college")
      .sort({ deadline: -1 }) // most recent deadline first
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: recruitments, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SOCIETY'S OWN RECRUITMENTS ──────────────────────────────────────────
// Returns only the logged-in society's posted positions (for society dashboard)
export const getRecruitmentsBySociety = async (req, res) => {
  try {
    const recruitments = await Recruitment.find({ society: req.user.id })
      .sort({ deadline: 1 }); // earliest deadline first (most urgent at top)
    res.json({ success: true, data: recruitments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE RECRUITMENT ───────────────────────────────────────────────────────
export const deleteRecruitment = async (req, res) => {
  try {
    const recruitment = await Recruitment.findById(req.params.id);
    if (!recruitment) return res.status(404).json({ success: false, message: "Not found" });

    // Only the society that posted this can delete it
    if (recruitment.society.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await recruitment.deleteOne();
    res.json({ success: true, message: "Recruitment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
