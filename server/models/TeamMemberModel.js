import mongoose from "mongoose";

// TeamMember is NOT linked to a Student account by ID
// Instead it's linked by rollNo — society adds members manually by entering their roll number
// This way the student doesn't need to have registered on the platform to be in a team
// When the student logs in, their rollNo is used to find their TeamMember records
const teamMemberSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  name: { type: String, required: true },
  rollNo: { type: String, required: true },    // key link between Student and TeamMember
  position: { type: String, required: true },  // e.g. "President", "General Member"
}, { timestamps: true });

const TeamMember = mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);
export default TeamMember;
