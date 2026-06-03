import mongoose from "mongoose";

const teamAnnouncementSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("TeamAnnouncement", teamAnnouncementSchema);
