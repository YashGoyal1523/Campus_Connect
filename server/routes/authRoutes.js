import express from "express";
import {
  registerStudent,
  loginStudent,
  registerSociety,
  loginSociety,
  getMe,
  deleteAccount,
} from "../controllers/authController.js";
import { upload } from "../utils/cloudinary.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);
router.post("/society/register", upload.single("logo"), registerSociety);
router.post("/society/login", loginSociety);
router.get("/me", verifyToken, getMe);
router.delete("/me", verifyToken, deleteAccount);

export default router;