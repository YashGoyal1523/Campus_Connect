import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/announcements?page=${pageNum}&limit=8`);
      setAnnouncements((prev) => append ? [...prev, ...data.data] : data.data);
      setHasMore(data.hasMore);
    } catch {
      // handled by axios interceptor
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

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    return a.title.toLowerCase().startsWith(q) || a.society?.name?.toLowerCase().startsWith(q);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Announcements</h1>
      <p className="text-white/40 mb-6">Important updates from societies on campus</p>

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
            <div key={a._id}
              className="rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition p-4 cursor-pointer"
              onClick={() => setSelected(a)}>
              <div className="flex items-center gap-2 mb-3">
                {a.society?.logo
                  ? <img src={a.society.logo} className="w-7 h-7 rounded-full object-contain bg-slate-800 border border-white/20" />
                  : <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-white/70">
                      {a.society?.name?.charAt(0).toUpperCase()}
                    </div>}
                <span className="text-sm font-medium">{a.society?.name}</span>
                <span className="text-white/30 text-xs ml-auto">{timeAgo(a.createdAt)}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📢</span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm mb-1">{a.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{a.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !search && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                {selected.society?.logo
                  ? <img src={selected.society.logo} className="w-9 h-9 rounded-full object-contain bg-slate-800 border border-white/20 shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-sm font-bold text-white/70 shrink-0">
                      {selected.society?.name?.charAt(0).toUpperCase()}
                    </div>}
                <div className="min-w-0">
                  <p className="text-xs text-white/40">{selected.society?.name}</p>
                  <h2 className="font-bold text-base truncate">{selected.title}</h2>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-white/70 text-sm leading-relaxed">{selected.content}</p>
              <p className="text-white/30 text-xs mt-4">{timeAgo(selected.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
