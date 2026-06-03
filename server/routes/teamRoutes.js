import express from "express";
import {
  addMember, getMembers, removeMember,
  postTeamAnnouncement, getTeamAnnouncements, deleteTeamAnnouncement,
  getMySocieties, getSocietyMembers, getSocietyTeamAnnouncements, getMyTeamAnnouncements, getMyTeamMembers,
} from "../controllers/teamController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/members", verifyToken, verifyRole("society"), getMembers);
router.post("/members", verifyToken, verifyRole("society"), addMember);
router.delete("/members/:id", verifyToken, verifyRole("society"), removeMember);

router.get("/announcements", verifyToken, verifyRole("society"), getTeamAnnouncements);
router.post("/announcements", verifyToken, verifyRole("society"), postTeamAnnouncement);
router.delete("/announcements/:id", verifyToken, verifyRole("society"), deleteTeamAnnouncement);

// Student routes
router.get("/my-societies", verifyToken, verifyRole("student"), getMySocieties);
router.get("/my-announcements", verifyToken, verifyRole("student"), getMyTeamAnnouncements);
router.get("/my-members", verifyToken, verifyRole("student"), getMyTeamMembers);
router.get("/society/:societyId/members", verifyToken, verifyRole("student"), getSocietyMembers);
router.get("/society/:societyId/announcements", verifyToken, verifyRole("student"), getSocietyTeamAnnouncements);

export default router;
