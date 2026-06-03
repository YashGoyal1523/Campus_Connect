import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getMyAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getAllAnnouncements);
router.post("/", verifyToken, verifyRole("society"), createAnnouncement);
router.get("/my", verifyToken, verifyRole("society"), getMyAnnouncements);
router.delete("/:id", verifyToken, verifyRole("society"), deleteAnnouncement);

export default router;
