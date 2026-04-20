import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// After Google OAuth, Supabase redirects back with a ?code= param.
// If it lands on the root (not /app), redirect to /app so AuthProvider
// can process the auth callback.
if (!window.location.pathname.startsWith('/app')) {
  const params = new URLSearchParams(window.location.search)
  if (params.has('code') && params.has('next')) {
    window.location.replace('/app' + window.location.search + window.location.hash)
  } else if (window.location.hash.includes('access_token')) {
    window.location.replace('/app' + window.location.hash)
  }
}

// Detect if we're in the live app (/app/*) — use basename so all internal
// routes (navigate('/onboarding'), Link to="/vendor") automatically resolve
// under /app without changing any page files.
const isLiveApp = window.location.pathname.startsWith('/app')

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={isLiveApp ? '/app' : ''}>
    <App isLiveApp={isLiveApp} />
  </BrowserRouter>
)
