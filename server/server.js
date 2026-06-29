import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { initializeSocket } from "./config/socket.js";

import authRoutes from "./routes/authRoutes.js";
import societyRoutes from "./routes/societyRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import recruitmentRoutes from "./routes/recruitmentRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// Initialize Express app
const app = express();

// Middleware: Enable CORS for cross-origin requests
app.use(cors());
// Middleware: Parse JSON request bodies
app.use(express.json());

// Connect to MongoDB database
await connectDB();

// Socket.io requires an HTTP server — wrap express app inside it
// This way both REST API and WebSocket connections use the same port
const httpServer = createServer(app);

// Initialize Socket.io on the HTTP server
// cors: "*" allows connections from any origin (restrict in production)
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Initialize Socket.io event handlers
initializeSocket(io);

// ─── REST API ROUTES ──────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);           // login, register, getMe, deleteAccount
app.use("/api/societies", societyRoutes);   // get all societies, get by id, update profile
app.use("/api/posts", postRoutes);          // create, get, delete posts
app.use("/api/recruitments", recruitmentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/follow", followRoutes);       // follow, unfollow, feed
app.use("/api/announcements", announcementRoutes);
app.use("/api/team", teamRoutes);           // team members, team announcements, my societies
app.use("/api/messages", messageRoutes);    // chat history, media upload

// Health check endpoint
app.get("/", (req, res) => {
  res.send("CampusConnect API is running...");
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
