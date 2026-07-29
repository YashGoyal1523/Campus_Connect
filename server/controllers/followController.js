import Student from "../models/StudentModel.js";
import Post from "../models/PostModel.js";
import { getPagination } from "../utils/pagination.js";

// ─── FOLLOW A SOCIETY ─────────────────────────────────────────────────────────
// Adds the society's ID to the student's "following" array
// $addToSet is like $push but prevents duplicates (won't add if already following)
export const followSociety = async (req, res) => {
  try {
    await Student.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { following: req.params.societyId } }
    );
    res.json({ success: true, message: "Followed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UNFOLLOW A SOCIETY ───────────────────────────────────────────────────────
// Removes the society's ID from the student's "following" array
// $pull removes a specific value from an array field
export const unfollowSociety = async (req, res) => {
  try {
    await Student.findByIdAndUpdate(
      req.user.id,
      { $pull: { following: req.params.societyId } }
    );
    res.json({ success: true, message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET PERSONALIZED FEED ────────────────────────────────────────────────────
// Returns posts ONLY from societies the student follows
// This is the core of the feed feature - personalized content
export const getFeed = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // $in operator - fetch posts where society field matches ANY id in the following array
    // This is how we get posts from ALL followed societies in one query
    const total = await Post.countDocuments({ society: { $in: student.following } });
    const posts = await Post.find({ society: { $in: student.following } })
      .populate("society", "name logo") // replace society ID with actual name and logo
      .sort({ createdAt: -1 })          // newest posts first
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: posts, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
