import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import PostLightbox from "../../components/PostLightbox";
import PostCard from "../../components/PostCard";
import SocietyCard from "../../components/SocietyCard";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Technical", "Cultural", "Sports", "Music", "Dance",
  "Drama & Theatre", "Photography", "Film & Media", "Literary & Debate",
  "Social Service", "Entrepreneurship", "Finance", "Art & Design", "Environment", "Gaming"];

export default function Discover() {
  const [societies, setSocieties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [following, setFollowing] = useState([]);

  const fetchSocieties = async (pageNum = 1, append = false) => {
    const [{ data: societiesData }, { data: meData }] = await Promise.all([
      axios.get(`/societies?page=${pageNum}&limit=9`),
      pageNum === 1 ? axios.get("/auth/me") : Promise.resolve({ data: null }),
    ]);
    setSocieties((prev) => append ? [...prev, ...societiesData.data] : societiesData.data);
    setHasMore(societiesData.hasMore);
    if (meData) setFollowing(meData.following?.map((s) => s._id) || []);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => { fetchSocieties(); }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchSocieties(nextPage, true);
  };

  const openSociety = async (society) => {
    setSelected(society);
    const { data } = await axios.get(`/posts/${society._id}`);
    setPosts(data.data);
  };

  const close = () => {
    setSelected(null);
    setPosts([]);
  };

  const toggleFollow = async (societyId) => {
    const isFollowing = following.includes(societyId);
    if (isFollowing) {
      await axios.delete(`/follow/${societyId}`);
      setFollowing((prev) => prev.filter((id) => id !== societyId));
      toast.success("Unfollowed");
    } else {
      await axios.post(`/follow/${societyId}`);
      setFollowing((prev) => [...prev, societyId]);
      toast.success("Following!");
    }
  };

  if (loading) return <Spinner />;

  const filtered = societies.filter((s) => {
    const matchesSearch = s.name.toLowerCase().startsWith(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Discover Societies</h1>
      <p className="text-white/40 mb-6">Explore all active societies on your campus</p>

      {/* Search */}
      <input
        type="text" placeholder="Search by society name..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-4"
      />

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition border
              ${activeCategory === cat
                ? "bg-purple-500/30 border-purple-500/60 text-purple-200"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">No societies match your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <SocietyCard
              key={s._id}
              society={s}
              onClick={() => openSociety(s)}
              isFollowing={following.includes(s._id)}
              onToggleFollow={toggleFollow}
            />
          ))}
        </div>
      )}

      {hasMore && !search && activeCategory === "All" && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* SOCIETY DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={close}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="h-36 bg-gradient-to-br from-purple-600/40 to-blue-600/40 relative rounded-t-3xl flex items-center justify-center">
              {selected.logo
                ? <img src={selected.logo} alt={selected.name} className="w-20 h-20 rounded-full object-contain bg-slate-800 border-4 border-white/10 shadow-lg" />
                : <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-3xl font-bold text-white/70">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>}
              <button onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/60 transition">
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <p className="text-white/40 text-sm">🏫 {selected.college}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{selected.category}</span>
                  <button onClick={() => toggleFollow(selected._id)}
                    className={`text-xs px-4 py-1.5 rounded-full font-semibold transition border
                      ${following.includes(selected._id)
                        ? "bg-white/10 border-white/20 text-white/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                        : "bg-purple-500 border-purple-500 text-white hover:bg-purple-600"}`}>
                    {following.includes(selected._id) ? "Following" : "Follow"}
                  </button>
                </div>
              </div>

              <p className="text-white/60 text-sm leading-relaxed mb-6">{selected.description}</p>

              <div className="flex gap-3 mb-6">
                {selected.instagramLink && (
                  <a href={selected.instagramLink} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 text-sm hover:bg-pink-500/30 transition">
                    📸 Instagram
                  </a>
                )}
                {selected.websiteLink && (
                  <a href={selected.websiteLink} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-500/30 transition">
                    🌐 Website
                  </a>
                )}
              </div>

              {/* Posts */}
              <h3 className="font-semibold mb-4 text-white/80">Posts by {selected.name}</h3>
              {posts.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No posts yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} height="h-40" onClick={() => setLightbox(post)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}