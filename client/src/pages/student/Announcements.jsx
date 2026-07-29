import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

// Converts a UTC date to a human-readable relative time string.
// Defined outside the component so the function reference is stable across renders.
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Announcements page: shows a paginated, searchable feed of public announcements
// posted by all societies on campus. Students can click any announcement to read the full content.
const Announcements = () => {
  const { token , backendUrl } = useContext(AppContext);

  // announcements: the accumulated list fetched from the server
  const [announcements, setAnnouncements] = useState([]);
  // loading: true only during the initial page load - shows the full-page skeleton
  const [loading, setLoading] = useState(true);
  // loadingMore: prevents duplicate Load More requests while one is already in-flight
  const [loadingMore, setLoadingMore] = useState(false);
  // hasMore: whether the server can return more pages beyond what we have
  const [hasMore, setHasMore] = useState(false);
  // page: current page cursor, incremented on each "Load More" click
  const [page, setPage] = useState(1);
  // search: controlled input value used to filter the announcement list client-side
  const [search, setSearch] = useState("");
  // selected: the announcement currently shown in the detail modal; null = modal closed
  const [selected, setSelected] = useState(null);

  // Fetches announcements from the API for a given page.
  // When append=true the new results are added to the existing list (Load More).
  // When append=false the list is replaced from scratch (initial load).
  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(backendUrl + `/api/announcements?page=${pageNum}&limit=8`, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setAnnouncements((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      // finally block always clears the spinners, even if the request threw an error
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  // Runs once on mount to load the first page of announcements
  useEffect(() => { fetchData(); }, []);

  // Fetches the next page and appends it to the current list
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchData(nextPage, true);
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
      ))}
    </div>
  );

  // Client-side filter: runs synchronously on each render using the current search string.
  // Using startsWith rather than includes keeps results tightly focused -
  // matching only items that begin with the typed query.
  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    return a.title.toLowerCase().startsWith(q) || a.society?.name?.toLowerCase().startsWith(q);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Announcements</h1>
      <p className="text-white/40 mb-6">Important updates from societies on campus</p>

      {/* Controlled input; every keystroke triggers a re-render with fresh `filtered` results */}
      <input
        type="text" placeholder="Search by title or society..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-8"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">No announcements right now.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((a) => (
            // Clicking the row sets `selected`, which opens the detail modal
            <div key={a._id}
              className="rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition p-4 cursor-pointer"
              onClick={() => setSelected(a)}>
              {/* Society info row: logo (or initial fallback) + name + relative timestamp */}
              <div className="flex items-center gap-2 mb-3">
                {a.society?.logo
                  ? <img src={a.society.logo} className="w-7 h-7 rounded-full object-contain bg-slate-800 border border-white/20" />
                  : <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-white/70">
                      {a.society?.name?.charAt(0).toUpperCase()}
                    </div>}
                <span className="text-sm font-medium">{a.society?.name}</span>
                {/* ml-auto pushes the timestamp to the far right of the row */}
                <span className="text-white/30 text-xs ml-auto">{timeAgo(a.createdAt)}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📢</span>
                {/* min-w-0 allows the text block to shrink properly inside the flex container,
                    enabling truncation/clamping to work as expected */}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm mb-1">{a.title}</h3>
                  {/* line-clamp-2 shows a preview of the content - user clicks to read the full text */}
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{a.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More is hidden while the user is actively searching,
          because filtering is client-side - all needed data is already loaded */}
      {hasMore && !search && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Detail modal: full announcement content.
          Clicking the dark backdrop calls setSelected(null) to close it.
          stopPropagation on the white panel prevents that backdrop click from
          firing when the user scrolls or interacts inside the modal. */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
              {/* Society avatar + name in the modal header for context */}
              <div className="flex items-center gap-3 min-w-0">
                {selected.society?.logo
                  ? <img src={selected.society.logo} className="w-9 h-9 rounded-full object-contain bg-slate-800 border border-white/20 shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-sm font-bold text-white/70 shrink-0">
                      {selected.society?.name?.charAt(0).toUpperCase()}
                    </div>}
                <div className="min-w-0">
                  <p className="text-xs text-white/40">{selected.society?.name}</p>
                  {/* truncate prevents a very long title from breaking the modal layout */}
                  <h2 className="font-bold text-base truncate">{selected.title}</h2>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              {/* Full content - no clamping here unlike in the list preview */}
              <p className="text-white/70 text-sm leading-relaxed">{selected.content}</p>
              <p className="text-white/30 text-xs mt-4">{timeAgo(selected.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;
