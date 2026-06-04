import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // stored as bcrypt hash, never plain text
  college: { type: String, required: true },
  rollNo: { type: String, required: true },   // used to link student to TeamMember records

  // Array of society IDs this student follows
  // ObjectId ref means we can use .populate() to get full society details
  // $addToSet adds to this array (follow), $pull removes (unfollow)
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "Society" }],
}, { timestamps: true });

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;
