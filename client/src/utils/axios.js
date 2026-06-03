import axios from "axios";

// Create a custom axios instance with a fixed base URL
// All API calls in the app use this instance instead of plain axios
// so we never have to repeat the base URL in every component
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

// Interceptor — runs automatically before EVERY request made with this instance
// Attaches the JWT token to the Authorization header so protected routes work
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Standard Bearer token format expected by our authMiddleware on the backend
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
