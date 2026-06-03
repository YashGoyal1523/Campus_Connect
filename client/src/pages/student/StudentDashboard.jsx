import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import toast from "react-hot-toast";
import Discover from "./Discover";
import Recruitment from "./Recruitment";
import Events from "./Events";
import Feed from "./Feed";
import Announcements from "./Announcements";
import MySocieties from "./MySocieties";

const navItems = [
  { id: "feed", label: "Feed", icon: "🏠" },
  { id: "discover", label: "Discover", icon: "🔭" },
  { id: "my-societies", label: "My Societies", icon: "🏛️" },
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "recruitment", label: "Recruitment", icon: "📋" },
  { id: "events", label: "Events", icon: "🎉" },
];

// Generates a unique localStorage key for each section
// e.g. "cc_lastSeen_events", "cc_lastSeen_feed"
const lastSeenKey = (section) => `cc_lastSeen_${section}`;

// Counts how many items are newer than the last time student visited this section
// items = array of objects with createdAt field
// section = which nav tab (used to get the saved timestamp from localStorage)
const countNew = (items, section) => {
  const lastSeen = localStorage.getItem(lastSeenKey(section));
  // If never visited before, all items are "new"
  if (!lastSeen) return items.length;
  // Compare each item's creation time against the saved last-seen timestamp
  return items.filter((item) => new Date(item.createdAt) > new Date(lastSeen)).length;
};

export default function StudentDashboard() {
  const [active, setActive] = useState("feed");
  const [badges, setBadges] = useState({ feed: 0, discover: 0, "my-societies": 0, announcements: 0, recruitment: 0, events: 0 });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // On mount — fetch all section data to calculate unread badge counts
  // All 6 requests fire simultaneously using Promise.all (faster than sequential)
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      const [
        { data: feedData },
        { data: societiesData },
        { data: announcementsData },
        { data: recruitmentsData },
        { data: eventsData },
        { data: mySocietiesData },
      ] = await Promise.all([
        axios.get("/follow/feed"),
        axios.get("/societies"),
        axios.get("/announcements"),
        axios.get("/recruitments"),
        axios.get("/events"),
        axios.get("/team/my-societies"),
      ]);

      // Paginated endpoints return { data: [...], hasMore } — use .data to get the array
      // my-societies is NOT paginated — returns plain array directly
      setBadges({
        feed: countNew(feedData.data, "feed"),
        discover: countNew(societiesData.data, "discover"),
        announcements: countNew(announcementsData.data, "announcements"),
        recruitment: countNew(recruitmentsData.data, "recruitment"),
        events: countNew(eventsData.data, "events"),
        "my-societies": countNew(mySocietiesData, "my-societies"),
      });
    };
    fetchBadgeCounts();
  }, []);

  // When student clicks a nav tab:
  // 1. Switch active section
  // 2. Save current time as "last seen" for this section (resets badge next visit)
  // 3. Clear the badge count immediately
  const handleTabChange = (id) => {
    setActive(id);
    localStorage.setItem(lastSeenKey(id), new Date().toISOString());
    setBadges((prev) => ({ ...prev, [id]: 0 }));
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  const openProfile = async () => {
    setProfileOpen(true);
    const [{ data: profileData }, { data: membershipsData }] = await Promise.all([
      // Only fetch profile if not already loaded (avoids re-fetching on every open)
      profile ? Promise.resolve({ data: profile }) : axios.get("/auth/me"),
      axios.get("/team/my-societies"),
    ]);
    setProfile(profileData);
    setMemberships(membershipsData);
  };

  const handleUnfollow = async (societyId) => {
    await axios.delete(`/follow/${societyId}`);
    setProfile((prev) => ({
      ...prev,
      following: prev.following.filter((s) => s._id !== societyId),
    }));
    toast.success("Unfollowed");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    await axios.delete("/auth/me");
    logout();
    toast.success("Account deleted");
    navigate("/");
  };

  const renderSection = () => {
    if (active === "feed") return <Feed />;
    if (active === "discover") return <Discover />;
    if (active === "my-societies") return <MySocieties />;
    if (active === "announcements") return <Announcements />;
    if (active === "recruitment") return <Recruitment />;
    if (active === "events") return <Events />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">

      {/* TOP NAVBAR */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={openProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-sm font-bold text-white/70">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white/80">{user?.name}</span>
          </button>
          <button onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
            Logout
          </button>
        </div>
      </header>

      <div className="flex pt-16">

        {/* LEFT SIDEBAR */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-slate-900/60 backdrop-blur-md border-r border-white/10 flex flex-col py-6 px-3 gap-2 z-30">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left w-full
                ${active === item.id
                  ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/40 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badges[item.id] > 0 && (
                <span className="text-xs bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {badges[item.id]}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="ml-56 flex-1 p-8 min-h-[calc(100vh-4rem)]">
          {renderSection()}
        </main>

      </div>

      {/* PROFILE MODAL */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setProfileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header gradient */}
            <div className="h-28 bg-linear-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center relative">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-bold text-white/70 shadow-lg">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => setProfileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/60 transition">✕</button>
            </div>

            {!profile ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="px-6 py-6 flex flex-col gap-4">
                <div className="text-center mb-2">
                  <p className="text-xl font-bold">{profile.name}</p>
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mt-1 inline-block">Student</span>
                </div>
                {[
                  { label: "Email", value: profile.email },
                  { label: "College", value: profile.college },
                  { label: "Roll Number", value: profile.rollNo },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <p className="text-white/40 text-xs mb-1">{label}</p>
                    <p className="text-sm font-medium">{value || "—"}</p>
                  </div>
                ))}
                {/* My Societies */}
                {memberships.length > 0 && (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <p className="text-white/40 text-xs mb-3">My Societies ({memberships.length})</p>
                    <div className="flex flex-col gap-2">
                      {memberships.map((m) => (
                        <div key={m._id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {m.society?.logo
                              ? <img src={m.society.logo} className="w-7 h-7 rounded-full object-contain bg-slate-800 border border-white/20 shrink-0" />
                              : <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-white/70 shrink-0">{m.society?.name?.charAt(0)}</div>}
                            <span className="text-sm truncate">{m.society?.name}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 bg-white/5 text-white/50 shrink-0">{m.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Following list */}
                {profile.following?.length > 0 && (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <p className="text-white/40 text-xs mb-3">Following ({profile.following.length})</p>
                    <div className="flex flex-col gap-2">
                      {profile.following.map((s) => (
                        <div key={s._id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {s.logo
                              ? <img src={s.logo} className="w-7 h-7 rounded-full object-contain bg-slate-800 border border-white/20" />
                              : <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-white/70">{s.name.charAt(0)}</div>}
                            <span className="text-sm">{s.name}</span>
                          </div>
                          <button onClick={() => handleUnfollow(s._id)}
                            className="text-xs px-3 py-1 rounded-full border border-white/20 text-white/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition shrink-0">
                            Unfollow
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleDeleteAccount}
                  className="w-full mt-2 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}