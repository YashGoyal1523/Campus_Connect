import { useEffect } from "react";

// PostLightbox renders a full-screen overlay (lightbox) to display a single post
// in a larger, focused view. It supports both images and videos.
// Props:
//   - post: the post object to display (mediaType, mediaUrl, caption)
//   - onClose: callback to close the lightbox (clears the parent's lightbox state)
export default function PostLightbox({ post, onClose }) {
  // Attach a global keyboard listener so pressing Escape closes the lightbox,
  // which is standard UX for any modal or overlay — users expect it
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    // addEventListener on 'window' (not a specific element) so the event is caught
    // regardless of which element currently has focus
    window.addEventListener("keydown", handler);
    // Cleanup: remove the listener when the component unmounts (or when onClose changes).
    // Without this, every time a lightbox is opened a new listener would pile up,
    // causing stale closures and memory leaks
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]); // re-run only if onClose reference changes (it typically doesn't)

  return (
    // Full-screen overlay: fixed + inset-0 covers the entire viewport.
    // Clicking the backdrop (this outer div) closes the lightbox
    // bg-black/80 + backdrop-blur-sm dims and blurs the page content behind it
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}>
      {/* stopPropagation on the inner container prevents clicks inside the media/caption
          area from bubbling up to the backdrop and accidentally closing the lightbox */}
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close button positioned above the media so it never overlaps the content */}
        <button onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition">
          ✕
        </button>

        {/* Render video with controls and autoPlay if mediaType is "video",
            otherwise render the image. object-contain ensures the full media is visible
            without cropping, and max-h-[75vh] prevents it from overflowing the viewport */}
        {post.mediaType === "video"
          ? <video src={post.mediaUrl} controls autoPlay className="w-full max-h-[75vh] rounded-2xl object-contain bg-black" />
          : <img src={post.mediaUrl} alt={post.caption} className="w-full max-h-[75vh] rounded-2xl object-contain bg-black" />}

        {/* Only render caption text if one exists — avoids dead whitespace below media */}
        {post.caption && (
          <p className="mt-3 text-white/70 text-sm text-center">{post.caption}</p>
        )}
      </div>
    </div>
  );
}
