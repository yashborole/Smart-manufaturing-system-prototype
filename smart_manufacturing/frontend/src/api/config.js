// API Base Configuration
// 1. If VITE_API_URL is explicitly set and non-empty, use it.
// 2. If running locally (localhost / 127.0.0.1 on any port other than FastAPI's 8000), default to http://localhost:8000.
// 3. Otherwise (unified backend container or reverse proxy), use relative path "".

export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    // If running in browser locally on Vite dev server (port 5173, 5174, etc.)
    if (isLocalhost && port !== '8000') {
      return 'http://localhost:8000';
    }
  }

  return '';
})();

export default API_BASE_URL;
