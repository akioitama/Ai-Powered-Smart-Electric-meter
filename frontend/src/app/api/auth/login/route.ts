import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, buildSessionCookieValue } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { signSession } from "@/lib/jwt";
import { ensureBootstrap } from "@/lib/bootstrap";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureBootstrap();
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const [u] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!u || !u.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(password, u.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signSession({
      sub: String(u.id),
      role: u.role,
      email: u.email,
      name: u.name,
    });

    const cookieValue = buildSessionCookieValue({
      token,
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
    });

    const res = NextResponse.json({ ok: true, role: u.role });
    res.cookies.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
