import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, buildSessionCookieValue } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { signSession } from "@/lib/jwt";
import { ensureBootstrap } from "@/lib/bootstrap";

export const runtime = "nodejs";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    await ensureBootstrap();
    const { email, password, name } = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (!EMAIL_RX.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const lower = email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, lower)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [u] = await db
      .insert(users)
      .values({ email: lower, name, passwordHash, role: "consumer" })
      .returning();

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

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
