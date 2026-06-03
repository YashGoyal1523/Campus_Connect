import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

const toAbsoluteUrl = (url) => url?.startsWith("http") ? url : `https://${url}`;

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", venue: "", googleFormLink: "" });
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchEvents = async () => {
    const { data } = await axios.get("/events/my");
    setEvents(data);
    setFetching(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (poster) formData.append("poster", poster);
    try {
      await axios.post("/events", formData);
      setForm({ title: "", description: "", date: "", venue: "", googleFormLink: "" });
      setPoster(null);
      e.target.reset();
      fetchEvents();
      toast.success("Event posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`/events/${id}`);
    setEvents(events.filter((ev) => ev._id !== id));
    if (selected?._id === id) setSelected(null);
    toast.success("Event deleted");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Events</h1>
      <p className="text-white/40 mb-8">Post upcoming events for your society</p>

      {/* Form */}
      <form onSubmit={handleSubmit}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-white/80">Create New Event</h2>
        <input name="title" placeholder="Event Title" value={form.title} onChange={handleChange} required
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        <textarea name="description" placeholder="Event description..." value={form.description} onChange={handleChange} required rows={3}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition text-white/60" />
          <input name="venue" placeholder="Venue" value={form.venue} onChange={handleChange} required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        </div>
        <input name="googleFormLink" placeholder="Google Form Link (optional)" value={form.googleFormLink} onChange={handleChange}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
        <input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files[0])}
          className="text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 file:cursor-pointer" />
        <button type="submit" disabled={loading}
          className="self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50">
          {loading ? "Posting..." : "Post Event"}
        </button>
      </form>

      {/* List */}
      {fetching && <Spinner />}
      {!fetching && events.length === 0 && (
        <div className="text-center py-20 text-white/30">No events posted yet.</div>
      )}
      {!fetching && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((ev) => {
            const date = new Date(ev.date);
            return (
              <div key={ev._id}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden group relative cursor-pointer hover:border-white/20 transition"
                onClick={() => setSelected(ev)}>
                {ev.poster
                  ? <img src={ev.poster} className="w-full h-24 object-contain bg-black" />
                  : <div className="w-full h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center text-2xl">🎉</div>}
                <div className="p-3">
                  <h3 className="font-bold text-sm truncate">{ev.title}</h3>
                  <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{ev.description}</p>
                  <p className="text-white/30 text-xs mt-1">📍 {ev.venue}</p>
                  <p className="text-purple-300 text-xs mt-0.5">
                    🗓 {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(ev._id); }}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition">
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
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition shrink-0 ml-3">✕</button>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{selected.description}</p>
              <div className="flex flex-col gap-1.5 mb-5 text-sm text-white/50">
                <p>📍 {selected.venue}</p>
                <p>🗓 {new Date(selected.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div className="flex gap-3">
                {selected.googleFormLink && (
                  <a href={toAbsoluteUrl(selected.googleFormLink)} target="_blank" rel="noreferrer"
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
                    🔗 View Form
                  </a>
                )}
                <button onClick={() => handleDelete(selected._id)}
                  className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm">
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
