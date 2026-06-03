import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import SocietyDashboard from "./pages/society/SocietyDashboard";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (user.role !== role) return <Navigate to="/" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "student") return <Navigate to="/student/discover" />;
  if (user?.role === "society") return <Navigate to="/society/posts" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
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