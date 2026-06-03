export default function PostCard({ post, onClick, onDelete }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/40 transition group relative ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="aspect-square w-full overflow-hidden">
        {post.mediaType === "image"
          ? <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
          : <video src={post.mediaUrl} className="w-full h-full object-cover" />}
      </div>

      {post.caption && <p className="px-3 py-2 text-sm text-white/60 line-clamp-2">{post.caption}</p>}

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(post._id); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
        >
          🗑
        </button>
      )}
    </div>
  );
}
