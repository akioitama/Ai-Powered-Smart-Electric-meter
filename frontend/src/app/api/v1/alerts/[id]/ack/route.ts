import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { alerts, meters } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const [a] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!a) return jsonError("Not found", 404);
  // Owner check.
  if (auth.role !== "admin") {
    const [m] = await db.select().from(meters).where(eq(meters.id, a.meterId)).limit(1);
    if (!m || m.ownerUserId !== auth.id) return jsonError("Forbidden", 403);
  }

  const [updated] = await db
    .update(alerts)
    .set({ acknowledgedBy: auth.id, acknowledgedAt: new Date() })
    .where(eq(alerts.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    meter_id: updated.meterId,
    ts: updated.ts.toISOString(),
    type: updated.type,
    severity: updated.severity,
    value: updated.value,
    message: updated.message,
    acknowledged_by: updated.acknowledgedBy,
    acknowledged_at: updated.acknowledgedAt ? updated.acknowledgedAt.toISOString() : null,
  });
}
