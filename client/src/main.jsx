// main.jsx — the entry point of the React app.
// createRoot mounts the entire React tree into the <div id="root"> in index.html.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// BrowserRouter enables client-side routing using the HTML5 History API (clean URLs like /student/discover).
// It must wrap the entire app so React Router hooks (useNavigate, useLocation) work anywhere.
import { BrowserRouter } from "react-router-dom"
// Toaster renders toast notifications — it sits outside App so toasts show over all pages.
import { Toaster } from "react-hot-toast"
// AppProvider wraps the app so every component can access the logged-in user via useContext(AppContext).
import { AppProvider } from "./context/AppContext"
import "./index.css"
import App from "./App.jsx"

// StrictMode renders every component twice in development to catch side-effect bugs early.
// It has no effect in production builds.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        {/* Toaster is positioned bottom-right with custom dark theme to match the app's palette */}
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#1e1b4b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#a78bfa', secondary: '#1e1b4b' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1e1b4b' } },
        }} />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
