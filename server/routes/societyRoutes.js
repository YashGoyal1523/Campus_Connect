import express from "express";
import {
  getAllSocieties,
  getSocietyById,
  updateSocietyProfile,
} from "../controllers/societyController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

router.get("/", getAllSocieties);
router.get("/:id", getSocietyById);
router.put(
  "/update",
  verifyToken,
  verifyRole("society"),
  upload.single("logo"),
  updateSocietyProfile
);

export default router;