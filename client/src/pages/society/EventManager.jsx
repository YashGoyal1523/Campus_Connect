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
              <div key={ev._id} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden group relative">
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
                  {ev.googleFormLink && (
                    <a href={toAbsoluteUrl(ev.googleFormLink)} target="_blank" rel="noreferrer"
                      className="inline-block mt-2 text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition">
                      🔗 Form
                    </a>
                  )}
                </div>
                <button onClick={() => handleDelete(ev._id)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}