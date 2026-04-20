import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// Detect if we're in the live app (/app/*) — use basename so all internal
// routes (navigate('/onboarding'), Link to="/vendor") automatically resolve
// under /app without changing any page files.
const isLiveApp = window.location.pathname.startsWith('/app')

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={isLiveApp ? '/app' : ''}>
    <App isLiveApp={isLiveApp} />
  </BrowserRouter>
)
