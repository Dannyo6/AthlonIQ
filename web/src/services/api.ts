/**
 * AthlonIQ API Client Service
 * Connects web client to FastAPI intelligence backend with graceful offline fallback.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function checkBackendHealth() {
  try {
    const res = await fetch("http://localhost:8000/health", { method: "GET" });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function fetchTargetsPreview(payload: any, token?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/coaching/targets-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer dev-token" }),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Targets preview failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend targets preview unavailable, using client calculations:", err);
    return null;
  }
}

export async function submitReadinessCheckIn(payload: any, token?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/coaching/readiness`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer dev-token" }),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Readiness check-in failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend readiness check-in unavailable, using client calculations:", err);
    return null;
  }
}
