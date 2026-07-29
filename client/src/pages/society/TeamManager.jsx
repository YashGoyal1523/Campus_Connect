import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import GroupChat from "../../components/GroupChat";

// Ordered list of available positions used to populate the position dropdown.
// Defined outside the component so the array is never recreated on re-renders.
const POSITIONS = [
  "President", "Vice President", "Secretary", "Treasurer",
  "Tech Lead", "Design Lead", "Marketing Lead", "Content Lead",
  "Core Member", "General Member",
];

// Converts a UTC date string to a relative time string (e.g. "3m ago", "2h ago")
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Color classes per position for badge styling.
// Falls back to "General Member" style for any unrecognised position string.
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

// TeamManager is the society-side panel for managing team membership,
// posting internal (team-only) announcements, and accessing the group chat with team members.
const TeamManager = () => {
  const { user, token , backendUrl } = useContext(AppContext);

  // members: the current list of team members for this society
  const [members, setMembers] = useState([]);
  // announcements: team-only announcements visible only to society members
  const [announcements, setAnnouncements] = useState([]);
  // fetching: true during the initial parallel data fetch - shows the full-page skeleton
  const [fetching, setFetching] = useState(true);
  // tab: which section is active ("members" | "announcements" | "chat")
  const [tab, setTab] = useState("members");

  // memberForm: controlled state for the Add Member form fields
  const [memberForm, setMemberForm] = useState({ name: "", rollNo: "", position: "" });
  // memberLoading: disables the Add Member submit button while the request is in progress
  const [memberLoading, setMemberLoading] = useState(false);
  // search: text for filtering the member list within the Members tab
  const [search, setSearch] = useState("");

  // announcementForm: controlled state for the Post Announcement form fields
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  // announcementLoading: disables the post button while the request is in progress
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  // On mount: fetch members and team announcements in parallel.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: membersData }, { data: announcementsData }] = await Promise.all([
          axios.get(backendUrl + "/api/team/members", { headers: { token } }),
          axios.get(backendUrl + "/api/team/announcements", { headers: { token } }),
        ]);
        if (!membersData.success) { toast.error(membersData.message); return; }
        if (!announcementsData.success) { toast.error(announcementsData.message); return; }
        setMembers(membersData.data);
        setAnnouncements(announcementsData.data);
      } catch (e) {
        toast.error(e.response?.data?.message || e.message);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []); // empty array = run once on mount only

  // Submits the Add Member form.
  // On success, appends the new member returned by the server directly to local state -
  // avoiding a full re-fetch while still getting the server-assigned _id.
  const handleAddMember = async (e) => {
    e.preventDefault(); // Prevent browser default form submission
    setMemberLoading(true);
    try {
      const { data } = await axios.post(backendUrl + "/api/team/members", memberForm, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      // Append the new member to the end of the list (server assigns _id and createdAt)
      setMembers((prev) => [...prev, data.data]);
      // Reset the form so the society can immediately add the next member
      setMemberForm({ name: "", rollNo: "", position: "" });
      toast.success("Member added!");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setMemberLoading(false);
    }
  };

  // Removes a member by ID from the server and filters the local array.
  // No confirmation dialog: this is a low-stakes action that can be re-done easily.
  const handleRemoveMember = async (id) => {
    try {
      await axios.delete(backendUrl + `/api/team/members/${id}`, { headers: { token } });
      setMembers((prev) => prev.filter((m) => m._id !== id));
      toast.success("Member removed");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Posts a new internal announcement.
  // Prepends the new announcement to the list so it appears at the top without re-fetching.
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementLoading(true);
    try {
      const { data } = await axios.post(backendUrl + "/api/team/announcements", announcementForm, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      // Prepend so the newest announcement appears first
      setAnnouncements((prev) => [data.data, ...prev]);
      setAnnouncementForm({ title: "", content: "" });
      toast.success("Announcement posted!");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Deletes a team announcement and removes it from local state
  const handleDeleteAnnouncement = async (id) => {
    try {
      await axios.delete(backendUrl + `/api/team/announcements/${id}`, { headers: { token } });
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Build the filtered + grouped member lists for the Members tab.
  // Filtering runs synchronously on each render using the current search string.
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().startsWith(q) || m.rollNo.toLowerCase().startsWith(q) || m.position.toLowerCase().startsWith(q);
  });
  // Split into two groups so "Leadership" can be displayed in a visually distinct section above "Members"
  const leaders = filteredMembers.filter((m) => !["Core Member", "General Member"].includes(m.position));
  const general = filteredMembers.filter((m) => ["Core Member", "General Member"].includes(m.position));

  if (fetching) return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Team</h1>
      <p className="text-white/40 mb-6">Manage your society's team members and internal announcements</p>

      {/* Tab bar */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
        {["members", "announcements", "chat"].map((id) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px
              ${tab === id ? "border-purple-500 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
            {id === "members" ? "👥 Members" : id === "announcements" ? "📣 Team Announcements" : "💬 Group Chat"}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div>
          {/* Add Member form */}
          <form onSubmit={handleAddMember}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-8 flex flex-col gap-3">
            <h2 className="font-semibold text-white/80 text-sm">Add Member</h2>
            {/* Three fields in a responsive grid: name, roll number, position */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input name="name" placeholder="Full Name" value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              <input name="rollNo" placeholder="Roll Number" value={memberForm.rollNo}
                onChange={(e) => setMemberForm({ ...memberForm, rollNo: e.target.value })} required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              {/* appearance-none removes the native browser arrow on the select;
                  a custom dropdown-style is applied via Tailwind classes instead */}
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

          {/* Search input for filtering the member list */}
          <input
            type="text" placeholder="Search by name, roll no or position..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-6"
          />

          {/* Three separate empty states:
              1. No members at all (different from "none match the search")
              2. No members match the search
              3. Render the grouped member lists */}
          {members.length === 0 ? (
            <div className="text-center py-16 text-white/30">No team members yet.</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 text-white/30">No members match your search.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Leadership section: anyone who isn't a Core/General Member */}
              {leaders.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Leadership</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leaders.map((m) => (
                      <div key={m._id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {/* Avatar: first letter of name */}
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500/40 to-blue-500/40 border border-white/20 flex items-center justify-center text-sm font-bold text-white/80 shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            {/* truncate prevents long names from overflowing into the remove button */}
                            <p className="font-semibold text-sm truncate">{m.name}</p>
                          </div>
                          <p className="text-white/40 text-xs">Roll: {m.rollNo}</p>
                          <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${POSITION_COLORS[m.position] || POSITION_COLORS["General Member"]}`}>
                            {m.position}
                          </span>
                        </div>
                        {/* Remove button: ✕ icon styled as a small circular button */}
                        <button onClick={() => handleRemoveMember(m._id)}
                          className="shrink-0 w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition text-xs">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Members section: Core Members and General Members */}
              {general.length > 0 && (
                <div>
                  {/* Shows count inline as a quick indicator of team size */}
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Members ({general.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {general.map((m) => (
                      // Slightly more compact card than the leadership section
                      <div key={m._id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.name}</p>
                            {/* Roll number and position badge combined on one line to save vertical space */}
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
          {/* Create announcement form */}
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
                      {/* "Internal" badge distinguishes team announcements from public ones */}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Internal</span>
                      <span className="text-white/30 text-xs">{timeAgo(a.createdAt)}</span>
                    </div>
                    <h3 className="font-bold text-sm">{a.title}</h3>
                    {/* Full content is shown inline - no click-to-expand needed on the society side */}
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
      {/* GroupChat receives societyId (= user.id) and currentUserRole="society"
          so the chat component can correctly label outgoing messages */}
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

export default TeamManager;
