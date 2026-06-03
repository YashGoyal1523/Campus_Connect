import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";

const toAbsoluteUrl = (url) => url?.startsWith("http") ? url : `https://${url}`;

export default function Recruitment() {
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchData = async (pageNum = 1, append = false) => {
    try {
      const { data } = await axios.get(`/recruitments?page=${pageNum}&limit=6`);
      setRecruitments((prev) => append ? [...prev, ...data.data] : data.data);
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

  const filtered = recruitments.filter((r) => {
    const q = search.toLowerCase();
    return r.role.toLowerCase().startsWith(q) || r.society?.name?.toLowerCase().startsWith(q);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Open Recruitments</h1>
      <p className="text-white/40 mb-6">Find open positions across all societies on campus</p>

      <input
        type="text" placeholder="Search by role or society name..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 mb-8"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">No recruitments match your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((r) => {
            const deadline = new Date(r.deadline);
            const isExpired = deadline < new Date();
            return (
              <div key={r._id}
                className="rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition p-5 cursor-pointer"
                onClick={() => setSelected(r)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{r.role}</h3>
                    <p className="text-purple-300 text-sm">{r.society?.name}</p>
                  </div>
                  <span className={`shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-semibold ${isExpired ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {isExpired ? "Closed" : "Open"}
                  </span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">{r.description}</p>
                <p className="text-white/40 text-xs">
                  Deadline: {deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
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
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold">{selected.role}</h2>
                <p className="text-purple-300 text-sm mt-0.5">{selected.society?.name}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-white/70 text-sm leading-relaxed mb-5">{selected.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${new Date(selected.deadline) < new Date() ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                  {new Date(selected.deadline) < new Date() ? "Closed" : "Open"}
                </span>
                <span className="text-white/40 text-xs">
                  Deadline: {new Date(selected.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {selected.googleFormLink && new Date(selected.deadline) >= new Date() && (
                <a href={toAbsoluteUrl(selected.googleFormLink)} target="_blank" rel="noreferrer"
                  className="block w-full text-center mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold">
                  Apply →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
