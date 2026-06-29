import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import PostLightbox from "../../components/PostLightbox";
import PostCard from "../../components/PostCard";
import SocietyCard from "../../components/SocietyCard";

// Static list of all possible society categories.
// "All" is the default selection (no filter applied).
// Defined outside the component so it never gets recreated on re-renders.
const CATEGORIES = ["All", "Technical", "Cultural", "Sports", "Music", "Dance",
  "Drama & Theatre", "Photography", "Film & Media", "Literary & Debate",
  "Social Service", "Entrepreneurship", "Finance", "Art & Design", "Environment", "Gaming"];

// Discover page: lets students browse all societies, filter by category/search,
// view a society's profile and posts in a modal, and follow/unfollow societies.
const Discover = () => {
  const { token , backendUrl } = useContext(AppContext);

  // societies: the accumulated list fetched from the server across all loaded pages
  const [societies, setSocieties] = useState([]);
  // selected: the society whose detail modal is currently open; null = no modal
  const [selected, setSelected] = useState(null);
  // posts: the posts of the currently selected society, fetched when the modal opens
  const [posts, setPosts] = useState([]);
  // loading: full-page skeleton state for the initial societies fetch
  const [loading, setLoading] = useState(true);
  // loadingMore: disables the Load More button while a page fetch is in progress
  const [loadingMore, setLoadingMore] = useState(false);
  // hasMore: whether the API has more society pages beyond what's already loaded
  const [hasMore, setHasMore] = useState(false);
  // page: current page number; incremented by handleLoadMore
  const [page, setPage] = useState(1);
  // lightbox: the post object open in the fullscreen lightbox; null = closed
  const [lightbox, setLightbox] = useState(null);
  // search: controlled input value for client-side society name filtering
  const [search, setSearch] = useState("");
  // activeCategory: the currently selected category chip; "All" = no category filter
  const [activeCategory, setActiveCategory] = useState("All");
  // following: array of society _id strings that the logged-in student follows.
  // Kept in local state so follow/unfollow actions update the UI immediately (optimistic update).
  const [following, setFollowing] = useState([]);

  // Fetches a page of societies and (on the first page only) the current user's follow list.
  // Two requests are fired in parallel with Promise.all for efficiency.
  // append=true adds to the existing list; append=false replaces it.
  const fetchSocieties = async (pageNum = 1, append = false) => {
    try {
      // On page > 1 we skip the /auth/me call because we already have the following list
      const [{ data: societiesData }, { data: meData }] = await Promise.all([
        axios.get(backendUrl + `/api/societies?page=${pageNum}&limit=9`, { headers: { token } }),
        pageNum === 1 ? axios.get(backendUrl + "/api/auth/me", { headers: { token } }) : Promise.resolve({ data: null }),
      ]);
      if (!societiesData.success) { toast.error(societiesData.message); return; }
      setSocieties((prev) => append ? [...prev, ...societiesData.data] : societiesData.data);
      setHasMore(societiesData.hasMore);
      // Extract just the _id values from the following array for easy lookup with .includes()
      if (meData && meData.success) setFollowing(meData.user.following?.map((s) => s._id) || []);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Populate the page on initial mount
  useEffect(() => { fetchSocieties(); }, []);

  // Appends the next page of societies to the current list
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchSocieties(nextPage, true);
  };

  // Opens the society detail modal.
  // Sets `selected` immediately so the modal shell appears, then fetches the society's posts.
  const openSociety = async (society) => {
    setSelected(society);
    try {
      const { data } = await axios.get(backendUrl + `/api/posts/${society._id}`, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      // data.data is the posts array from the paginated response; fall back to [] if missing
      setPosts(data.data ?? []);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
      setPosts([]);
    }
  };

  // Closes the society detail modal and clears its posts from state
  const close = () => {
    setSelected(null);
    setPosts([]);
  };

  // Toggles follow/unfollow for a given society.
  // State is updated optimistically first for snappy UX, then rolled back if the server fails.
  const toggleFollow = async (societyId) => {
    const isFollowing = following.includes(societyId);
    // Apply optimistic update immediately
    if (isFollowing) {
      setFollowing((prev) => prev.filter((id) => id !== societyId));
    } else {
      setFollowing((prev) => [...prev, societyId]);
    }
    try {
      if (isFollowing) {
        await axios.delete(backendUrl + `/api/follow/${societyId}`, { headers: { token } });
        toast.success("Unfollowed");
      } else {
        await axios.post(backendUrl + `/api/follow/${societyId}`, {}, { headers: { token } });
        toast.success("Following!");
      }
    } catch (e) {
      // Roll back the optimistic update so UI matches the server
      if (isFollowing) {
        setFollowing((prev) => [...prev, societyId]);
      } else {
        setFollowing((prev) => prev.filter((id) => id !== societyId));
      }
      toast.error(e.response?.data?.message || e.message);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl h-48 animate-pulse" />
      ))}
    </div>
  );

  // Client-side filtering: combines search text and category chip.
  // Both conditions must pass (AND logic), so users get progressively narrower results
  // when they combine a search term with a category filter.
  const filtered = societies.filter((s) => {
    const matchesSearch = s.name.toLowerCase().startsWith(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Discover Societies</h1>
      <p className="text-white/40 mb-6">Explore all active societies on your campus</p>

      {/* Search input: controlled; filters societies by name on every keystroke */}
      <input
        type="text" placeholder="Search by society name..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-4"
      />

      {/* Category filter chips: one button per category.
          Active chip is highlighted; clicking another chip changes activeCategory state */}
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
            // SocietyCard is a reusable component; we pass all necessary callbacks as props
            <SocietyCard
              key={s._id}
              society={s}
              onClick={() => openSociety(s)}
              // Derived from the local `following` array — updates instantly after toggleFollow
              isFollowing={following.includes(s._id)}
              onToggleFollow={toggleFollow}
            />
          ))}
        </div>
      )}

      {/* Load More: hidden when the user is filtering by search or category,
          because those filters operate on already-fetched data —
          loading more without those server-side filters would produce inconsistent results */}
      {hasMore && !search && activeCategory === "All" && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* SOCIETY DETAIL MODAL */}
      {/* Clicking the dark backdrop calls close(); stopPropagation on the inner panel
          prevents those clicks from bubbling up to the backdrop handler */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={close}>
          {/* max-h-[85vh] + overflow-y-auto: the modal scrolls internally if content is tall,
              rather than growing off-screen */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>

            {/* Gradient header with logo or initial letter fallback */}
            <div className="h-36 bg-linear-to-br from-purple-600/40 to-blue-600/40 relative rounded-t-3xl flex items-center justify-center">
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
                  {/* Follow/Unfollow inside the modal mirrors the card button,
                      reading from the same `following` state for consistency */}
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

              {/* Social links — only shown when the society has configured them */}
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

              {/* Posts section: loaded when the modal opens via openSociety() */}
              <h3 className="font-semibold mb-4 text-white/80">Posts by {selected.name}</h3>
              {posts.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No posts yet.</p>
              ) : (
                // 2-column grid for posts; clicking a PostCard opens the lightbox on top of the modal
                <div className="grid grid-cols-2 gap-3">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} onClick={() => setLightbox(post)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PostLightbox renders on top of everything (z-100) including the society modal */}
      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default Discover;
