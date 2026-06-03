// LandingPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This is the very first page a visitor sees when they land on CampusConnect.
// It serves two purposes:
//   1. Marketing — explains what the platform does (hero section + feature cards).
//   2. Auth entry-point — lets both students and societies register or log in
//      through a single shared modal that adapts its fields based on the user type.
//
// After a successful login/register the user is redirected to their role-specific
// dashboard. If they are already logged in, PublicRoute (in App.jsx) redirects
// them away from this page automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../utils/axios"; // pre-configured axios instance with base URL
import toast from "react-hot-toast"; // lightweight toast notification library

export default function LandingPage() {
  // modal tracks which user type's form is currently open: "student", "society", or null (closed)
  const [modal, setModal] = useState(null); // "student" | "society" | null

  // isRegister toggles between the Login form and the Register form inside the same modal
  const [isRegister, setIsRegister] = useState(false);

  // form holds all text/select input values as a plain key-value object
  // We use a single generic object so we don't need a separate state variable for every field
  const [form, setForm] = useState({});

  // logoFile is kept separate from `form` because it is a File object (binary),
  // not a plain string — it needs special handling with FormData before upload
  const [logoFile, setLogoFile] = useState(null);

  // error stores a server-side or network error message to display inside the modal
  const [error, setError] = useState("");

  // loading disables the submit button while the API request is in flight
  // to prevent duplicate submissions
  const [loading, setLoading] = useState(false);

  // login comes from AuthContext — it stores the user object + JWT token globally
  // so every part of the app knows who is logged in
  const { login } = useAuth();

  // useNavigate gives us programmatic navigation after a successful auth action
  const navigate = useNavigate();

  // openModal — called when the user clicks "Student Login" or "Society Login"
  // Resets all form state so stale data from a previous session is cleared,
  // then opens the modal for the given user type
  const openModal = (type) => {
    setModal(type);
    setIsRegister(false); // always start on the Login view, not Register
    setForm({});
    setLogoFile(null);
    setError("");
  };

  // closeModal — resets everything and hides the modal
  // Also triggered when the user clicks the dark overlay behind the modal
  const closeModal = () => {
    setModal(null);
    setForm({});
    setLogoFile(null);
    setError("");
  };

  // handleChange — generic controlled-input handler
  // Uses the input's `name` attribute as the key so we can handle any number
  // of fields with one function instead of writing a setter per field
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handleSubmit — the core auth function
  // Decides whether to call register or login, constructs the correct payload,
  // calls the API, stores the result in context, and navigates to the dashboard
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent the default browser page reload on form submit
    setLoading(true);
    setError("");
    try {
      // Build the API endpoint dynamically from the current modal type and mode:
      //   e.g. "/auth/student/register"  or  "/auth/society/login"
      const endpoint = isRegister
        ? `/auth/${modal}/register`
        : `/auth/${modal}/login`;

      // For most cases, send the form data as JSON (the default axios behaviour)
      let payload = form;

      // Exception: society registration may include a logo file (binary data).
      // JSON cannot carry binary, so we switch to multipart/form-data via FormData.
      // We only do this when registering a society AND a logo file was selected.
      if (isRegister && modal === "society" && logoFile) {
        const fd = new FormData();
        // Append every text field from the form object to the FormData
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        // Append the logo file under the key "logo" (must match what multer expects on the server)
        fd.append("logo", logoFile);
        payload = fd;
      }

      // Make the POST request; axios automatically sets the correct Content-Type header
      // (application/json for a plain object, multipart/form-data for FormData)
      const { data } = await axios.post(endpoint, payload);

      // Store the returned user object and JWT token in global AuthContext
      // so all other components can read the current user without a new API call
      login(data.user, data.token);

      // Show a friendly success notification
      toast.success(isRegister ? "Account created!" : "Welcome back!");

      // Redirect using the role from the server response (not the modal type)
      // so the route is always correct regardless of which button the user clicked
      navigate(data.user.role === "student" ? "/student/discover" : "/society/posts");
    } catch (err) {
      // Prefer the server's error message; fall back to a generic string
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg); // show inline inside the form
      toast.error(msg); // also show as a toast for visibility
    } finally {
      // Always re-enable the submit button regardless of success or failure
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────────
          Top navigation bar. Contains the brand logo and two CTA buttons that
          open the modal for the respective user type. */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Brand icon — a simple coloured square with the letter "C" */}
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <div className="flex gap-3">
          {/* Outline style for the secondary action (Student) */}
          <button onClick={() => openModal("student")}
            className="px-5 py-2 rounded-xl border border-purple-400/50 text-purple-300 hover:bg-purple-500/20 transition text-sm font-medium">
            Student Login
          </button>
          {/* Filled gradient style for the primary action (Society) */}
          <button onClick={() => openModal("society")}
            className="px-5 py-2 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium">
            Society Login
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────────────────────────
          The centrepiece of the landing page. Communicates the platform's value
          proposition in one headline. Two CTA buttons mirror the navbar so the
          call-to-action is visible as soon as the user scrolls. */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        {/* Small badge above the headline — draws the eye before the main title */}
        <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-2">
          🎓 Your College, Connected
        </div>
        {/* Main headline — uses a gradient text clip technique for the coloured effect */}
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl bg-linear-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
          Discover Every Society On Campus
        </h1>
        {/* Supporting sub-headline that adds more detail to the headline */}
        <p className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
          CampusConnect is the single platform where students explore college societies,
          find open recruitments, and never miss an event — all in one place.
        </p>
        {/* Duplicate CTAs — placed after the description for users who read before clicking */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button onClick={() => openModal("student")}
            className="px-8 py-4 rounded-2xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition font-semibold text-lg shadow-lg shadow-purple-500/25">
            I'm a Student →
          </button>
          <button onClick={() => openModal("society")}
            className="px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 transition font-semibold text-lg">
            I Represent a Society
          </button>
        </div>
      </section>

      {/* ── FEATURES SECTION ───────────────────────────────────────────────────
          A 3-column card grid explaining the three core feature areas.
          The data is defined inline as an array of objects and mapped to cards —
          this avoids repeating JSX and makes it easy to add/remove feature cards. */}
      <section className="px-6 py-16 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "🔭", title: "Discover Societies", desc: "Browse all active college societies, their mission, posts, and everything they're about." },
          { icon: "📋", title: "Open Recruitments", desc: "Never miss a recruitment drive. All open positions with deadlines in one feed." },
          { icon: "🎉", title: "Upcoming Events", desc: "Stay updated on every event happening across all societies on your campus." },
        ].map((f) => (
          // key prop is required when rendering lists so React can efficiently diff the DOM
          <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────────
          Minimal footer with copyright notice. */}
      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/10">
        © 2025 CampusConnect. Built for students, by students.
      </footer>

      {/* ── AUTH MODAL ─────────────────────────────────────────────────────────
          Rendered only when `modal` is non-null (i.e., a user type has been chosen).
          The modal uses a "portal-style" fixed overlay that dims the background.
          Clicking the dark backdrop calls closeModal; clicking inside the white card
          stops event propagation so the modal stays open (stopPropagation trick). */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={closeModal}>
          {/* stopPropagation prevents the backdrop click handler from firing
              when the user clicks anywhere inside the card */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>

            {/* ── Modal Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {/* Title changes between "Create Account" and "Welcome Back"
                    based on the current isRegister toggle */}
                <h2 className="text-2xl font-bold">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h2>
                {/* Subtitle clarifies which portal the user is accessing */}
                <p className="text-white/40 text-sm mt-1">
                  {modal === "student" ? "Student Portal" : "Society Portal"}
                </p>
              </div>
              {/* Close button — calls closeModal to hide the modal */}
              <button onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/60">
                ✕
              </button>
            </div>

            {/* ── Dynamic Form ──────────────────────────────────────────────── */}
            {/* The form renders different fields depending on modal type + isRegister.
                Login always shows only email + password.
                Registration shows extra fields specific to the user type. */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Name field — shown only during registration (both types) */}
              {isRegister && (
                <input name="name" placeholder="Full Name" onChange={handleChange} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              )}

              {/* Student-specific registration fields: college + roll number */}
              {isRegister && modal === "student" && (
                <>
                  <input name="college" placeholder="College Name" onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
                  {/* Roll number is used to uniquely identify a student within a society's team */}
                  <input name="rollNo" placeholder="Roll Number" onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
                </>
              )}

              {/* Society-specific registration fields: college, category, description, logo */}
              {isRegister && modal === "society" && (
                <>
                  <input name="college" placeholder="College Name" onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
                  {/* Category dropdown — defines the type of society; used for filtering */}
                  <select name="category" onChange={handleChange} required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition text-white/80 appearance-none cursor-pointer">
                    <option value="" disabled selected className="text-white/30">Select Category</option>
                    {/* All supported society categories are listed here as option elements */}
                    {["Technical", "Cultural", "Sports", "Music", "Dance", "Drama & Theatre",
                      "Photography", "Film & Media", "Literary & Debate", "Social Service",
                      "Entrepreneurship", "Finance", "Art & Design", "Environment", "Gaming"].map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                    ))}
                  </select>
                  <textarea name="description" placeholder="Society Description" onChange={handleChange} required rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30 resize-none" />
                  {/* Logo upload — optional binary file; stored in logoFile state separately
                      because it cannot be serialised to JSON like the other fields */}
                  <div className="w-full">
                    <label className="block text-white/40 text-xs mb-2">Society Logo (optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/60 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-500/30 file:text-purple-300 file:text-xs file:cursor-pointer cursor-pointer" />
                    {/* Show the selected file name as a visual confirmation */}
                    {logoFile && <p className="text-white/30 text-xs mt-1">{logoFile.name}</p>}
                  </div>
                </>
              )}

              {/* Email and password are common to all auth scenarios (login + register, both types) */}
              <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />
              <input name="password" type="password" placeholder="Password" onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition placeholder:text-white/30" />

              {/* Inline error message shown when the API returns an error */}
              {error && <p className="text-red-400 text-sm">{error}</p>}

              {/* Submit button — disabled while loading to prevent duplicate requests */}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition font-semibold text-sm disabled:opacity-50">
                {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
              </button>
            </form>

            {/* ── Login / Register Toggle ────────────────────────────────────
                Allows the user to switch between Login and Register without
                opening a new modal. Toggling also clears any existing errors. */}
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
