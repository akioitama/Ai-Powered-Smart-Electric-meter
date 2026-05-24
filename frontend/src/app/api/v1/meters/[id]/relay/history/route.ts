import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { relayEvents } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { loadMeterForUser } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");
  const { forbidden, notFound } = await loadMeterForUser(id, auth);
  if (notFound) return jsonError("Not found", 404);
  if (forbidden) return jsonError("Forbidden", 403);

  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const rows = await db
    .select()
    .from(relayEvents)
    .where(eq(relayEvents.meterId, id))
    .orderBy(desc(relayEvents.ts))
    .limit(limit);

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      meter_id: r.meterId,
      ts: r.ts.toISOString(),
      action: r.action,
      source: r.source,
      requested_by_user_id: r.requestedByUserId,
      success: r.success,
      note: r.note,
    })),
  );
}
