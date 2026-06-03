import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  caption: { type: String, default: "" },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], required: true },
}, { timestamps: true });

export default mongoose.model("Post", postSchema);