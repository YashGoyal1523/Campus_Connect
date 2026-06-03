import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#1e1b4b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#a78bfa', secondary: '#1e1b4b' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1e1b4b' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)