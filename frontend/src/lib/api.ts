import type {
  Alert,
  Meter,
  MeterCreated,
  Reading,
  ReadingsSummary,
  RelayEvent,
} from "@/lib/types";

/**
 * On Vercel the API lives in the same Next.js app under `/api/v1/...`,
 * so all requests are same-origin. The optional `serverSide` flag is
 * still accepted to keep the call-site signatures stable; when called
 * from a Server Component we resolve to an absolute URL using the
 * incoming request host (or VERCEL_URL).
 */

const API_PREFIX = "/api/v1";

function absoluteBase(): string {
  // Server-only.
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  opts: RequestInit & { token?: string; serverSide?: boolean } = {},
): Promise<T> {
  const url = opts.serverSide
    ? `${absoluteBase()}${API_PREFIX}${path}`
    : `${API_PREFIX}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  // For server-side calls we need to forward the session cookie so the
  // route handler can authenticate the request. Lazy import to avoid
  // bundling next/headers into client builds.
  if (opts.serverSide) {
    try {
      const { cookies } = await import("next/headers");
      const all = cookies()
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      if (all) headers.Cookie = all;
    } catch {
      // not in a request context (e.g. build) — proceed
    }
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (typeof j.detail === "string") {
        detail = j.detail;
      } else if (Array.isArray(j.detail)) {
        detail = j.detail
          .map((d: { loc?: (string | number)[]; msg?: string }) => {
            const field = Array.isArray(d.loc)
              ? d.loc.filter((p) => p !== "body").join(".")
              : "";
            return field ? `${field}: ${d.msg}` : d.msg ?? JSON.stringify(d);
          })
          .join("; ");
      } else if (j.detail) {
        detail = JSON.stringify(j.detail);
      } else if (j.error) {
        detail = String(j.error);
      } else {
        detail = JSON.stringify(j);
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ---- meters ----
  listMeters: (token: string, serverSide = false) =>
    request<Meter[]>("/meters", { token, serverSide }),

  getMeter: (id: number, token: string, serverSide = false) =>
    request<Meter>(`/meters/${id}`, { token, serverSide }),

  createMeter: (
    token: string,
    body: {
      name: string;
      location?: string;
      owner_user_id?: number | null;
      low_v_threshold?: number;
      high_v_threshold?: number;
    },
  ) =>
    request<MeterCreated>("/meters", { method: "POST", body: JSON.stringify(body), token }),

  updateMeter: (
    id: number,
    token: string,
    body: Partial<{
      name: string;
      location: string | null;
      owner_user_id: number | null;
      low_v_threshold: number;
      high_v_threshold: number;
    }>,
  ) =>
    request<Meter>(`/meters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),

  rotateToken: (id: number, token: string) =>
    request<MeterCreated>(`/meters/${id}/rotate-token`, { method: "POST", token }),

  deleteMeter: (id: number, token: string) =>
    request<void>(`/meters/${id}`, { method: "DELETE", token }),

  // ---- readings ----
  listReadings: (id: number, token: string, hours = 24, limit = 500, serverSide = false) =>
    request<Reading[]>(`/meters/${id}/readings?hours=${hours}&limit=${limit}`, {
      token,
      serverSide,
    }),

  latestReading: (id: number, token: string, serverSide = false) =>
    request<Reading>(`/meters/${id}/readings/latest`, { token, serverSide }),

  summary: (id: number, token: string, serverSide = false) =>
    request<ReadingsSummary>(`/meters/${id}/readings/summary`, { token, serverSide }),

  // ---- alerts ----
  listAlerts: (
    token: string,
    opts: { meterId?: number; unackOnly?: boolean; limit?: number } = {},
    serverSide = false,
  ) => {
    const qs = new URLSearchParams();
    if (opts.meterId !== undefined) qs.set("meter_id", String(opts.meterId));
    if (opts.unackOnly) qs.set("unack_only", "true");
    if (opts.limit) qs.set("limit", String(opts.limit));
    return request<Alert[]>(`/alerts?${qs.toString()}`, { token, serverSide });
  },

  ackAlert: (id: number, token: string) =>
    request<Alert>(`/alerts/${id}/ack`, { method: "PATCH", token }),

  // ---- control ----
  relayCommand: (id: number, action: "on" | "off", token: string, note?: string) =>
    request<RelayEvent>(`/meters/${id}/relay`, {
      method: "POST",
      body: JSON.stringify({ action, note }),
      token,
    }),

  relayHistory: (id: number, token: string, limit = 50, serverSide = false) =>
    request<RelayEvent[]>(`/meters/${id}/relay/history?limit=${limit}`, { token, serverSide }),

  // ---- users (admin) ----
  listUsers: (token: string, serverSide = false) =>
    request<
      Array<{
        id: number;
        email: string;
        name: string;
        role: "admin" | "consumer" | "technician";
        is_active: boolean;
      }>
    >("/users", { token, serverSide }),

  setUserRole: (
    id: number,
    role: "admin" | "consumer" | "technician",
    token: string,
  ) =>
    request<{
      id: number;
      email: string;
      name: string;
      role: "admin" | "consumer" | "technician";
      is_active: boolean;
    }>(`/users/${id}/role?role=${role}`, { method: "PATCH", token }),

  setUserActive: (id: number, isActive: boolean, token: string) =>
    request<{
      id: number;
      email: string;
      name: string;
      role: "admin" | "consumer" | "technician";
      is_active: boolean;
    }>(`/users/${id}/active?is_active=${isActive}`, { method: "PATCH", token }),

  // ---- reports (return URL for download) ----
  readingsCsvUrl: (id: number, days: number) =>
    `${API_PREFIX}/reports/${id}/readings.csv?days=${days}`,
  alertsCsvUrl: (id: number, days: number) =>
    `${API_PREFIX}/reports/${id}/alerts.csv?days=${days}`,
};
