import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Message from "./models/MessageModel.js";
import TeamMember from "./models/TeamMemberModel.js";
import Student from "./models/StudentModel.js";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/authRoutes.js";
import societyRoutes from "./routes/societyRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import recruitmentRoutes from "./routes/recruitmentRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Socket.io requires an HTTP server — we wrap express app inside it
// This way both REST API and WebSocket connections use the same port
const httpServer = createServer(app);

// Initialize Socket.io on the HTTP server
// cors: "*" allows connections from any origin (restrict in production)
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json()); // parse incoming JSON request bodies

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

app.get("/", (req, res) => {
  res.send("CampusConnect API is running...");
});

// ─── SOCKET.IO — REAL TIME GROUP CHAT ────────────────────────────────────────
// io.on("connection") fires every time a client connects via WebSocket
// Each connected client gets their own unique "socket" object
io.on("connection", (socket) => {

  // CLIENT → SERVER: student/society joins a society's chat room
  // socket.join(societyId) adds this socket to a named "room"
  // After joining, this socket will receive all events emitted to that room
  socket.on("join_room", ({ societyId }) => {
    socket.join(societyId);
  });

  // CLIENT → SERVER: someone sends a message
  // We verify their token server-side (can't trust client for permissions)
  socket.on("send_message", async ({ token, societyId, content, attachmentUrl, attachmentType }) => {
    try {
      // Verify JWT token to identify WHO is sending the message
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let senderName;
      let senderRollNo = "";
      let senderPosition = "";
      let senderRole = decoded.role;

      if (decoded.role === "student") {
        const student = await Student.findById(decoded.id);

        // Verify the student is actually a member of this society
        // Prevents unauthorized users from sending messages even with a valid token
        const isMember = await TeamMember.findOne({ society: societyId, rollNo: student.rollNo });
        if (!isMember) return; // silently reject — not a member

        senderName = student.name;
        senderRollNo = student.rollNo;
        senderPosition = isMember.position; // e.g. "Tech Lead"
      } else {
        // Society admin — verify they own this chat room
        if (decoded.id !== societyId) return;

        // Dynamic import to avoid circular dependency issues
        const Society = (await import("./models/SocietyModel.js")).default;
        const society = await Society.findById(decoded.id);
        senderName = society.name;
      }

      // Save the message to MongoDB (persists chat history)
      const message = await Message.create({
        society: societyId,
        senderId: decoded.id,
        senderName,
        senderRollNo,
        senderPosition,
        senderRole,
        content: content || "",
        attachmentUrl: attachmentUrl || "",   // Cloudinary URL if media attached
        attachmentType: attachmentType || "", // "image" or "video"
      });

      // SERVER → ALL CLIENTS IN ROOM: broadcast the message to everyone in this society's room
      // io.to(societyId) targets only the sockets that joined this specific room
      io.to(societyId).emit("receive_message", {
        _id: message._id,
        senderId: message.senderId,
        senderName: message.senderName,
        senderRollNo: message.senderRollNo,
        senderPosition: message.senderPosition,
        senderRole: message.senderRole,
        content: message.content,
        attachmentUrl: message.attachmentUrl,
        attachmentType: message.attachmentType,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error("Socket error:", err.message);
    }
  });

  // CLIENT → SERVER: unsend/delete a message
  // Only the original sender OR the society admin can delete
  socket.on("delete_message", async ({ token, societyId, messageId }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const message = await Message.findById(messageId);
      if (!message) return;

      // Permission check — reject if neither the sender nor the admin
      const isSender = message.senderId === decoded.id;
      const isSocietyAdmin = decoded.role === "society" && decoded.id === societyId;
      if (!isSender && !isSocietyAdmin) return;

      // Remove from MongoDB permanently
      await message.deleteOne();

      // SERVER → ALL CLIENTS IN ROOM: tell everyone to remove this message from their UI
      // Each client filters their messages array by _id to remove just this one
      io.to(societyId).emit("message_deleted", { messageId });
    } catch (err) {
      console.error("Socket error:", err.message);
    }
  });

  // CLIENT → SERVER: client leaves the chat (navigates away)
  // socket.leave removes them from the room so they stop receiving messages
  socket.on("leave_room", ({ societyId }) => {
    socket.leave(societyId);
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
