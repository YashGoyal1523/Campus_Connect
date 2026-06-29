import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // Fetches fresh user data from backend using the stored token.
  // Called on page load and whenever token changes.
  // Always reflects latest data from DB (name, logo, following, etc.)
  const loadUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/me", { headers: { token } });
      if (!data.success) { toast.error(data.message); return; }
      setUser(data.user);
    } catch (e) {
      // Token expired or invalid — clear auth state
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On token change (login, logout, page reload) — fetch fresh user from backend
  useEffect(() => {
    if (token) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Called after successful login/register — only token is stored in localStorage
  const login = (tokenData) => {
    localStorage.setItem("token", tokenData);
    setToken(tokenData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, token, loading, login, logout, backendUrl }}>
      {children}
    </AppContext.Provider>
  );
};
