import mongoose from "mongoose";

// Recruitment schema — represents an open position posted by a society.
const recruitmentSchema = new mongoose.Schema({
  // Which society is recruiting
  society:        { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  // The role/position being offered (e.g. "Graphic Designer", "Tech Lead")
  role:           { type: String, required: true },
  description:    { type: String, required: true },
  // Google Form link for applications — required so students always have a way to apply
  googleFormLink: { type: String, required: true },
  // Deadline stored as Date so we can compare with new Date() to determine if the listing is expired
  deadline:       { type: Date, required: true },
}, { timestamps: true });

const Recruitment = mongoose.models.Recruitment || mongoose.model("Recruitment", recruitmentSchema);
export default Recruitment;
