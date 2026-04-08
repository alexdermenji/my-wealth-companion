import { supabase } from "@/shared/auth/supabase";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function getToken(): Promise<string | null> {
  if (import.meta.env.VITE_E2E_TEST === "true") return "e2e-mock-token";
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();

  if (!token) {
    await supabase.auth.signOut();
    throw new Error("No active session. Please sign in.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    await supabase.auth.signOut();
    throw new Error("Unauthorized. Please sign in again.");
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
