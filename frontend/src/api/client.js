import axios from "axios";

// Base URL for the backend API. Configured at build time via Vite env var.
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Normalize backend errors into a readable message for the UI.
export function extractError(err) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors (422) come as a list of objects.
    return detail
      .map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`)
      .join("; ");
  }
  if (typeof detail === "string") return detail;
  return err?.message || "Something went wrong";
}

export default client;
