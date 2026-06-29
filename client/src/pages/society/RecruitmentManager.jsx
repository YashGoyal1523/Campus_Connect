import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

// Normalises a URL that may be missing the "https://" protocol prefix.
// Without this, anchor tags would treat bare domains as relative paths.
const toAbsoluteUrl = (url) => url?.startsWith("http") ? url : `https://${url}`;

// RecruitmentManager is the society-side panel for posting, viewing,
// and deleting recruitment openings. It also shows a countdown badge per opening.
const RecruitmentManager = () => {
  const { token , backendUrl } = useContext(AppContext);

  // recruitments: the list of this society's recruitment postings
  const [recruitments, setRecruitments] = useState([]);
  // form: controlled state object for all fields in the create-recruitment form
  const [form, setForm] = useState({ role: "", description: "", googleFormLink: "", deadline: "" });
  // loading: true while the POST request is in progress — disables the submit button
  const [loading, setLoading] = useState(false);
  // fetching: true during the initial GET — shows the inline skeleton
  const [fetching, setFetching] = useState(true);
  // selected: the recruitment currently displayed in the detail modal; null = no modal
  const [selected, setSelected] = useState(null);

  // Fetches all recruitment postings owned by the logged-in society
  const fetchRecruitments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/recruitments/my", { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setRecruitments(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setFetching(false);
    }
  };

  // Load postings when the component first mounts
  useEffect(() => { fetchRecruitments(); }, []);

  // Generic change handler: reads the input's `name` attribute to update the correct field.
  // Keeps the form clean with a single handler rather than four separate setters.
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // handleSubmit creates a new recruitment posting.
  // On success, resets the form and re-fetches the list to include the new item.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission
    setLoading(true);
    try {
      const { data } = await axios.post(backendUrl + "/api/recruitments", form, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      // Reset all form fields so the society can immediately create another posting
      setForm({ role: "", description: "", googleFormLink: "", deadline: "" });
      // Re-fetch to get the server-assigned _id and deadline value for the new item
      fetchRecruitments();
      toast.success("Recruitment posted!");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // handleDelete removes a posting from the server and updates the local list instantly.
  // Also closes the detail modal if the deleted item was the one currently open.
  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(backendUrl + `/api/recruitments/${id}`, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setRecruitments(recruitments.filter((r) => r._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success("Recruitment deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Recruitment</h1>
      <p className="text-white/40 mb-8">Post openings for your society</p>

      {/* Create Recruitment Form */}
      <form onSubmit={handleSubmit}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">Post a New Opening</h2>
        {/* Each input's `name` attribute matches the corresponding key in `form` state */}
        <input name="role" placeholder="Role (e.g. Graphic Designer)" value={form.role} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        <textarea name="description" placeholder="Describe the role and requirements..." value={form.description} onChange={handleChange} required rows={3}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
        {/* Google Form link is required here (unlike EventManager) because the whole point
            of a recruitment posting is to direct students to an application form */}
        <input name="googleFormLink" placeholder="Google Form Link" value={form.googleFormLink} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        {/* type="date" renders a native date picker (no time component needed for deadlines) */}
        <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition text-white/60" />
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Posting..." : "Post Opening"}
        </button>
      </form>

      {/* Recruitments list — three branches: loading / empty / populated */}
      {fetching && (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      )}
      {!fetching && recruitments.length === 0 && (
        <div className="text-center py-20 text-white/30">No recruitments posted yet.</div>
      )}
      {!fetching && recruitments.length > 0 && (
        <div className="flex flex-col gap-4">
          {recruitments.map((r) => {
            const deadline = new Date(r.deadline);
            // daysLeft is a float converted to integer with Math.ceil (rounds up so "0.5 days" = 1 day left)
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            return (
              // Clicking the row opens the detail modal
              <div key={r._id}
                className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-start justify-between gap-3 cursor-pointer hover:border-white/20 transition"
                onClick={() => setSelected(r)}>
                <div className="min-w-0">
                  {/* truncate prevents a long role title from overflowing into the delete button */}
                  <h3 className="font-bold text-sm truncate">{r.role}</h3>
                  {/* line-clamp-2 shows a brief description preview */}
                  <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {/* Urgency badge: turns red when ≤3 days remain, green otherwise */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border
                      ${daysLeft <= 3 ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>
                      {daysLeft <= 0 ? "Closing today" : `${daysLeft}d left`}
                    </span>
                    <span className="text-white/30 text-xs">{deadline.toLocaleDateString()}</span>
                  </div>
                </div>
                {/* stopPropagation prevents the card's onClick (setSelected) from also firing
                    when the user clicks the Delete button */}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-xs">
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal: backdrop click closes it; stopPropagation on the inner panel
          prevents that from firing when interacting inside the modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold">{selected.role}</h2>
                {/* IIFE (Immediately Invoked Function Expression) is used here to compute
                    daysLeft inline without declaring a variable in the outer scope.
                    This is a self-contained calculation that only affects this JSX block. */}
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
              {/* Full description without any line clamping */}
              <p className="text-white/70 text-sm leading-relaxed mb-5">{selected.description}</p>
              <div className="flex gap-3">
                {selected.googleFormLink && (
                  <a href={toAbsoluteUrl(selected.googleFormLink)} target="_blank" rel="noreferrer"
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
                    🔗 View Form
                  </a>
                )}
                {/* Delete also available from within the modal for convenience */}
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

export default RecruitmentManager;
