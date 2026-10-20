/**
 * AthlonIQ API Client Service
 * Connects web client to FastAPI intelligence backend with dynamic LAN hostname resolution
 * and deterministic offline fallbacks.
 */

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
  return `http://${host}:8000/api/v1`;
}

export function getHealthUrl(): string {
  const host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
  return `http://${host}:8000/health`;
}

export async function checkBackendHealth(): Promise<{ status: string; environment?: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(getHealthUrl(), {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error("Health check non-200");
    const json = await res.json();
    return json?.data || json || { status: "healthy" };
  } catch (error) {
    return null;
  }
}

export async function fetchTargetsPreview(payload: any, token?: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/coaching/targets-preview`, {
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
    const res = await fetch(`${getApiBaseUrl()}/coaching/readiness`, {
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

  const res = await fetch(`${getApiBaseUrl()}/vision/analyze-meal`, {
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
  const res = await fetch(`${getApiBaseUrl()}/coaching/chat`, {
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
  const res = await fetch(`${getApiBaseUrl()}/coaching/weekly-review`, {
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
  const res = await fetch(`${getApiBaseUrl()}/coaching/tools`, {
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
  const res = await fetch(`${getApiBaseUrl()}/coaching/calibrate-lean-bulk`, {
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
  const res = await fetch(`${getApiBaseUrl()}/coaching/fatigue-advisory`, {
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



