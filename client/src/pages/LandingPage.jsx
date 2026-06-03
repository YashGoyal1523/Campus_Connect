import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../utils/axios";
import toast from "react-hot-toast";

export default function LandingPage() {
  const [modal, setModal] = useState(null); // "student" | "society" | null
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const openModal = (type) => {
    setModal(type);
    setIsRegister(false);
    setForm({});
    setLogoFile(null);
    setError("");
  };

  const closeModal = () => {
    setModal(null);
    setForm({});
    setLogoFile(null);
    setError("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isRegister
        ? `/auth/${modal}/register`
        : `/auth/${modal}/login`;

      let payload = form;

      if (isRegister && modal === "society" && logoFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append("logo", logoFile);
        payload = fd;
      }

      const { data } = await axios.post(endpoint, payload);
      login(data.user, data.token);
      toast.success(isRegister ? "Account created!" : "Welcome back!");
      navigate(modal === "student" ? "/student/discover" : "/society/posts");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal("student")}
            className="px-5 py-2 rounded-xl border border-purple-400/50 text-purple-300 hover:bg-purple-500/20 transition text-sm font-medium">
            Student Login
          </button>
          <button onClick={() => openModal("society")}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium">
            Society Login
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-2">
          🎓 Your College, Connected
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
          Discover Every Society On Campus
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
          CampusConnect is the single platform where students explore college societies,
          find open recruitments, and never miss an event — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button onClick={() => openModal("student")}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition font-semibold text-lg shadow-lg shadow-purple-500/25">
            I'm a Student →
          </button>
          <button onClick={() => openModal("society")}
            className="px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 transition font-semibold text-lg">
            I Represent a Society
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-16 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "🔭", title: "Discover Societies", desc: "Browse all active college societies, their mission, posts, and everything they're about." },
          { icon: "📋", title: "Open Recruitments", desc: "Never miss a recruitment drive. All open positions with deadlines in one feed." },
          { icon: "🎉", title: "Upcoming Events", desc: "Stay updated on every event happening across all societies on your campus." },
        ].map((f) => (
          <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/10">
        © 2025 CampusConnect. Built for students, by students.
      </footer>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={closeModal}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  {modal === "student" ? "Student Portal" : "Society Portal"}
                </p>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/60">
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isRegister && (
                <input name="name" placeholder="Full Name" onChange={handleChange} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              )}
              {isRegister && modal === "student" && (
                <>
                  <input name="college" placeholder="College Name" onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
                  <input name="rollNo" placeholder="Roll Number" onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
                </>
              )}
              {isRegister && modal === "society" && (
                <>
                  <input name="college" placeholder="College Name" onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
                  <select name="category" onChange={handleChange} required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition text-white/80 appearance-none cursor-pointer">
                    <option value="" disabled selected className="text-white/30">Select Category</option>
                    {["Technical", "Cultural", "Sports", "Music", "Dance", "Drama & Theatre",
                      "Photography", "Film & Media", "Literary & Debate", "Social Service",
                      "Entrepreneurship", "Finance", "Art & Design", "Environment", "Gaming"].map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                    ))}
                  </select>
                  <textarea name="description" placeholder="Society Description" onChange={handleChange} required rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
                  <div className="w-full">
                    <label className="block text-white/40 text-xs mb-2">Society Logo (optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/60 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-500/30 file:text-purple-300 file:text-xs file:cursor-pointer cursor-pointer" />
                    {logoFile && <p className="text-white/30 text-xs mt-1">{logoFile.name}</p>}
                  </div>
                </>
              )}
              <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              <input name="password" type="password" placeholder="Password" onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition font-semibold text-sm disabled:opacity-50">
                {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
              </button>
            </form>

            {/* Toggle */}
            <p className="text-center text-white/40 text-sm mt-5">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setIsRegister(!isRegister); setError(""); }}
                className="text-purple-400 hover:text-purple-300 font-medium transition">
                {isRegister ? "Login" : "Register"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}