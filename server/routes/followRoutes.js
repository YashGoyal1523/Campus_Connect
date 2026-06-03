import express from "express";
import { followSociety, unfollowSociety, getFeed } from "../controllers/followController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/feed", verifyToken, verifyRole("student"), getFeed);
router.post("/:societyId", verifyToken, verifyRole("student"), followSociety);
router.delete("/:societyId", verifyToken, verifyRole("student"), unfollowSociety);

export default router;
