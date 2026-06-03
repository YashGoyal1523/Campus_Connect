import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventsBySociety,
  deleteEvent,
} from "../controllers/eventController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", verifyToken, verifyRole("society"), upload.single("poster"), createEvent);
router.get("/my", verifyToken, verifyRole("society"), getEventsBySociety);
router.delete("/:id", verifyToken, verifyRole("society"), deleteEvent);

export default router;