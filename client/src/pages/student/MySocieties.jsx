import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";
import GroupChat from "../../components/GroupChat";
import { useAuth } from "../../context/AuthContext";

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

// Count items newer than saved timestamp for a given key
const countNew = (items, key) => {
  const lastSeen = localStorage.getItem(key);
  if (!lastSeen) return items.length;
  return items.filter((item) => new Date(item.createdAt) > new Date(lastSeen)).length;
};

export default function MySocieties() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Detail view state
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  // Per-tab badge counts inside a society
  const [membersBadge, setMembersBadge] = useState(0);
  const [announcementsBadge, setAnnouncementsBadge] = useState(0);
  const [chatBadge, setChatBadge] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: mySocietiesData }, { data: membersData }, { data: announcementsData }] = await Promise.all([
        axios.get("/team/my-societies"),
        axios.get("/team/my-members"),
        axios.get("/team/my-announcements"),
      ]);
      setMemberships(mySocietiesData);
      setAllMembers(membersData);
      setAllAnnouncements(announcementsData);

      // Fetch messages for each society to build card badges
      const messagesBySOciety = await Promise.all(
        mySocietiesData.map((m) => axios.get(`/messages/${m.society._id}`))
      );
      setAllMessages(messagesBySOciety.map(({ data }, i) => ({
        societyId: mySocietiesData[i].society._id,
        messages: data,
      })));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Card badge = new members + new announcements for that society since last visit
  const getCardBadge = (societyId) => {
    const chatLastSeen = localStorage.getItem(`cc_lastSeen_society_${societyId}_chat`);
    const generalLastSeen = localStorage.getItem(`cc_lastSeen_society_${societyId}`);

    const newMembers = allMembers.filter((m) =>
      m.society?.toString() === societyId && (!generalLastSeen || new Date(m.createdAt) > new Date(generalLastSeen))
    ).length;

    const newAnnouncements = allAnnouncements.filter((a) =>
      a.society?.toString() === societyId && (!generalLastSeen || new Date(a.createdAt) > new Date(generalLastSeen))
    ).length;

    const societyMessages = allMessages.find((s) => s.societyId === societyId)?.messages || [];
    const newMessages = societyMessages.filter((msg) =>
      !chatLastSeen || new Date(msg.createdAt) > new Date(chatLastSeen)
    ).length;

    return newMembers + newAnnouncements + newMessages;
  };

  const openSociety = async (membership) => {
    const societyId = membership.society._id;
    setSelected(membership);
    setTab("members");
    setMemberSearch("");
    setDetailLoading(true);

    const [{ data: membersData }, { data: announcementsData }, { data: messagesData }] = await Promise.all([
      axios.get(`/team/society/${societyId}/members`),
      axios.get(`/team/society/${societyId}/announcements`),
      axios.get(`/messages/${societyId}`),
    ]);
    setMembers(membersData);
    setAnnouncements(announcementsData);
    setDetailLoading(false);

    // Calculate per-tab badges
    setMembersBadge(countNew(membersData, `cc_lastSeen_society_${societyId}_members`));
    setAnnouncementsBadge(countNew(announcementsData, `cc_lastSeen_society_${societyId}_announcements`));
    setChatBadge(countNew(messagesData, `cc_lastSeen_society_${societyId}_chat`));

    // Reset card badge (mark society as visited)
    localStorage.setItem(`cc_lastSeen_society_${societyId}`, new Date().toISOString());
  };

  const handleTabChange = (id) => {
    setTab(id);
    const societyId = selected.society._id;
    if (id === "members") {
      localStorage.setItem(`cc_lastSeen_society_${societyId}_members`, new Date().toISOString());
      setMembersBadge(0);
    } else if (id === "announcements") {
      localStorage.setItem(`cc_lastSeen_society_${societyId}_announcements`, new Date().toISOString());
      setAnnouncementsBadge(0);
    } else if (id === "chat") {
      localStorage.setItem(`cc_lastSeen_society_${societyId}_chat`, new Date().toISOString());
      setChatBadge(0);
    }
  };

  const goBack = () => {
    setSelected(null);
    setMembers([]);
    setAnnouncements([]);
  };

  if (loading) return <Spinner />;

  /* ── DETAIL VIEW ── */
  if (selected) {
    const filteredMembers = members.filter((m) => {
      const q = memberSearch.toLowerCase();
      return m.name.toLowerCase().startsWith(q) ||
        m.rollNo.toLowerCase().startsWith(q) ||
        m.position.toLowerCase().startsWith(q);
    });

    return (
      <div>
        <button onClick={goBack}
          className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm mb-6">
          ← Back to My Societies
        </button>

        {/* Society header */}
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
              <span className={`text-xs px-2 py-0.5 rounded-full border ${POSITION_COLORS[selected.position] || POSITION_COLORS["General Member"]}`}>
                {selected.position}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs with badges */}
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: "members", label: "👥 Members", badge: membersBadge },
            { id: "announcements", label: "📣 Announcements", badge: announcementsBadge },
            { id: "chat", label: "💬 Group Chat", badge: chatBadge },
          ].map(({ id, label, badge }) => (
            <button key={id} onClick={() => handleTabChange(id)}
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

        {detailLoading ? <Spinner /> : tab === "members" ? (
          <div>
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
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500/30 to-blue-500/30 border border-white/20 flex items-center justify-center text-sm font-bold text-white/70 shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-white/30 text-xs">Roll: {m.rollNo}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${POSITION_COLORS[m.position] || POSITION_COLORS["General Member"]}`}>
                      {m.position}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === "announcements" ? (
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
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{a.content}</p>
                </div>
              ))}
          </div>
        ) : (
          <GroupChat
            societyId={selected.society._id}
            currentUserName={user?.name}
            currentUserRole="student"
          />
        )}

      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelectedAnnouncement(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Internal</span>
                <h2 className="font-bold text-lg mt-2">{selectedAnnouncement.title}</h2>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
            </div>
            <div className="px-6 py-5">
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
            .map((m) => {
              const cardBadge = getCardBadge(m.society._id);
              return (
                <div key={m._id} onClick={() => openSociety(m)}
                  className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 transition p-5 flex items-center gap-4 relative">
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
                  {cardBadge > 0 && (
                    <span className="absolute top-3 right-3 text-xs bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                      {cardBadge}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
