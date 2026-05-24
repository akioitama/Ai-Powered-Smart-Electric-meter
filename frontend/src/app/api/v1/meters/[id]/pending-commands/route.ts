import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { meterCommands, meters } from "@/db/schema";
import { authenticateMeter, jsonError } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pi-facing endpoint. Auth via `Authorization: Bearer <meter_token>`.
 * Returns any queued commands for this meter and marks them delivered.
 *
 * The `:id` segment here is treated as `meter_uid` for convenience —
 * the Pi only knows its own UID, not the DB id.
 */
export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const meterUid = ctx.params.id;
  const meter = await authenticateMeter(req, meterUid);
  if (!meter) return jsonError("Unauthorized", 401);

  const pending = await db
    .select()
    .from(meterCommands)
    .where(and(eq(meterCommands.meterId, meter.id), isNull(meterCommands.deliveredAt)))
    .orderBy(asc(meterCommands.id))
    .limit(20);

  if (pending.length > 0) {
    const ids = pending.map((c) => c.id);
    await db
      .update(meterCommands)
      .set({ deliveredAt: new Date() })
      .where(inArray(meterCommands.id, ids));
  }

  // Refresh online state.
  await db.update(meters).set({ online: true, lastSeen: new Date() }).where(eq(meters.id, meter.id));

  return NextResponse.json(
    pending.map((c) => ({
      id: c.id,
      action: c.action,
      payload: c.payload ? JSON.parse(c.payload) : null,
      created_at: c.createdAt.toISOString(),
    })),
  );
}
