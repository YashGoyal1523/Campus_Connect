import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

// AnnouncementManager is the society-side panel for creating, viewing,
// and deleting public announcements that all students can see.
const AnnouncementManager = () => {
  const { token , backendUrl } = useContext(AppContext);

  // announcements: the list of this society's announcements fetched from the server
  const [announcements, setAnnouncements] = useState([]);
  // form: controlled state for the create-announcement form fields (title + content)
  const [form, setForm] = useState({ title: "", content: "" });
  // loading: true while the POST request to create an announcement is in progress
  const [loading, setLoading] = useState(false);
  // fetching: true during the initial GET request — shows the inline skeleton
  const [fetching, setFetching] = useState(true);
  // selected: the announcement whose full-content modal is open; null = no modal
  const [selected, setSelected] = useState(null);

  // Fetches all announcements belonging to this society from the /announcements/my endpoint
  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/announcements/my", { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setAnnouncements(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setFetching(false);
    }
  };

  // Populate the list as soon as the component mounts
  useEffect(() => { fetchAnnouncements(); }, []);

  // Generic handler for all form text inputs.
  // Uses the input's `name` attribute to identify which field to update,
  // so a single handler works for both "title" and "content" without separate setters.
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // handleSubmit posts a new announcement.
  // After success it resets the form and re-fetches the list so the new item appears.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission / page reload
    setLoading(true);
    try {
      const { data } = await axios.post(backendUrl + "/api/announcements", form, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      // Reset form fields so the society can immediately post another announcement
      setForm({ title: "", content: "" });
      // Re-fetch rather than optimistically prepending, to ensure we get the server-assigned
      // _id and createdAt timestamp for the new item
      fetchAnnouncements();
      toast.success("Announcement posted!");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      // Re-enable the submit button regardless of success or failure
      setLoading(false);
    }
  };

  // handleDelete removes an announcement from the server and updates local state.
  // Filtering the local array immediately avoids a full re-fetch and gives instant feedback.
  // If the deleted announcement is currently open in the modal, also close the modal.
  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(backendUrl + `/api/announcements/${id}`, { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      // Close the detail modal if the currently selected announcement was the one just deleted
      if (selected?._id === id) setSelected(null);
      toast.success("Announcement deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  // Local helper for relative timestamps — scoped here because it's only needed in this component
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

      {/* Create Announcement Form */}
      <form onSubmit={handleSubmit}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">New Announcement</h2>
        {/* name="title" and name="content" are used by handleChange to identify the field */}
        <input name="title" placeholder="Announcement title" value={form.title} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        {/* resize-none prevents the textarea from being dragged to an unexpected size */}
        <textarea name="content" placeholder="Write your announcement..." value={form.content} onChange={handleChange} required rows={4}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Posting..." : "Post Announcement"}
        </button>
      </form>

      {/* List of existing announcements — three branches: loading / empty / populated */}
      {fetching && (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      )}
      {!fetching && announcements.length === 0 && (
        <div className="text-center py-20 text-white/30">No announcements posted yet.</div>
      )}
      {!fetching && announcements.length > 0 && (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            // Clicking the row opens the detail modal; the delete button stops propagation
            // so clicking Delete doesn't also open the modal at the same time
            <div key={a._id}
              className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-4 cursor-pointer hover:border-white/20 transition"
              onClick={() => setSelected(a)}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shrink-0">📢 Announcement</span>
                  <span className="text-white/30 text-xs">{timeAgo(a.createdAt)}</span>
                </div>
                <h3 className="font-bold text-sm">{a.title}</h3>
                {/* line-clamp-2 shows a content preview; full text is in the modal */}
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

      {/* Detail modal: clicking the dark backdrop closes it.
          stopPropagation on the inner panel prevents that backdrop click from
          closing the modal when the user interacts with the content inside it. */}
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
              {/* Full content without line-clamp, unlike the list preview */}
              <p className="text-white/70 text-sm leading-relaxed">{selected.content}</p>
              <p className="text-white/30 text-xs mt-4">{timeAgo(selected.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementManager;
