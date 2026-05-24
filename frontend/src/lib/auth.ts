import { cookies } from "next/headers";
import { jwtVerify, decodeJwt } from "jose";
import type { SessionUser, UserRole } from "@/lib/types";

const COOKIE = "aimeter_session";

export interface SessionPayload {
  token: string;
  user: SessionUser;
}

export function getServerSession(): SessionPayload | null {
  const c = cookies().get(COOKIE);
  if (!c?.value) return null;
  try {
    const data = JSON.parse(Buffer.from(c.value, "base64").toString("utf8")) as SessionPayload;
    if (!data?.token || !data?.user) return null;
    const claims = decodeJwt(data.token) as { exp?: number };
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}

export function buildSessionCookieValue(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export const SESSION_COOKIE = COOKIE;

// Verifies a JWT signature using the shared secret (optional — useful in middleware).
export async function verifyJwt(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}
