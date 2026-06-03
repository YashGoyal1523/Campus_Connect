import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  googleFormLink: { type: String, default: "" },
  poster: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Event", eventSchema);