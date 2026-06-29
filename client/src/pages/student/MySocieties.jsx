import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import GroupChat from "../../components/GroupChat";

// Converts a UTC date string to a relative time string ("2m ago", "1h ago", etc.)
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Color lookup for position badges.
// Defined outside the component so the object is created only once (not on every render).
// Falls back to "General Member" styling for any unrecognised position string.
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

// MySocieties shows a student all the societies they are a team member of.
// It has two views:
//   Grid view: a card for each membership.
//   Detail view: tabs for Members, Announcements, and Group Chat within a selected society.
const MySocieties = () => {
  const { user, token , backendUrl } = useContext(AppContext);

  // memberships: the student's society memberships (each has a .society object and .position)
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  // search: text for filtering the society cards in the grid view
  const [search, setSearch] = useState("");

  // ── Detail view state ──
  // selected: the membership object whose detail view is active; null = show grid
  const [selected, setSelected] = useState(null);
  // tab: which tab is active inside the detail view ("members" | "announcements" | "chat")
  const [tab, setTab] = useState("members");
  // members / announcements: the detailed data fetched when a specific society is opened
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  // memberSearch: text for filtering the member list within the detail view
  const [memberSearch, setMemberSearch] = useState("");
  // selectedAnnouncement: the announcement open in the inner announcement modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    document.body.style.overflow = selectedAnnouncement ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedAnnouncement]);

  // On mount: fetch the student's society memberships
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/team/my-societies", { headers: { token } });
        if (!data.success) { toast.error(data.message); return; }
        setMemberships(data.data);
      } catch (e) {
        toast.error(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Opens the detail view for a specific society membership.
  // Fetches members, announcements, and messages in parallel.
  const openSociety = async (membership) => {
    const societyId = membership.society._id;
    setSelected(membership);
    setTab("members");
    setMemberSearch("");
    setDetailLoading(true);

    try {
      const [{ data: membersData }, { data: announcementsData }] = await Promise.all([
        axios.get(backendUrl + `/api/team/society/${societyId}/members`, { headers: { token } }),
        axios.get(backendUrl + `/api/team/society/${societyId}/announcements`, { headers: { token } }),
      ]);
      if (!membersData.success) { toast.error(membersData.message); setSelected(null); return; }
      if (!announcementsData.success) { toast.error(announcementsData.message); setSelected(null); return; }
      setMembers(membersData.data);
      setAnnouncements(announcementsData.data);
    } catch (e) {
      setSelected(null);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // Returns to the grid view and clears all detail-view data from state
  const goBack = () => {
    setSelected(null);
    setMembers([]);
    setAnnouncements([]);
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
      ))}
    </div>
  );

  /* ── DETAIL VIEW ── */
  if (selected) {
    // Filter members by name, roll number, or position inside the detail view
    const filteredMembers = members.filter((m) => {
      const q = memberSearch.toLowerCase();
      return m.name.toLowerCase().startsWith(q) ||
        m.rollNo.toLowerCase().startsWith(q) ||
        m.position.toLowerCase().startsWith(q);
    });

    return (
      <div>
        {/* Back button navigates from the detail view back to the society grid */}
        <button onClick={goBack}
          className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm mb-6">
          ← Back to My Societies
        </button>

        {/* Society header card: shows logo (or letter fallback), name, category, and the student's role */}
        <div className="flex items-center gap-5 mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          {selected.society?.logo
            ? <img src={selected.society.logo} className="w-16 h-16 rounded-full object-contain bg-slate-800 border-2 border-white/20 shrink-0" />
            : <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-2xl font-bold text-white/70 shrink-0">
                {selected.society?.name?.charAt(0).toUpperCase()}
              </div>}
          <div>
            <h2 className="text-2xl font-bold">{selected.society?.name}</h2>
            <p className="text-white/40 text-sm">{selected.society?.category} · {selected.society?.college}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/40 text-xs">Your role:</span>
              {/* Position badge with color lookup; falls back to General Member style */}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${POSITION_COLORS[selected.position] || POSITION_COLORS["General Member"]}`}>
                {selected.position}
              </span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: "members", label: "👥 Members" },
            { id: "announcements", label: "📣 Announcements" },
            { id: "chat", label: "💬 Group Chat" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px
                ${tab === id ? "border-purple-500 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content: show a skeleton while detail data is loading, then render the active tab */}
        {detailLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : tab === "members" ? (
          <div>
            {/* Member search: filters the member list by name, roll no, or position */}
            <input
              type="text" placeholder="Search by name, roll no or position..."
              value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-5"
            />
            {filteredMembers.length === 0 ? (
              <div className="text-center py-16 text-white/30">No members match your search.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMembers.map((m) => (
                  <div key={m._id} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar: first letter of the member's name */}
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500/30 to-blue-500/30 border border-white/20 flex items-center justify-center text-sm font-bold text-white/70 shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-white/30 text-xs">Roll: {m.rollNo}</p>
                      </div>
                    </div>
                    {/* Position badge using the color lookup map */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${POSITION_COLORS[m.position] || POSITION_COLORS["General Member"]}`}>
                      {m.position}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === "announcements" ? (
          // Announcements tab: each row is clickable and opens an inner modal for the full content
          <div className="flex flex-col gap-3">
            {announcements.length === 0
              ? <div className="text-center py-16 text-white/30">No team announcements yet.</div>
              : announcements.map((a) => (
                <div key={a._id}
                  className="rounded-xl bg-white/5 border border-white/10 p-4 cursor-pointer hover:border-white/20 transition"
                  onClick={() => setSelectedAnnouncement(a)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Internal</span>
                    <span className="text-white/30 text-xs">{timeAgo(a.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{a.title}</h3>
                  {/* line-clamp-2: preview only; full content shown in the modal */}
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{a.content}</p>
                </div>
              ))}
          </div>
        ) : (
          // Chat tab: renders the GroupChat component with the student's identity
          <GroupChat
            societyId={selected.society._id}
            currentUserName={user?.name}
            currentUserRole="student"
          />
        )}

      {/* Inner modal: shows the full content of a selected team announcement */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelectedAnnouncement(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Internal</span>
                <h2 className="font-bold text-lg mt-2">{selectedAnnouncement.title}</h2>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <p className="text-white/70 text-sm leading-relaxed">{selectedAnnouncement.content}</p>
              <p className="text-white/30 text-xs mt-4">{timeAgo(selectedAnnouncement.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  /* ── GRID VIEW ── */
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">My Societies</h1>
      <p className="text-white/40 mb-6">Societies you are a member of</p>

      {/* Search input filters the membership cards by society name, category, or position */}
      <input
        type="text" placeholder="Search by society name, category or position..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-8"
      />

      {memberships.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <p className="text-4xl mb-4">🏛️</p>
          <p>You haven't been added to any society team yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships
            .filter((m) => {
              const q = search.toLowerCase();
              return m.society?.name?.toLowerCase().startsWith(q) ||
                m.society?.category?.toLowerCase().startsWith(q) ||
                m.position.toLowerCase().startsWith(q);
            })
            .map((m) => (
              <div key={m._id} onClick={() => openSociety(m)}
                className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 transition p-5 flex items-center gap-4">
                {m.society?.logo
                  ? <img src={m.society.logo} className="w-12 h-12 rounded-full object-contain bg-slate-800 border border-white/20 shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xl font-bold text-white/70 shrink-0">
                      {m.society?.name?.charAt(0).toUpperCase()}
                    </div>}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{m.society?.name}</p>
                  <p className="text-white/40 text-xs">{m.society?.category}</p>
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${POSITION_COLORS[m.position] || POSITION_COLORS["General Member"]}`}>
                    {m.position}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default MySocieties;
