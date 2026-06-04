import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import PostLightbox from "../../components/PostLightbox";
import PostCard from "../../components/PostCard";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

// PostSection is the society-side post management panel.
// It lets the logged-in society upload new image/video posts, view their existing posts
// in a paginated grid, delete posts, and open posts in a fullscreen lightbox.
const PostSection = () => {
  // posts: the accumulated list of this society's posts across all fetched pages
  const [posts, setPosts] = useState([]);
  // caption: controlled input for the caption of the post being created
  const [caption, setCaption] = useState("");
  // file: the media file (image or video) selected for upload
  const [file, setFile] = useState(null);
  // loading: true while the upload request is in progress — disables the submit button
  const [loading, setLoading] = useState(false);
  // fetching: true during the initial posts fetch — shows the inline spinner below the form
  const [fetching, setFetching] = useState(true);
  // loadingMore: true while fetching additional pages — disables the Load More button
  const [loadingMore, setLoadingMore] = useState(false);
  // hasMore: whether the API has more pages of posts beyond what's already loaded
  const [hasMore, setHasMore] = useState(false);
  // page: current page cursor for pagination
  const [page, setPage] = useState(1);
  // error: inline error message shown beneath the form when an upload fails
  const [error, setError] = useState("");
  // lightbox: the post currently being viewed in the fullscreen lightbox; null = closed
  const [lightbox, setLightbox] = useState(null);
  // user from AuthContext provides the society's ID for API requests
  const { user } = useAuth();

  // Fetches a page of this society's posts.
  // append=true adds results to the end of the list (Load More).
  // append=false replaces the list (initial fetch or after a new post is uploaded).
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/posts/${user.id}?page=${pageNum}&limit=12`);
      setPosts((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch {
      // 401 errors are handled by the global axios interceptor; others fail silently
    } finally {
      // finally runs regardless of success/failure to ensure spinners are cleared
      setFetching(false);
      setLoadingMore(false);
    }
  };

  // Fetch the first page of posts when the component first mounts
  useEffect(() => { fetchPosts(); }, []);

  // Increments the page and appends the next batch of posts without clearing the grid
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchPosts(nextPage, true);
  };

  // handlePost submits the new-post form.
  // Uses FormData because the request contains a binary file alongside text fields.
  const handlePost = async (e) => {
    // Prevent the default browser form submission (which would reload the page)
    e.preventDefault();
    // Guard: file is required — the button would normally be hidden, but this is a safety net
    if (!file) return;
    setLoading(true);
    // FormData serializes mixed text+binary data correctly for multipart/form-data requests
    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", caption);
    try {
      setError(""); // Clear any previous error before the new attempt
      await axios.post("/posts", formData);
      // Reset all form fields after a successful upload
      setCaption("");
      setFile(null);
      // e.target.reset() clears the file input visually; React state reset alone doesn't do this
      // because file inputs are uncontrolled by React
      e.target.reset();
      // Refresh from page 1 to include the newly uploaded post at the top of the grid
      fetchPosts();
      toast.success("Post uploaded!");
    } catch (err) {
      // Extract the server's error message if available, otherwise show a generic fallback
      const msg = err.response?.data?.message || "Upload failed. Try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      // Always re-enable the submit button regardless of success or failure
      setLoading(false);
    }
  };

  // handleDelete removes a post by ID from the server and updates local state immediately.
  // Filtering the local array avoids needing a full re-fetch — the grid updates instantly.
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Posts</h1>
      <p className="text-white/40 mb-8">Share photos and videos with students</p>

      {/* Upload Form */}
      <form onSubmit={handlePost}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">Create New Post</h2>
        {/* accept restricts the file picker to image and video types only */}
        <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} required
          className="text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 file:cursor-pointer" />
        <input type="text" placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        {/* Inline error message shown only when an upload attempt fails */}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Uploading..." : "Post"}
        </button>
      </form>

      {/* Posts Grid — three separate render branches to handle loading / empty / populated states */}
      {fetching && <Spinner />}
      {!fetching && posts.length === 0 && (
        <div className="text-center py-20 text-white/30">No posts yet. Create your first post!</div>
      )}
      {!fetching && posts.length > 0 && (
        // Responsive grid: 2 columns on mobile, 3 on sm, 4 on lg
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.map((post) => (
            // Pass both onClick (lightbox) and onDelete so PostCard shows the delete button on hover
            <PostCard key={post._id} post={post} onClick={() => setLightbox(post)} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Load More: no search filter here, so it's always shown when more pages exist */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Lightbox: renders on top of the page when a post is clicked */}
      {lightbox && <PostLightbox post={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default PostSection;
