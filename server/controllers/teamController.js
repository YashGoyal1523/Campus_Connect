import TeamMember from "../models/TeamMemberModel.js";
import TeamAnnouncement from "../models/TeamAnnouncementModel.js";
import Student from "../models/StudentModel.js";

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT-FACING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET MY SOCIETIES ─────────────────────────────────────────────────────────
// Returns all societies the logged-in student belongs to as a team member
// Matches by rollNo - society adds student by roll number, not account ID
export const getMySocieties = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Find all TeamMember records where rollNo matches this student
    // populate() replaces the society ObjectId with the actual society document
    const memberships = await TeamMember.find({ rollNo: student.rollNo })
      .populate("society", "name logo category college");

    res.json({ success: true, data: memberships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET MEMBERS OF A SPECIFIC SOCIETY ───────────────────────────────────────
// Returns full team roster - shown in "Members" tab inside a society
export const getSocietyMembers = async (req, res) => {
  try {
    const members = await TeamMember.find({ society: req.params.societyId })
      .sort({ createdAt: 1 }); // oldest first so founding members appear at top
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET TEAM ANNOUNCEMENTS FOR A SPECIFIC SOCIETY ───────────────────────────
// Internal announcements - only visible to verified team members
// Gate: student must be a TeamMember of this society to access
export const getSocietyTeamAnnouncements = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Verify the student actually belongs to this society before showing announcements
    const isMember = await TeamMember.findOne({
      society: req.params.societyId,
      rollNo: student.rollNo,
    });
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member of this society" });

    const announcements = await TeamAnnouncement.find({ society: req.params.societyId })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// SOCIETY-FACING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ADD MEMBER ───────────────────────────────────────────────────────────────
// Society manually adds a student to their team by entering name, roll no, position
// No link to student account - stored independently in TeamMember collection
export const addMember = async (req, res) => {
  try {
    const { name, rollNo, position } = req.body;
    const member = await TeamMember.create({
      society: req.user.id, // which society is adding this member
      name,
      rollNo,
      position,
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SOCIETY'S OWN TEAM MEMBERS ──────────────────────────────────────────
export const getMembers = async (req, res) => {
  try {
    const members = await TeamMember.find({ society: req.user.id })
      .sort({ createdAt: 1 }); // oldest first
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REMOVE MEMBER ────────────────────────────────────────────────────────────
export const removeMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    // Only the society that added this member can remove them
    if (member.society.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await member.deleteOne();
    res.json({ success: true, message: "Removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST TEAM ANNOUNCEMENT ───────────────────────────────────────────────────
// Internal announcement - only visible to team members, not public students
export const postTeamAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    const a = await TeamAnnouncement.create({ society: req.user.id, title, content });
    res.status(201).json({ success: true, data: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SOCIETY'S TEAM ANNOUNCEMENTS ────────────────────────────────────────
export const getTeamAnnouncements = async (req, res) => {
  try {
    const announcements = await TeamAnnouncement.find({ society: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE TEAM ANNOUNCEMENT ─────────────────────────────────────────────────
export const deleteTeamAnnouncement = async (req, res) => {
  try {
    const a = await TeamAnnouncement.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: "Not found" });

    if (a.society.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await a.deleteOne();
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
