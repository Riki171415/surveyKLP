import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Tangani error ketika user memakai versi lama dan chunk JS sudah hilang di server (setelah deploy baru)
window.addEventListener('vite:preloadError', (event) => {
  const hasReloaded = sessionStorage.getItem('vite_preload_reloaded');
  if (!hasReloaded) {
    event.preventDefault();
    sessionStorage.setItem('vite_preload_reloaded', 'true');
    // Force cache bust by appending query param
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now());
    window.location.href = url.toString();
  }
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
