import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Tangani error ketika user memakai versi lama dan chunk JS sudah hilang di server (setelah deploy baru)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const hasReloaded = sessionStorage.getItem('vite_preload_reloaded');
  if (!hasReloaded) {
    sessionStorage.setItem('vite_preload_reloaded', 'true');
    window.location.reload();
  }
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
