// PostCard is a reusable display card for a single post (image or video).
// It accepts three props:
//   - post: the post data object (mediaType, mediaUrl, caption, _id)
//   - onClick: optional click handler (e.g., open a lightbox); adds cursor-pointer when provided
//   - onDelete: optional delete handler; when provided a delete button is shown on hover
export default function PostCard({ post, onClick, onDelete }) {
  return (
    // "group" class enables Tailwind's group-hover utilities on child elements (e.g., reveal delete button on hover)
    // The cursor-pointer class is conditionally applied only when an onClick handler exists,
    // so the card doesn't mislead users into thinking it's clickable when it isn't
    <div
      className={`rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/40 transition group relative ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {/* aspect-square forces the media container to always be a perfect square (1:1 ratio),
          giving the post grid a consistent, Instagram-style look regardless of media dimensions */}
      <div className="aspect-square w-full overflow-hidden">
        {/* Conditionally render an <img> or <video> based on what the post contains */}
        {post.mediaType === "image"
          ? <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
          : <video src={post.mediaUrl} className="w-full h-full object-cover" />}
      </div>

      {/* Only render the caption paragraph if one actually exists —
          avoids leaving an empty padded block when caption is null/undefined */}
      {/* line-clamp-3 truncates long captions to 3 lines with an ellipsis,
          keeping the card compact and uniform in height */}
      {post.caption && <p className="px-3 py-2 text-sm text-white/60 line-clamp-3">{post.caption}</p>}

      {/* The delete button is only rendered when an onDelete handler is passed in.
          This makes PostCard reusable across contexts: the society dashboard passes onDelete,
          but the student feed view does not, so the button never appears there */}
      {onDelete && (
        <button
          // e.stopPropagation() prevents the click from bubbling up to the parent div's onClick,
          // which would open the lightbox at the same time as deleting the post — two conflicting actions
          onClick={(e) => { e.stopPropagation(); onDelete(post._id); }}
          // opacity-0 hides the button by default; group-hover:opacity-100 reveals it only when
          // the user hovers over the card — keeps the UI clean until the action is intentional
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
        >
          🗑
        </button>
      )}
    </div>
  );
}
