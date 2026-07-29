import mongoose from "mongoose";

// Post schema - represents a photo or video uploaded by a society.
const postSchema = new mongoose.Schema({
  // ref: "Society" lets Mongoose populate() replace this ObjectId with the full society document
  society:   { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  // caption is optional - society may post without text
  caption:   { type: String, default: "" },
  // mediaUrl is a Cloudinary URL pointing to the uploaded image or video
  mediaUrl:  { type: String, required: true },
  // enum restricts the value to exactly these two strings, preventing bad data
  mediaType: { type: String, enum: ["image", "video"], required: true },
}, { timestamps: true });

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
export default Post;
