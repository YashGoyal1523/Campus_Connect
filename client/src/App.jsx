// App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This is the root component of the React application.
// It is responsible for:
//   1. Defining ALL client-side routes using React Router v6.
//   2. Protecting certain routes so they are only accessible to authenticated
//      users with the correct role (student or society).
//   3. Redirecting already-authenticated users away from the public landing page.
//
// Architecture decision:
//   Two guard components — ProtectedRoute and PublicRoute — handle all redirect
//   logic in one place. This keeps individual page components clean and unaware
//   of authentication concerns (single-responsibility principle).
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // global auth state (user object + JWT)
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import SocietyDashboard from "./pages/society/SocietyDashboard";

// ── ProtectedRoute ────────────────────────────────────────────────────────────
// A wrapper component that guards routes which require authentication AND a
// specific role (e.g. only "student" can visit /student/* routes).
//
// How it works:
//   - While the auth state is still loading from localStorage/token validation,
//     render nothing (null) to avoid a flash of an incorrect redirect.
//   - If there is no logged-in user, redirect to the landing page ("/").
//   - If the user is logged in but has the WRONG role (e.g. a society trying to
//     access a student route), also redirect to "/".
//   - Otherwise, render the protected child component.
//
// Props:
//   children — the page component to render if access is granted
//   role     — the required role string: "student" or "society"
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // Wait until AuthContext finishes checking localStorage / validating the token
  // before making any redirect decision — prevents a flicker to "/" on page refresh
  if (loading) return null;

  // Not logged in at all — send to the landing page
  if (!user) return <Navigate to="/" />;

  // Logged in but wrong role — also send to the landing page
  // (e.g. a society account should never see the student dashboard)
  if (user.role !== role) return <Navigate to="/" />;

  // All checks passed — render the actual page
  return children;
};

// ── PublicRoute ───────────────────────────────────────────────────────────────
// A wrapper for routes that should only be accessible to unauthenticated users.
// This prevents a logged-in user from seeing the landing/login page again by
// automatically bouncing them to their dashboard.
//
// Without this guard, a logged-in student could navigate to "/" and see the
// login form, which would be confusing UX.
//
// Props:
//   children — the page component to render if the user is NOT logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Same loading guard as ProtectedRoute — avoid premature redirects
  if (loading) return null;

  // If a student is already logged in, redirect them straight to their feed
  if (user?.role === "student") return <Navigate to="/student/discover" />;

  // If a society is already logged in, redirect them to their posts dashboard
  if (user?.role === "society") return <Navigate to="/society/posts" />;

  // No user logged in — show the public page (landing page)
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
// Defines the route tree. React Router v6 uses a declarative <Routes>/<Route>
// structure where each <Route> maps a URL pattern to a component.
//
// Route design decisions:
//   - "/" is a PublicRoute wrapping LandingPage (redirects away if already logged in).
//   - "/student/*" uses a wildcard ("/*") so StudentDashboard can define its own
//     nested sub-routes internally (e.g. /student/discover, /student/events).
//   - "/society/*" follows the same pattern for SocietyDashboard.
//   - All dashboard routes are wrapped in ProtectedRoute with the appropriate role.
const App = () => {
  return (
    <Routes>
      {/* Landing page — public, but redirects authenticated users to their dashboard */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

      {/* Student dashboard and all its nested sub-routes (e.g. /student/discover).
          Only accessible to users whose role is "student". */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Society dashboard and all its nested sub-routes (e.g. /society/posts).
          Only accessible to users whose role is "society". */}
      <Route
        path="/society/*"
        element={
          <ProtectedRoute role="society">
            <SocietyDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
