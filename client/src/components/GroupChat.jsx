import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "../utils/axios";
import toast from "react-hot-toast";

// Connect to the Socket.io server
// Falls back to localhost if env variable not set
// This connection is created once at module level (when the file is first imported)
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000");

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Props:
// societyId — which society's chat room to connect to
// currentUserName — to identify which messages are "mine" (right-aligned)
// currentUserRole — "student" or "society" (society can delete any message)
export default function GroupChat({ societyId, currentUserName, currentUserRole }) {
  const [messages, setMessages] = useState([]);  // all messages in this chat
  const [input, setInput] = useState("");         // text input value
  const [file, setFile] = useState(null);         // selected media file (before upload)
  const [uploading, setUploading] = useState(false); // true while uploading to Cloudinary
  const [loading, setLoading] = useState(true);      // true while fetching history
  const bottomRef = useRef(null);     // ref to the bottom of message list (for auto-scroll)
  const fileInputRef = useRef(null);  // ref to hidden file input (triggered by attach button)
  const token = localStorage.getItem("token"); // JWT token sent with socket events for auth

  useEffect(() => {
    // ── LOAD CHAT HISTORY ────────────────────────────────────────────────────
    // Fetch all previous messages from MongoDB via REST API
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`/messages/${societyId}`);
        setMessages(data);
      } catch {
        // handled by axios interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // ── JOIN SOCKET ROOM ─────────────────────────────────────────────────────
    // Tell the server to add this client to this society's room
    // After this, server will broadcast messages to this client
    socket.emit("join_room", { societyId });

    // ── LISTEN FOR NEW MESSAGES ──────────────────────────────────────────────
    // Named handler references are required so cleanup removes only THIS component's
    // listeners. socket.off("event") without a reference removes ALL listeners for
    // that event — risky if the socket is shared. Named refs fix the duplicate-message bug.
    const handleReceive = (msg) => setMessages((prev) => [...prev, msg]);
    const handleDelete = ({ messageId }) => setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

    socket.on("receive_message", handleReceive);
    socket.on("message_deleted", handleDelete);

    // ── CLEANUP ──────────────────────────────────────────────────────────────
    // This runs when component unmounts (user navigates away from chat)
    // Leaves the room and removes only this component's event listeners
    return () => {
      socket.emit("leave_room", { societyId });
      socket.off("receive_message", handleReceive);
      socket.off("message_deleted", handleDelete);
    };
  }, [societyId]); // re-run if societyId changes (switching between societies)

  // Auto-scroll to the latest message whenever messages array updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return; // nothing to send

    let attachmentUrl = "";
    let attachmentType = "";

    // ── UPLOAD MEDIA FIRST (if file selected) ────────────────────────────────
    // Socket.io only carries text — actual file goes to Cloudinary via HTTP
    // We get back a URL, then send that URL through the socket
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await axios.post("/messages/upload", formData);
        attachmentUrl = data.url;   // Cloudinary URL
        attachmentType = data.type; // "image" or "video"
      } catch (err) {
        toast.error(err.response?.data?.message || "Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // ── SEND MESSAGE VIA SOCKET ───────────────────────────────────────────────
    // Server verifies the token, saves to DB, then broadcasts to the room
    socket.emit("send_message", {
      token,        // JWT for server-side auth verification
      societyId,
      content: input.trim(),
      attachmentUrl,
      attachmentType,
    });

    // Reset input fields
    setInput("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Tell server to delete this message
  // Server checks if user is the sender OR society admin before deleting
  const handleUnsend = (messageId) => {
    socket.emit("delete_message", { token, societyId, messageId });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-125">
      {/* ── MESSAGE LIST ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-sm py-12">No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg) => {
          // Determine if this message belongs to the current user
          // Used to right-align "my" messages and left-align others
          const isMe = msg.senderName === currentUserName && msg.senderRole === currentUserRole;

          // Society admin can delete ANY message, sender can delete their own
          const canDelete = isMe || currentUserRole === "society";

          return (
            <div key={msg._id} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>

              {/* Show sender info only for messages from others */}
              {!isMe && (
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-white/70">{msg.senderName}</span>
                  {msg.senderRole === "society" ? (
                    // Society messages get "Admin" badge
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin</span>
                  ) : (
                    <>
                      {/* Student messages show roll number and position */}
                      {msg.senderRollNo && <span className="text-xs text-white/40">{msg.senderRollNo}</span>}
                      {msg.senderPosition && <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/20">{msg.senderPosition}</span>}
                    </>
                  )}
                </div>
              )}

              <div className={`flex items-center gap-2 ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                {/* Delete/unsend button — appears on hover only */}
                {canDelete && (
                  <button onClick={() => handleUnsend(msg._id)}
                    className="opacity-0 group-hover:opacity-100 transition text-white/30 hover:text-red-400 text-xs shrink-0"
                    title={isMe ? "Unsend" : "Delete message"}>
                    🗑
                  </button>
                )}

                {/* Message bubble */}
                <div className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${
                  isMe
                    ? "bg-purple-500 text-white rounded-br-sm"
                    : "bg-white/10 text-white/90 rounded-bl-sm"
                }`}>
                  {/* Render image or video if message has attachment */}
                  {msg.attachmentUrl && (
                    msg.attachmentType === "video"
                      ? <video src={msg.attachmentUrl} controls className="w-full max-h-64 object-contain bg-black" />
                      : <img src={msg.attachmentUrl} alt="attachment" className="w-full max-h-64 object-contain bg-black" />
                  )}
                  {/* Text content */}
                  {msg.content && <p className="px-4 py-2.5">{msg.content}</p>}
                </div>
              </div>

              <span className="text-white/30 text-xs mt-1">{timeAgo(msg.createdAt)}</span>
            </div>
          );
        })}
        {/* Invisible div at bottom — scrollIntoView targets this for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* ── FILE PREVIEW ──────────────────────────────────────────────────── */}
      {/* Shows selected file name before sending, with option to cancel */}
      {file && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="text-sm text-white/60 truncate flex-1">📎 {file.name}</span>
          <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            className="text-white/40 hover:text-red-400 transition text-sm shrink-0">✕</button>
        </div>
      )}

      {/* ── INPUT BAR ─────────────────────────────────────────────────────── */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        {/* Hidden file input — triggered when attach button is clicked */}
        <input type="file" accept="image/*,video/*" ref={fileInputRef} hidden
          onChange={(e) => setFile(e.target.files[0])} />

        {/* Attach button — programmatically clicks the hidden file input */}
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm shrink-0"
          title="Attach photo or video">
          📎
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30"
        />
        <button type="submit" disabled={uploading || (!input.trim() && !file)}
          className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 transition text-sm font-semibold disabled:opacity-40">
          {uploading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
