import jwt from "jsonwebtoken";
import Message from "../models/MessageModel.js";
import TeamMember from "../models/TeamMemberModel.js";
import Student from "../models/StudentModel.js";

// Initialize Socket.io event handlers for real-time group chat
export const initializeSocket = (io) => {
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
          if (!isMember) return; // silently reject - not a member

          senderName = student.name;
          senderRollNo = student.rollNo;
          senderPosition = isMember.position; // e.g. "Tech Lead"
        } else {
          // Society admin - verify they own this chat room
          if (decoded.id !== societyId) return;

          // Dynamic import to avoid circular dependency issues
          const Society = (await import("../models/SocietyModel.js")).default;
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

        // Permission check - reject if neither the sender nor the admin
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
};
