import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

const toAbsoluteUrl = (url) => url?.startsWith("http") ? url : `https://${url}`;

export default function RecruitmentManager() {
  const [recruitments, setRecruitments] = useState([]);
  const [form, setForm] = useState({ role: "", description: "", googleFormLink: "", deadline: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchRecruitments = async () => {
    const { data } = await axios.get("/recruitments/my");
    setRecruitments(data);
    setFetching(false);
  };

  useEffect(() => { fetchRecruitments(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/recruitments", form);
      setForm({ role: "", description: "", googleFormLink: "", deadline: "" });
      fetchRecruitments();
      toast.success("Recruitment posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post recruitment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`/recruitments/${id}`);
    setRecruitments(recruitments.filter((r) => r._id !== id));
    if (selected?._id === id) setSelected(null);
    toast.success("Recruitment deleted");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Recruitment</h1>
      <p className="text-white/40 mb-8">Post openings for your society</p>

      {/* Form */}
      <form onSubmit={handleSubmit}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">Post a New Opening</h2>
        <input name="role" placeholder="Role (e.g. Graphic Designer)" value={form.role} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        <textarea name="description" placeholder="Describe the role and requirements..." value={form.description} onChange={handleChange} required rows={3}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
        <input name="googleFormLink" placeholder="Google Form Link" value={form.googleFormLink} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition text-white/60" />
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Posting..." : "Post Opening"}
        </button>
      </form>

      {/* List */}
      {fetching && <Spinner />}
      {!fetching && recruitments.length === 0 && (
        <div className="text-center py-20 text-white/30">No recruitments posted yet.</div>
      )}
      {!fetching && recruitments.length > 0 && (
        <div className="flex flex-col gap-4">
          {recruitments.map((r) => {
            const deadline = new Date(r.deadline);
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={r._id}
                className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-start justify-between gap-3 cursor-pointer hover:border-white/20 transition"
                onClick={() => setSelected(r)}>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{r.role}</h3>
                  <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border
                      ${daysLeft <= 3 ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>
                      {daysLeft <= 0 ? "Closing today" : `${daysLeft}d left`}
                    </span>
                    <span className="text-white/30 text-xs">{deadline.toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-xs">
                  Delete
                </button>
              </div>
            );
          })}
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
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const daysLeft = Math.ceil((new Date(selected.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded-full border
                        ${daysLeft <= 3 ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>
                        {daysLeft <= 0 ? "Closing today" : `${daysLeft}d left`}
                      </span>
                    );
                  })()}
                  <span className="text-white/30 text-xs">
                    Deadline: {new Date(selected.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-white/70 text-sm leading-relaxed mb-5">{selected.description}</p>
              <div className="flex gap-3">
                {selected.googleFormLink && (
                  <a href={toAbsoluteUrl(selected.googleFormLink)} target="_blank" rel="noreferrer"
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
                    🔗 View Form
                  </a>
                )}
                <button onClick={() => handleDelete(selected._id)}
                  className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
