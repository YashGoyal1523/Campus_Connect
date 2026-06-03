import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  // Which society's group chat this message belongs to
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },

  // ID of the sender — used to verify ownership on delete (unsend)
  // Stored as String (not ObjectId ref) because sender can be Student OR Society
  senderId: { type: String, required: true },

  senderName: { type: String, required: true },
  senderRollNo: { type: String, default: "" },     // empty for society admin
  senderPosition: { type: String, default: "" },   // e.g. "Tech Lead", empty for admin
  senderRole: { type: String, enum: ["student", "society"], required: true },

  content: { type: String, default: "" },          // text content (can be empty if only media)
  attachmentUrl: { type: String, default: "" },    // Cloudinary URL for image/video
  attachmentType: { type: String, default: "" },   // "image" or "video"
}, { timestamps: true }); // adds createdAt and updatedAt automatically

export default mongoose.model("Message", messageSchema);
