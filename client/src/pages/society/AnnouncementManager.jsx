import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchAnnouncements = async () => {
    const { data } = await axios.get("/announcements/my");
    setAnnouncements(data);
    setFetching(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/announcements", form);
      setForm({ title: "", content: "" });
      fetchAnnouncements();
      toast.success("Announcement posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`/announcements/${id}`);
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    if (selected?._id === id) setSelected(null);
    toast.success("Announcement deleted");
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Announcements</h1>
      <p className="text-white/40 mb-8">Broadcast important updates to all students</p>

      {/* Form */}
      <form onSubmit={handleSubmit}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">New Announcement</h2>
        <input name="title" placeholder="Announcement title" value={form.title} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        <textarea name="content" placeholder="Write your announcement..." value={form.content} onChange={handleChange} required rows={4}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Posting..." : "Post Announcement"}
        </button>
      </form>

      {/* List */}
      {fetching && <Spinner />}
      {!fetching && announcements.length === 0 && (
        <div className="text-center py-20 text-white/30">No announcements posted yet.</div>
      )}
      {!fetching && announcements.length > 0 && (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <div key={a._id}
              className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-4 cursor-pointer hover:border-white/20 transition"
              onClick={() => setSelected(a)}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shrink-0">📢 Announcement</span>
                  <span className="text-white/30 text-xs">{timeAgo(a.createdAt)}</span>
                </div>
                <h3 className="font-bold text-sm">{a.title}</h3>
                <p className="text-white/60 text-xs mt-1 leading-relaxed line-clamp-2">{a.content}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(a._id); }}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-xs">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <h2 className="font-bold text-lg">{selected.title}</h2>
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
