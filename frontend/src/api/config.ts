// Central API base configuration for frontend
// Use Vite env var VITE_API_URL if provided, otherwise fall back to process.env.BASE_URL or localhost

const VITE_API =
  (import.meta as any).env?.VITE_API_URL ||
  process.env?.BASE_URL ||
  "http://localhost:5001";

export const BACKEND_BASE = VITE_API;
export const API_BASE = `${BACKEND_BASE}/api`;
export default API_BASE;
