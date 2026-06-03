import { useEffect } from "react";

export default function PostLightbox({ post, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition">
          ✕
        </button>
        {post.mediaType === "video"
          ? <video src={post.mediaUrl} controls autoPlay className="w-full max-h-[75vh] rounded-2xl object-contain bg-black" />
          : <img src={post.mediaUrl} alt={post.caption} className="w-full max-h-[75vh] rounded-2xl object-contain bg-black" />}
        {post.caption && (
          <p className="mt-3 text-white/70 text-sm text-center">{post.caption}</p>
        )}
      </div>
    </div>
  );
}
