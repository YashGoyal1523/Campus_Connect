import mongoose from "mongoose";

// Announcement schema — represents a public announcement posted by a society.
// These are visible to ALL students (unlike TeamAnnouncement which is members-only).
const announcementSchema = new mongoose.Schema({
  // Which society posted this announcement
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  title:   { type: String, required: true },
  content: { type: String, required: true },
// timestamps: true gives us createdAt, used for sorting and "time ago" display
}, { timestamps: true });

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
export default Announcement;
