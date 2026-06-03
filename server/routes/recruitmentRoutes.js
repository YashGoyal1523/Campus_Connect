import express from "express";
import {
  createRecruitment,
  getAllRecruitments,
  getRecruitmentsBySociety,
  deleteRecruitment,
} from "../controllers/recruitmentController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getAllRecruitments);
router.post("/", verifyToken, verifyRole("society"), createRecruitment);
router.get("/my", verifyToken, verifyRole("society"), getRecruitmentsBySociety);
router.delete("/:id", verifyToken, verifyRole("society"), deleteRecruitment);

export default router;