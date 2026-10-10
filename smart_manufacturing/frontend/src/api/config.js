// API Base Configuration
// In development, this defaults to http://localhost:8000 or the VITE_API_URL environment variable.
// In production or when served from the same domain / behind reverse proxy, set VITE_API_URL="" or relative path.

export const API_BASE_URL = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== null)
  ? import.meta.env.VITE_API_URL
  : (window.location.port === '5173' ? 'http://localhost:8000' : '');

export default API_BASE_URL;
