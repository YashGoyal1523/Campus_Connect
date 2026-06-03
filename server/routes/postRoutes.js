import express from "express";
import {
  createPost,
  getPostsBySociety,
  deletePost,
} from "../controllers/postController.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/", verifyToken, verifyRole("society"), upload.single("media"), createPost);
router.get("/:societyId", getPostsBySociety);
router.delete("/:id", verifyToken, verifyRole("society"), deletePost);

export default router;