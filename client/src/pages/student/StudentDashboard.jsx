import { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Discover from "./Discover";
import Recruitment from "./Recruitment";
import Events from "./Events";
import Feed from "./Feed";
import Announcements from "./Announcements";
import MySocieties from "./MySocieties";

// StudentDashboard — the main shell for all student-facing pages.
// It renders a fixed top navbar, a fixed left sidebar, and a main content area.
// The active tab controls which page component is rendered inside the main area.

// navItems drives the sidebar buttons.
// Defined outside the component so the array is never recreated on re-renders.
const navItems = [
  { id: "feed", label: "Feed", icon: "🏠" },
  { id: "discover", label: "Discover", icon: "🔭" },
  { id: "my-societies", label: "My Societies", icon: "🏛️" },
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "recruitment", label: "Recruitment", icon: "📋" },
  { id: "events", label: "Events", icon: "🎉" },
];

const StudentDashboard = () => {
  const { user, token, logout, backendUrl } = useContext(AppContext);

  // active: which sidebar tab is currently selected; determines which component renders
  const [active, setActive] = useState("feed");
  // profileOpen: whether the profile slide-over modal is visible
  const [profileOpen, setProfileOpen] = useState(false);
  // profile: cached /auth/me response; only fetched once (re-used on subsequent modal opens)
  const [profile, setProfile] = useState(null);
  // memberships: societies the student is a team member of, shown inside the profile modal
  const [memberships, setMemberships] = useState([]);
  const navigate = useNavigate();

  // Clears auth state and redirects to the landing page
  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  // Opens the profile modal and loads the student's profile + memberships in parallel.
  // Profile is cached in state so re-opening the modal doesn't trigger another API call.
  const openProfile = async () => {
    setProfileOpen(true);
    try {
      const [{ data: profileData }, { data: membershipsData }] = await Promise.all([
        // Only fetch profile if not already loaded (avoids re-fetching on every open)
        profile ? Promise.resolve({ data: { success: true, user: profile } }) : axios.get(backendUrl + "/api/auth/me", { headers: { token } }),
        axios.get(backendUrl + "/api/team/my-societies", { headers: { token } }),
      ]);
      if (!profileData.success) { toast.error(profileData.message); setProfileOpen(false); return; }
      if (!membershipsData.success) { toast.error(membershipsData.message); setProfileOpen(false); return; }
      setProfile(profileData.user);
      setMemberships(membershipsData.data);
    } catch (e) {
      // Close the modal so the user isn't stuck with an infinite spinner
      setProfileOpen(false);
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Snapshot the current following list before the optimistic update so we can roll back
  // if the server call fails, keeping UI and server state in sync.
  const handleUnfollow = async (societyId) => {
    const previousFollowing = profile.following;
    setProfile((prev) => ({
      ...prev,
      following: prev.following.filter((s) => s._id !== societyId),
    }));
    try {
      await axios.delete(backendUrl + `/api/follow/${societyId}`, { headers: { token } });
      toast.success("Unfollowed");
    } catch (e) {
      // Rollback the optimistic removal if the server call fails
      setProfile((prev) => ({ ...prev, following: previousFollowing }));
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Permanently deletes the account after a confirmation dialog, then logs the user out.
  // window.confirm is a native browser dialog — no UI library needed for a destructive action.
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    try {
      await axios.delete(backendUrl + "/api/auth/me", { headers: { token } });
      logout();
      toast.success("Account deleted");
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Renders the correct page component based on the active sidebar tab.
  // Each component is independently responsible for its own data fetching.
  const renderSection = () => {
    if (active === "feed") return <Feed />;
    if (active === "discover") return <Discover />;
    if (active === "my-societies") return <MySocieties />;
    if (active === "announcements") return <Announcements />;
    if (active === "recruitment") return <Recruitment />;
    if (active === "events") return <Events />;
  };

  return (
    // min-h-screen ensures the background covers the full viewport even on short pages
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">

      {/* TOP NAVBAR — fixed at the top (z-40) so it stays visible while scrolling.
          backdrop-blur-md gives a frosted-glass effect over the scrolling content. */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-3">
          {/* App logo mark */}
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Profile button: shows first letter of name as avatar; opens profile modal on click */}
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

      {/* pt-16 offsets the content below the fixed navbar (navbar height ≈ 4rem = 64px) */}
      <div className="flex pt-16">

        {/* LEFT SIDEBAR — fixed on the left (z-30, below navbar z-40).
            h-[calc(100vh-4rem)] makes it fill the remaining viewport height below the navbar. */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-slate-900/60 backdrop-blur-md border-r border-white/10 flex flex-col py-6 px-3 gap-2 z-30">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map((item) => (
            // Active tab gets a gradient highlight; inactive tabs show a hover effect
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left w-full
                ${active === item.id
                  ? "bg-linear-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/40 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT — ml-56 offsets it by the sidebar width so they don't overlap */}
        <main className="ml-56 flex-1 p-8 min-h-[calc(100vh-4rem)]">
          {renderSection()}
        </main>

      </div>

      {/* PROFILE MODAL — z-50 sits above navbar (z-40) and sidebar (z-30).
          Clicking the backdrop (outer div) closes the modal;
          stopPropagation on the inner panel prevents clicks inside from bubbling out. */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setProfileOpen(false)}>
          {/* Semi-transparent blurred backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Gradient header band with avatar initial */}
            <div className="h-28 bg-linear-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center relative">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-bold text-white/70 shadow-lg">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => setProfileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/60 transition">✕</button>
            </div>

            {/* Inline spinner while profile data is loading; replaced with content once loaded */}
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

                {/* Render info fields from an array to avoid repetitive JSX */}
                {[
                  { label: "Email", value: profile.email },
                  { label: "College", value: profile.college },
                  { label: "Roll Number", value: profile.rollNo },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <p className="text-white/40 text-xs mb-1">{label}</p>
                    {/* "—" fallback so the card never looks empty */}
                    <p className="text-sm font-medium">{value || "—"}</p>
                  </div>
                ))}

                {/* Society memberships — only shown if the student belongs to at least one team */}
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

                {/* Following list — only shown if the student follows at least one society */}
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

                {/* Destructive action placed last so it's not accidentally clicked */}
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

export default StudentDashboard;
