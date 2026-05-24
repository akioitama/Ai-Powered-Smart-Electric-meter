import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const rows = await db.select().from(users).orderBy(asc(users.id));
  return NextResponse.json(
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      is_active: u.isActive,
    })),
  );
}
