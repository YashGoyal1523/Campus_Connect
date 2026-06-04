import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import PostLightbox from "../../components/PostLightbox";
import Spinner from "../../components/Spinner";

// Converts a UTC date string into a human-readable relative time string
// (e.g. "5s ago", "3m ago", "2h ago", "4d ago").
// Defined outside the component so it is not re-created on every render.
const timeAgo = (date) => {
  // Math.floor(.../ 1000) converts milliseconds to seconds
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Feed displays a paginated, chronological list of posts from societies
// that the logged-in student follows. It also supports opening a post in a lightbox.
const Feed = () => {
  // posts: the array of post objects fetched from the server
  const [posts, setPosts] = useState([]);
  // loading: true only during the very first fetch — shows a full-page spinner
  const [loading, setLoading] = useState(true);
  // loadingMore: true when fetching additional pages — only disables the "Load More" button
  const [loadingMore, setLoadingMore] = useState(false);
  // hasMore: whether the server has more pages beyond what we've already fetched
  const [hasMore, setHasMore] = useState(false);
  // page: tracks the current page number for cursor-based pagination
  const [page, setPage] = useState(1);
  // lightbox: holds the post object currently open in the lightbox, or null if closed
  const [lightbox, setLightbox] = useState(null);

  // fetchData fetches a page of feed posts.
  // pageNum — which page to request (defaults to 1 for the initial load).
  // append — if true, new results are appended to the existing list (Load More);
  //          if false, the list is replaced (initial load / refresh).
  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/follow/feed?page=${pageNum}&limit=6`);
      // Functional update form of setPosts ensures we always read the latest state,
      // which is important when append=true is called rapidly
      setPosts((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch {
      // 401 (unauthenticated) errors are handled globally by the axios interceptor
      // (it redirects to login). Other errors fail silently here to avoid crashing the feed.
    } finally {
      // finally always runs — guarantees spinners are hidden even if the request fails
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Run fetchData once when the component first mounts to populate the initial feed
  useEffect(() => { fetchData(); }, []);

  // handleLoadMore increments the page counter and fetches the next page,
  // appending results to the current list rather than replacing them
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchData(nextPage, true);
  };

  // Show a full-page spinner during the very first load so the user
  // sees feedback instead of an empty screen
  if (loading) return <Spinner />;

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-3xl font-bold mb-2">Feed</h1>
      <p className="text-white/40 mb-8">Posts from societies you follow</p>

      {/* Empty state: shown when the user follows no societies yet, or those societies have no posts */}
      {posts.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <p className="text-4xl mb-4">📭</p>
          <p>No posts yet. Follow some societies from Discover!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <div key={post._id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {/* Post header: society avatar + name + relative timestamp */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Avatar fallback: show the society's first initial if no logo is set */}
                {post.society?.logo
                  ? <img src={post.society.logo} className="w-9 h-9 rounded-full object-contain bg-slate-800 border border-white/20" />
                  : <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-sm font-bold text-white/70">
                      {post.society?.name?.charAt(0).toUpperCase()}
                    </div>}
                <div>
                  <p className="text-sm font-semibold">{post.society?.name}</p>
                  <p className="text-white/30 text-xs">{timeAgo(post.createdAt)}</p>
                </div>
              </div>

              {/* Post media: clicking it opens the lightbox.
                  For images we layer two copies:
                    1. A blurred, scaled-up version as a background (fills the square with color context)
                    2. The actual image on top with object-contain (no cropping)
                  This "blurred backdrop" trick avoids empty black bars on portrait/landscape images */}
              <div className="aspect-square w-full overflow-hidden cursor-pointer relative" onClick={() => setLightbox(post)}>
                {post.mediaType === "image"
                  ? <>
                      {/* aria-hidden removes this decorative blur layer from the accessibility tree */}
                      <img src={post.mediaUrl} className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-50" aria-hidden="true" />
                      <img src={post.mediaUrl} alt={post.caption} className="absolute inset-0 w-full h-full object-contain" />
                    </>
                  : <video src={post.mediaUrl} className="absolute inset-0 w-full h-full object-contain bg-black" controls />}
              </div>

              {/* Caption row: clicking it also opens the lightbox for a better reading experience */}
              {post.caption && (
                <div className="px-4 py-3 cursor-pointer" onClick={() => setLightbox(post)}>
                  {/* Society name is bolded as the "author" label, just like Instagram */}
                  <span className="text-sm font-semibold mr-2">{post.society?.name}</span>
                  {/* line-clamp-2 truncates long captions so the feed stays compact */}
                  <span className="text-sm text-white/70 line-clamp-2">{post.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More button: only shown when more pages exist.
          Disabled while a page is loading to prevent duplicate requests */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Lightbox overlay: rendered conditionally — only when a post is selected.
          onClose resets lightbox to null, unmounting the overlay */}
      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default Feed;
