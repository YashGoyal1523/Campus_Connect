import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import PostLightbox from "../../components/PostLightbox";
import PostCard from "../../components/PostCard";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

export default function PostSection() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const { user } = useAuth();

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/posts/${user.id}?page=${pageNum}&limit=12`);
      setPosts((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch {
      // 401s are handled by the axios interceptor; other errors fail silently
    } finally {
      setFetching(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchPosts(nextPage, true);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", caption);
    try {
      setError("");
      await axios.post("/posts", formData);
      setCaption("");
      setFile(null);
      e.target.reset();
      fetchPosts();
      toast.success("Post uploaded!");
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed. Try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`/posts/${id}`);
    setPosts((prev) => prev.filter((p) => p._id !== id));
    toast.success("Post deleted");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Posts</h1>
      <p className="text-white/40 mb-8">Share photos and videos with students</p>

      {/* Upload Form */}
      <form onSubmit={handlePost}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">Create New Post</h2>
        <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} required
          className="text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 file:cursor-pointer" />
        <input type="text" placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Uploading..." : "Post"}
        </button>
      </form>

      {/* Posts Grid */}
      {fetching && <Spinner />}
      {!fetching && posts.length === 0 && (
        <div className="text-center py-20 text-white/30">No posts yet. Create your first post!</div>
      )}
      {!fetching && posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onClick={() => setLightbox(post)} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
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