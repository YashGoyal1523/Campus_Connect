import { createContext, useContext, useState, useEffect } from "react";

// Create a context — this is a way to share data across all components
// without passing props manually at every level
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // stores { id, name, role } of logged-in user
  const [token, setToken] = useState(null); // stores the JWT token string
  const [loading, setLoading] = useState(true); // true while checking localStorage on startup

  // On first app load — check if user was already logged in before
  // localStorage persists data even after closing the browser tab
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      // Restore the previous session automatically
      setUser(JSON.parse(storedUser)); // JSON.parse converts string back to object
      setToken(storedToken);
    }

    // Done checking — allow the app to render
    // Without this loading guard, protected routes would redirect before
    // we know if the user is actually logged in
    setLoading(false);
  }, []); // empty array = run only once when app starts

  // Called after successful login/register API response
  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    // Save to localStorage so session survives page refresh
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);
  };

  // Called when user clicks logout
  const logout = () => {
    setUser(null);
    setToken(null);
    // Remove from localStorage so next visit starts fresh
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    // Provide user, token, loading, login, logout to ALL child components
    // Any component can access these using the useAuth() hook below
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — shortcut to access auth context in any component
// Usage: const { user, login, logout } = useAuth()
export const useAuth = () => useContext(AuthContext);
