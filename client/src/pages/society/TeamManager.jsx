import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";
import GroupChat from "../../components/GroupChat";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const POSITIONS = [
  "President", "Vice President", "Secretary", "Treasurer",
  "Tech Lead", "Design Lead", "Marketing Lead", "Content Lead",
  "Core Member", "General Member",
];

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const POSITION_COLORS = {
  "President": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Vice President": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Secretary": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Treasurer": "bg-green-500/20 text-green-300 border-green-500/30",
  "Tech Lead": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Design Lead": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "Marketing Lead": "bg-red-500/20 text-red-300 border-red-500/30",
  "Content Lead": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "Core Member": "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "General Member": "bg-white/10 text-white/50 border-white/20",
};

export default function TeamManager() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState("members");

  const [memberForm, setMemberForm] = useState({ name: "", rollNo: "", position: "" });
  const [memberLoading, setMemberLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [chatBadge, setChatBadge] = useState(0);

  const chatKey = `cc_society_chat_lastSeen_${user?.id}`;

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: membersData }, { data: announcementsData }, { data: messagesData }] = await Promise.all([
        axios.get("/team/members"),
        axios.get("/team/announcements"),
        axios.get(`/messages/${user.id}`),
      ]);
      setMembers(membersData);
      setAnnouncements(announcementsData);
      setFetching(false);

      const lastSeen = localStorage.getItem(chatKey);
      const unread = messagesData.filter((msg) =>
        msg.senderRole === "student" && (!lastSeen || new Date(msg.createdAt) > new Date(lastSeen))
      ).length;
      setChatBadge(unread);
    };
    fetchData();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberLoading(true);
    try {
      const { data } = await axios.post("/team/members", memberForm);
      setMembers((prev) => [...prev, data]);
      setMemberForm({ name: "", rollNo: "", position: "" });
      toast.success("Member added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (id) => {
    await axios.delete(`/team/members/${id}`);
    setMembers((prev) => prev.filter((m) => m._id !== id));
    toast.success("Member removed");
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementLoading(true);
    try {
      const { data } = await axios.post("/team/announcements", announcementForm);
      setAnnouncements((prev) => [data, ...prev]);
      setAnnouncementForm({ title: "", content: "" });
      toast.success("Announcement posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    await axios.delete(`/team/announcements/${id}`);
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    toast.success("Deleted");
  };

  // Filter then group
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().startsWith(q) || m.rollNo.toLowerCase().startsWith(q) || m.position.toLowerCase().startsWith(q);
  });
  const leaders = filteredMembers.filter((m) => !["Core Member", "General Member"].includes(m.position));
  const general = filteredMembers.filter((m) => ["Core Member", "General Member"].includes(m.position));

  if (fetching) return <Spinner />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Team</h1>
      <p className="text-white/40 mb-6">Manage your society's team members and internal announcements</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
        {[
          { id: "members", label: "👥 Members", badge: 0 },
          { id: "announcements", label: "📣 Team Announcements", badge: 0 },
          { id: "chat", label: "💬 Group Chat", badge: chatBadge },
        ].map(({ id, label, badge }) => (
          <button key={id} onClick={() => {
            setTab(id);
            if (id === "chat") {
              localStorage.setItem(chatKey, new Date().toISOString());
              setChatBadge(0);
            }
          }}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px
              ${tab === id ? "border-purple-500 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
            {label}
            {badge > 0 && (
              <span className="text-xs bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div>
          {/* Add member form */}
          <form onSubmit={handleAddMember}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-8 flex flex-col gap-3">
            <h2 className="font-semibold text-white/80 text-sm">Add Member</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input name="name" placeholder="Full Name" value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              <input name="rollNo" placeholder="Roll Number" value={memberForm.rollNo}
                onChange={(e) => setMemberForm({ ...memberForm, rollNo: e.target.value })} required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              <select value={memberForm.position}
                onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })} required
                className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition text-white/80 appearance-none cursor-pointer">
                <option value="" disabled>Select Position</option>
                {POSITIONS.map((p) => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
              </select>
            </div>
            <button type="submit" disabled={memberLoading}
              className="self-start px-5 py-2 rounded-xl bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:bg-purple-500/40 transition text-sm font-medium disabled:opacity-50">
              {memberLoading ? "Adding..." : "+ Add Member"}
            </button>
          </form>

          <input
            type="text" placeholder="Search by name, roll no or position..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-6"
          />

          {members.length === 0 ? (
            <div className="text-center py-16 text-white/30">No team members yet.</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 text-white/30">No members match your search.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Leadership */}
              {leaders.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Leadership</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leaders.map((m) => (
                      <div key={m._id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 border border-white/20 flex items-center justify-center text-sm font-bold text-white/80 shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold text-sm truncate">{m.name}</p>
                          </div>
                          <p className="text-white/40 text-xs">Roll: {m.rollNo}</p>
                          <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${POSITION_COLORS[m.position] || POSITION_COLORS["General Member"]}`}>
                            {m.position}
                          </span>
                        </div>
                        <button onClick={() => handleRemoveMember(m._id)}
                          className="shrink-0 w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition text-xs">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Members */}
              {general.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Members ({general.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {general.map((m) => (
                      <div key={m._id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.name}</p>
                            <p className="text-white/30 text-xs">Roll: {m.rollNo} · <span className={`text-xs px-1.5 py-0.5 rounded-full border ${POSITION_COLORS[m.position] || POSITION_COLORS["General Member"]}`}>{m.position}</span></p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveMember(m._id)}
                          className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition text-xs">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TEAM ANNOUNCEMENTS TAB ── */}
      {tab === "announcements" && (
        <div>
          <form onSubmit={handlePostAnnouncement}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-8 flex flex-col gap-3">
            <h2 className="font-semibold text-white/80 text-sm">Post Internal Announcement</h2>
            <input placeholder="Title" value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} required
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
            <textarea placeholder="Write your message to the team..." value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} required rows={3}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
            <button type="submit" disabled={announcementLoading}
              className="self-start px-5 py-2 rounded-xl bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:bg-purple-500/40 transition text-sm font-medium disabled:opacity-50">
              {announcementLoading ? "Posting..." : "Post"}
            </button>
          </form>

          {announcements.length === 0 ? (
            <div className="text-center py-16 text-white/30">No team announcements yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {announcements.map((a) => (
                <div key={a._id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Internal</span>
                      <span className="text-white/30 text-xs">{timeAgo(a.createdAt)}</span>
                    </div>
                    <h3 className="font-bold text-sm">{a.title}</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">{a.content}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(a._id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-xs">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <GroupChat
          societyId={user.id}
          currentUserName={user.name}
          currentUserRole="society"
        />
      )}
    </div>
  );
}
