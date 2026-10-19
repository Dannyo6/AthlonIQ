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

export async function analyzeMealPhotoApi(imageFile: File, token?: string) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const res = await fetch(`${API_BASE_URL}/vision/analyze-meal`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer test-token-athlete" }),
    },
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = `Vision analysis failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson?.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const json = await res.json();
  return json.data; // MealAnalysisResponse
}

export async function sendCoachChatTurn(
  message: string,
  context?: any,
  token?: string
) {
  const res = await fetch(`${API_BASE_URL}/coaching/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer test-token-athlete" }),
    },
    body: JSON.stringify({ message, context }),
  });

  if (!res.ok) {
    let errorDetail = `Coach chat failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const json = await res.json();
  return json.data;
}

export async function fetchWeeklyReview(context?: any, token?: string) {
  const res = await fetch(`${API_BASE_URL}/coaching/weekly-review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer test-token-athlete" }),
    },
    body: JSON.stringify({ context }),
  });

  if (!res.ok) {
    let errorDetail = `Weekly review failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const json = await res.json();
  return json.data;
}

export async function fetchCoachTools(token?: string) {
  const res = await fetch(`${API_BASE_URL}/coaching/tools`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer test-token-athlete" }),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch coach tools: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function calibrateLeanBulkApi(payload: any, token?: string) {
  const res = await fetch(`${API_BASE_URL}/coaching/calibrate-lean-bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer test-token-athlete" }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `Calibrate lean-bulk failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const json = await res.json();
  return json.data;
}

export async function fetchFatigueAdvisoryApi(payload: any, token?: string) {
  const res = await fetch(`${API_BASE_URL}/coaching/fatigue-advisory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer test-token-athlete" }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `Fatigue advisory failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const json = await res.json();
  return json.data;
}


