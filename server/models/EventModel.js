import mongoose from "mongoose";

// Event schema — represents an upcoming event posted by a society.
const eventSchema = new mongoose.Schema({
  // Which society created this event — used to filter events by society
  society:        { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  title:          { type: String, required: true },
  description:    { type: String, required: true },
  // Date stored as a JS Date object — allows date comparisons (e.g. upcoming vs. past)
  date:           { type: Date, required: true },
  venue:          { type: String, required: true },
  // Optional Google Form link for event registration; default "" avoids null checks
  googleFormLink: { type: String, default: "" },
  // Optional Cloudinary URL for the event poster image
  poster:         { type: String, default: "" },
}, { timestamps: true });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
export default Event;
