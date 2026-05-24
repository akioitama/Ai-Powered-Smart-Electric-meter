import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const url = new URL(req.url);
  const flag = url.searchParams.get("is_active");
  if (flag !== "true" && flag !== "false") return jsonError("is_active must be true|false");

  const [updated] = await db
    .update(users)
    .set({ isActive: flag === "true" })
    .where(eq(users.id, id))
    .returning();
  if (!updated) return jsonError("Not found", 404);

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    is_active: updated.isActive,
  });
}
