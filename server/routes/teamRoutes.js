// teamRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Defines routes for managing society team members and internal team announcements.
// Mounted at /api/team in the main server file.
//
// There are two groups of routes in this file:
//
//   SOCIETY ADMIN ROUTES — for a society managing its own team:
//     GET    /api/team/members                         — list all members of the society
//     POST   /api/team/members                         — add a student as a team member
//     DELETE /api/team/members/:id                     — remove a member
//     GET    /api/team/announcements                   — list internal team announcements
//     POST   /api/team/announcements                   — post a new team announcement
//     DELETE /api/team/announcements/:id               — delete a team announcement
//
//   STUDENT ROUTES — for a student viewing their team memberships:
//     GET    /api/team/my-societies                    — list societies the student is a member of
//     GET    /api/team/my-announcements                — all internal announcements across their societies
//     GET    /api/team/my-members                      — co-members in all their societies
//     GET    /api/team/society/:societyId/members      — member list of a specific society
//     GET    /api/team/society/:societyId/announcements — announcements of a specific society
//
// Key design decision — role separation:
//   Society admins manage team structure; students view it. The same data
//   is accessible from both sides but through different, role-guarded endpoints.
//   This prevents a student from adding/removing members or posting announcements.
//
// Middleware used:
//   verifyToken  — required on ALL routes (team data is always private/internal)
//   verifyRole   — "society" for admin routes, "student" for student-facing routes
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  addMember, getMembers, removeMember,
  postTeamAnnouncement, getTeamAnnouncements, deleteTeamAnnouncement,
  getMySocieties, getSocietyMembers, getSocietyTeamAnnouncements, getMyTeamAnnouncements, getMyTeamMembers,
} from "../controllers/teamController.js";
import verifyToken from "../middleware/authMiddleware.js"; // JWT validation
import verifyRole from "../middleware/roleMiddleware.js"; // role-based access guard

const router = express.Router();

// ── SOCIETY ADMIN ROUTES ──────────────────────────────────────────────────────
// Only accessible by authenticated society accounts.

// GET /api/team/members
// Returns all team members of the currently logged-in society.
// Used on the society's team management dashboard.
router.get("/members", verifyToken, verifyRole("society"), getMembers);

// POST /api/team/members
// Adds a student (identified by roll number) to the society's team.
// The society admin manually adds members after accepting them through recruitment.
// Expects body: { rollNo, name, role } (or similar fields defined in the model)
router.post("/members", verifyToken, verifyRole("society"), addMember);

// DELETE /api/team/members/:id
// Removes a team member by their TeamMember document _id.
// The controller checks that the member belongs to the requesting society
// before deleting, preventing a society from removing another society's members.
router.delete("/members/:id", verifyToken, verifyRole("society"), removeMember);

// GET /api/team/announcements
// Returns all internal team announcements posted by the currently logged-in society.
// These are private — visible only to the society admin and their team members.
router.get("/announcements", verifyToken, verifyRole("society"), getTeamAnnouncements);

// POST /api/team/announcements
// Creates a new internal team announcement for the logged-in society.
// Unlike public announcements (/api/announcements), these are only shown to
// students who are members of that specific society.
router.post("/announcements", verifyToken, verifyRole("society"), postTeamAnnouncement);

// DELETE /api/team/announcements/:id
// Deletes a team announcement by its MongoDB ObjectId.
// Protected: only the society that created it can delete it.
router.delete("/announcements/:id", verifyToken, verifyRole("society"), deleteTeamAnnouncement);

// ── STUDENT ROUTES ────────────────────────────────────────────────────────────
// Only accessible by authenticated student accounts.
// These provide a student's view of the team data across all societies they belong to.

// GET /api/team/my-societies
// Returns a list of all societies the logged-in student is a member of.
// Used on the student's dashboard to show their team memberships at a glance.
router.get("/my-societies", verifyToken, verifyRole("student"), getMySocieties);

// GET /api/team/my-announcements
// Returns all internal team announcements from every society the student is a member of.
// Aggregates announcements across multiple societies into one feed.
router.get("/my-announcements", verifyToken, verifyRole("student"), getMyTeamAnnouncements);

// GET /api/team/my-members
// Returns co-members across all societies the student belongs to.
// Lets a student see who else is on their team(s).
router.get("/my-members", verifyToken, verifyRole("student"), getMyTeamMembers);

// GET /api/team/society/:societyId/members
// Returns the member list for a specific society.
// The student must be a member of that society (enforced in the controller)
// to prevent students from snooping on other societies' team rosters.
router.get("/society/:societyId/members", verifyToken, verifyRole("student"), getSocietyMembers);

// GET /api/team/society/:societyId/announcements
// Returns internal team announcements for a specific society.
// Again, the controller verifies that the requesting student is a member.
router.get("/society/:societyId/announcements", verifyToken, verifyRole("student"), getSocietyTeamAnnouncements);

export default router;
