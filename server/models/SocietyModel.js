import mongoose from "mongoose";

const societySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  logo: { type: String, default: "" },
  college: { type: String, required: true },
  instagramLink: { type: String, default: "" },
  websiteLink: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Society", societySchema);