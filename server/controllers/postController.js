import Post from "../models/PostModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { getPagination } from "../utils/pagination.js";

// ─── CREATE POST ──────────────────────────────────────────────────────────────
// Society uploads a photo or video with an optional caption
export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Media file is required" });

    // Upload the file buffer to Cloudinary and get back a public URL
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    const mediaUrl = result.secure_url;

    // Determine if uploaded file is a video or image based on MIME type
    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const post = await Post.create({
      society: req.user.id, // from JWT token - which society is posting
      caption,
      mediaUrl,
      mediaType,
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET POSTS BY SOCIETY ─────────────────────────────────────────────────────
// Returns paginated posts for a specific society (used in student Discover view)
export const getPostsBySociety = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const total = await Post.countDocuments({ society: req.params.societyId });
    const posts = await Post.find({ society: req.params.societyId })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: posts, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE POST ──────────────────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Ensure only the society that created this post can delete it
    if (post.society.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
