import mongoose from "mongoose";

const recruitmentSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  role: { type: String, required: true },
  description: { type: String, required: true },
  googleFormLink: { type: String, required: true },
  deadline: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model("Recruitment", recruitmentSchema);