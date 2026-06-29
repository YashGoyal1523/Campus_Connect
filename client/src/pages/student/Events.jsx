import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

// Normalises a URL that may or may not include a protocol.
// Some users paste links without "https://", so we prepend it when missing
// to prevent the browser from treating it as a relative path.
const toAbsoluteUrl = (url) => url?.startsWith("http") ? url : `https://${url}`;

// Events page: shows a paginated, searchable grid of upcoming campus events.
// Students can browse, search, and register for events via an external Google Form link.
const Events = () => {
  const { token , backendUrl } = useContext(AppContext);

  // events: the full list of events fetched from the server (grows as pages are loaded)
  const [events, setEvents] = useState([]);
  // loading: true only on the very first fetch — controls the full-page skeleton
  const [loading, setLoading] = useState(true);
  // loadingMore: true while fetching subsequent pages (Load More) — avoids duplicate fetches
  const [loadingMore, setLoadingMore] = useState(false);
  // hasMore: whether there are additional pages available on the server
  const [hasMore, setHasMore] = useState(false);
  // page: current page cursor; incremented by handleLoadMore
  const [page, setPage] = useState(1);
  // search: the current text in the search box, used to filter events client-side
  const [search, setSearch] = useState("");
  // selected: the event whose detail modal is currently open, or null if no modal is shown
  const [selected, setSelected] = useState(null);

  // fetchData requests a page of events from the API.
  // append=true means add the results to the existing list (Load More behaviour).
  // append=false replaces the list entirely (initial load).
  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(backendUrl + `/api/events?page=${pageNum}&limit=9`, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setEvents((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      // finally block guarantees loading flags are cleared even if the request throws
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  // Fetch the first page of events as soon as the component mounts
  useEffect(() => { fetchData(); }, []);

  // Increments the page and fetches the next batch, appending it to the current list
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchData(nextPage, true);
  };

  // Show a grid skeleton until the initial data arrives
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl h-48 animate-pulse" />
      ))}
    </div>
  );

  // Client-side filtering: runs on every render using the current search string.
  // startsWith is intentional — it ranks results where the title/name *begins* with the query,
  // which feels more precise than includes() for a search-as-you-type experience.
  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().startsWith(q) || e.society?.name?.toLowerCase().startsWith(q);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
      <p className="text-white/40 mb-6">Stay updated on everything happening on campus</p>

      {/* Controlled search input — updates `search` state on every keystroke,
          which immediately re-evaluates `filtered` above on the next render */}
      <input
        type="text" placeholder="Search by event name or society..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-8"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">No events match your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => {
            // Parse the date string once per card to avoid repeated conversions in JSX
            const date = new Date(e.date);
            return (
              // Clicking the card sets it as `selected`, which opens the detail modal
              <div key={e._id}
                className="rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition overflow-hidden cursor-pointer"
                onClick={() => setSelected(e)}>
                {/* Poster image with blurred backdrop technique:
                    Layer 1 (aria-hidden): blurred, scaled-up version fills the container with ambient color
                    Layer 2: sharp poster image using object-contain to show the full poster without cropping
                    This avoids letterboxing or pillarboxing with empty black/white bars */}
                <div className="relative w-full h-28 overflow-hidden">
                  {e.poster ? (
                    <>
                      <img src={e.poster} className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60" aria-hidden="true" />
                      <img src={e.poster} alt={e.title} className="relative w-full h-full object-contain" />
                    </>
                  ) : (
                    // Fallback gradient banner when no poster has been uploaded
                    <div className="w-full h-full bg-linear-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center text-3xl">🎉</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    {/* min-w-0 on the left block allows truncate to work inside a flex child */}
                    <div className="min-w-0 mr-2">
                      <h3 className="font-bold text-sm truncate">{e.title}</h3>
                      <p className="text-purple-300 text-xs">{e.society?.name}</p>
                    </div>
                    {/* Date block: day+month on one line, year smaller below — compact but readable */}
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold text-xs">{date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p className="text-white/30 text-xs">{date.getFullYear()}</p>
                    </div>
                  </div>
                  {/* line-clamp-2 keeps the card height consistent across items */}
                  <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-2">{e.description}</p>
                  <p className="text-white/40 text-xs truncate">📍 {e.venue}</p>
                  {e.googleFormLink && (
                    // target="_blank" opens the form in a new tab so the user doesn't lose the app.
                    // rel="noreferrer" prevents the new page from accessing window.opener (security best practice).
                    // stopPropagation stops the card's onClick from also firing and opening the detail modal
                    // while the user is trying to navigate to the form.
                    <a href={toAbsoluteUrl(e.googleFormLink)} target="_blank" rel="noreferrer"
                      onClick={(ev) => ev.stopPropagation()}
                      className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-xs font-semibold">
                      Register →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hide Load More when the user has typed a search query.
          Pagination is irrelevant during search because filtering is done on already-fetched data;
          showing the button could confuse the user into thinking it fetches filtered server results. */}
      {hasMore && !search && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Detail modal: rendered when an event card is clicked.
          Clicking the backdrop (outer div) closes the modal via setSelected(null).
          stopPropagation on the inner panel prevents the backdrop click handler
          from firing when the user interacts with the modal content. */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {selected.poster && (
              <div className="relative w-full h-40 overflow-hidden shrink-0">
                {/* Same blurred backdrop technique as the card, but larger for the modal */}
                <img src={selected.poster} className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60" aria-hidden="true" />
                <img src={selected.poster} alt={selected.title} className="relative w-full h-full object-contain" />
              </div>
            )}
            <div className="px-6 py-5 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.title}</h2>
                  <p className="text-purple-300 text-sm mt-0.5">{selected.society?.name}</p>
                </div>
                {/* Close button inside the modal as an alternative to clicking the backdrop */}
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{selected.description}</p>
              <div className="flex flex-col gap-1.5 mb-5 text-sm text-white/50">
                <p>📍 {selected.venue}</p>
                {/* Full date format including time for the detail view, unlike the compact card */}
                <p>🗓 {new Date(selected.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {selected.googleFormLink && (
                <a href={toAbsoluteUrl(selected.googleFormLink)} target="_blank" rel="noreferrer"
                  className="block w-full text-center py-3 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold">
                  Register →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
