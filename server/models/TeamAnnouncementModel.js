import mongoose from "mongoose";

// TeamAnnouncement schema - represents an internal announcement visible only to
// team members of a specific society (unlike Announcement which is public to all students).
const teamAnnouncementSchema = new mongoose.Schema({
  // Which society posted this internal announcement
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  title:   { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const TeamAnnouncement = mongoose.models.TeamAnnouncement || mongoose.model("TeamAnnouncement", teamAnnouncementSchema);
export default TeamAnnouncement;
