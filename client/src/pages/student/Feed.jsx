import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import PostLightbox from "../../components/PostLightbox";
import Spinner from "../../components/Spinner";

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState(null);

  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/follow/feed?page=${pageNum}&limit=6`);
      setPosts((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch {
      // error is handled by the axios 401 interceptor; other errors fail silently
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchData(nextPage, true);
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-3xl font-bold mb-2">Feed</h1>
      <p className="text-white/40 mb-8">Posts from societies you follow</p>

      {posts.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <p className="text-4xl mb-4">📭</p>
          <p>No posts yet. Follow some societies from Discover!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <div key={post._id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
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

              <div className="aspect-square w-full overflow-hidden cursor-pointer relative" onClick={() => setLightbox(post)}>
                {post.mediaType === "image"
                  ? <>
                      <img src={post.mediaUrl} className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-50" aria-hidden="true" />
                      <img src={post.mediaUrl} alt={post.caption} className="absolute inset-0 w-full h-full object-contain" />
                    </>
                  : <video src={post.mediaUrl} className="absolute inset-0 w-full h-full object-contain bg-black" controls />}
              </div>

              {post.caption && (
                <div className="px-4 py-3 cursor-pointer" onClick={() => setLightbox(post)}>
                  <span className="text-sm font-semibold mr-2">{post.society?.name}</span>
                  <span className="text-sm text-white/70 line-clamp-2">{post.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
