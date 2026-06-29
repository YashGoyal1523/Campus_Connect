import { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import PostSection from "./PostSection";
import RecruitmentManager from "./RecruitmentManager";
import EventManager from "./EventManager";
import AnnouncementManager from "./AnnouncementManager";
import TeamManager from "./TeamManager";
import PostLightbox from "../../components/PostLightbox";
import PostCard from "../../components/PostCard";

// Navigation items for the left sidebar.
// Defined outside the component so the array is never recreated on re-renders.
const navItems = [
  { id: "posts", label: "Posts", icon: "📸" },
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "recruitment", label: "Recruitment", icon: "📋" },
  { id: "events", label: "Events", icon: "🎉" },
  { id: "team", label: "Team", icon: "👥" },
];

// SocietyDashboard is the top-level layout shell for the society side of the app.
// It renders the fixed navbar, the persistent left sidebar, and a dynamic main content area.
// The active sidebar item controls which child component (PostSection, EventManager, etc.) is shown.
// It also owns the Profile modal, which societies use to view their public profile and delete their account.
const SocietyDashboard = () => {
  const { user, token, logout , backendUrl } = useContext(AppContext);

  // active: the id of the currently selected sidebar item; determines what renderSection() returns
  const [active, setActive] = useState("posts");
  // profileOpen: controls whether the profile modal overlay is visible
  const [profileOpen, setProfileOpen] = useState(false);
  // profile: the society's profile data fetched from /auth/me; cached after the first fetch
  const [profile, setProfile] = useState(null);
  // posts: the society's posts shown inside the profile modal (fetched alongside profile)
  const [posts, setPosts] = useState([]);
  // lightbox: the post currently open in the fullscreen lightbox inside the profile modal
  const [lightbox, setLightbox] = useState(null);
  const navigate = useNavigate();

  // Clears auth state, shows a toast, and redirects to the home/login page
  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  // Opens the profile modal and fetches the society's profile + posts in parallel.
  // If profile data was already fetched previously it is reused (Promise.resolve short-circuit),
  // so reopening the modal doesn't make a redundant network request.
  const openProfile = async () => {
    setProfileOpen(true);
    try {
      const [{ data: profileData }, { data: postsData }] = await Promise.all([
        profile ? Promise.resolve({ data: { success: true, user: profile } }) : axios.get(backendUrl + "/api/auth/me", { headers: { token } }),
        axios.get(backendUrl + `/api/posts/${user.id}`, { headers: { token } }),
      ]);
      if (!profileData.success) { toast.error(profileData.message); setProfileOpen(false); return; }
      if (!postsData.success) { toast.error(postsData.message); setProfileOpen(false); return; }
      setProfile(profileData.user);
      setPosts(postsData.data);
    } catch (e) {
      // Close the modal so the user isn't stuck with an infinite spinner
      setProfileOpen(false);
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Permanently deletes the society's account after an explicit confirmation prompt.
  // window.confirm is a blocking native dialog — intentionally chosen to be hard to dismiss accidentally.
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your society account? All posts, events and recruitments will be permanently deleted.")) return;
    try {
      await axios.delete(backendUrl + "/api/auth/me", { headers: { token } });
      logout();
      toast.success("Account deleted");
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Deletes a single post from the profile modal's post grid.
  // Updates local state immediately via filter to avoid a full re-fetch.
  const deletePost = async (postId) => {
    try {
      const { data } = await axios.delete(backendUrl + `/api/posts/${postId}`, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success("Post deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Returns the correct section component based on the active sidebar item.
  // This is a simple conditional render pattern — no routing needed since the dashboard
  // is a single-page layout with sidebar navigation.
  const renderSection = () => {
    if (active === "posts") return <PostSection />;
    if (active === "announcements") return <AnnouncementManager />;
    if (active === "recruitment") return <RecruitmentManager />;
    if (active === "events") return <EventManager />;
    if (active === "team") return <TeamManager />;
  };

  return (
    // min-h-screen ensures the gradient background fills the viewport even on short pages
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">

      {/* TOP NAVBAR — fixed so it stays visible while the main content scrolls.
          z-40 keeps it above regular content but below modals (z-50). */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Profile button: shows the society's logo or initial letter, name, and a "Society" badge */}
          <button onClick={openProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            {user?.logo
              ? <img src={user.logo} alt={user.name} className="w-7 h-7 rounded-full object-contain bg-slate-800 border border-white/20" />
              : <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-sm font-bold text-white/70">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
            }
            <span className="text-sm text-white/80">{user?.name}</span>
            <span className="text-xs text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full ml-1">Society</span>
          </button>
          <button onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
            Logout
          </button>
        </div>
      </header>

      {/* pt-16 offsets the fixed navbar height so the sidebar/content don't slide under it */}
      <div className="flex pt-16">

        {/* LEFT SIDEBAR — also fixed so it stays visible while main content scrolls.
            h-[calc(100vh-4rem)] fills the remaining viewport height below the 4rem navbar.
            z-30 keeps it above content but below the navbar and modals. */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-slate-900/60 backdrop-blur-md border-r border-white/10 flex flex-col py-6 px-3 gap-2 z-30">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Dashboard</p>
          {navItems.map((item) => (
            // Clicking a nav item sets `active`, which re-renders the main content area
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left w-full
                ${active === item.id
                  ? "bg-linear-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/40 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT — ml-56 offsets the fixed 14rem sidebar.
            min-h-[calc(100vh-4rem)] ensures the area is always at least full height. */}
        <main className="ml-56 flex-1 p-8 min-h-[calc(100vh-4rem)]">
          {renderSection()}
        </main>

      </div>

      {/* PROFILE MODAL — fixed overlay, z-50 puts it above the sidebar and navbar.
          Clicking the backdrop (outer div) closes the modal.
          The absolute black overlay and the relative content panel are siblings so the
          content appears above the blur layer without extra z-index gymnastics. */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setProfileOpen(false)}>
          {/* Separate backdrop div so we can apply the blur without affecting the panel */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* stopPropagation prevents clicks inside the modal from closing it via the backdrop handler */}
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Gradient header with logo or letter fallback */}
            <div className="h-32 bg-linear-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center relative shrink-0">
              {profile?.logo
                ? <img src={profile.logo} alt={profile?.name} className="w-20 h-20 rounded-full object-contain bg-slate-800 border-4 border-slate-900 shadow-lg" />
                : <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-bold text-white/70 shadow-lg">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>}
              <button onClick={() => setProfileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/60 transition">✕</button>
            </div>

            {/* Show an inline spinner until profile data arrives (fetched asynchronously in openProfile) */}
            {!profile ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              // flex-1 + overflow-y-auto lets this section scroll independently while
              // the header remains visible at the top
              <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-4">
                {/* Society identity: name, category badge, follower count */}
                <div className="text-center mb-2">
                  <p className="text-xl font-bold">{profile.name}</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{profile.category}</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                      👥 {profile.followerCount ?? 0} followers
                    </span>
                  </div>
                </div>

                {/* Detail fields: only rendered when the value is non-empty.
                    The array + map pattern keeps this DRY — no repeated JSX blocks per field. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Email", value: profile.email },
                    { label: "College", value: profile.college },
                    { label: "Description", value: profile.description },
                    { label: "Instagram", value: profile.instagramLink },
                    { label: "Website", value: profile.websiteLink },
                  ].map(({ label, value }) => value ? (
                    // Description spans two columns because it can be longer than one field
                    <div key={label} className={`rounded-xl bg-white/5 border border-white/10 px-4 py-3 ${label === "Description" ? "sm:col-span-2" : ""}`}>
                      <p className="text-white/40 text-xs mb-1">{label}</p>
                      {/* break-all prevents very long URLs or emails from overflowing the card */}
                      <p className="text-sm font-medium break-all">{value}</p>
                    </div>
                  ) : null)}
                </div>

                {/* Danger zone: account deletion. Uses window.confirm as a two-step confirmation. */}
                <button onClick={handleDeleteAccount}
                  className="w-full py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
                  Delete Account
                </button>

                {/* Posts section inside the modal: shows a mini grid of the society's posts */}
                <div className="border-t border-white/10 pt-5 mt-2">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Posts ({posts.length})</p>
                  {posts.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-6">No posts yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {posts.map((post) => (
                        // onDelete is passed so the society can delete posts directly from the profile modal
                        <PostCard key={post._id} post={post} onClick={() => setLightbox(post)} onDelete={deletePost} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PostLightbox renders on top of everything (z-100) including the profile modal */}
      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default SocietyDashboard;
