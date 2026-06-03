import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";

const toAbsoluteUrl = (url) => url?.startsWith("http") ? url : `https://${url}`;

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/events?page=${pageNum}&limit=9`);
      setEvents((prev) => append ? [...prev, ...data.data] : data.data);
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

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().startsWith(q) || e.society?.name?.toLowerCase().startsWith(q);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
      <p className="text-white/40 mb-6">Stay updated on everything happening on campus</p>

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
            const date = new Date(e.date);
            return (
              <div key={e._id}
                className="rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition overflow-hidden cursor-pointer"
                onClick={() => setSelected(e)}>
                <div className="relative w-full h-28 overflow-hidden">
                  {e.poster ? (
                    <>
                      <img src={e.poster} className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60" aria-hidden="true" />
                      <img src={e.poster} alt={e.title} className="relative w-full h-full object-contain" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center text-3xl">🎉</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0 mr-2">
                      <h3 className="font-bold text-sm truncate">{e.title}</h3>
                      <p className="text-purple-300 text-xs">{e.society?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold text-xs">{date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p className="text-white/30 text-xs">{date.getFullYear()}</p>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-2">{e.description}</p>
                  <p className="text-white/40 text-xs truncate">📍 {e.venue}</p>
                  {e.googleFormLink && (
                    <a href={toAbsoluteUrl(e.googleFormLink)} target="_blank" rel="noreferrer"
                      onClick={(ev) => ev.stopPropagation()}
                      className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-xs font-semibold">
                      Register →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
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
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {selected.poster && (
              <div className="relative w-full h-40 overflow-hidden">
                <img src={selected.poster} className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60" aria-hidden="true" />
                <img src={selected.poster} alt={selected.title} className="relative w-full h-full object-contain" />
              </div>
            )}
            <div className="px-6 py-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.title}</h2>
                  <p className="text-purple-300 text-sm mt-0.5">{selected.society?.name}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{selected.description}</p>
              <div className="flex flex-col gap-1.5 mb-5 text-sm text-white/50">
                <p>📍 {selected.venue}</p>
                <p>🗓 {new Date(selected.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {selected.googleFormLink && (
                <a href={toAbsoluteUrl(selected.googleFormLink)} target="_blank" rel="noreferrer"
                  className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold">
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
