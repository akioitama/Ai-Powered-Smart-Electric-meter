import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meters, users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";
import { verifySession } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";

export interface AuthedUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "consumer" | "technician";
}

/**
 * Returns the authed user from either the session cookie (browser) or
 * `Authorization: Bearer <jwt>` header (legacy / direct API).
 */
export async function getAuthedUser(req?: NextRequest): Promise<AuthedUser | null> {
  // 1) Cookie-based session (preferred for browser).
  const c = cookies().get(SESSION_COOKIE);
  if (c?.value) {
    try {
      const payload = JSON.parse(Buffer.from(c.value, "base64").toString("utf8")) as {
        token?: string;
        user?: AuthedUser;
      };
      if (payload.token && payload.user) {
        const claims = await verifySession(payload.token);
        if (claims) {
          // Cross-check that user still exists & is active.
          const [u] = await db.select().from(users).where(eq(users.id, payload.user.id)).limit(1);
          if (u && u.isActive) {
            return { id: u.id, email: u.email, name: u.name, role: u.role };
          }
        }
      }
    } catch {
      // fall through to bearer
    }
  }

  // 2) Bearer JWT header.
  const auth = req?.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match) {
    const token = match[1];
    const claims = await verifySession(token);
    if (claims) {
      const id = Number(claims.sub);
      if (Number.isFinite(id)) {
        const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (u && u.isActive) return { id: u.id, email: u.email, name: u.name, role: u.role };
      }
    }
  }
  return null;
}

export async function requireUser(req?: NextRequest): Promise<AuthedUser | NextResponse> {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  return user;
}

export async function requireAdmin(req?: NextRequest): Promise<AuthedUser | NextResponse> {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ detail: "Admin only" }, { status: 403 });
  return user;
}

/**
 * Authenticate a meter (Pi) by checking `Authorization: Bearer <meter_token>`
 * against the stored bcrypt-hashed `accessTokenHash`. Returns the meter row.
 */
export async function authenticateMeter(req: NextRequest, meterUid: string) {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1];

  const [m] = await db.select().from(meters).where(eq(meters.meterUid, meterUid)).limit(1);
  if (!m) return null;
  const ok = await verifyPassword(token, m.accessTokenHash);
  if (!ok) return null;
  return m;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ detail: message }, { status });
}
