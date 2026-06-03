import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import toast from "react-hot-toast";
import PostSection from "./PostSection";
import RecruitmentManager from "./RecruitmentManager";
import EventManager from "./EventManager";
import AnnouncementManager from "./AnnouncementManager";
import TeamManager from "./TeamManager";
import PostLightbox from "../../components/PostLightbox";
import PostCard from "../../components/PostCard";

const navItems = [
  { id: "posts", label: "Posts", icon: "📸" },
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "recruitment", label: "Recruitment", icon: "📋" },
  { id: "events", label: "Events", icon: "🎉" },
  { id: "team", label: "Team", icon: "👥" },
];

export default function SocietyDashboard() {
  const [active, setActive] = useState("posts");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  const openProfile = async () => {
    setProfileOpen(true);
    const [{ data: profileData }, { data: postsData }] = await Promise.all([
      profile ? Promise.resolve({ data: profile }) : axios.get("/auth/me"),
      axios.get(`/posts/${user.id}`),
    ]);
    setProfile(profileData);
    setPosts(postsData.data);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your society account? All posts, events and recruitments will be permanently deleted.")) return;
    await axios.delete("/auth/me");
    logout();
    toast.success("Account deleted");
    navigate("/");
  };

  const deletePost = async (postId) => {
    await axios.delete(`/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    toast.success("Post deleted");
  };

  const renderSection = () => {
    if (active === "posts") return <PostSection />;
    if (active === "announcements") return <AnnouncementManager />;
    if (active === "recruitment") return <RecruitmentManager />;
    if (active === "events") return <EventManager />;
    if (active === "team") return <TeamManager />;
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

      <div className="flex pt-16">

        {/* LEFT SIDEBAR */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-slate-900/60 backdrop-blur-md border-r border-white/10 flex flex-col py-6 px-3 gap-2 z-30">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Dashboard</p>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left w-full
                ${active === item.id
                  ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/40 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
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
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="h-32 bg-linear-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center relative shrink-0">
              {profile?.logo
                ? <img src={profile.logo} alt={profile?.name} className="w-20 h-20 rounded-full object-contain bg-slate-800 border-4 border-slate-900 shadow-lg" />
                : <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-bold text-white/70 shadow-lg">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>}
              <button onClick={() => setProfileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/60 transition">✕</button>
            </div>

            {!profile ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-4">
                {/* Identity */}
                <div className="text-center mb-2">
                  <p className="text-xl font-bold">{profile.name}</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{profile.category}</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                      👥 {profile.followerCount ?? 0} followers
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Email", value: profile.email },
                    { label: "College", value: profile.college },
                    { label: "Description", value: profile.description },
                    { label: "Instagram", value: profile.instagramLink },
                    { label: "Website", value: profile.websiteLink },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className={`rounded-xl bg-white/5 border border-white/10 px-4 py-3 ${label === "Description" ? "sm:col-span-2" : ""}`}>
                      <p className="text-white/40 text-xs mb-1">{label}</p>
                      <p className="text-sm font-medium break-all">{value}</p>
                    </div>
                  ) : null)}
                </div>

                {/* Delete Account */}
                <button onClick={handleDeleteAccount}
                  className="w-full py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
                  Delete Account
                </button>

                {/* Posts */}
                <div className="border-t border-white/10 pt-5 mt-2">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Posts ({posts.length})</p>
                  {posts.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-6">No posts yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {posts.map((post) => (
                        <PostCard key={post._id} post={post} height="h-36" onClick={() => setLightbox(post)} onDelete={deletePost} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}